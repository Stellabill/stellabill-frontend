import React, { useCallback, useState } from 'react';
import { clamp } from './brandPackUtils';

export type CropFrame = { x: number; y: number; width: number; height: number };
export type ImageMeta = { width: number; height: number; transparent: boolean; type: 'png' | 'svg' };
type UploadState = 'idle' | 'processing' | 'ready' | 'error';

export function useBrandPackUploadState(inputRef: React.RefObject<HTMLInputElement>) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageMeta, setImageMeta] = useState<ImageMeta | null>(null);
  const [cropFrame, setCropFrame] = useState<CropFrame>({ x: 20, y: 20, width: 60, height: 60 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetUploader = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setImageMeta(null);
    setCropFrame({ x: 20, y: 20, width: 60, height: 60 });
    setErrorMessage(null);
    setUploadState('idle');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [inputRef, previewUrl, setPreviewUrl, setSelectedFile, setImageMeta, setCropFrame, setErrorMessage, setUploadState]);

  const validateImage = useCallback(async (file: File): Promise<ImageMeta> => {
    const lowerName = file.name.toLowerCase();
    const isSvg = file.type === 'image/svg+xml' || lowerName.endsWith('.svg');

    if (isSvg) {
      const content = await file.text();
      if (/<script/i.test(content)) {
        throw new Error('SVG uploads must not contain scripts for security reasons.');
      }
      return { width: 1024, height: 1024, transparent: true, type: 'svg' };
    }

    const isPng = file.type === 'image/png' || lowerName.endsWith('.png');
    if (!isPng) {
      throw new Error('Please upload a transparent PNG or an SVG asset.');
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    const loaded = await new Promise<HTMLImageElement>((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('The browser could not read that image file.'));
      image.src = objectUrl;
    });

    URL.revokeObjectURL(objectUrl);

    if (loaded.width < 512 || loaded.height < 512) {
      throw new Error('The logo must be at least 512x512 pixels to be used reliably across surfaces.');
    }

    const canvas = document.createElement('canvas');
    canvas.width = loaded.width;
    canvas.height = loaded.height;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('The browser could not process that image file.');
    }

    context.drawImage(loaded, 0, 0);
    const pixelData = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let hasTransparency = false;

    for (let index = 3; index < pixelData.length; index += 4) {
      if (pixelData[index] < 255) {
        hasTransparency = true;
        break;
      }
    }

    if (!hasTransparency) {
      throw new Error('The PNG must include transparent areas so it can be previewed on light and dark backgrounds.');
    }

    return { width: loaded.width, height: loaded.height, transparent: true, type: 'png' };
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      setErrorMessage(null);
      setUploadState('processing');

      try {
        const meta = await validateImage(file);
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setSelectedFile(file);
        setImageMeta(meta);
        setCropFrame({ x: 20, y: 20, width: 60, height: 60 });
        setUploadState('ready');
      } catch (error) {
        setUploadState('error');
        setErrorMessage(error instanceof Error ? error.message : 'Unable to process that file.');
      }
    },
    [validateImage, setErrorMessage, setUploadState, setPreviewUrl, setSelectedFile, setImageMeta, setCropFrame]
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        void processFile(file);
      }
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setDragActive(false);
      const file = event.dataTransfer.files?.[0];
      if (file) {
        void processFile(file);
      }
    },
    [processFile]
  );

  const handleCropKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, handle: 'tl' | 'tr' | 'bl' | 'br') => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        return;
      }

      event.preventDefault();
      const step = event.shiftKey ? 6 : 2;

      setCropFrame((current) => {
        const next = { ...current };
        const maxX = 100 - next.width;
        const maxY = 100 - next.height;

        switch (handle) {
          case 'tl':
            next.x = clamp(next.x - (event.key === 'ArrowLeft' ? step : 0), 0, maxX);
            next.y = clamp(next.y - (event.key === 'ArrowUp' ? step : 0), 0, maxY);
            next.x = clamp(next.x + (event.key === 'ArrowRight' ? step : 0), 0, maxX);
            next.y = clamp(next.y + (event.key === 'ArrowDown' ? step : 0), 0, maxY);
            break;
          case 'tr':
            next.y = clamp(next.y - (event.key === 'ArrowUp' ? step : 0), 0, maxY);
            next.width = clamp(next.width + (event.key === 'ArrowRight' ? step : 0), 24, 100 - next.x);
            next.width = clamp(next.width - (event.key === 'ArrowLeft' ? step : 0), 24, 100 - next.x);
            next.y = clamp(next.y + (event.key === 'ArrowDown' ? step : 0), 0, maxY);
            break;
          case 'bl':
            next.x = clamp(next.x - (event.key === 'ArrowLeft' ? step : 0), 0, maxX);
            next.height = clamp(next.height + (event.key === 'ArrowDown' ? step : 0), 24, 100 - next.y);
            next.height = clamp(next.height - (event.key === 'ArrowUp' ? step : 0), 24, 100 - next.y);
            next.x = clamp(next.x + (event.key === 'ArrowRight' ? step : 0), 0, maxX);
            break;
          case 'br':
            next.width = clamp(next.width + (event.key === 'ArrowRight' ? step : 0), 24, 100 - next.x);
            next.width = clamp(next.width - (event.key === 'ArrowLeft' ? step : 0), 24, 100 - next.x);
            next.height = clamp(next.height + (event.key === 'ArrowDown' ? step : 0), 24, 100 - next.y);
            next.height = clamp(next.height - (event.key === 'ArrowUp' ? step : 0), 24, 100 - next.y);
            break;
          default:
            break;
        }

        return next;
      });
    },
    [setCropFrame]
  );


  return {
    uploadState, previewUrl, selectedFile, imageMeta, cropFrame, errorMessage,
    setUploadState, setPreviewUrl, setSelectedFile, setImageMeta, setCropFrame, setErrorMessage,
    resetUploader, handleChange, handleDrop, handleCropKeyDown,
  };
}
