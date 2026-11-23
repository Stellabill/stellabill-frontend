import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { initializeDensity, useDensity } from './useDensity';

const STORAGE_KEY = 'stellabill-density-preference';

describe('useDensity', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.density;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes the document density from storage', () => {
    localStorage.setItem(STORAGE_KEY, 'spacious');

    initializeDensity();

    expect(document.documentElement.dataset.density).toBe('spacious');
  });

  it('uses comfortable when the stored density is invalid', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid');

    initializeDensity();

    expect(document.documentElement.dataset.density).toBe('comfortable');
  });

  it('applies and persists a selected density', () => {
    const { result } = renderHook(() => useDensity());

    act(() => {
      result.current.setDensity('compact');
    });

    expect(document.documentElement.dataset.density).toBe('compact');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('compact');
  });

  it('removes the stored preference when reset', () => {
    localStorage.setItem(STORAGE_KEY, 'compact');
    const { result } = renderHook(() => useDensity());

    act(() => {
      result.current.resetDensity();
    });

    expect(result.current.density).toBe('comfortable');
    expect(result.current.isDefault).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('remains usable when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });

    const { result } = renderHook(() => useDensity());

    expect(result.current.density).toBe('comfortable');

    act(() => {
      result.current.setDensity('compact');
    });

    expect(result.current.density).toBe('compact');
    expect(document.documentElement.dataset.density).toBe('compact');
  });
});
