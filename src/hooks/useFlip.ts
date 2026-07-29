/**
 * useFlip — FLIP-based list reorder animation
 *
 * FLIP stands for First, Last, Invert, Play:
 *  - First:  record the bounding-rect of each item before the DOM update.
 *  - Last:   after React commits the reorder, read the new bounding-rects.
 *  - Invert: apply a CSS transform that makes each item appear to be in its
 *            old position.
 *  - Play:   animate from the inverted (old) position back to 0, which
 *            visually moves the item to its new position.
 *
 * Accessibility:
 *  - Respects `prefers-reduced-motion`. When reduced, the duration is 0 so
 *    items snap instantly — no motion occurs, but DOM order is still correct.
 *  - Focus is preserved on the previously-focused element across sorts.
 *    The hook captures `document.activeElement` before the render and
 *    restores focus after the animation starts, so keyboard navigation is
 *    never interrupted.
 *  - `aria-live` regions outside the list announce sort changes separately;
 *    this hook does not modify ARIA attributes.
 *
 * Usage:
 * ```tsx
 * const { containerRef, getItemProps } = useFlip({ keys: items.map(i => i.id) });
 *
 * return (
 *   <ul ref={containerRef}>
 *     {items.map(item => (
 *       <li key={item.id} {...getItemProps(item.id)}>…</li>
 *     ))}
 *   </ul>
 * );
 * ```
 *
 * Notes:
 *  - `keys` must be a stable array of unique string IDs that matches the
 *    rendered list order.  Pass the same array you map over.
 *  - The hook only animates items that were present before AND after the
 *    update. Newly-entering items use a fade-in (see `--motion-entry-*`
 *    tokens) managed separately by the CSS class `flip-item--entering`.
 *  - The container must have `position: relative` or any position value
 *    other than `static` for the transforms to work correctly.  Add the
 *    `flip-container` CSS class (provided in this file) to ensure this.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';
import { getMotionTokens } from '@/design/tokens/motion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseFlipOptions {
  /**
   * Ordered array of stable item IDs that corresponds 1:1 with the rendered
   * list.  Changing this array (order, additions, removals) triggers the FLIP
   * animation on the next paint.
   */
  keys: string[];

  /**
   * Optional: whether the hook is active.  Set to `false` to skip all
   * animation work, e.g. when the list hasn't loaded yet.
   * @default true
   */
  enabled?: boolean;
}

