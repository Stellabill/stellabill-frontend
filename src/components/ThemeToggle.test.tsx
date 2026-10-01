import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import ThemeToggle from './ThemeToggle';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'stellabill-theme-preference';

/** Return the three radio buttons in DOM order. */
function getOptions() {
  return screen.getAllByRole('radio') as HTMLButtonElement[];
}

/** Return the radio that is currently checked (aria-checked="true"). */
function getChecked() {
  return screen.getByRole('radio', { checked: true }) as HTMLButtonElement;
}

/** Return the polite live-region element. */
function getLiveRegion() {
  return screen.getByRole('status');
}

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  // Do NOT call vi.restoreAllMocks() here — it would undo the matchMedia
  // mock installed by src/test/setup.ts and break every subsequent render.
  // Individual tests that spy on localStorage methods restore them manually.
  localStorage.clear();
});

// ===========================================================================
// Rendering — structure
// ===========================================================================

describe('ThemeToggle — rendering', () => {
  it('renders a radiogroup with the accessible label "Color theme"', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('radiogroup', { name: /color theme/i })).toBeInTheDocument();
  });

  it('renders exactly three radio options: System, Light, Dark', () => {
    render(<ThemeToggle />);
    const options = getOptions();
    expect(options).toHaveLength(3);
    const names = options.map((o) => o.querySelector('.theme-toggle__label')?.textContent);
    expect(names).toEqual(['System', 'Light', 'Dark']);
  });

  it('exposes descriptive title attributes on each button', () => {
    render(<ThemeToggle />);
    expect(screen.getByTitle('Use system theme')).toBeInTheDocument();
    expect(screen.getByTitle('Light theme')).toBeInTheDocument();
    expect(screen.getByTitle('Dark theme')).toBeInTheDocument();
  });

  it('includes a polite aria-live region for announcements', () => {
    render(<ThemeToggle />);
    const region = getLiveRegion();
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-atomic', 'true');
  });

  it('renders all buttons as type="button" to avoid accidental form submission', () => {
    render(<ThemeToggle />);
    getOptions().forEach((btn) => expect(btn).toHaveAttribute('type', 'button'));
  });
});

// ===========================================================================
// Default state — no prior preference
// ===========================================================================

describe('ThemeToggle — default state (no stored preference)', () => {
  it('checks "System" by default', () => {
    render(<ThemeToggle />);
    expect(getChecked()).toHaveAccessibleName(/system/i);
  });

  it('gives tabIndex=0 to the System option and -1 to the rest', () => {
    render(<ThemeToggle />);
    const [system, light, dark] = getOptions();
    expect(system.tabIndex).toBe(0);
    expect(light.tabIndex).toBe(-1);
    expect(dark.tabIndex).toBe(-1);
  });

  it('applies the active CSS class only to the System button', () => {
    render(<ThemeToggle />);
    const [system, light, dark] = getOptions();
    expect(system.className).toMatch(/theme-toggle__option--active/);
    expect(light.className).not.toMatch(/theme-toggle__option--active/);
    expect(dark.className).not.toMatch(/theme-toggle__option--active/);
  });
});

// ===========================================================================
// Stored preference — hydration
// ===========================================================================

describe('ThemeToggle — persisted preference hydration', () => {
  it('restores a previously stored "light" preference on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'light');
    render(<ThemeToggle />);
    expect(getChecked()).toHaveAccessibleName(/light/i);
  });

  it('restores a previously stored "dark" preference on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    render(<ThemeToggle />);
    expect(getChecked()).toHaveAccessibleName(/dark/i);
  });

  it('falls back to "system" when the stored value is not a recognised preference', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid-value');
    render(<ThemeToggle />);
    expect(getChecked()).toHaveAccessibleName(/system/i);
  });

  it('falls back to "system" when localStorage contains an empty string', () => {
    localStorage.setItem(STORAGE_KEY, '');
    render(<ThemeToggle />);
    expect(getChecked()).toHaveAccessibleName(/system/i);
  });
});

// ===========================================================================
// Click interactions — state transitions
// ===========================================================================

