export type LocaleId =
    | 'auto'
    | 'en-US'
    | 'en-GB'
    | 'fr-FR'
    | 'de-DE'
    | 'es-ES'
    | 'pt-BR'
    | 'ja-JP'
    | 'zh-CN'
    | 'ar-SA'
    | 'he-IL';

export type LocaleDirection = 'ltr' | 'rtl';

export interface LocaleOption {
    id: Exclude<LocaleId, 'auto'>;
    language: string;
    englishName: string;
    region: string;
    regionGroup: 'Americas' | 'Europe' | 'Middle East' | 'Asia-Pacific';
    direction: LocaleDirection;
    searchTerms: string;
}

export interface AutoLocaleOption {
    id: 'auto';
    language: 'Auto';
    englishName: 'Browser language';
    region: 'Detected automatically';
    regionGroup: 'Automatic';
    direction: LocaleDirection;
    searchTerms: string;
}

export const AUTO_LOCALE_ID: LocaleId = 'auto';
export const LOCALE_STORAGE_KEY = 'sb:locale';

export const localeOptions: LocaleOption[] = [
    {
        id: 'en-US',
        language: 'English',
        englishName: 'English',
        region: 'United States',
        regionGroup: 'Americas',
        direction: 'ltr',
        searchTerms: 'english us united states america',
    },
    {
        id: 'pt-BR',
        language: 'Português',
        englishName: 'Portuguese',
        region: 'Brazil',
        regionGroup: 'Americas',
        direction: 'ltr',
        searchTerms: 'portuguese brazil português brasil',
    },
    {
        id: 'fr-FR',
        language: 'Français',
        englishName: 'French',
        region: 'France',
        regionGroup: 'Europe',
        direction: 'ltr',
        searchTerms: 'french france français français',
    },
    {
        id: 'de-DE',
        language: 'Deutsch',
        englishName: 'German',
        region: 'Germany',
        regionGroup: 'Europe',
        direction: 'ltr',
        searchTerms: 'german germany deutsch deutschland',
    },
    {
        id: 'en-GB',
        language: 'English',
        englishName: 'English',
        region: 'United Kingdom',
        regionGroup: 'Europe',
        direction: 'ltr',
        searchTerms: 'english uk united kingdom britain',
    },
    {
        id: 'es-ES',
        language: 'Español',
        englishName: 'Spanish',
        region: 'Spain',
        regionGroup: 'Europe',
        direction: 'ltr',
        searchTerms: 'spanish spain español españa',
    },
    {
        id: 'ar-SA',
        language: 'العربية',
        englishName: 'Arabic',
        region: 'Saudi Arabia',
        regionGroup: 'Middle East',
        direction: 'rtl',
        searchTerms: 'arabic saudi arabia العربية السعودية',
    },
    {
        id: 'he-IL',
        language: 'עברית',
        englishName: 'Hebrew',
        region: 'Israel',
        regionGroup: 'Middle East',
        direction: 'rtl',
        searchTerms: 'hebrew israel עברית ישראל',
    },
    {
        id: 'ja-JP',
        language: '日本語',
        englishName: 'Japanese',
        region: 'Japan',
        regionGroup: 'Asia-Pacific',
        direction: 'ltr',
        searchTerms: 'japanese japan 日本語 日本',
    },
    {
        id: 'zh-CN',
        language: '简体中文',
        englishName: 'Simplified Chinese',
        region: 'China',
        regionGroup: 'Asia-Pacific',
        direction: 'ltr',
        searchTerms: 'chinese china simplified 中文 中国 简体',
    },
];

export const autoLocaleOption: AutoLocaleOption = {
    id: 'auto',
    language: 'Auto',
    englishName: 'Browser language',
    region: 'Detected automatically',
    regionGroup: 'Automatic',
    direction: 'ltr',
    searchTerms: 'auto browser automatic detected language',
};

export const LOCALE_GROUP_ORDER = [
    'Automatic',
    'Americas',
    'Europe',
    'Middle East',
    'Asia-Pacific',
] as const;

export function getLocaleOption(id: LocaleId): LocaleOption | AutoLocaleOption {
    return id === AUTO_LOCALE_ID
        ? autoLocaleOption
        : localeOptions.find((option) => option.id === id) ?? localeOptions[0];
}

export function isSupportedLocale(id: string): id is LocaleId {
    return id === AUTO_LOCALE_ID || localeOptions.some((option) => option.id === id);
}

export function getBrowserLocale(): string {
    if (typeof navigator === 'undefined') return 'en';
    return navigator.language || navigator.languages?.[0] || 'en';
}

export function getI18nLanguage(id: LocaleId): string {
    if (id === AUTO_LOCALE_ID) {
        return getBrowserLocale().split('-')[0].toLowerCase();
    }
    return id.split('-')[0].toLowerCase();
}

export function getLocaleDirection(id: LocaleId): LocaleDirection {
    return getLocaleOption(id).direction;
}
