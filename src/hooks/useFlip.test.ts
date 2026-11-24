import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFlip } from './useFlip';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeItem(flipId: string): HTMLElement {
  const el = document.createElement('li');
  el.dataset.flipId = flipId;
  el.tabIndex = 0; // make it focusable for focus-preservation tests
  return el;
}

/**
 * Build a container element, append items to it, mount it in the document
 * body (so focus() calls work), and return it.
 */
function makeContainer(items: HTMLElement[]): HTMLElement {
  const container = document.createElement('ul');
  for (const item of items) {
    container.appendChild(item);
  }
  document.body.appendChild(container);
  return container;
}

/** Assign a stable mock getBoundingClientRect to an element. */
function setRect(el: HTMLElement, rect: Partial<DOMRect>): void {
  el.getBoundingClientRect = vi.fn(() => ({
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...rect,
  })) as unknown as () => DOMRect;
}

/** Mock matchMedia so that prefers-reduced-motion: reduce reports `matches`. */
function mockReducedMotion(matches: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? matches : false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

/**
 * Render the hook with the ref already attached to a real container element
 * and keysRef initialised, so the first real reorder can be tested cleanly.
 *
 * Returns the renderHook result, the container, and the item elements.
 */
function setupFlipHook(initialKeys: string[]) {
  const items = initialKeys.map(makeItem);
  const container = makeContainer(items);

  // Set default rects (all zero) so the initial snapshot doesn't throw
  for (const item of items) {
    setRect(item, {});
  }

  const hook = renderHook(
    ({ keys }: { keys: string[] }) => useFlip({ keys }),
    { initialProps: { keys: initialKeys } },
  );

  // Attach the ref; this does NOT trigger a re-render on its own
  act(() => {
    (hook.result.current.containerRef as React.MutableRefObject<HTMLElement>).current = container;
  });

  // Re-render with the same keys so the layout effect fires with the ref set
  // and sets keysRef.current = initialKeys.  After this, keysChanged will only
  // be true when keys actually change.
  act(() => {
    hook.rerender({ keys: initialKeys });
  });

  return { hook, container, items };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useFlip', () => {
  let animateSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock the Web Animations API (not implemented in jsdom)
    animateSpy = vi.fn(() => ({
      onfinish: null,
      cancel: vi.fn(),
    }));
    HTMLElement.prototype.animate = animateSpy;

    // Ensure CSS.escape is available (jsdom provides it, but guard just in case)
    if (!window.CSS) {
      (window as unknown as { CSS: { escape: (s: string) => string } }).CSS = {
        escape: (s: string) => s,
      };
    }
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    // Restore to the default non-reduced-motion stub from setup.ts
    mockReducedMotion(false);
  });

  // ─── 1. getItemProps ─────────────────────────────────────────────────────

  it('getItemProps(key) returns a stable data-flip-id attribute for the given key', () => {
    const { result } = renderHook(() => useFlip({ keys: ['a', 'b', 'c'] }));

    expect(result.current.getItemProps('a')).toEqual({ 'data-flip-id': 'a' });
    expect(result.current.getItemProps('b')).toEqual({ 'data-flip-id': 'b' });
    expect(result.current.getItemProps('xyz')).toEqual({ 'data-flip-id': 'xyz' });
  });

  // ─── 2. Reorder animation ────────────────────────────────────────────────

  it('calls Element.animate with an inverted translate transform per moved item', () => {
    const { hook, items } = setupFlipHook(['a', 'b']);
    const [itemA, itemB] = items;

    // Clear any animate calls that happened during setup
    animateSpy.mockClear();

    // Prime the "Before" rects that the hook will read during the next render
    // (snapshot runs synchronously during render, before useLayoutEffect)
    setRect(itemA, { left: 0, top: 0 });
    setRect(itemB, { left: 100, top: 0 });

    // After the render, useLayoutEffect reads the "After" rects.
    // We'll switch the rects between the render call and useLayoutEffect by
    // using mockReturnValueOnce: first call (render-phase) returns old pos,
    // second call (useLayoutEffect) returns new pos.
    itemA.getBoundingClientRect = vi.fn()
      // render-phase "Before": a was at left=0
      .mockReturnValueOnce({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect)
      // useLayoutEffect "After": a is now at left=100
      .mockReturnValueOnce({ left: 100, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect);

    itemB.getBoundingClientRect = vi.fn()
      // render-phase "Before": b was at left=100
      .mockReturnValueOnce({ left: 100, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect)
      // useLayoutEffect "After": b is now at left=0
      .mockReturnValueOnce({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect);

    act(() => {
      hook.rerender({ keys: ['b', 'a'] });
    });

    expect(animateSpy).toHaveBeenCalled();

    // Filter to reorder calls: 2-frame keyframe arrays where the first frame
    // is a non-identity translate
    const reorderCalls = animateSpy.mock.calls.filter(
      (call: unknown[]) => {
        const kf = call[0] as Array<Record<string, unknown>>;
        return (
          Array.isArray(kf) &&
          kf.length === 2 &&
          typeof kf[0].transform === 'string' &&
          kf[0].transform !== 'translate(0, 0)'
        );
      },
    );
    expect(reorderCalls.length).toBeGreaterThan(0);

    for (const call of reorderCalls) {
      const keyframes = call[0] as Array<Record<string, unknown>>;
      // Last frame must be identity
      expect(keyframes[1]).toEqual({ transform: 'translate(0, 0)' });
      // First frame must be a translate() with a numeric argument
      expect(keyframes[0].transform).toMatch(/^translate\(-?\d/);
    }
  });

  // ─── 3. Reduced motion ───────────────────────────────────────────────────

  it('uses duration 0 for all animations when prefers-reduced-motion is set', () => {
    mockReducedMotion(true);

    const { hook, items } = setupFlipHook(['a', 'b']);
    const [itemA, itemB] = items;

    animateSpy.mockClear();

    itemA.getBoundingClientRect = vi.fn()
      .mockReturnValueOnce({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect)
      .mockReturnValueOnce({ left: 100, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect);

    itemB.getBoundingClientRect = vi.fn()
      .mockReturnValueOnce({ left: 100, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect)
      .mockReturnValueOnce({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect);

    act(() => {
      hook.rerender({ keys: ['b', 'a'] });
    });

    // If animate was called, every call must have duration 0 (or the hook
    // skips animation entirely for duration 0 — both are acceptable)
    for (const call of animateSpy.mock.calls) {
      const options = call[1] as { duration?: number };
      expect(options.duration).toBe(0);
    }
  });

  // ─── 4. Focus preservation ───────────────────────────────────────────────

  it('restores focus to the previously focused item after a reorder', () => {
    const { hook, items } = setupFlipHook(['a', 'b', 'c']);
    const [itemA, itemB, itemC] = items;

    animateSpy.mockClear();

    // Focus item 'b' before the reorder
    act(() => {
      itemB.focus();
    });
    expect(document.activeElement).toBe(itemB);

    // Set up rects for the reorder: items move vertically
    itemA.getBoundingClientRect = vi.fn()
      .mockReturnValueOnce({ left: 0, top: 0, right: 0, bottom: 50, width: 0, height: 50, x: 0, y: 0, toJSON: () => ({}) } as DOMRect)
      .mockReturnValueOnce({ left: 0, top: 50, right: 0, bottom: 100, width: 0, height: 50, x: 0, y: 0, toJSON: () => ({}) } as DOMRect);

    itemB.getBoundingClientRect = vi.fn()
      .mockReturnValueOnce({ left: 0, top: 50, right: 0, bottom: 100, width: 0, height: 50, x: 0, y: 0, toJSON: () => ({}) } as DOMRect)
      .mockReturnValueOnce({ left: 0, top: 0, right: 0, bottom: 50, width: 0, height: 50, x: 0, y: 0, toJSON: () => ({}) } as DOMRect);

    itemC.getBoundingClientRect = vi.fn()
      .mockReturnValue({ left: 0, top: 100, right: 0, bottom: 150, width: 0, height: 50, x: 0, y: 0, toJSON: () => ({}) } as DOMRect);

    act(() => {
      hook.rerender({ keys: ['b', 'a', 'c'] });
    });

    // Focus must remain on itemB (identified by data-flip-id="b")
    expect(document.activeElement).toBe(itemB);
  });
});
