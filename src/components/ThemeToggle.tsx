import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import type { ThemePreference } from '../hooks/useTheme';

interface Option {
  value: ThemePreference;
  label: string;
  Icon: typeof Sun;
  title: string;
}

const OPTIONS: Option[] = [
  { value: 'system', label: 'System', Icon: Monitor, title: 'Use system theme' },
  { value: 'light',  label: 'Light',  Icon: Sun,     title: 'Light theme' },
  { value: 'dark',   label: 'Dark',   Icon: Moon,    title: 'Dark theme' },
];

/**
 * ThemeToggle
 *
 * Tri-state segmented control: System / Light / Dark.
 * – Persists selection to localStorage via `useTheme`.
 * – Announces changes to assistive technology via a polite aria-live region.
 * – Keyboard: arrow keys navigate between segments; Enter/Space confirm.
 * – Responsive: labels hidden on small viewports (icon-only, with title attrs).
 * – WCAG 2.1 AA: role="radiogroup", role="radio", focus-visible ring, 44 px touch targets.
 */
export default function ThemeToggle() {
  const { preference, setThemePreference, theme } = useTheme();
  const [announcement, setAnnouncement] = useState('');
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function select(value: ThemePreference) {
    setThemePreference(value);
    const opt = OPTIONS.find((o) => o.value === value)!;
    const suffix = value === 'system' ? ` (currently ${theme})` : '';
    setAnnouncement(`Theme set to ${opt.label}${suffix}.`);
  }

  // Roving-tabindex keyboard nav within the group
  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      next = (index + 1) % OPTIONS.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      next = (index - 1 + OPTIONS.length) % OPTIONS.length;
    } else if (e.key === 'Home') {
      next = 0;
    } else if (e.key === 'End') {
      next = OPTIONS.length - 1;
    }
    if (next !== null) {
      e.preventDefault();
      btnRefs.current[next]?.focus();
    }
  }

  return (
    <div className="theme-toggle-wrap">
      {/* Polite live region for screen-reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="theme-toggle-sr-live"
      >
        {announcement}
      </div>

      <div
        role="radiogroup"
        aria-label="Color theme"
        className="theme-toggle"
      >
        {OPTIONS.map(({ value, label, Icon, title }, i) => {
          const isSelected = preference === value;
          return (
            <button
              key={value}
              ref={(el) => { btnRefs.current[i] = el; }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`theme-toggle__option${isSelected ? ' theme-toggle__option--active' : ''}`}
              title={title}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => select(value)}
              onKeyDown={(e) => handleKeyDown(e, i)}
            >
              <span className="theme-toggle__icon" aria-hidden="true">
                <Icon size={14} strokeWidth={2.25} />
              </span>
              <span className="theme-toggle__label">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
