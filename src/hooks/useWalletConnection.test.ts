import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWalletConnection } from './useWalletConnection';

describe('useWalletConnection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes in disconnected state with empty address and closed modal', () => {
    const { result } = renderHook(() => useWalletConnection());

    expect(result.current.connectionState).toBe('disconnected');
    expect(result.current.isConnected).toBe(false);
    expect(result.current.address).toBe('');
    expect(result.current.errorMessage).toBe('');
    expect(result.current.isModalOpen).toBe(false);
  });

  it('opens and closes modal', () => {
    const { result } = renderHook(() => useWalletConnection());

    act(() => {
      result.current.openModal();
    });
    expect(result.current.isModalOpen).toBe(true);

    act(() => {
      result.current.closeModal();
    });
    expect(result.current.isModalOpen).toBe(false);
  });

  it('connects successfully and closes modal', async () => {
    const onConnect = vi.fn();
    const { result } = renderHook(() =>
      useWalletConnection({
        connectDelayMs: 0,
        randomFn: () => 0.9,
        onConnect,
      })
    );

    act(() => {
      result.current.openModal();
    });

    act(() => {
      result.current.connectFreighter();
    });

    await vi.waitFor(() => {
      expect(result.current.connectionState).toBe('connected');
      expect(result.current.isConnected).toBe(true);
      expect(result.current.address).toBe('GB3K4Y5QYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQ');
      expect(result.current.isModalOpen).toBe(false);
      expect(onConnect).toHaveBeenCalledWith('GB3K4Y5QYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQ');
    });
  });

  it('handles connection error and retry', async () => {
    const randomFn = vi.fn().mockReturnValueOnce(0.1).mockReturnValueOnce(0.9);
    const { result } = renderHook(() =>
      useWalletConnection({
        connectDelayMs: 0,
        randomFn,
      })
    );

    act(() => {
      result.current.openModal();
    });

    act(() => {
      result.current.connectFreighter();
    });

    await vi.waitFor(() => {
      expect(result.current.connectionState).toBe('error');
      expect(result.current.errorMessage).toBe('Connection rejected by user');
      expect(result.current.isConnected).toBe(false);
    });

    act(() => {
      result.current.retry();
    });

    expect(result.current.connectionState).toBe('disconnected');
    expect(result.current.errorMessage).toBe('');
    expect(result.current.isModalOpen).toBe(true);
  });

  it('cancels pending connection if closed during connecting', async () => {
    const { result } = renderHook(() =>
      useWalletConnection({
        connectDelayMs: 200,
        randomFn: () => 0.9,
      })
    );

    act(() => {
      result.current.openModal();
    });

    act(() => {
      result.current.connectFreighter();
    });

    expect(result.current.connectionState).toBe('connecting');

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.connectionState).toBe('disconnected');
    expect(result.current.isModalOpen).toBe(false);
  });

  it('disconnects and clears address', async () => {
    const onDisconnect = vi.fn();
    const { result } = renderHook(() =>
      useWalletConnection({
        connectDelayMs: 0,
        randomFn: () => 0.9,
        onDisconnect,
      })
    );

    act(() => {
      result.current.connectFreighter();
    });

    await vi.waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.connectionState).toBe('disconnected');
    expect(result.current.isConnected).toBe(false);
    expect(result.current.address).toBe('');
    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });
});
