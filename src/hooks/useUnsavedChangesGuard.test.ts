import { createElement, type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  UnsavedChangesProvider,
  useUnsavedChangesGuard,
} from './useUnsavedChangesGuard';

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(UnsavedChangesProvider, null, children);

describe('useUnsavedChangesGuard', () => {
  it('throws when used outside an UnsavedChangesProvider', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => renderHook(() => useUnsavedChangesGuard())).toThrow(
        'useUnsavedChangesGuard must be used within an UnsavedChangesProvider',
      );
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it('starts clean and flips isDirty via setDirty', () => {
    const { result } = renderHook(() => useUnsavedChangesGuard(), { wrapper });

    expect(result.current.isDirty).toBe(false);

    act(() => {
      result.current.setDirty(true);
    });
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.setDirty(false);
    });
    expect(result.current.isDirty).toBe(false);
  });

  it('resolves confirmNavigation to true when no blocker is registered', async () => {
    const { result } = renderHook(() => useUnsavedChangesGuard(), { wrapper });

    await expect(result.current.confirmNavigation()).resolves.toBe(true);
  });

  it('returns the registered blocker boolean for both sync and promise blockers', async () => {
    const { result } = renderHook(() => useUnsavedChangesGuard(), { wrapper });

    const syncFalseBlocker = vi.fn(() => false);
    act(() => {
      result.current.registerBlocker(syncFalseBlocker);
    });
    await expect(result.current.confirmNavigation()).resolves.toBe(false);
    expect(syncFalseBlocker).toHaveBeenCalledTimes(1);

    const syncTrueBlocker = vi.fn(() => true);
    act(() => {
      result.current.registerBlocker(syncTrueBlocker);
    });
    await expect(result.current.confirmNavigation()).resolves.toBe(true);
    expect(syncTrueBlocker).toHaveBeenCalledTimes(1);

    const asyncFalseBlocker = vi.fn(async () => false);
    act(() => {
      result.current.registerBlocker(asyncFalseBlocker);
    });
    await expect(result.current.confirmNavigation()).resolves.toBe(false);
    expect(asyncFalseBlocker).toHaveBeenCalledTimes(1);

    const asyncTrueBlocker = vi.fn(async () => true);
    act(() => {
      result.current.registerBlocker(asyncTrueBlocker);
    });
    await expect(result.current.confirmNavigation()).resolves.toBe(true);
    expect(asyncTrueBlocker).toHaveBeenCalledTimes(1);
  });

  it('unregister clears only its own blocker so a later blocker survives', async () => {
    const { result } = renderHook(() => useUnsavedChangesGuard(), { wrapper });

    const firstBlocker = vi.fn(() => true);
    const secondBlocker = vi.fn(() => false);

    let unregisterFirst!: () => void;
    let unregisterSecond!: () => void;

    act(() => {
      unregisterFirst = result.current.registerBlocker(firstBlocker);
      unregisterSecond = result.current.registerBlocker(secondBlocker);
    });

    // Unregistering the first blocker must not clear the second blocker.
    act(() => {
      unregisterFirst();
    });

    await expect(result.current.confirmNavigation()).resolves.toBe(false);
    expect(secondBlocker).toHaveBeenCalledTimes(1);
    expect(firstBlocker).not.toHaveBeenCalled();

    // Unregistering the active blocker restores default true behavior.
    act(() => {
      unregisterSecond();
    });

    await expect(result.current.confirmNavigation()).resolves.toBe(true);
  });

  it('prevents beforeunload only while dirty and removes listener after setDirty(false)', () => {
    const { result } = renderHook(() => useUnsavedChangesGuard(), { wrapper });

    const cleanEvent = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
    window.dispatchEvent(cleanEvent);
    expect(cleanEvent.defaultPrevented).toBe(false);

    act(() => {
      result.current.setDirty(true);
    });

    const dirtyEvent = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
    window.dispatchEvent(dirtyEvent);
    expect(dirtyEvent.defaultPrevented).toBe(true);

    act(() => {
      result.current.setDirty(false);
    });

    const afterResetEvent = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
    window.dispatchEvent(afterResetEvent);
    expect(afterResetEvent.defaultPrevented).toBe(false);
  });
});
