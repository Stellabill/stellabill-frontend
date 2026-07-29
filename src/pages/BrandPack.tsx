import React, { useCallback, useEffect, useRef, useState } from 'react';
import Logo from '../components/Branding/Logo';
import Icon from '../components/Branding/Icon';
import { EmptyDashboard, NoTransactions } from '../components/Branding/Illustrations';
import ThemePreview from '../components/settings/ThemePreview';
import type { ThemeTokens } from '../types/theme';
import { DEFAULT_THEME_TOKENS } from '../types/theme';

type CropFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ImageMeta = {
  width: number;
  height: number;
  transparent: boolean;
  type: 'png' | 'svg';
};

type UploadState = 'idle' | 'processing' | 'ready' | 'error';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const BrandPack: React.FC = () => {
  const colors = [
    { name: 'Cyan (Primary)', hex: '#22d3ee', bg: 'bg-cyan-400' },
    { name: 'Emerald (Primary)', hex: '#14b8a6', bg: 'bg-teal-500' },
    { name: 'Slate (Background)', hex: '#020617', bg: 'bg-slate-950' },
    { name: 'Slate (Secondary)', hex: '#0a0f16', bg: 'bg-[#0a0f16]' },
  ];

  const icons = ['Users', 'TrendingUp', 'Activity', 'Shield', 'Settings', 'Zap'] as const;
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageMeta, setImageMeta] = useState<ImageMeta | null>(null);
  const [cropFrame, setCropFrame] = useState<CropFrame>({ x: 20, y: 20, width: 60, height: 60 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [themeTokens, setThemeTokens] = useState<ThemeTokens>(DEFAULT_THEME_TOKENS);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
  }, [previewUrl]);

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
    [validateImage]
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
    []
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-8 md:p-12 font-sans">
      <div className="mx-auto max-w-6xl space-y-16">
        <section className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-white">Stellabill Brand Pack</h1>
          <p className="max-w-2xl text-lg text-slate-400">
            A comprehensive set of visual guidelines and reusable components to ensure consistency across the Stellabill ecosystem.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/50 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Merchant brand asset uploader</p>
              <h2 className="text-3xl font-semibold text-white">Upload, crop, and preview logos across every touchpoint</h2>
              <p className="text-sm leading-7 text-slate-400">
                The uploader supports drag and drop, browse, a crop stage with safe-area overlay, and per-usage preview tiles for header, receipt, and social share surfaces. It validates transparent PNG and SVG assets, and it keeps the experience accessible for keyboard and screen-reader users.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-400">
              <p className="font-medium text-slate-200">Requirements</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-400">
                <li>• Transparent PNG or SVG only</li>
                <li>• Minimum 512x512 pixels</li>
                <li>• Keyboard-friendly crop handles</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div
              className={`rounded-3xl border p-5 transition-all ${dragActive ? 'border-cyan-400 bg-cyan-400/10' : 'border-slate-800 bg-slate-950/70'}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/svg+xml"
                className="sr-only"
                onChange={handleChange}
                data-testid="brandpack-file-input"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-200">Drop a logo here</p>
                  <p className="text-sm text-slate-400">Browse your device or drag an asset into the drop zone.</p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
                  onClick={() => inputRef.current?.click()}
                >
                  Browse files
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-900/80 p-6 text-center text-slate-400">
                <p className="text-sm">Transparent PNG or SVG</p>
                <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">Safe-area overlay • crop guide • keyboard support</p>
              </div>

              {uploadState === 'processing' && (
                <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
                  Validating the asset and preparing the crop view…
                </div>
              )}

              {uploadState === 'error' && errorMessage && (
                <div className="mt-5 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200" role="alert">
                  {errorMessage}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
              <p className="text-sm font-medium text-slate-200">Usage notes</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li>• Prefer generous clear space around the mark for header and receipt layouts.</li>
                <li>• Keep the icon centered for social share thumbnails and avatars.</li>
                <li>• Use the preview tiles to verify legibility on both dark and light surfaces.</li>
              </ul>
              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Preview tiles</p>
                <div className="mt-3 space-y-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                    <p className="text-sm font-medium text-slate-200">Header</p>
                    <p className="text-xs text-slate-500">Wide layouts need balanced spacing.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                    <p className="text-sm font-medium text-slate-200">Receipt</p>
                    <p className="text-xs text-slate-500">Favor a compact, centered composition.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                    <p className="text-sm font-medium text-slate-200">Social share</p>
                    <p className="text-xs text-slate-500">Keep the mark readable in a square crop.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {uploadState === 'ready' && selectedFile && imageMeta && (
            <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/75 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Crop stage</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Crop your logo</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Align the mark inside the safe-area overlay and use the keyboard to nudge the crop handles.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
                  onClick={resetUploader}
                >
                  Start over
                </button>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-800 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_50%),linear-gradient(135deg,#020617,#0f172a)]">
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Uploaded brand asset"
                        className="absolute inset-0 h-full w-full object-contain"
                      />
                    )}
                    <div className="absolute inset-0 bg-slate-950/20" />
                    <div className="absolute inset-0 rounded-2xl border border-white/10" />
                    <div
                      className="absolute rounded-[1.75rem] border-2 border-cyan-300/90 shadow-[0_0_0_9999px_rgba(2,6,23,0.72)]"
                      style={{ left: `${cropFrame.x}%`, top: `${cropFrame.y}%`, width: `${cropFrame.width}%`, height: `${cropFrame.height}%` }}
                    >
                      <div className="absolute -left-2 -top-2 h-4 w-4 rounded-full border-2 border-cyan-300 bg-slate-950" />
                      <div className="absolute -right-2 -top-2 h-4 w-4 rounded-full border-2 border-cyan-300 bg-slate-950" />
                      <div className="absolute -bottom-2 -left-2 h-4 w-4 rounded-full border-2 border-cyan-300 bg-slate-950" />
                      <div className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full border-2 border-cyan-300 bg-slate-950" />
                    </div>
                    <div className="pointer-events-none absolute inset-x-[12%] top-[18%] h-[64%] rounded-[2rem] border border-dashed border-cyan-400/50" />
                    <div className="pointer-events-none absolute inset-x-[10%] top-[16%] h-[68%] rounded-[2rem] border border-white/10" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(['tl', 'tr', 'bl', 'br'] as const).map((handle) => (
                      <button
                        key={handle}
                        type="button"
                        className="rounded-full border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-300"
                        aria-label={`Adjust ${handle} crop handle`}
                        onKeyDown={(event) => handleCropKeyDown(event, handle)}
                      >
                        {handle}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-slate-400">Safe-area overlay keeps the logo readable while preserving a clear frame for the mark.</p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-sm font-medium text-slate-200">Asset details</p>
                    <dl className="mt-3 space-y-3 text-sm text-slate-400">
                      <div className="flex items-center justify-between">
                        <dt>File</dt>
                        <dd className="font-medium text-slate-200">{selectedFile?.name}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Size</dt>
                        <dd className="font-medium text-slate-200">{imageMeta.width}×{imageMeta.height}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Format</dt>
                        <dd className="font-medium text-slate-200">{imageMeta.type.toUpperCase()}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-sm font-medium text-slate-200">Preview tiles</p>
                    <div className="mt-4 grid gap-3">
                      {[
                        { label: 'Header', className: 'rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-slate-300', tone: 'wide' },
                        { label: 'Receipt', className: 'rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-slate-300', tone: 'stacked' },
                        { label: 'Social share', className: 'rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-slate-300', tone: 'square' },
                      ].map((tile) => (
                        <div key={tile.label} className={tile.className}>
                          <div className="mb-2 text-xs uppercase tracking-[0.24em] text-slate-500">{tile.label}</div>
                          <div className="relative h-20 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                            {previewUrl && (
                              <div
                                className="absolute inset-0"
                                style={{
                                  backgroundImage: `url(${previewUrl})`,
                                  backgroundSize: 'contain',
                                  backgroundPosition: `${cropFrame.x + cropFrame.width / 2}% ${cropFrame.y + cropFrame.height / 2}%`,
                                  backgroundRepeat: 'no-repeat',
                                  backgroundColor: '#020617',
                                }}
                              />
                            )}
                            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-8">
          <h2 className="border-b border-slate-800 pb-2 text-2xl font-semibold">Logo Usage</h2>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
              <h3 className="text-sm font-medium uppercase tracking-widest text-slate-400">Standard Variants</h3>
              <div className="space-y-8">
                <div className="flex items-center gap-12">
                  <Logo size="md" />
                  <span className="text-xs font-mono text-slate-500">Medium (Default)</span>
                </div>
                <div className="flex items-center gap-12">
                  <Logo size="lg" />
                  <span className="text-xs font-mono text-slate-500">Large (Hero Sections)</span>
                </div>
                <div className="flex items-center gap-12">
                  <Logo size="sm" />
                  <span className="text-xs font-mono text-slate-500">Small (Footers/Mobile)</span>
                </div>
              </div>
            </div>
            <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
              <h3 className="text-sm font-medium uppercase tracking-widest text-slate-400">Icon-only Variant</h3>
              <div className="flex flex-wrap items-center gap-8">
                <Logo size="xl" variant="icon" />
                <Logo size="lg" variant="icon" />
                <Logo size="md" variant="icon" />
                <Logo size="sm" variant="icon" />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="border-b border-slate-800 pb-2 text-2xl font-semibold">Primary Colors</h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {colors.map((color) => (
              <div key={color.name} className="space-y-3">
                <div className={`h-24 w-full rounded-2xl ${color.bg} border border-white/5 shadow-xl shadow-black/20`}></div>
                <div>
                  <p className="text-sm font-medium">{color.name}</p>
                  <p className="text-xs font-mono text-slate-500">{color.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="border-b border-slate-800 pb-2 text-2xl font-semibold">Live Theme Preview</h2>
          <p className="text-sm text-slate-400">
            Edit theme tokens on the left and see real-time updates in the preview pane. Toggle between checkout, dashboard, and receipt views.
          </p>
          <ThemePreview tokens={themeTokens} onChange={setThemeTokens} />
        </section>

        <section className="space-y-8">
          <h2 className="border-b border-slate-800 pb-2 text-2xl font-semibold">Iconography</h2>
          <div className="flex flex-wrap gap-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-10">
            {icons.map((icon) => (
              <div key={icon} className="flex flex-col items-center gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-cyan-400 transition-all hover:border-cyan-500/50">
                  <Icon name={icon} size={28} />
                </div>
                <span className="text-xs font-mono text-slate-500">{icon}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="border-b border-slate-800 pb-2 text-2xl font-semibold">Illustration Style</h2>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div className="flex flex-col items-center gap-6 rounded-2xl border border-slate-800 bg-slate-950 p-12 shadow-2xl">
              <EmptyDashboard size={240} />
              <div className="text-center">
                <h4 className="font-semibold text-slate-200">Empty Dashboard Pattern</h4>
                <p className="mt-1 text-xs text-slate-500">Orbital and diamond geometric forms</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-6 rounded-2xl border border-slate-800 bg-slate-950 p-12 shadow-2xl">
              <NoTransactions size={240} />
              <div className="text-center">
                <h4 className="font-semibold text-slate-200">No Transactions Pattern</h4>
                <p className="mt-1 text-xs text-slate-500">Schematic and technical UI elements</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default BrandPack;
