import React, { useRef, useState, useCallback } from 'react';
import Avatar, { AvatarSize } from './Avatar';
import { Camera, X } from 'lucide-react';

export interface AvatarUploaderProps {
  /** Current avatar source URL (or null/undefined for initials fallback). */
  currentSrc?: string | null;
  /** Organization/person name for initials fallback. */
  name: string;
  /** Avatar size. */
  size?: AvatarSize;
  /** Called with the selected File when user uploads a new avatar. */
  onUpload?: (file: File) => void | Promise<void>;
  /** Called when user removes the existing avatar. */
  onRemove?: () => void;
  /** Accepted MIME types (default: PNG, JPG, WebP). */
  accept?: string;
  /** Maximum file size in bytes (default: 5 MB). */
  maxSizeBytes?: number;
  /** Additional class name. */
  className?: string;
}

const DEFAULT_ACCEPT = 'image/png,image/jpeg,image/webp';
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Avatar uploader with drag-drop, preview, hover-to-change overlay, and remove.
 *
 * - Shows the current avatar (image or initials) with a semi-transparent
 *   "Change photo" overlay on hover.
 * - Clicking the overlay opens the file picker.
 * - When the mouse is over an uploaded avatar, a remove button also appears.
 * - Accessible: keyboard-operable, proper ARIA labels, focus-visible styles.
 */
export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  currentSrc,
  name,
  size = 'xl',
  onUpload,
  onRemove,
  accept = DEFAULT_ACCEPT,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndProcess = useCallback(
    async (file: File) => {
      setError(null);

      // Validate type
      const allowedTypes = accept.split(',');
      const typeOk = allowedTypes.some(
        (t) => file.type === t || file.name.endsWith(t.replace(/.*\./, '.'))
      );
      if (!typeOk) {
        setError(`Please upload an image (${accept.replace(/image\//g, '').replace(/,/g, ', ')}).`);
        return;
      }

      // Validate size
      if (file.size > maxSizeBytes) {
        setError(`File too large. Maximum size is ${(maxSizeBytes / (1024 * 1024)).toFixed(0)} MB.`);
        return;
      }

      try {
        await onUpload?.(file);
      } catch {
        setError('Upload failed. Please try again.');
      }

      // Reset input so re-selecting the same file triggers onChange
      if (inputRef.current) inputRef.current.value = '';
    },
    [accept, maxSizeBytes, onUpload]
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndProcess(file);
    },
    [validateAndProcess]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndProcess(file);
    },
    [validateAndProcess]
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove?.();
      if (inputRef.current) inputRef.current.value = '';
    },
    [onRemove]
  );

  const hasAvatar = !!currentSrc;

  return (
    <div className={className}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        aria-label="Upload avatar"
        onChange={handleChange}
        data-testid="avatar-uploader-input"
      />

      {/* Avatar wrapper with drag-drop and hover overlay */}
      <div
        role="button"
        tabIndex={0}
        aria-label={
          hasAvatar
            ? 'Change or remove avatar. Press Enter or Space to change.'
            : 'Upload avatar. Press Enter or Space to browse files.'
        }
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          position: 'relative',
          width: 'fit-content',
          cursor: 'pointer',
          borderRadius: 'var(--radius-full, 9999px)',
          outline: 'none',
        }}
        data-testid="avatar-uploader-area"
      >
        {/* Avatar display */}
        <Avatar src={currentSrc} name={name} size={size} />

        {/* Drag-over overlay */}
        {isDragOver && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'var(--radius-full, 9999px)',
              background: 'rgba(34, 211, 238, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(2px)',
            }}
          >
            <Camera size={size === 'xl' || size === 'xxl' ? 24 : 16} color="#fff" />
          </div>
        )}

        {/* Hover overlay: "Change photo" */}
        {!isDragOver && (
          <div
            className="avatar-uploader__overlay"
            onClick={handleClick}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'var(--radius-full, 9999px)',
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.2s ease',
              backdropFilter: 'blur(2px)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
            onFocus={(e) => (e.currentTarget.style.opacity = '1')}
            onBlur={(e) => (e.currentTarget.style.opacity = '0')}
          >
            <Camera size={size === 'xl' || size === 'xxl' ? 24 : 16} color="#fff" />
          </div>
        )}

        {/* Remove button (only for uploaded avatars) */}
        {hasAvatar && (
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove avatar"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: '2px solid var(--color-surface-card, #0a0f16)',
              background: 'var(--color-danger, #ef4444)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              fontSize: '0.75rem',
              lineHeight: 1,
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              zIndex: 2,
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p
          role="alert"
          style={{
            margin: '0.5rem 0 0',
            fontSize: 'var(--text-sm, 0.833rem)',
            color: 'var(--color-danger, #ef4444)',
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default AvatarUploader;
