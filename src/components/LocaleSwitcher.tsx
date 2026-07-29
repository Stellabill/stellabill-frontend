import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronDown, Check, Languages, Search } from 'lucide-react';
import i18n from '../i18n/config';
import {
    AUTO_LOCALE_ID,
    LOCALE_STORAGE_KEY,
    LOCALE_GROUP_ORDER,
    autoLocaleOption,
    getI18nLanguage,
    getLocaleDirection,
    getLocaleOption,
    isSupportedLocale,
    localeOptions,
    type LocaleId,
    type LocaleOption,
} from '../i18n/locales';
import './LocaleSwitcher.css';

const listboxId = 'locale-switcher-listbox';
const inputId = 'locale-switcher-search';

function readStoredLocale(): LocaleId {
    if (typeof window === 'undefined') return AUTO_LOCALE_ID;
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return stored && isSupportedLocale(stored) ? stored : AUTO_LOCALE_ID;
}

function applyLocale(id: LocaleId) {
    document.documentElement.dir = getLocaleDirection(id);
    document.documentElement.lang = getI18nLanguage(id);
}

function optionLabel(option: LocaleOption | typeof autoLocaleOption) {
    return option.id === AUTO_LOCALE_ID
        ? `${option.language} · ${option.englishName}`
        : `${option.language} · ${option.englishName}`;
}

function optionAccessibleLabel(option: LocaleOption | typeof autoLocaleOption) {
    return `${optionLabel(option)} · ${option.region}`;
}

