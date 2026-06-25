import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle() {
  const { theme, isSystemPreference, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const nextTheme = isDark ? 'light' : 'dark';
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={`Switch to ${nextTheme} theme${isSystemPreference ? ' (currently following system)' : ''}`}
      title={`Switch to ${nextTheme} theme`}
    >
      <span className="theme-toggle__icon" aria-hidden="true">
        <Icon size={16} strokeWidth={2.25} />
      </span>
      <span className="theme-toggle__label">{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
