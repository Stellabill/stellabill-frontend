import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSubscriptionActions } from './useSubscriptionActions';
import { subscriptions } from '../api/client';

vi.mock('../api/client', () => ({
  subscriptions: {
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    downgrade: vi.fn(),
    reactivate: vi.fn(),
  },
}));

describe('useSubscriptionActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('executes cancel with optimistic update, success toast, and pending state reset', async () => {
    let resolveCancel!: (val: { success: boolean }) => void;
    vi.mocked(subscriptions.cancel).mockImplementationOnce(
      () => new Promise((res) => { resolveCancel = res; }),
    );

    const onOptimistic = vi.fn();
    const onRollback = vi.fn();
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useSubscriptionActions());

    let promise!: Promise<boolean>;
    act(() => {
      promise = result.current.cancel('SUB-1', {
        onOptimistic,
        onRollback,
        onSuccess,
      });
    });

    expect(onOptimistic).toHaveBeenCalledOnce();
    expect(result.current.isPending).toBe(true);
    expect(result.current.pendingAction).toBe('cancel');
    expect(result.current.pendingId).toBe('SUB-1');

    await act(async () => {
      resolveCancel({ success: true });
      await promise;
    });

    expect(subscriptions.cancel).toHaveBeenCalledWith('SUB-1');
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(onRollback).not.toHaveBeenCalled();
    expect(result.current.isPending).toBe(false);
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      status: 'success',
      title: 'Subscription cancelled',
    });
  });

  it('rolls back optimistic update and emits error toast when an action fails', async () => {
    vi.mocked(subscriptions.pause).mockRejectedValueOnce(
      Object.assign(new Error('Pause rejected'), {
        technicalDetails: 'Contract locked',
      }),
    );

    const onOptimistic = vi.fn();
    const onRollback = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() => useSubscriptionActions());

    let success = true;
    await act(async () => {
      success = await result.current.pause('SUB-2', {
        onOptimistic,
        onRollback,
        onError,
      });
    });

    expect(success).toBe(false);
    expect(onOptimistic).toHaveBeenCalledOnce();
    expect(onRollback).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith({
      message: 'Pause rejected',
      technicalDetails: 'Contract locked',
    });
    expect(result.current.error).toEqual({
      message: 'Pause rejected',
      technicalDetails: 'Contract locked',
    });
    expect(result.current.toasts[0]).toMatchObject({
      status: 'error',
      title: 'Pause rejected',
      message: 'Contract locked',
    });
  });

  it('executes resume with pending toast transitioning to success or error', async () => {
    let rejectResume!: (err: Error) => void;
    vi.mocked(subscriptions.resume).mockImplementationOnce(
      () => new Promise((_, rej) => { rejectResume = rej; }),
    );

    const onOptimistic = vi.fn();
    const onRollback = vi.fn();

    const { result } = renderHook(() => useSubscriptionActions());

    let promise!: Promise<boolean>;
    act(() => {
      promise = result.current.resume('SUB-3', { onOptimistic, onRollback });
    });

    expect(result.current.toasts[0]).toMatchObject({
      status: 'pending',
      title: 'Resuming subscription',
    });

    await act(async () => {
      rejectResume(new Error('Resume timeout'));
      await promise;
    });

    expect(onRollback).toHaveBeenCalledOnce();
    expect(result.current.toasts[0]).toMatchObject({
      status: 'error',
      title: 'Resume timeout',
    });
  });

  it('executes downgrade and reactivate and supports removing toasts', async () => {
    vi.mocked(subscriptions.downgrade).mockResolvedValueOnce({ success: true });
    vi.mocked(subscriptions.reactivate).mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() => useSubscriptionActions());

    await act(async () => {
      await result.current.downgrade('SUB-4', { planName: 'Basic' });
    });
    expect(subscriptions.downgrade).toHaveBeenCalledWith('SUB-4', { planName: 'Basic' });
    expect(result.current.toasts[0].title).toBe('Plan downgraded');

    await act(async () => {
      await result.current.reactivate('SUB-4', { startDate: '2026-08-01T00:00:00.000Z' });
    });
    expect(subscriptions.reactivate).toHaveBeenCalledWith('SUB-4', {
      startDate: '2026-08-01T00:00:00.000Z',
    });
    expect(result.current.toasts).toHaveLength(2);

    act(() => {
      result.current.removeToast(result.current.toasts[0].id);
    });
    expect(result.current.toasts).toHaveLength(1);
  });
});