describe('ThemeToggle — click interactions', () => {
  it('selecting "Light" marks it as checked and unchecks "System"', () => {
    render(<ThemeToggle />);
    const [, light] = getOptions();
    fireEvent.click(light);
    expect(light).toHaveAttribute('aria-checked', 'true');
    expect(getOptions()[0]).toHaveAttribute('aria-checked', 'false');
  });

  it('selecting "Dark" marks it as checked', () => {
    render(<ThemeToggle />);
    const [,, dark] = getOptions();
    fireEvent.click(dark);
    expect(dark).toHaveAttribute('aria-checked', 'true');
  });

  it('only one option is checked at a time after multiple clicks', () => {
    render(<ThemeToggle />);
    const [system, light, dark] = getOptions();
    fireEvent.click(light);
    fireEvent.click(dark);
    fireEvent.click(system);
    const checked = getOptions().filter((o) => o.getAttribute('aria-checked') === 'true');
    expect(checked).toHaveLength(1);
    expect(checked[0]).toHaveAccessibleName(/system/i);
  });

  it('persists "light" to localStorage after clicking Light', () => {
    render(<ThemeToggle />);
    fireEvent.click(getOptions()[1]);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
  });

  it('persists "dark" to localStorage after clicking Dark', () => {
    render(<ThemeToggle />);
    fireEvent.click(getOptions()[2]);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
  });

  it('removes the localStorage entry when "System" is selected (system = default)', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    render(<ThemeToggle />);
    fireEvent.click(getOptions()[0]); // System
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('moves tabIndex=0 to the newly selected option', () => {
    render(<ThemeToggle />);
    const [, light] = getOptions();
    fireEvent.click(light);
    expect(light.tabIndex).toBe(0);
    expect(getOptions()[0].tabIndex).toBe(-1);
    expect(getOptions()[2].tabIndex).toBe(-1);
  });

  it('clicking the already-selected option is a no-op (stays checked)', () => {
    render(<ThemeToggle />);
    const [system] = getOptions();
    fireEvent.click(system); // already selected
    expect(system).toHaveAttribute('aria-checked', 'true');
  });
});

// ===========================================================================
// SR announcements
// ===========================================================================

describe('ThemeToggle — screen-reader announcements', () => {
  it('announces "Theme set to Light." when Light is selected', () => {
    render(<ThemeToggle />);
    fireEvent.click(getOptions()[1]);
    expect(getLiveRegion()).toHaveTextContent(/theme set to light\./i);
  });

  it('announces "Theme set to Dark." when Dark is selected', () => {
    render(<ThemeToggle />);
    fireEvent.click(getOptions()[2]);
    expect(getLiveRegion()).toHaveTextContent(/theme set to dark\./i);
  });

  it('announces "Theme set to System." with a resolved-theme suffix when System is selected', () => {
    render(<ThemeToggle />);
    // Start at "light" preference, then switch to System.
    // When clicking System, the theme captured in the announcement is the
    // theme resolved from the *current* preference (light → theme='light').
    fireEvent.click(getOptions()[1]); // go to Light first
    fireEvent.click(getOptions()[0]); // back to System
    // theme when System was clicked is 'light' (the resolved value of the prior preference)
    expect(getLiveRegion()).toHaveTextContent(/theme set to system.*currently light/i);
  });

  it('live region is initially empty (no announcement before interaction)', () => {
    render(<ThemeToggle />);
    expect(getLiveRegion()).toHaveTextContent('');
  });
});

// ===========================================================================
// Keyboard navigation — roving tabindex
// ===========================================================================

describe('ThemeToggle — keyboard navigation', () => {
  it('ArrowRight moves focus from System → Light', () => {
    render(<ThemeToggle />);
    const [system, light] = getOptions();
    system.focus();
    fireEvent.keyDown(system, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(light);
  });

  it('ArrowRight wraps from Dark back to System', () => {
    render(<ThemeToggle />);
    const [system,, dark] = getOptions();
    dark.focus();
    fireEvent.keyDown(dark, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(system);
  });

  it('ArrowLeft moves focus from Light → System', () => {
    render(<ThemeToggle />);
    const [system, light] = getOptions();
    light.focus();
    fireEvent.keyDown(light, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(system);
  });

  it('ArrowLeft wraps from System back to Dark', () => {
    render(<ThemeToggle />);
    const [system,, dark] = getOptions();
    system.focus();
    fireEvent.keyDown(system, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(dark);
  });

  it('ArrowDown behaves the same as ArrowRight', () => {
    render(<ThemeToggle />);
    const [system, light] = getOptions();
    system.focus();
    fireEvent.keyDown(system, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(light);
  });

  it('ArrowUp behaves the same as ArrowLeft', () => {
    render(<ThemeToggle />);
    const [system, light] = getOptions();
    light.focus();
    fireEvent.keyDown(light, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(system);
  });

  it('Home moves focus to the first option (System) from any position', () => {
    render(<ThemeToggle />);
    const [system,, dark] = getOptions();
    dark.focus();
    fireEvent.keyDown(dark, { key: 'Home' });
    expect(document.activeElement).toBe(system);
  });

  it('End moves focus to the last option (Dark) from any position', () => {
    render(<ThemeToggle />);
    const [system,, dark] = getOptions();
    system.focus();
    fireEvent.keyDown(system, { key: 'End' });
    expect(document.activeElement).toBe(dark);
  });

  it('arrow keys call preventDefault to prevent page scroll', () => {
    render(<ThemeToggle />);
    const [system] = getOptions();
    system.focus();

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    system.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('unrecognised keys (e.g. Tab) do not move focus', () => {
    render(<ThemeToggle />);
    const [system] = getOptions();
    system.focus();
    fireEvent.keyDown(system, { key: 'Tab' });
    expect(document.activeElement).toBe(system);
  });
});

// ===========================================================================
// Boundary / error resilience
// ===========================================================================

describe('ThemeToggle — boundary and error resilience', () => {
  it('renders without error when localStorage.getItem throws (private-mode simulation)', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('SecurityError');
    });
    try {
      expect(() => render(<ThemeToggle />)).not.toThrow();
      // Falls back to system default
      expect(getChecked()).toHaveAccessibleName(/system/i);
    } finally {
      spy.mockRestore();
    }
  });

  it('renders without error when localStorage.setItem throws', () => {
    render(<ThemeToggle />);
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    try {
      // Clicking should not throw even if persistence fails
      expect(() => fireEvent.click(getOptions()[1])).not.toThrow();
      // UI still reflects the selected option
      expect(getOptions()[1]).toHaveAttribute('aria-checked', 'true');
    } finally {
      spy.mockRestore();
    }
  });

  it('renders without error when localStorage.removeItem throws', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    render(<ThemeToggle />);
    const spy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('SecurityError');
    });
    try {
      expect(() => fireEvent.click(getOptions()[0])).not.toThrow();
    } finally {
      spy.mockRestore();
    }
  });

  it('renders without error when matchMedia is unavailable (SSR-like)', () => {
    // Override the matchMedia mock to simulate absence
    const originalMatchMedia = window.matchMedia;
    // @ts-expect-error — intentionally removing matchMedia to simulate restricted env
    delete window.matchMedia;
    expect(() => render(<ThemeToggle />)).not.toThrow();
    window.matchMedia = originalMatchMedia;
  });

  it('applies the --active class to exactly one option at all times during rapid clicks', () => {
    render(<ThemeToggle />);
    const [system, light, dark] = getOptions();
    [light, dark, system, dark, light, system].forEach((btn) => fireEvent.click(btn));
    const active = getOptions().filter((o) => o.className.includes('theme-toggle__option--active'));
    expect(active).toHaveLength(1);
  });
});

// ===========================================================================
// ARIA / WCAG contract
// ===========================================================================

describe('ThemeToggle — ARIA contract', () => {
  it('each option has role="radio"', () => {
    render(<ThemeToggle />);
    getOptions().forEach((btn) => expect(btn).toHaveAttribute('role', 'radio'));
  });

  it('icons inside buttons are hidden from assistive technology', () => {
    render(<ThemeToggle />);
    const { container } = render(<ThemeToggle />);
    const icons = container.querySelectorAll('.theme-toggle__icon');
    icons.forEach((icon) => expect(icon).toHaveAttribute('aria-hidden', 'true'));
  });

  it('each option label is visible text (not image-only)', () => {
    render(<ThemeToggle />);
    const labels = screen
      .getAllByRole('radio')
      .map((btn) => within(btn as HTMLElement).getByText(/^(System|Light|Dark)$/));
    expect(labels).toHaveLength(3);
  });

  it('unchecked options have aria-checked="false"', () => {
    render(<ThemeToggle />);
    const unchecked = getOptions().filter((o) => o.getAttribute('aria-checked') === 'false');
    expect(unchecked).toHaveLength(2);
  });
});
