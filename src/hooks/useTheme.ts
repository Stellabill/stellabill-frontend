import { useEffect, useMemo, useState } from 'react';

export type Theme = 'light' | 'dark';
export type ThemePreference = Theme | 'system';

const STORAGE_KEY = 'stellabill-theme-preference';
const THEME_QUERY = '(prefers-color-scheme: dark)';

function canUseDOM() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function getSystemTheme(): Theme {
  if (!canUseDOM() || typeof window.matchMedia !== 'function') {
    return 'light';
  }

  return window.matchMedia(THEME_QUERY).matches ? 'dark' : 'light';
}

function getStoredPreference(): ThemePreference {
  if (!canUseDOM()) return 'system';

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  } catch {
    return 'system';
  }
}

function persistPreference(preference: ThemePreference) {
  if (!canUseDOM()) return;

  try {
    if (preference === 'system') {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, preference);
    }
  } catch {
    // Ignore storage failures (private mode, disabled storage, etc.).
  }
}

function applyTheme(theme: Theme) {
  if (!canUseDOM()) return;

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function initializeTheme() {
  const preference = getStoredPreference();
  applyTheme(preference === 'system' ? getSystemTheme() : preference);
}

export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => getStoredPreference());
  const [systemTheme, setSystemTheme] = useState<Theme>(() => getSystemTheme());

  useEffect(() => {
    if (!canUseDOM() || typeof window.matchMedia !== 'function') return;

    const mediaQuery = window.matchMedia(THEME_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const theme = useMemo<Theme>(
    () => (preference === 'system' ? systemTheme : preference),
    [preference, systemTheme],
  );

  useEffect(() => {
    applyTheme(theme);
    persistPreference(preference);
  }, [preference, theme]);

  const setThemePreference = (nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);
  };

  const toggleTheme = () => {
    setPreferenceState(theme === 'dark' ? 'light' : 'dark');
  };

  return {
    theme,
    preference,
    isSystemPreference: preference === 'system',
    setThemePreference,
    toggleTheme,
  };
}
