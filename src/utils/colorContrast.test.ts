import { describe, expect, it } from 'vitest';
import {
  WCAG_AA_LARGE,
  WCAG_AA_NORMAL,
  WCAG_AAA_NORMAL,
  contrastRatio,
  parseHex,
  passesAA,
  relativeLuminance,
  wcagLevel,
} from './colorContrast';

describe('WCAG threshold constants', () => {
  it('exports the expected WCAG 2.1 contrast thresholds', () => {
    expect(WCAG_AA_NORMAL).toBe(4.5);
    expect(WCAG_AA_LARGE).toBe(3.0);
    expect(WCAG_AAA_NORMAL).toBe(7.0);
  });
});

describe('parseHex', () => {
  it('parses 3-digit hex strings with and without #', () => {
    expect(parseHex('#000')).toEqual([0, 0, 0]);
    expect(parseHex('fff')).toEqual([255, 255, 255]);
    expect(parseHex('#f0a')).toEqual([255, 0, 170]);
    expect(parseHex('0F8')).toEqual([0, 255, 136]);
  });

  it('parses 4-digit hex strings (with alpha) by returning [r, g, b]', () => {
    expect(parseHex('#f0a8')).toEqual([255, 0, 170]);
    expect(parseHex('1234')).toEqual([17, 34, 51]);
  });

  it('parses 6-digit hex strings with and without #', () => {
    expect(parseHex('#000000')).toEqual([0, 0, 0]);
    expect(parseHex('ffffff')).toEqual([255, 255, 255]);
    expect(parseHex('#1e40af')).toEqual([30, 64, 175]);
    expect(parseHex('DBEAFE')).toEqual([219, 234, 254]);
  });

  it('parses 8-digit hex strings (with alpha) by returning [r, g, b]', () => {
    expect(parseHex('#1e40af80')).toEqual([30, 64, 175]);
    expect(parseHex('ff8800cc')).toEqual([255, 136, 0]);
  });

  it('trims surrounding whitespace after removing #', () => {
    expect(parseHex('#ffffff  ')).toEqual([255, 255, 255]);
    expect(parseHex('  000  ')).toEqual([0, 0, 0]);
  });

  it('returns null for invalid lengths and non-hex characters', () => {
    expect(parseHex('')).toBeNull();
    expect(parseHex('#')).toBeNull();
    expect(parseHex('#12')).toBeNull();
    expect(parseHex('#12345')).toBeNull();
    expect(parseHex('#1234567')).toBeNull();
    expect(parseHex('#123456789')).toBeNull();
    expect(parseHex('#zzzzzz')).toBeNull();
    expect(parseHex('gggggg')).toBeNull();
    expect(parseHex('rgb(0, 0, 0)')).toBeNull();
  });
});

describe('relativeLuminance', () => {
  it('returns 0 for black and 1 for white', () => {
    expect(relativeLuminance([0, 0, 0])).toBe(0);
    expect(relativeLuminance([255, 255, 255])).toBe(1);
  });

  it('returns the WCAG channel weights for pure primaries', () => {
    expect(relativeLuminance([255, 0, 0])).toBeCloseTo(0.2126, 4);
    expect(relativeLuminance([0, 255, 0])).toBeCloseTo(0.7152, 4);
    expect(relativeLuminance([0, 0, 255])).toBeCloseTo(0.0722, 4);
  });

  it('handles both linear and gamma-corrected sRGB branches', () => {
    // 10 / 255 ≈ 0.0392 <= 0.04045 (linear branch)
    const lowChannel = relativeLuminance([10, 10, 10]);
    expect(lowChannel).toBeCloseTo(10 / 255 / 12.92, 6);

    // 11 / 255 ≈ 0.0431 > 0.04045 (gamma branch)
    const highChannel = relativeLuminance([11, 11, 11]);
    expect(highChannel).toBeCloseTo(Math.pow((11 / 255 + 0.055) / 1.055, 2.4), 6);
  });
});

describe('contrastRatio', () => {
  it('returns 21 for black and white regardless of argument order', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBe(21);
    expect(contrastRatio('#ffffff', '#000000')).toBe(21);
  });

  it('returns 1 for identical colours', () => {
    expect(contrastRatio('#1e40af', '#1e40af')).toBe(1);
    expect(contrastRatio('#fff', '#ffffff')).toBe(1);
  });

  it('computes expected contrast for a mid-range colour pair', () => {
    const ratio = contrastRatio('#1e40af', '#dbeafe');
    expect(ratio).not.toBeNull();
    expect(ratio!).toBeCloseTo(7.15, 2);
  });

  it('returns null when either colour is invalid', () => {
    expect(contrastRatio('invalid', '#ffffff')).toBeNull();
    expect(contrastRatio('#000000', 'not-a-hex')).toBeNull();
    expect(contrastRatio('', '')).toBeNull();
  });
});

describe('wcagLevel', () => {
  it('returns AAA at and above WCAG_AAA_NORMAL', () => {
    expect(wcagLevel(WCAG_AAA_NORMAL)).toBe('AAA');
    expect(wcagLevel(21)).toBe('AAA');
  });

  it('returns AA at WCAG_AA_NORMAL and just below WCAG_AAA_NORMAL', () => {
    expect(wcagLevel(WCAG_AA_NORMAL)).toBe('AA');
    expect(wcagLevel(WCAG_AAA_NORMAL - 0.01)).toBe('AA');
  });

  it('returns AA Large at WCAG_AA_LARGE and just below WCAG_AA_NORMAL', () => {
    expect(wcagLevel(WCAG_AA_LARGE)).toBe('AA Large');
    expect(wcagLevel(WCAG_AA_NORMAL - 0.01)).toBe('AA Large');
  });

  it('returns Fail below WCAG_AA_LARGE or when ratio is null', () => {
    expect(wcagLevel(WCAG_AA_LARGE - 0.01)).toBe('Fail');
    expect(wcagLevel(1)).toBe('Fail');
    expect(wcagLevel(0)).toBe('Fail');
    expect(wcagLevel(null)).toBe('Fail');
  });
});

describe('passesAA', () => {
  it('returns true when contrast meets or exceeds WCAG_AA_NORMAL', () => {
    expect(passesAA('#000000', '#ffffff')).toBe(true);
    // #767676 on #ffffff has ~4.54:1 contrast (>= 4.5)
    expect(passesAA('#767676', '#ffffff')).toBe(true);
  });

  it('returns false when contrast only meets WCAG_AA_LARGE but is below WCAG_AA_NORMAL', () => {
    // #949494 on #ffffff has ~3.03:1 contrast (>= 3.0 AA Large, < 4.5 AA Normal)
    const ratio = contrastRatio('#949494', '#ffffff');
    expect(ratio).not.toBeNull();
    expect(ratio!).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
    expect(ratio!).toBeLessThan(WCAG_AA_NORMAL);
    expect(wcagLevel(ratio)).toBe('AA Large');
    expect(passesAA('#949494', '#ffffff')).toBe(false);
  });

  it('returns false for low-contrast pairs and invalid hex inputs', () => {
    expect(passesAA('#cccccc', '#ffffff')).toBe(false);
    expect(passesAA('invalid', '#ffffff')).toBe(false);
    expect(passesAA('#000000', 'invalid')).toBe(false);
  });
});