export interface UseFlipReturn {
  /**
   * Attach to the list container element.
   */
  containerRef: React.RefObject<HTMLElement | null>;
  /**
   * Returns props to spread onto each list item.  The `data-flip-id`
   * attribute is how the hook locates each element in the DOM.
   */
  getItemProps: (id: string) => { 'data-flip-id': string };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Read a `DOMRect` snapshot for all currently-rendered flip items. */
function snapshotRects(
  container: HTMLElement,
): Map<string, DOMRect> {
  const rects = new Map<string, DOMRect>();
  const items = container.querySelectorAll<HTMLElement>('[data-flip-id]');
  items.forEach((el) => {
    const id = el.dataset.flipId;
    if (id) {
      rects.set(id, el.getBoundingClientRect());
    }
  });
  return rects;
}

/**
 * Read the CSS custom property from the root element, falling back to the
 * numeric default so the hook is functional even if the CSS file is not
 * loaded (e.g. in test environments).
 */
function readCssDurationMs(property: string, fallback: number): number {
  if (typeof document === 'undefined') return 0;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(property)
    .trim();
  // Values like "320ms" or "0.32s"
  if (raw.endsWith('ms')) return parseFloat(raw);
  if (raw.endsWith('s')) return parseFloat(raw) * 1000;
  return fallback;
}

// ---------------------------------------------------------------------------
// The hook
// ---------------------------------------------------------------------------

export function useFlip({
  keys,
  enabled = true,
}: UseFlipOptions): UseFlipReturn {
  const containerRef = useRef<HTMLElement | null>(null);

  /**
   * `prevRectsRef` stores the bounding-rects BEFORE the DOM update (the
   * "First" step of FLIP).  We populate it in `useLayoutEffect` BEFORE React
   * has had a chance to mutate the DOM for the current render.  In practice
   * this means we capture rects at the end of the *previous* commit and read
   * them at the start of the *next* commit.
   */
  const prevRectsRef = useRef<Map<string, DOMRect>>(new Map());

  /**
   * Track the previously-focused element so we can restore it after the
   * animation starts (prevents focus loss on sort/filter).
   */
  const prevFocusRef = useRef<Element | null>(null);

  /**
   * Capture rects and focused element before this render's DOM changes land.
   * We do this inside a layout effect with cleanup — the cleanup runs right
   * before the *next* layout effect, which is after React has updated the DOM
   * but before the browser has painted.  That gives us reliable "before" and
   * "after" snapshots without needing a MutationObserver.
   *
   * Sequence per render cycle:
   *  1. React calls render (virtual DOM diff)
   *  2. React commits to real DOM
   *  3. useLayoutEffect cleanup runs → captures "before" was actually
   *     captured in the PREVIOUS run's body; now we animate from before→after
   *  4. useLayoutEffect body runs → captures "after" for NEXT cycle
   *
   * To keep this simpler we use two separate effects:
   *  - A synchronous snapshot before the commit (via the `keys` ref comparison)
   *  - A layout effect that fires after the commit to run the animation
   */

  // Step 1 — snapshot BEFORE the DOM update
  // We compare keys to detect a meaningful change. The snapshot is taken
  // eagerly on every render, then discarded if nothing changed.
  const keysRef = useRef<string[]>([]);
  const keysChanged = keys.join('\0') !== keysRef.current.join('\0');

  if (keysChanged && enabled && containerRef.current) {
    prevRectsRef.current = snapshotRects(containerRef.current);
    prevFocusRef.current = document.activeElement;
  }

  // Step 2 — animate AFTER the DOM update (useLayoutEffect fires synchronously
  // after DOM mutations, before paint)
  useLayoutEffect(() => {
    if (!enabled) return;
    if (!keysChanged) return;
    if (!containerRef.current) return;

    keysRef.current = keys;

    const container = containerRef.current;
    const before = prevRectsRef.current;

    // Read new positions (the "Last" step)
    const after = snapshotRects(container);

    // Read motion tokens (respects prefers-reduced-motion CSS var + JS API)
    const tokens = getMotionTokens();
    const cssDuration = readCssDurationMs(
      '--motion-reorder-duration',
      tokens.reorder.duration,
    );
    const duration = cssDuration;
    const easing = tokens.reorder.easing;

    const animations: Animation[] = [];

    after.forEach((afterRect, id) => {
      const el = container.querySelector<HTMLElement>(
        `[data-flip-id="${CSS.escape(id)}"]`,
      );
      if (!el) return;

      const beforeRect = before.get(id);
      if (!beforeRect) {
        // New item — play entry animation
        el.classList.add('flip-item--entering');
        const entryDuration = readCssDurationMs(
          '--motion-entry-duration',
          tokens.entry.duration,
        );
        const animation = el.animate(
          [
            { opacity: 0, transform: 'scale(0.96)' },
            { opacity: 1, transform: 'scale(1)' },
          ],
          {
            duration: entryDuration,
            easing: tokens.entry.easing,
            fill: 'both',
          },
        );
        animation.onfinish = () => el.classList.remove('flip-item--entering');
        animations.push(animation);
        return;
      }

      const dx = beforeRect.left - afterRect.left;
      const dy = beforeRect.top - afterRect.top;

      // No movement — skip
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

      // Invert + Play
      const animation = el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)` },
          { transform: 'translate(0, 0)' },
        ],
        {
          duration,
          easing,
          fill: 'both',
        },
      );
      animations.push(animation);
    });

    // Restore focus after animation starts (non-blocking)
    if (prevFocusRef.current && prevFocusRef.current instanceof HTMLElement) {
      const focusedId = (prevFocusRef.current as HTMLElement).dataset?.flipId;
      if (focusedId) {
        const newEl = container.querySelector<HTMLElement>(
          `[data-flip-id="${CSS.escape(focusedId)}"]`,
        );
        newEl?.focus({ preventScroll: true });
      } else if (container.contains(prevFocusRef.current)) {
        (prevFocusRef.current as HTMLElement).focus({ preventScroll: true });
      }
    }

    return () => {
      // Cancel any in-flight animations when the component unmounts
      animations.forEach((a) => a.cancel());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys, enabled]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      prevRectsRef.current = new Map();
    };
  }, []);

  const getItemProps = useCallback(
    (id: string): { 'data-flip-id': string } => ({
      'data-flip-id': id,
    }),
    [],
  );

  return { containerRef, getItemProps };
}
