import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSessionTimeout } from './useSessionTimeout';

class MockBroadcastChannel {
  static instances: MockBroadcastChannel[] = [];

  onmessage: ((event: MessageEvent) => void) | null = null;
  postMessage = vi.fn();
  close = vi.fn();

  constructor(public name: string) {
    MockBroadcastChannel.instances.push(this);
  }

  receive(data: unknown) {
    this.onmessage?.({ data } as MessageEvent);
  }
}

describe('useSessionTimeout', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    MockBroadcastChannel.instances = [];
    localStorage.removeItem('stellabill-session-event');
  });

  it('resets the timer when another tab reports activity', () => {
    vi.useFakeTimers();
    vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);
    const onTimeout = vi.fn();
    const { result, unmount } = renderHook(() =>
      useSessionTimeout({
        sessionDurationSeconds: 10,
        warningDurationSeconds: 2,
        onTimeout,
      }),
    );
    const channel = MockBroadcastChannel.instances[0];

    act(() => {
      document.dispatchEvent(new Event('mousedown'));
    });
    expect(channel.postMessage).toHaveBeenCalledWith({ type: 'activity' });

    act(() => {
      vi.advanceTimersByTime(7_000);
      channel.receive({ type: 'activity' });
      vi.advanceTimersByTime(7_000);
    });
    expect(result.current.isWarningOpen).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(result.current.isWarningOpen).toBe(true);

    unmount();
    expect(channel.close).toHaveBeenCalledOnce();
  });

  it('broadcasts local logout and logs out when another tab reports a timeout', () => {
    vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useSessionTimeout({ onTimeout }));
    const channel = MockBroadcastChannel.instances[0];

    act(() => {
      result.current.handleLogout();
    });
    expect(channel.postMessage).toHaveBeenCalledWith({ type: 'timeout' });
    expect(onTimeout).toHaveBeenCalledTimes(1);

    act(() => {
      channel.receive({ type: 'timeout' });
    });
    expect(onTimeout).toHaveBeenCalledTimes(2);
    expect(channel.postMessage).toHaveBeenCalledTimes(1);
  });

  it('uses storage events when BroadcastChannel is unavailable', () => {
    vi.useFakeTimers();
    vi.stubGlobal('BroadcastChannel', undefined);
    const onTimeout = vi.fn();
    const { result } = renderHook(() =>
      useSessionTimeout({
        sessionDurationSeconds: 10,
        warningDurationSeconds: 2,
        onTimeout,
      }),
    );

    act(() => {
      document.dispatchEvent(new Event('mousedown'));
    });
    expect(localStorage.getItem('stellabill-session-event')).toMatch(/^activity:/);

    act(() => {
      vi.advanceTimersByTime(7_000);
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'stellabill-session-event',
        newValue: ['activity', Date.now()].join(':'),
      }));
      vi.advanceTimersByTime(7_000);
    });
    expect(result.current.isWarningOpen).toBe(false);

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'stellabill-session-event',
        newValue: ['timeout', Date.now()].join(':'),
      }));
    });
    expect(onTimeout).toHaveBeenCalledOnce();
  });
});
