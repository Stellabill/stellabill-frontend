import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProductTour } from './useProductTour';

describe('useProductTour', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Initial state', () => {
    it('should start with tour closed for new users', () => {
      const { result } = renderHook(() => useProductTour());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.showCompletion).toBe(false);
    });

    it('should auto-open tour after delay for new users', async () => {
      const { result } = renderHook(() => useProductTour());

      expect(result.current.isOpen).toBe(false);

      // Fast-forward past the 800ms delay
      act(() => {
        vi.advanceTimersByTime(800);
      });

      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
      });
    });

    it('should not open tour if already completed', () => {
      localStorage.setItem('sb:tour-completed', 'true');

      const { result } = renderHook(() => useProductTour());

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should not open tour if dismissed', () => {
      localStorage.setItem('sb:tour-dismissed', 'true');

      const { result } = renderHook(() => useProductTour());

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('Manual controls', () => {
    it('should open tour when startTour is called', () => {
      const { result } = renderHook(() => useProductTour());

      act(() => {
        result.current.startTour();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should close tour when closeTour is called', () => {
      const { result } = renderHook(() => useProductTour());

      act(() => {
        result.current.startTour();
      });

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.closeTour();
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('Tour completion', () => {
    it('should mark tour as completed and show completion screen', () => {
      const { result } = renderHook(() => useProductTour());

      act(() => {
        result.current.completeTour();
      });

      expect(localStorage.getItem('sb:tour-completed')).toBe('true');
      expect(result.current.showCompletion).toBe(true);
    });

    it('should close completion screen when closeCompletion is called', () => {
      const { result } = renderHook(() => useProductTour());

      act(() => {
        result.current.completeTour();
      });

      expect(result.current.showCompletion).toBe(true);

      act(() => {
        result.current.closeCompletion();
      });

      expect(result.current.showCompletion).toBe(false);
    });
  });

  describe('Tour dismissal', () => {
    it('should mark tour as dismissed', () => {
      const { result } = renderHook(() => useProductTour());

      act(() => {
        result.current.dismissTour();
      });

      expect(localStorage.getItem('sb:tour-dismissed')).toBe('true');
    });

    it('should not auto-open tour after dismissal', () => {
      const { result } = renderHook(() => useProductTour());

      act(() => {
        result.current.dismissTour();
      });

      const { result: newResult } = renderHook(() => useProductTour());

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(newResult.current.isOpen).toBe(false);
    });
  });

  describe('Tour reset', () => {
    it('should clear all tour state', () => {
      const { result } = renderHook(() => useProductTour());

      // Complete and dismiss tour
      act(() => {
        result.current.completeTour();
        result.current.dismissTour();
      });

      expect(localStorage.getItem('sb:tour-completed')).toBe('true');
      expect(localStorage.getItem('sb:tour-dismissed')).toBe('true');

      // Reset tour
      act(() => {
        result.current.resetTour();
      });

      expect(localStorage.getItem('sb:tour-completed')).toBeNull();
      expect(localStorage.getItem('sb:tour-dismissed')).toBeNull();
      expect(result.current.isOpen).toBe(false);
      expect(result.current.showCompletion).toBe(false);
    });
  });

  describe('Version management', () => {
    it('should reset tour when version changes', () => {
      // Set old version data
      localStorage.setItem('sb:tour-completed', 'true');
      localStorage.setItem('sb:tour-dismissed', 'true');
      localStorage.setItem('sb:tour-completed-version', '0.9');

      const { result } = renderHook(() => useProductTour());

      // Should clear old data due to version mismatch
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(localStorage.getItem('sb:tour-completed')).toBeNull();
      expect(localStorage.getItem('sb:tour-dismissed')).toBeNull();
      expect(localStorage.getItem('sb:tour-completed-version')).toBe('1.0');
    });

    it('should not reset tour if version matches', () => {
      localStorage.setItem('sb:tour-completed', 'true');
      localStorage.setItem('sb:tour-completed-version', '1.0');

      const { result } = renderHook(() => useProductTour());

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(localStorage.getItem('sb:tour-completed')).toBe('true');
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('State persistence', () => {
    it('should persist completion state across hook instances', () => {
      const { result: firstInstance } = renderHook(() => useProductTour());

      act(() => {
        firstInstance.current.completeTour();
      });

      // Create new instance
      const { result: secondInstance } = renderHook(() => useProductTour());

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should not open because it's marked as completed
      expect(secondInstance.current.isOpen).toBe(false);
    });

    it('should persist dismissal state across hook instances', () => {
      const { result: firstInstance } = renderHook(() => useProductTour());

      act(() => {
        firstInstance.current.dismissTour();
      });

      // Create new instance
      const { result: secondInstance } = renderHook(() => useProductTour());

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should not open because it's marked as dismissed
      expect(secondInstance.current.isOpen).toBe(false);
    });
  });

  describe('Storage failure resilience', () => {
    const throwSecurityError = () => {
      throw new DOMException('Storage disabled', 'SecurityError');
    };

    it('should render without throwing when getItem throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(throwSecurityError);

      expect(() => renderHook(() => useProductTour())).not.toThrow();
    });

    it('should fall back to in-memory defaults when reads throw', async () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(throwSecurityError);

      const { result } = renderHook(() => useProductTour());

      act(() => {
        vi.advanceTimersByTime(800);
      });

      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
      });
    });

    it('should keep completion state in memory when setItem throws', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(throwSecurityError);

      const { result } = renderHook(() => useProductTour());

      expect(() => {
        act(() => {
          result.current.completeTour();
        });
      }).not.toThrow();

      expect(result.current.showCompletion).toBe(true);
    });

    it('should dismiss the open tour in memory when setItem throws', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(throwSecurityError);

      const { result } = renderHook(() => useProductTour());

      act(() => {
        result.current.startTour();
      });

      expect(result.current.isOpen).toBe(true);

      expect(() => {
        act(() => {
          result.current.dismissTour();
        });
      }).not.toThrow();

      expect(result.current.isOpen).toBe(false);
    });

    it('should keep dismiss and reset state in memory when storage writes throw', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(throwSecurityError);
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(throwSecurityError);

      const { result } = renderHook(() => useProductTour());

      expect(() => {
        act(() => {
          result.current.dismissTour();
          result.current.completeTour();
          result.current.resetTour();
        });
      }).not.toThrow();

      expect(result.current.isOpen).toBe(false);
      expect(result.current.showCompletion).toBe(false);
    });

    it('should still run the TOUR_VERSION reset when getItem throws', () => {
      const getItemSpy = vi
        .spyOn(Storage.prototype, 'getItem')
        .mockImplementation(throwSecurityError);
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      renderHook(() => useProductTour());

      expect(getItemSpy).toHaveBeenCalledWith('sb:tour-completed-version');
      expect(setItemSpy).toHaveBeenCalledWith('sb:tour-completed-version', '1.0');
    });

    it('should not throw when every storage operation throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(throwSecurityError);
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(throwSecurityError);
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(throwSecurityError);

      expect(() => renderHook(() => useProductTour())).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw errors
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      const { result } = renderHook(() => useProductTour());

      // Should not crash when localStorage fails
      expect(() => {
        act(() => {
          result.current.completeTour();
        });
      }).not.toThrow();

      // Restore original
      Storage.prototype.setItem = originalSetItem;
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('sb:tour-completed', 'invalid-json{');

      // Should not crash with invalid data
      expect(() => {
        renderHook(() => useProductTour());
      }).not.toThrow();
    });

    it('should cleanup timer on unmount', () => {
      const { unmount } = renderHook(() => useProductTour());

      unmount();

      // Advance timers - should not open tour after unmount
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // No error should occur
    });
  });
});
