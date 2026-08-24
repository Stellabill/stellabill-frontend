import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useRefresh } from './useRefresh';

describe('useRefresh', () => {
  const onRefresh = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useRefresh({ onRefresh }));
    expect(result.current.pullDistance).toBe(0);
    expect(result.current.isRefreshing).toBe(false);
  });

  it('should not update pull distance if scrolled down', () => {
    const { result } = renderHook(() => useRefresh({ onRefresh }));
    
    act(() => {
      const mockEvent = {
        currentTarget: { scrollTop: 10 },
        touches: [{ clientY: 100 }]
      } as any;
      result.current.handlers.onTouchStart(mockEvent);
    });
    
    expect(result.current.pullDistance).toBe(0);
  });

  it('should update pull distance when pulling down', () => {
    const { result } = renderHook(() => useRefresh({ onRefresh }));
    
    act(() => {
      const startEvent = {
        currentTarget: { scrollTop: 0 },
        touches: [{ clientY: 100 }]
      } as any;
      result.current.handlers.onTouchStart(startEvent);
      
      const moveEvent = {
        currentTarget: { scrollTop: 0 },
        touches: [{ clientY: 200 }],
        cancelable: true,
        preventDefault: vi.fn()
      } as any;
      result.current.handlers.onTouchMove(moveEvent);
    });
    
    // 100 delta * 0.4 resistance = 40
    expect(result.current.pullDistance).toBe(40);
  });

  it('should trigger refresh if pulled past threshold', async () => {
    const { result } = renderHook(() => useRefresh({ onRefresh, threshold: 50 }));
    
    act(() => {
      const startEvent = {
        currentTarget: { scrollTop: 0 },
        touches: [{ clientY: 100 }]
      } as any;
      result.current.handlers.onTouchStart(startEvent);
      
      const moveEvent = {
        currentTarget: { scrollTop: 0 },
        touches: [{ clientY: 300 }], // 200 delta * 0.4 = 80 distance
        cancelable: true,
        preventDefault: vi.fn()
      } as any;
      result.current.handlers.onTouchMove(moveEvent);
    });
    
    expect(result.current.pullDistance).toBe(80);
    
    await act(async () => {
      result.current.handlers.onTouchEnd();
    });
    
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.pullDistance).toBe(0);
  });

  it('should manually trigger refresh', async () => {
    const { result } = renderHook(() => useRefresh({ onRefresh }));
    
    await act(async () => {
      await result.current.triggerRefresh();
    });
    
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
