import { describe, expect, it } from 'vitest';
import {
  HEX_COLOR_PATTERN,
  PLAYGROUND_TOKEN_CATEGORIES,
  PLAYGROUND_TOKENS,
  formatRemValue,
  parseRemValue,
} from './playgroundTokens';

describe('parseRemValue', () => {
  it('parses valid rem strings including decimals, leading dots, negatives, and whitespace', () => {
    expect(parseRemValue('1.5rem')).toBe(1.5);
    expect(parseRemValue('0rem')).toBe(0);
    expect(parseRemValue('.5rem')).toBe(0.5);
    expect(parseRemValue('-0.25rem')).toBe(-0.25);
    expect(parseRemValue('  2.75rem  ')).toBe(2.75);
  });

  it('returns null for invalid or non-rem strings', () => {
    expect(parseRemValue('')).toBeNull();
    expect(parseRemValue('   ')).toBeNull();
    expect(parseRemValue('1.5')).toBeNull();
    expect(parseRemValue('1.5px')).toBeNull();
    expect(parseRemValue('rem')).toBeNull();
    expect(parseRemValue('1..5rem')).toBeNull();
    expect(parseRemValue('1.5rem extra')).toBeNull();
    expect(parseRemValue('auto')).toBeNull();
  });
});

describe('formatRemValue', () => {
  it('rounds to two decimal places and appends rem', () => {
    expect(formatRemValue(1.234)).toBe('1.23rem');
    expect(formatRemValue(1.236)).toBe('1.24rem');
    expect(formatRemValue(-0.756)).toBe('-0.76rem');
  });

  it('drops trailing zeroes after rounding', () => {
    expect(formatRemValue(0)).toBe('0rem');
    expect(formatRemValue(2)).toBe('2rem');
    expect(formatRemValue(1.5)).toBe('1.5rem');
    expect(formatRemValue(1.2)).toBe('1.2rem');
  });
});

describe('HEX_COLOR_PATTERN', () => {
  it('accepts valid 3-digit and 6-digit hex colors', () => {
    expect(HEX_COLOR_PATTERN.test('#abc')).toBe(true);
    expect(HEX_COLOR_PATTERN.test('#FFF')).toBe(true);
    expect(HEX_COLOR_PATTERN.test('#09a')).toBe(true);
    expect(HEX_COLOR_PATTERN.test('#1a2b3c')).toBe(true);
    expect(HEX_COLOR_PATTERN.test('#FFFFFF')).toBe(true);
    expect(HEX_COLOR_PATTERN.test('#000000')).toBe(true);
  });

  it('rejects named colors, 5-digit hex, and other invalid formats', () => {
    expect(HEX_COLOR_PATTERN.test('red')).toBe(false);
    expect(HEX_COLOR_PATTERN.test('#12345')).toBe(false);
    expect(HEX_COLOR_PATTERN.test('123456')).toBe(false);
    expect(HEX_COLOR_PATTERN.test('#1234')).toBe(false);
    expect(HEX_COLOR_PATTERN.test('#1234567')).toBe(false);
    expect(HEX_COLOR_PATTERN.test('#gggggg')).toBe(false);
    expect(HEX_COLOR_PATTERN.test('')).toBe(false);
  });
});

describe('PLAYGROUND_TOKENS and PLAYGROUND_TOKEN_CATEGORIES', () => {
  it('assigns every token a category that exists in PLAYGROUND_TOKEN_CATEGORIES', () => {
    const validCategories = new Set(PLAYGROUND_TOKEN_CATEGORIES.map((c) => c.key));

    expect(PLAYGROUND_TOKENS.length).toBeGreaterThan(0);
    for (const token of PLAYGROUND_TOKENS) {
      expect(validCategories.has(token.category)).toBe(true);
    }
  });

  it('has unique token cssVar names and category keys', () => {
    const cssVars = PLAYGROUND_TOKENS.map((t) => t.cssVar);
    expect(new Set(cssVars).size).toBe(cssVars.length);

    const categoryKeys = PLAYGROUND_TOKEN_CATEGORIES.map((c) => c.key);
    expect(new Set(categoryKeys).size).toBe(categoryKeys.length);
  });

  it('defines valid slider bounds for rem tokens', () => {
    const remTokens = PLAYGROUND_TOKENS.filter((t) => t.type === 'rem');
    expect(remTokens.length).toBeGreaterThan(0);

    for (const token of remTokens) {
      expect(typeof token.min).toBe('number');
      expect(typeof token.max).toBe('number');
      expect(typeof token.step).toBe('number');
      expect(token.min!).toBeLessThan(token.max!);
      expect(token.step!).toBeGreaterThan(0);
    }
  });
});
