import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { openExternal } from './openExternal';

describe('openExternal utility', () => {
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    openSpy.mockRestore();
  });

  it('opens URL with _blank and noopener,noreferrer by default', () => {
    openExternal('https://example.com');
    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
  });

  it('preserves custom target when provided', () => {
    openExternal('https://example.com', '_self');
    expect(openSpy).toHaveBeenCalledWith('https://example.com', '_self', 'noopener,noreferrer');
  });

  it('keeps noopener if already present in custom features', () => {
    openExternal('https://example.com', '_blank', 'noopener');
    expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener');
  });

  it('appends noopener,noreferrer if missing from custom features', () => {
    openExternal('https://example.com', '_blank', 'width=500');
    expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'width=500,noopener,noreferrer');
  });

  describe('ESLint no-restricted-syntax rule', () => {
    it('flags window.open without noopener and allows window.open with noopener', async () => {
      const { default: esquery } = await import('esquery');
      const espree = await import('espree');

      const selector =
        "CallExpression[callee.object.name='window'][callee.property.name='open']:not([arguments.2.value=/noopener/])";

      const invalidCode = 'window.open("https://example.com", "_blank");';
      const invalidAst = espree.parse(invalidCode, { ecmaVersion: 2020 });
      expect(esquery(invalidAst, selector)).toHaveLength(1);

      const validCode = 'window.open("https://example.com", "_blank", "noopener,noreferrer");';
      const validAst = espree.parse(validCode, { ecmaVersion: 2020 });
      expect(esquery(validAst, selector)).toHaveLength(0);
    });
  });
});
