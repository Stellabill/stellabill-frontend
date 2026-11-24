import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useReactivationDateState } from './useReactivationDateState';

describe('useReactivationDateState', () => {
  it('initializes with mode="today" and customDate=null', () => {
    const { result } = renderHook(() => useReactivationDateState(true));
    expect(result.current.mode).toBe('today');
    expect(result.current.customDate).toBeNull();
  });

  it('updates mode and customDate and resets them when reopened', () => {
    const { result, rerender } = renderHook(
      ({ isOpen }) => useReactivationDateState(isOpen),
      { initialProps: { isOpen: true } },
    );

    const chosenDate = new Date(2025, 6, 10);
    act(() => {
      result.current.setMode('custom');
      result.current.setCustomDate(chosenDate);
    });

    expect(result.current.mode).toBe('custom');
    expect(result.current.customDate).toBe(chosenDate);

    rerender({ isOpen: false });
    rerender({ isOpen: true });

    expect(result.current.mode).toBe('today');
    expect(result.current.customDate).toBeNull();
  });
});
