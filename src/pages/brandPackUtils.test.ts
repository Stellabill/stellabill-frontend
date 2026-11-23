import { describe, expect, it } from 'vitest';
import { clamp } from './brandPackUtils';

describe('clamp', () => {
  it('keeps values within the inclusive bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});
