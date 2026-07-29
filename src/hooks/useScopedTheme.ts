import { useEffect, useRef } from 'react';
import type { Theme } from './useTheme';

/**
 * useScopedTheme
 *
 * Applies a forced theme to a specific DOM subtree without touching the global
 * `<html data-theme>` attribute.  Designed for printable views (receipt previews,
 * PDF export areas) where light mode must always be used regardless of the user's
 * global preference.
 *
 * Usage
 * -----
 * ```tsx
 * const printRef = useScopedTheme('light');
 * return <div ref={printRef}>...</div>;
 * ```
 *
 * The hook sets `data-theme` and `color-scheme` on the returned ref's element so
 * that all CSS custom-property tokens cascade correctly within that subtree.
 *
 * Pass `null` to remove the forced override and let the element inherit the global
 * theme again.
 *
 * @param forcedTheme - The theme to lock this subtree to, or `null` to inherit.
 * @returns A React ref to attach to the root element of the scoped area.
 */
export function useScopedTheme<T extends HTMLElement = HTMLDivElement>(
  forcedTheme: Theme | null,
): React.RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (forcedTheme === null) {
      // Remove override — inherit from global data-theme
      delete el.dataset.theme;
      el.style.colorScheme = '';
    } else {
      el.dataset.theme = forcedTheme;
      el.style.colorScheme = forcedTheme;
    }

    return () => {
      // Cleanup on unmount
      delete el.dataset.theme;
      el.style.colorScheme = '';
    };
  }, [forcedTheme]);

  return ref;
}
