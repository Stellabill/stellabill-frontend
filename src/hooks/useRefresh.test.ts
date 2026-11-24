import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useRefresh } from './useRefresh';

describe('useRefresh', () => {
  const onRefresh = vi.fn().mockResolvedValue(undefined);

  const mockMatchMedia = (matches: boolean) => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  };

  const createContainer = () => {
    const container = document.createElement('div');
    Object.defineProperty(container, 'scrollTop', {
      writable: true,
      value: 0,
    });
    document.body.appendChild(container);
    return container;
  };

  const dispatchTouch = (
    target: EventTarget,
    type: 'touchstart' | 'touchmove' | 'touchend',
    clientY?: number,
  ) => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    if (clientY !== undefined) {
      Object.defineProperty(event, 'touches', {
        value: [{ clientY: clientY }],
      });
    }
    target.dispatchEvent(event);
    return event;
  };

  const setupWithContainer = (options: Partial<Parameters<typeof useRefresh>[0]> = {}) => {
    const container = createContainer();
    const hook = renderHook(() => useRefresh({ onRefresh, ...options }));
    container.addEventListener('touchstart', hook.result.current.handlers.onTouchStart as EventListener);
    container.addEventListener('touchend', hook.result.current.handlers.onTouchEnd as EventListener);
    act(() => {
      hook.result.current.containerRef.current = container;
      hook.rerender();
    });
    return { container, ...hook };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMatchMedia(false);
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useRefresh({ onRefresh }));
    expect(result.current.pullDistance).toBe(0);
    expect(result.current.isRefreshing).toBe(false);
  });

  it('should not update pull distance if scrolled down', () => {
    const { container, result } = setupWithContainer();
    container.scrollTop = 10;

    act(() => {
      dispatchTouch(container, 'touchstart', 100);
      dispatchTouch(container, 'touchmove', 200);
    });

    expect(result.current.pullDistance).toBe(0);
    container.remove();
  });

  it('should update pull distance when pulling down', () => {
    const { container, result } = setupWithContainer();

    act(() => {
      dispatchTouch(container, 'touchstart', 100);
      dispatchTouch(container, 'touchmove', 200);
    });

    // 100 delta * 0.4 resistance = 40
    expect(result.current.pullDistance).toBe(40);
    container.remove();
  });

  it('should trigger refresh if pulled past threshold', async () => {
    const { container, result } = setupWithContainer({ threshold: 50 });

    act(() => {
      dispatchTouch(container, 'touchstart', 100);
      dispatchTouch(container, 'touchmove', 300); // 200 delta * 0.4 = 80 distance
    });

    expect(result.current.pullDistance).toBe(80);

    await act(async () => {
      dispatchTouch(container, 'touchend');
      await Promise.resolve();
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.pullDistance).toBe(0);
    container.remove();
  });

  it('should not trigger refresh if threshold not reached', async () => {
    const { container, result } = setupWithContainer({ threshold: 50 });

    act(() => {
      dispatchTouch(container, 'touchstart', 100);
      dispatchTouch(container, 'touchmove', 150); // 50 delta * 0.4 = 20
    });

    expect(result.current.pullDistance).toBe(20);

    await act(async () => {
      dispatchTouch(container, 'touchend');
      await Promise.resolve();
    });

    expect(onRefresh).not.toHaveBeenCalled();
    expect(result.current.pullDistance).toBe(0);
    container.remove();
  });

  it('should trigger refresh with reduced motion without applying translate', async () => {
    mockMatchMedia(true);
    const { container, result } = setupWithContainer({ threshold: 50 });

    act(() => {
      dispatchTouch(container, 'touchstart', 100);
      dispatchTouch(container, 'touchmove', 300); // raw delta 200 > threshold
    });

    // Visual offset stays at 0 with reduced motion
    expect(result.current.pullDistance).toBe(0);

    await act(async () => {
      dispatchTouch(container, 'touchend');
      await Promise.resolve();
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(result.current.pullDistance).toBe(0);
    container.remove();
  });

  it('should use latest distance on fast pull', async () => {
    const { container } = setupWithContainer({ threshold: 50 });

    act(() => {
      dispatchTouch(container, 'touchstart', 100);
    });

    // Fast pull: move and end within the same act, so state hasn't committed yet
    await act(async () => {
      dispatchTouch(container, 'touchmove', 300);
      dispatchTouch(container, 'touchend');
      await Promise.resolve();
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);
    container.remove();
  });

  it('should register touchmove as non-passive', () => {
    const container = createContainer();
    const addSpy = vi.spyOn(container, 'addEventListener');
    const { result, rerender } = renderHook(() => useRefresh({ onRefresh }));

    act(() => {
      result.current.containerRef.current = container;
      rerender();
    });

    const moveCall = addSpy.mock.calls.find(([type]) => type === 'touchmove');
    expect(moveCall).toBeTruthy();
    expect(moveCall?.[2]).toMatchObject({ passive: false });
    container.remove();
  });

  it('should prevent native scroll during downward pull at scrollTop 0', () => {
    const { container } = setupWithContainer();

    let moveEvent!: Event;
    act(() => {
      dispatchTouch(container, 'touchstart', 100);
      moveEvent = dispatchTouch(container, 'touchmove', 200);
    });

    expect(moveEvent.defaultPrevented).toBe(true);
    container.remove();
  });

  it('should manually trigger refresh', async () => {
    const { result } = renderHook(() => useRefresh({ onRefresh }));

    await act(async () => {
      await result.current.triggerRefresh();
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
