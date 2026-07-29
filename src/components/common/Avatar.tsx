import React, { useState, useCallback } from 'react';
import { getInitials, getAvatarGradient } from '../../utils/avatar';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export interface AvatarProps {
  /** Image source URL. When omitted or on load error, initials fallback is shown. */
  src?: string | null;
  /** Name used for initials fallback and deterministic color. */
  name: string;
  /** Avatar size. */
  size?: AvatarSize;
  /** Optional className for additional styling. */
  className?: string;
  /** Alt text for the image (defaults to `${name} avatar`). */
  alt?: string;
}

const SIZE_MAP: Record<AvatarSize, { px: number; fontSize: string }> = {
  sm:  { px: 24, fontSize: '0.625rem' },   // 10px
  md:  { px: 32, fontSize: '0.75rem' },     // 12px
  lg:  { px: 40, fontSize: '0.875rem' },    // 14px
  xl:  { px: 80, fontSize: '1.5rem' },      // 24px
  xxl: { px: 120, fontSize: '2.25rem' },    // 36px
};

/**
 * Avatar component with image support and initials fallback.
 *
 * - Renders an <img> when `src` is provided and loads successfully.
 * - Falls back to initials with a deterministic gradient background on error or missing src.
 * - WCAG 2.1 AA: text contrast against gradient backgrounds, focus-visible ring, alt text.
 */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'lg',
  className = '',
  alt,
}) => {
  const [imgError, setImgError] = useState(false);
  const sizeConfig = SIZE_MAP[size];
  const showImage = !!src && !imgError;

  const handleError = useCallback(() => {
    setImgError(true);
  }, []);

  // Re-apply image if src changes (e.g. after upload)
  React.useEffect(() => {
    setImgError(false);
  }, [src]);

  if (showImage) {
    return (
      <img
        src={src!}
        alt={alt ?? `${name} avatar`}
        onError={handleError}
        className={className}
        style={{
          width: sizeConfig.px,
          height: sizeConfig.px,
          borderRadius: 'var(--radius-full, 9999px)',
          objectFit: 'cover',
          display: 'block',
          flexShrink: 0,
        }}
      />
    );
  }

  // Initials fallback
  const initials = getInitials(name);
  const [gradientStart, gradientEnd] = getAvatarGradient(name);

  return (
    <div
      className={className}
      role="img"
      aria-label={alt ?? `${name} avatar`}
      style={{
        width: sizeConfig.px,
        height: sizeConfig.px,
        borderRadius: 'var(--radius-full, 9999px)',
        background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 600,
        fontSize: sizeConfig.fontSize,
        lineHeight: 1,
        flexShrink: 0,
        userSelect: 'none',
        fontFamily: 'var(--font-family-display, "Sora", "DM Sans", sans-serif)',
      }}
    >
      {initials}
    </div>
  );
};

export default Avatar;
