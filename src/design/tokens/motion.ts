/**
 * Motion design tokens — FLIP reorder animations
 *
 * These values are the JavaScript counterparts of the CSS custom properties
 * defined in src/styles/tokens.css under the "Motion tokens" section.
 * They drive the `useFlip` hook's Web Animations API calls.
 *
 * Reduced-motion users automatically receive `duration: 0` through the
 * `prefersReducedMotion` helper; these base values should never be consumed
 * directly from animation paths — always use `getMotionTokens()`.
 */

export const motionTokens = {
  reorder: {
    /** Duration (ms) for a row sliding into its new position */
    duration: 320,
    /** CSS easing that matches a natural deceleration */
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
  entry: {
    /** Duration (ms) for newly-visible rows fading in */
    duration: 200,
    easing: 'ease-out',
  },
  /** Instant swap — used when the user prefers reduced motion */
  reducedMotion: {
    duration: 0,
    easing: 'linear',
  },
} as const;

export type MotionTokens = typeof motionTokens;

/**
 * Returns the correct motion token set based on the user's OS/browser
 * reduced-motion preference.
 *
 * This function is safe to call during React render — it reads
 * `window.matchMedia` but does not subscribe; the `useFlip` hook subscribes
 * to changes separately.
 */
export function getMotionTokens(): {
  reorder: { duration: number; easing: string };
  entry: { duration: number; easing: string };
} {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced) {
    return {
      reorder: motionTokens.reducedMotion,
      entry: motionTokens.reducedMotion,
    };
  }

  return {
    reorder: motionTokens.reorder,
    entry: motionTokens.entry,
  };
}
