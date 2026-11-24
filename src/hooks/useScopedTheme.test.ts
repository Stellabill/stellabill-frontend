import { createElement, useState } from 'react';
import { render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Theme } from './useTheme';
import { useScopedTheme } from './useScopedTheme';

function ScopedThemeHarness() {
  const [theme, setTheme] = useState<Theme | null>('light');
  const ref = useScopedTheme(theme);

  return createElement(
    'div',
    null,
    createElement('div', { ref, 'data-testid': 'scoped-element' }),
    createElement('button', { onClick: () => setTheme(null) }, 'Inherit theme'),
  );
}

describe('useScopedTheme', () => {
  it('applies the forced theme and clears it when changed to null', async () => {
    const user = userEvent.setup();
    render(createElement(ScopedThemeHarness));

    const element = screen.getByTestId('scoped-element');
    expect(element).toHaveAttribute('data-theme', 'light');
    expect(element.style.colorScheme).toBe('light');

    await user.click(screen.getByRole('button', { name: 'Inherit theme' }));

    expect(element).not.toHaveAttribute('data-theme');
    expect(element.style.colorScheme).toBe('');
  });

  it('clears the theme on unmount', () => {
    const { unmount } = render(createElement(ScopedThemeHarness));
    const element = screen.getByTestId('scoped-element');

    unmount();

    expect(element).not.toHaveAttribute('data-theme');
    expect(element.style.colorScheme).toBe('');
  });

  it('does not throw when no element is attached to the ref', () => {
    expect(() => renderHook(() => useScopedTheme('light'))).not.toThrow();
  });
});
