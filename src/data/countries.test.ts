import { describe, it, expect } from 'vitest';
import { COUNTRY_OPTIONS } from './countries';

describe('COUNTRY_OPTIONS', () => {
  it('contains a non-empty list of country options', () => {
    expect(COUNTRY_OPTIONS.length).toBeGreaterThan(0);
  });

  it('has unique, two-letter uppercase ISO country codes', () => {
    const codes = COUNTRY_OPTIONS.map((option) => option.code);

    for (const code of codes) {
      expect(code).toMatch(/^[A-Z]{2}$/);
    }

    expect(new Set(codes).size).toBe(codes.length);
  });

  it('resolves to non-empty, unique display names for all country codes', () => {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    const names = COUNTRY_OPTIONS.map((option) => displayNames.of(option.code));

    for (const name of names) {
      expect(typeof name).toBe('string');
      expect(name!.trim().length).toBeGreaterThan(0);
    }

    expect(new Set(names).size).toBe(names.length);
  });

  it('has non-empty region strings and valid subregion strings for every entry', () => {
    for (const option of COUNTRY_OPTIONS) {
      expect(option.region.trim().length).toBeGreaterThan(0);
      expect(typeof option.subregion).toBe('string');
    }
  });

  it('includes key entries such as US, GB, and NG', () => {
    const byCode = new Map(COUNTRY_OPTIONS.map((option) => [option.code, option]));

    expect(byCode.get('US')).toEqual({
      code: 'US',
      region: 'Americas',
      subregion: 'Northern America',
    });
    expect(byCode.get('GB')).toEqual({
      code: 'GB',
      region: 'Europe',
      subregion: 'Northern Europe',
    });
    expect(byCode.get('NG')).toEqual({
      code: 'NG',
      region: 'Africa',
      subregion: 'Sub-Saharan Africa',
    });
  });
});
