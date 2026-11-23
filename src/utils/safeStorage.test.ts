import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readJson, writeJson, remove } from './safeStorage';

const KEY = 'sb:test-key';

describe('safeStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  describe('readJson', () => {
    it('returns the fallback when the key is missing', () => {
      expect(readJson(KEY, ['fallback'])).toEqual(['fallback']);
    });

    it('returns the fallback for corrupted JSON without throwing', () => {
      window.localStorage.setItem(KEY, '{not valid json');

      expect(() => readJson(KEY, ['fallback'])).not.toThrow();
      expect(readJson(KEY, ['fallback'])).toEqual(['fallback']);
    });

    it('returns the fallback when validation rejects the parsed value', () => {
      window.localStorage.setItem(KEY, JSON.stringify({ unexpected: true }));

      const isStringArray = (value: unknown): value is string[] => Array.isArray(value);

      expect(readJson(KEY, ['fallback'], isStringArray)).toEqual(['fallback']);
    });

    it('returns the fallback when getItem throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('Storage blocked', 'SecurityError');
      });

      expect(readJson(KEY, 'fallback')).toBe('fallback');
    });

    it('returns the fallback when localStorage is unavailable', () => {
      vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
        throw new Error('Storage blocked');
      });

      expect(readJson(KEY, 'fallback')).toBe('fallback');
    });

    it('returns the parsed value when no validator is supplied', () => {
      window.localStorage.setItem(KEY, JSON.stringify({ hello: 'world' }));

      expect(readJson(KEY, null)).toEqual({ hello: 'world' });
    });

    it('returns the parsed value when the validator accepts it', () => {
      window.localStorage.setItem(KEY, JSON.stringify(['a', 'b']));

      const isStringArray = (value: unknown): value is string[] =>
        Array.isArray(value) && value.every((item) => typeof item === 'string');

      expect(readJson<string[]>(KEY, [], isStringArray)).toEqual(['a', 'b']);
    });

    it('supports boolean predicates as validators', () => {
      window.localStorage.setItem(KEY, JSON.stringify(true));

      expect(readJson(KEY, false, (value) => value === true)).toBe(true);
    });
  });

  describe('writeJson', () => {
    it('persists JSON-serializable values', () => {
      expect(writeJson(KEY, { enabled: true })).toBe(true);
      expect(window.localStorage.getItem(KEY)).toBe('{"enabled":true}');
    });

    it('returns false and swallows errors when setItem throws', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      });

      expect(() => writeJson(KEY, 'value')).not.toThrow();
      expect(writeJson(KEY, 'value')).toBe(false);
    });

    it('returns false when localStorage is unavailable', () => {
      vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
        throw new Error('Storage blocked');
      });

      expect(writeJson(KEY, 'value')).toBe(false);
    });
  });

  describe('remove', () => {
    it('deletes the stored key', () => {
      window.localStorage.setItem(KEY, 'value');

      expect(remove(KEY)).toBe(true);
      expect(window.localStorage.getItem(KEY)).toBeNull();
    });

    it('returns false and swallows errors when removeItem throws', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new DOMException('Storage blocked', 'SecurityError');
      });

      expect(() => remove(KEY)).not.toThrow();
      expect(remove(KEY)).toBe(false);
    });

    it('returns false when localStorage is unavailable', () => {
      vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
        throw new Error('Storage blocked');
      });

      expect(remove(KEY)).toBe(false);
    });
  });
});
