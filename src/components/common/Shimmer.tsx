import { CSSProperties } from 'react';
import '../../styles/shimmer.css';

export type ShimmerShape = 'block' | 'circle' | 'text';
export type ShimmerDirection = 'ltr' | 'rtl';

export interface ShimmerProps {
  /** Width of the placeholder. Accepts any CSS length (e.g. '100%', '12rem'). */
  width?: string | number;
  /** Height of the placeholder. Accepts any CSS length. */
  height?: string | number;
  /** Explicit border radius. Defaults based on `shape` when omitted. */
  radius?: string;
  /** Visual shape preset. 'circle' is for avatars, 'text' for copy lines. */
  shape?: ShimmerShape;
  /**
   * Sweep direction. Defaults to following the ancestor/document
   * writing direction (`dir="rtl"`). Set explicitly to force a direction
   * regardless of locale, e.g. a chart placeholder that always reads
   * left-to-right.
   */
  direction?: ShimmerDirection;
  /** Overrides the `--shimmer-duration` token for this instance. */
  duration?: string;
  /** Stagger the animation start so multiple shimmers don't sweep in lockstep. */
  delay?: string;
  className?: string;
  style?: CSSProperties;
  /**
   * Accessible label. Omit for purely decorative placeholders nested inside
   * a container that already announces loading state (recommended default).
   * Provide one to make a standalone shimmer announce itself via
   * `role="status"`.
   */
  'aria-label'?: string;
}

// 'block' has no default: it's meant to be composed into an element that
// already owns a border-radius (e.g. `.dashboard-skeleton__button`). Setting
// one here would compete with that class via inline-style specificity.
const DEFAULT_RADIUS: Partial<Record<ShimmerShape, string>> = {
  circle: 'var(--radius-full)',
  text: 'var(--radius-sm)',
};

export default function Shimmer({
  width,
  height,
  radius,
  shape = 'block',
  direction,
  duration,
  delay,
  className = '',
  style,
  'aria-label': ariaLabel,
}: ShimmerProps) {
  const mergedStyle: CSSProperties & Record<string, string | number | undefined> = {
    width,
    height,
    borderRadius: radius ?? DEFAULT_RADIUS[shape],
    ...style,
  };

  if (duration) {
    mergedStyle['--shimmer-duration'] = duration;
  }
  if (delay) {
    mergedStyle.animationDelay = delay;
  }

  return (
    <div
      className={`sb-shimmer sb-shimmer--${shape} ${className}`.trim()}
      style={mergedStyle}
      data-direction={direction}
      role={ariaLabel ? 'status' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    />
  );
}