export default function LocaleSwitcher() {
    const triggerRef = useRef<HTMLButtonElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const [selectedId, setSelectedId] = useState<LocaleId>(readStoredLocale);
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);

    const selectedOption = getLocaleOption(selectedId);

    const visibleOptions = useMemo(() => {
        const normalizedQuery = query.trim().toLocaleLowerCase();
        const allOptions = [autoLocaleOption, ...localeOptions];
        if (!normalizedQuery) return allOptions;

        return allOptions.filter((option) =>
            `${option.id} ${optionAccessibleLabel(option)} ${option.searchTerms}`
                .toLocaleLowerCase()
                .includes(normalizedQuery),
        );
    }, [query]);

    const groups = useMemo(
        () =>
            LOCALE_GROUP_ORDER.map((group) => ({
                name: group,
                options: visibleOptions.filter((option) => option.regionGroup === group),
            })).filter((group) => group.options.length > 0),
        [visibleOptions],
    );

    useEffect(() => {
        applyLocale(selectedId);
        void i18n.changeLanguage(getI18nLanguage(selectedId));
        window.localStorage.setItem(LOCALE_STORAGE_KEY, selectedId);
    }, [selectedId]);

    useEffect(() => {
        if (!isOpen) return;

        setQuery('');
        setActiveIndex(0);
        requestAnimationFrame(() => searchRef.current?.focus());
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = (event: PointerEvent) => {
            if (!popupRef.current?.contains(event.target as Node) && !triggerRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        const handleEscape = (event: globalThis.KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                triggerRef.current?.focus();
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    useEffect(() => {
        setActiveIndex((index) => Math.min(index, Math.max(visibleOptions.length - 1, 0)));
    }, [visibleOptions.length]);

    const selectLocale = (id: LocaleId) => {
        setSelectedId(id);
        setIsOpen(false);
        setQuery('');
        triggerRef.current?.focus();
    };

    const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) => Math.min(index + 1, visibleOptions.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
        } else if (event.key === 'Home') {
            event.preventDefault();
            setActiveIndex(0);
        } else if (event.key === 'End') {
            event.preventDefault();
            setActiveIndex(Math.max(visibleOptions.length - 1, 0));
        } else if (event.key === 'Enter' && visibleOptions[activeIndex]) {
            event.preventDefault();
            selectLocale(visibleOptions[activeIndex].id);
        }
    };

    const activeOption = visibleOptions[activeIndex];
    const activeOptionId = activeOption ? `locale-option-${activeOption.id}` : undefined;

    return (
        <div className="locale-switcher">
            <button
                ref={triggerRef}
                type="button"
                className="locale-switcher__trigger"
                aria-label={`Language: ${optionAccessibleLabel(selectedOption)}`}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                onClick={() => setIsOpen((open) => !open)}
            >
                <Languages aria-hidden="true" size={17} strokeWidth={1.8} />
                <span className="locale-switcher__trigger-copy">
          <span className="locale-switcher__trigger-code">{selectedId === AUTO_LOCALE_ID ? 'AUTO' : selectedId}</span>
          <span className="locale-switcher__trigger-name">{selectedOption.language}</span>
        </span>
                <ChevronDown aria-hidden="true" size={15} />
            </button>

            {isOpen && (
                <div ref={popupRef} className="locale-switcher__popup" role="dialog" aria-label="Choose language">
                    <div className="locale-switcher__header">
                        <div>
                            <p className="locale-switcher__eyebrow">Language</p>
                            <p className="locale-switcher__current">
                                Current: <strong>{optionLabel(selectedOption)}</strong>
                            </p>
                        </div>
                        <button
                            type="button"
                            className="locale-switcher__close"
                            aria-label="Close language menu"
                            onClick={() => {
                                setIsOpen(false);
                                triggerRef.current?.focus();
                            }}
                        >
                            <span aria-hidden="true">×</span>
                        </button>
                    </div>

                    <div className="locale-switcher__search-wrap">
                        <Search aria-hidden="true" size={16} />
                        <input
                            ref={searchRef}
                            id={inputId}
                            className="locale-switcher__search"
                            type="search"
                            role="combobox"
                            aria-label="Search languages"
                            aria-controls={listboxId}
                            aria-expanded={isOpen}
                            aria-autocomplete="list"
                            aria-activedescendant={activeOptionId}
                            placeholder="Search by language or region"
                            value={query}
                            onChange={(event) => {
                                setQuery(event.target.value);
                                setActiveIndex(0);
                            }}
                            onKeyDown={handleSearchKeyDown}
                        />
                    </div>

                    <div className="locale-switcher__results">
                        <div className="locale-switcher__sr-only" role="status" aria-live="polite">
                            {visibleOptions.length === 0
                                ? 'No languages found.'
                                : `${visibleOptions.length} ${visibleOptions.length === 1 ? 'language' : 'languages'} available.`}
                        </div>
                        {visibleOptions.length > 0 ? (
                            <div id={listboxId} className="locale-switcher__listbox" role="listbox" aria-label="Available languages">
                                {groups.map((group) => (
                                    <div key={group.name} className="locale-switcher__group" role="group" aria-label={group.name}>
                                        <div className="locale-switcher__group-heading">{group.name}</div>
                                        {group.options.map((option) => {
                                            const optionIndex = visibleOptions.findIndex((item) => item.id === option.id);
                                            const isSelected = option.id === selectedId;
                                            return (
                                                <button
                                                    key={option.id}
                                                    id={`locale-option-${option.id}`}
                                                    type="button"
                                                    role="option"
                                                    aria-selected={isSelected}
                                                    className={`locale-switcher__option ${optionIndex === activeIndex ? 'is-active' : ''}`}
                                                    onMouseEnter={() => setActiveIndex(optionIndex)}
                                                    onClick={() => selectLocale(option.id)}
                                                >
                          <span className="locale-switcher__option-language" dir={option.direction}>
                            {option.language}
                          </span>
                                                    <span className="locale-switcher__option-detail">
                            <span>{option.englishName}</span>
                            <span aria-hidden="true">·</span>
                            <span>{option.region}</span>
                          </span>
                                                    {isSelected && <Check className="locale-switcher__check" aria-label="Selected" size={16} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="locale-switcher__empty">
                                <strong>No languages found</strong>
                                <span>Try a language name, code, or region.</span>
                            </div>
                        )}
                    </div>
                    <p className="locale-switcher__hint">
                        <span>↑↓</span> to navigate <span>Enter</span> to select <span>Esc</span> to close
                    </p>
                </div>
            )}
        </div>
    );
}
