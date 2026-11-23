import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSessionTimeout } from './useSessionTimeout';

describe('useSessionTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('opens the warning after 780 s with default options and counts down from 120', () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useSessionTimeout({ onTimeout }));

    expect(result.current.isWarningOpen).toBe(false);
    expect(result.current.remainingSeconds).toBe(120);

    // Just before 780 s (900 - 120), warning should still be closed
    act(() => {
      vi.advanceTimersByTime(779_000);
    });
    expect(result.current.isWarningOpen).toBe(false);
    expect(result.current.remainingSeconds).toBe(120);

    // At 780 s, warning opens with 120 s remaining
    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(result.current.isWarningOpen).toBe(true);
    expect(result.current.remainingSeconds).toBe(120);

    // Counts down each second
    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(result.current.remainingSeconds).toBe(119);

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(result.current.remainingSeconds).toBe(114);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('handleStaySignedIn closes the warning and restarts the timer', () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useSessionTimeout({ onTimeout }));

    // Trigger warning and let countdown tick down
    act(() => {
      vi.advanceTimersByTime(780_000);
    });
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(result.current.isWarningOpen).toBe(true);
    expect(result.current.remainingSeconds).toBe(110);

    // Stay signed in -> closes warning, resets remainingSeconds, restarts 780 s timer
    act(() => {
      result.current.handleStaySignedIn();
    });
    expect(result.current.isWarningOpen).toBe(false);
    expect(result.current.remainingSeconds).toBe(120);

    // Advancing 779 s should keep warning closed
    act(() => {
      vi.advanceTimersByTime(779_000);
    });
    expect(result.current.isWarningOpen).toBe(false);

    // Advancing 1 more second (total 780 s after reset) opens warning again
    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(result.current.isWarningOpen).toBe(true);
    expect(result.current.remainingSeconds).toBe(120);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('calls onTimeout once when the countdown reaches 0', () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useSessionTimeout({ onTimeout }));

    // Open warning at 780 s
    act(() => {
      vi.advanceTimersByTime(780_000);
    });
    expect(result.current.isWarningOpen).toBe(true);

    // Advance 119 s -> 1 s remaining, onTimeout not called yet
    act(() => {
      vi.advanceTimersByTime(119_000);
    });
    expect(result.current.remainingSeconds).toBe(1);
    expect(onTimeout).not.toHaveBeenCalled();

    // Advance final 1 s -> reaches 0, onTimeout called once
    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(result.current.remainingSeconds).toBe(0);
    expect(onTimeout).toHaveBeenCalledTimes(1);

    // Further time elapsing should not invoke onTimeout again
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('restarts the timer on activity events and removes listeners and timers on unmount', () => {
    const onTimeout = vi.fn();
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const { result, unmount } = renderHook(() => useSessionTimeout({ onTimeout }));

    // Advance 500 s, then dispatch a keydown activity event
    act(() => {
      vi.advanceTimersByTime(500_000);
    });
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    });

    // Advance another 500 s (1000 s total, but only 500 s since keydown)
    act(() => {
      vi.advanceTimersByTime(500_000);
    });
    expect(result.current.isWarningOpen).toBe(false);

    // Advance remaining 280 s (780 s since keydown) -> warning opens
    act(() => {
      vi.advanceTimersByTime(280_000);
    });
    expect(result.current.isWarningOpen).toBe(true);

    // Unmount should remove all activity listeners and clear active timers
    unmount();

    const expectedEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'touchmove',
      'click',
      'wheel',
    ];
    for (const eventName of expectedEvents) {
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        eventName,
        expect.any(Function)
      );
    }

    // Advancing past the countdown after unmount must not call onTimeout
    act(() => {
      vi.advanceTimersByTime(200_000);
    });
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('respects custom sessionDurationSeconds and warningDurationSeconds', () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() =>
      useSessionTimeout({
        sessionDurationSeconds: 60,
        warningDurationSeconds: 15,
        onTimeout,
      })
    );

    expect(result.current.isWarningOpen).toBe(false);
    expect(result.current.remainingSeconds).toBe(15);

    // 44 s elapsed -> still closed
    act(() => {
      vi.advanceTimersByTime(44_000);
    });
    expect(result.current.isWarningOpen).toBe(false);

    // 45 s elapsed (60 - 15) -> warning opens with 15 s remaining
    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(result.current.isWarningOpen).toBe(true);
    expect(result.current.remainingSeconds).toBe(15);

    // Advance 15 s -> countdown hits 0 and onTimeout fires once
    act(() => {
      vi.advanceTimersByTime(15_000);
    });
    expect(result.current.remainingSeconds).toBe(0);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('handleLogout clears timers and invokes onTimeout immediately', () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useSessionTimeout({ onTimeout }));

    act(() => {
      result.current.handleLogout();
    });
    expect(onTimeout).toHaveBeenCalledTimes(1);

    // Advancing past full session duration should not trigger onTimeout again
    act(() => {
      vi.advanceTimersByTime(1_000_000);
    });
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });
});
