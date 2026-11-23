import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  AUTO_LOCALE_ID,
  LOCALE_GROUP_ORDER,
  LOCALE_STORAGE_KEY,
  autoLocaleOption,
  getBrowserLocale,
  getI18nLanguage,
  getLocaleDirection,
  getLocaleOption,
  isSupportedLocale,
  localeOptions,
  type LocaleDirection,
  type LocaleId,
} from './locales';

const RTL_LANGUAGE_CODES = new Set(['ar', 'he', 'fa', 'ur']);

describe('locale registry integrity', () => {
  it('has unique option ids and includes an en locale', () => {
    const ids = localeOptions.map((option) => option.id);
    const uniqueIds = new Set(ids);

    expect(localeOptions.length).toBeGreaterThan(0);
    expect(uniqueIds.size).toBe(ids.length);
    expect(ids).not.toContain(AUTO_LOCALE_ID);
    expect(ids.some((id) => id === 'en' || id.startsWith('en-'))).toBe(true);
  });

  it('declares direction "rtl" for RTL languages and "ltr" for all others', () => {
    const validDirections: LocaleDirection[] = ['ltr', 'rtl'];

    for (const option of localeOptions) {
      expect(validDirections).toContain(option.direction);
      const languageCode = option.id.split('-')[0].toLowerCase();
      const expectedDirection: LocaleDirection = RTL_LANGUAGE_CODES.has(languageCode)
        ? 'rtl'
        : 'ltr';

      expect(option.direction).toBe(expectedDirection);
    }

    expect(autoLocaleOption.direction).toBe('ltr');
  });

  it('aligns autoLocaleOption.id with AUTO_LOCALE_ID and defines a non-empty LOCALE_STORAGE_KEY', () => {
    expect(autoLocaleOption.id).toBe(AUTO_LOCALE_ID);
    expect(typeof LOCALE_STORAGE_KEY).toBe('string');
    expect(LOCALE_STORAGE_KEY.trim().length).toBeGreaterThan(0);
  });

  it('covers every option regionGroup in LOCALE_GROUP_ORDER', () => {
    expect(LOCALE_GROUP_ORDER).toContain(autoLocaleOption.regionGroup);
    for (const option of localeOptions) {
      expect(LOCALE_GROUP_ORDER).toContain(option.regionGroup);
    }
  });
});

describe('locale registry helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('getLocaleOption returns autoLocaleOption, matching option, or fallback', () => {
    expect(getLocaleOption(AUTO_LOCALE_ID)).toBe(autoLocaleOption);
    expect(getLocaleOption('ar-SA').id).toBe('ar-SA');
    expect(getLocaleOption('xx-XX' as LocaleId)).toBe(localeOptions[0]);
  });

  it('isSupportedLocale accepts AUTO_LOCALE_ID and registered ids, and rejects unknown ids', () => {
    expect(isSupportedLocale(AUTO_LOCALE_ID)).toBe(true);
    for (const option of localeOptions) {
      expect(isSupportedLocale(option.id)).toBe(true);
    }
    expect(isSupportedLocale('xx-XX')).toBe(false);
    expect(isSupportedLocale('')).toBe(false);
  });

  it('getBrowserLocale resolves navigator.language, navigator.languages, or falls back to "en"', () => {
    vi.stubGlobal('navigator', { language: 'fr-FR', languages: ['de-DE'] });
    expect(getBrowserLocale()).toBe('fr-FR');

    vi.stubGlobal('navigator', { language: '', languages: ['es-ES'] });
    expect(getBrowserLocale()).toBe('es-ES');

    vi.stubGlobal('navigator', { language: '', languages: [] });
    expect(getBrowserLocale()).toBe('en');

    vi.stubGlobal('navigator', undefined);
    expect(getBrowserLocale()).toBe('en');
  });

  it('getI18nLanguage extracts the lowercase primary language tag', () => {
    expect(getI18nLanguage('en-US')).toBe('en');
    expect(getI18nLanguage('ar-SA')).toBe('ar');

    vi.stubGlobal('navigator', { language: 'pt-BR', languages: ['pt-BR'] });
    expect(getI18nLanguage(AUTO_LOCALE_ID)).toBe('pt');
  });

  it('getLocaleDirection returns the direction for each locale id', () => {
    expect(getLocaleDirection('ar-SA')).toBe('rtl');
    expect(getLocaleDirection('he-IL')).toBe('rtl');
    expect(getLocaleDirection('en-US')).toBe('ltr');
    expect(getLocaleDirection(AUTO_LOCALE_ID)).toBe('ltr');
  });
});
