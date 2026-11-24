import { describe, it, expect } from 'vitest';
import { getInitials, getAvatarGradient } from './avatar';

const AVATAR_PALETTE: readonly [string, string][] = [
  ['#6366f1', '#8b5cf6'],
  ['#22d3ee', '#2dd4bf'],
  ['#f59e0b', '#f97316'],
  ['#ec4899', '#f43f5e'],
  ['#14b8a6', '#10b981'],
  ['#3b82f6', '#6366f1'],
  ['#a855f7', '#d946ef'],
  ['#06b6d4', '#0ea5e9'],
  ['#84cc16', '#22c55e'],
  ['#f97316', '#ef4444'],
] as const;

describe('avatar utilities', () => {
  describe('getInitials', () => {
    it('extracts initials for two-word, single-word, and Unicode names', () => {
      expect(getInitials('John Doe')).toBe('JD');
      expect(getInitials('Alice')).toBe('A');
      expect(getInitials('山田 太郎')).toBe('山太');
    });

    it('uppercases lowercase initials and handles leading/trailing whitespace', () => {
      expect(getInitials('john doe')).toBe('JD');
      expect(getInitials('  alice  ')).toBe('A');
      expect(getInitials('  john   doe  ')).toBe('JD');
    });

    it('uses the first and last word when given three or more words', () => {
      expect(getInitials('John Michael Doe')).toBe('JD');
      expect(getInitials('Mary Jane Watson Parker')).toBe('MP');
      expect(getInitials('Adaeze Chioma Ngozi Okafor')).toBe('AO');
    });

    it('handles multi-byte Unicode / surrogate pairs like emoji', () => {
      expect(getInitials('🚀 Rocket')).toBe('🚀R');
      expect(getInitials('🌟')).toBe('🌟');
    });

    it('returns "?" for empty, whitespace, and non-string input', () => {
      expect(getInitials('')).toBe('?');
      expect(getInitials('   ')).toBe('?');
      expect(getInitials('\t\n')).toBe('?');
      expect(getInitials(null as unknown as string)).toBe('?');
      expect(getInitials(undefined as unknown as string)).toBe('?');
      expect(getInitials(123 as unknown as string)).toBe('?');
      expect(getInitials({} as unknown as string)).toBe('?');
    });
  });

  describe('getAvatarGradient', () => {
    it('returns the same gradient pair for the same name deterministically', () => {
      const first = getAvatarGradient('John Doe');
      const second = getAvatarGradient('John Doe');
      expect(first).toEqual(second);
    });

    it('returns a valid pair from the palette for various names', () => {
      const names = ['John Doe', 'Alice', '山田 太郎', 'Bob Smith', 'Stellar User', 'Zara'];
      for (const name of names) {
        const pair = getAvatarGradient(name);
        expect(pair).toHaveLength(2);
        expect(AVATAR_PALETTE).toContainEqual(pair);
      }
    });

    it('returns the default first palette pair for empty string', () => {
      expect(getAvatarGradient('')).toEqual(AVATAR_PALETTE[0]);
      expect(getAvatarGradient(null as unknown as string)).toEqual(AVATAR_PALETTE[0]);
    });
  });
});
