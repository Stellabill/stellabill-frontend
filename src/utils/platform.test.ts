import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getPlatform, isMac, getModifierKey, getModifierSymbol, formatShortcut } from './platform';

// Helper to mock navigator properties
function mockNavigator(overrides: Partial<Navigator>) {
  Object.defineProperty(globalThis, 'navigator', {
    value: { ...navigator, ...overrides },
    writable: true,
    configurable: true,
  });
}

describe('platform utilities', () => {
  beforeEach(() => {
    // Reset to a known state
    mockNavigator({
      platform: '',
      userAgent: '',
    });
  });

  describe('getPlatform', () => {
    it('detects macOS from navigator.platform', () => {
      mockNavigator({ platform: 'MacIntel' });
      expect(getPlatform()).toBe('mac');
    });

    it('detects Windows from navigator.platform', () => {
      mockNavigator({ platform: 'Win32' });
      expect(getPlatform()).toBe('windows');
    });

    it('detects Linux from navigator.platform', () => {
      mockNavigator({ platform: 'Linux x86_64' });
      expect(getPlatform()).toBe('linux');
    });

    it('detects macOS from userAgent as fallback', () => {
      mockNavigator({
        platform: '',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      });
      expect(getPlatform()).toBe('mac');
    });

    it('detects Windows from userAgent as fallback', () => {
      mockNavigator({
        platform: '',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      });
      expect(getPlatform()).toBe('windows');
    });

    it('detects Linux from userAgent as fallback', () => {
      mockNavigator({
        platform: '',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
      });
      expect(getPlatform()).toBe('linux');
    });

    it('returns "other" for unknown platforms', () => {
      mockNavigator({
        platform: '',
        userAgent: 'Unknown Browser',
      });
      expect(getPlatform()).toBe('other');
    });

    it('handles missing navigator gracefully', () => {
      const original = globalThis.navigator;
      vi.stubGlobal('navigator', undefined);
      expect(getPlatform()).toBe('other');
      vi.stubGlobal('navigator', original);
    });
  });

  describe('isMac', () => {
    it('returns true on macOS', () => {
      mockNavigator({ platform: 'MacIntel' });
      expect(isMac()).toBe(true);
    });

    it('returns false on Windows', () => {
      mockNavigator({ platform: 'Win32' });
      expect(isMac()).toBe(false);
    });

    it('returns false on Linux', () => {
      mockNavigator({ platform: 'Linux x86_64' });
      expect(isMac()).toBe(false);
    });
  });

  describe('getModifierKey', () => {
    it('returns "Cmd" on macOS', () => {
      mockNavigator({ platform: 'MacIntel' });
      expect(getModifierKey()).toBe('Cmd');
    });

    it('returns "Ctrl" on Windows', () => {
      mockNavigator({ platform: 'Win32' });
      expect(getModifierKey()).toBe('Ctrl');
    });

    it('returns "Ctrl" on Linux', () => {
      mockNavigator({ platform: 'Linux x86_64' });
      expect(getModifierKey()).toBe('Ctrl');
    });
  });

  describe('getModifierSymbol', () => {
    it('returns "⌘" on macOS', () => {
      mockNavigator({ platform: 'MacIntel' });
      expect(getModifierSymbol()).toBe('⌘');
    });

    it('returns "Ctrl" on Windows', () => {
      mockNavigator({ platform: 'Win32' });
      expect(getModifierSymbol()).toBe('Ctrl');
    });

    it('returns "Ctrl" on Linux', () => {
      mockNavigator({ platform: 'Linux x86_64' });
      expect(getModifierSymbol()).toBe('Ctrl');
    });
  });

  describe('formatShortcut', () => {
    it('replaces "mod" with platform modifier on macOS', () => {
      mockNavigator({ platform: 'MacIntel' });
      expect(formatShortcut(['mod', 'K'])).toEqual(['⌘', 'K']);
    });

    it('replaces "mod" with platform modifier on Windows', () => {
      mockNavigator({ platform: 'Win32' });
      expect(formatShortcut(['mod', 'K'])).toEqual(['Ctrl', 'K']);
    });

    it('preserves non-mod keys', () => {
      mockNavigator({ platform: 'MacIntel' });
      expect(formatShortcut(['Esc'])).toEqual(['Esc']);
      expect(formatShortcut(['Shift', 'Tab'])).toEqual(['Shift', 'Tab']);
    });

    it('handles mixed case "mod"', () => {
      mockNavigator({ platform: 'MacIntel' });
      expect(formatShortcut(['Mod', 'K'])).toEqual(['⌘', 'K']);
      expect(formatShortcut(['MOD', 'K'])).toEqual(['⌘', 'K']);
    });

    it('handles multiple mod keys', () => {
      mockNavigator({ platform: 'Win32' });
      expect(formatShortcut(['mod', 'Shift', 'K'])).toEqual(['Ctrl', 'Shift', 'K']);
    });

    it('returns empty array for empty input', () => {
      expect(formatShortcut([])).toEqual([]);
    });
  });
});
