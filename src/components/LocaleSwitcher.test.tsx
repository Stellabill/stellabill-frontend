import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import LocaleSwitcher from './LocaleSwitcher';
import { LOCALE_STORAGE_KEY } from '../i18n/locales';

describe('LocaleSwitcher', () => {
    beforeEach(() => {
        window.localStorage.clear();
        document.documentElement.dir = 'ltr';
        document.documentElement.lang = 'en';
    });

    it('identifies the current locale without relying on a flag', () => {
        render(<LocaleSwitcher />);
        expect(screen.getByRole('button', { name: /language: auto · browser language/i })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /language:/i }));
        expect(screen.getByText('Current:')).toBeInTheDocument();
        expect(screen.getByText('Auto · Browser language')).toBeInTheDocument();
    });

    it('groups locales by region and exposes the combobox listbox relationship', () => {
        render(<LocaleSwitcher />);
        fireEvent.click(screen.getByRole('button', { name: /language:/i }));

        expect(screen.getByRole('combobox', { name: /search languages/i })).toHaveAttribute(
            'aria-controls',
            'locale-switcher-listbox',
        );
        expect(screen.getByRole('listbox', { name: /available languages/i })).toBeInTheDocument();
        expect(screen.getAllByRole('group')).toHaveLength(5);
        expect(screen.getByText('Middle East')).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /العربية.*Arabic.*Saudi Arabia/i })).toBeInTheDocument();
    });

    it('filters using English, native, and region text', () => {
        render(<LocaleSwitcher />);
        fireEvent.click(screen.getByRole('button', { name: /language:/i }));
        const search = screen.getByRole('combobox', { name: /search languages/i });

        fireEvent.change(search, { target: { value: 'brasil' } });
        expect(screen.getByRole('option', { name: /Português.*Portuguese.*Brazil/i })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: /Deutsch.*German/i })).not.toBeInTheDocument();
    });

    it('filters by BCP-47 locale code', () => {
        render(<LocaleSwitcher />);
        fireEvent.click(screen.getByRole('button', { name: /language:/i }));
        fireEvent.change(screen.getByRole('combobox', { name: /search languages/i }), { target: { value: 'ja-jp' } });

        expect(screen.getByRole('option', { name: /日本語.*Japanese.*Japan/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation and selection', () => {
        render(<LocaleSwitcher />);
        fireEvent.click(screen.getByRole('button', { name: /language:/i }));
        const search = screen.getByRole('combobox', { name: /search languages/i });

        fireEvent.change(search, { target: { value: 'rtl' } });
        // No locale uses "rtl" as a label, so search should show its empty state.
        expect(screen.getByRole('status')).toHaveTextContent('No languages found');

        fireEvent.change(search, { target: { value: 'arabic' } });
        fireEvent.keyDown(search, { key: 'Enter' });

        expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('ar-SA');
        expect(document.documentElement.dir).toBe('rtl');
        expect(document.documentElement.lang).toBe('ar');
    });

    it('updates the active descendant with arrow, Home, and End keys', () => {
        render(<LocaleSwitcher />);
        fireEvent.click(screen.getByRole('button', { name: /language:/i }));
        const search = screen.getByRole('combobox', { name: /search languages/i });

        expect(search).toHaveAttribute('aria-activedescendant', 'locale-option-auto');
        fireEvent.keyDown(search, { key: 'ArrowDown' });
        expect(search).toHaveAttribute('aria-activedescendant', 'locale-option-en-US');
        fireEvent.keyDown(search, { key: 'End' });
        expect(search).toHaveAttribute('aria-activedescendant', 'locale-option-zh-CN');
        fireEvent.keyDown(search, { key: 'Home' });
        expect(search).toHaveAttribute('aria-activedescendant', 'locale-option-auto');
        fireEvent.keyDown(search, { key: 'ArrowUp' });
        expect(search).toHaveAttribute('aria-activedescendant', 'locale-option-auto');
    });

    it('shows an empty state for an unknown search and closes on Escape', () => {
        render(<LocaleSwitcher />);
        fireEvent.click(screen.getByRole('button', { name: /language:/i }));
        const search = screen.getByRole('combobox', { name: /search languages/i });
        fireEvent.change(search, { target: { value: 'not-a-language' } });

        expect(screen.getByText('Try a language name, code, or region.')).toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent('No languages found.');
        fireEvent.keyDown(search, { key: 'Escape' });
        expect(screen.queryByRole('dialog', { name: /choose language/i })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /language:/i })).toHaveFocus();
    });

    it('restores a persisted locale on mount', () => {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, 'ja-JP');
        render(<LocaleSwitcher />);
        const trigger = screen.getByRole('button', { name: /language: 日本語.*Japanese/i });
        expect(trigger).toHaveTextContent('ja-JP');
        fireEvent.click(trigger);
        expect(within(screen.getByRole('listbox')).getByRole('option', { name: /日本語.*Japanese.*Japan/i })).toHaveAttribute(
            'aria-selected',
            'true',
        );
    });
});
