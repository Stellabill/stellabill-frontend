import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ColorSwatch, { TAG_COLOR_PAIRS, type TagColor } from './ColorSwatch';
import { contrastRatio, passesAA, WCAG_AA_LARGE } from '../../utils/colorContrast';

describe('ColorSwatch', () => {
  it('renders an unselected swatch with aria-checked="false" and label "Blue"', () => {
    render(<ColorSwatch color="blue" selected={false} onSelect={vi.fn()} />);

    const swatch = screen.getByRole('radio', { name: 'Blue' });
    expect(swatch).toHaveAttribute('aria-checked', 'false');
    expect(swatch).not.toHaveClass('color-swatch--selected');
  });

  it('renders a selected swatch with aria-checked="true", label "Blue (selected)", and class color-swatch--selected', () => {
    render(<ColorSwatch color="blue" selected={true} onSelect={vi.fn()} />);

    const swatch = screen.getByRole('radio', { name: 'Blue (selected)' });
    expect(swatch).toHaveAttribute('aria-checked', 'true');
    expect(swatch).toHaveClass('color-swatch--selected');
  });

  it('calls onSelect with the swatch color when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<ColorSwatch color="green" selected={false} onSelect={onSelect} />);

    await user.click(screen.getByRole('radio', { name: 'Green' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('green');
  });

  const AA_COLORS: TagColor[] = ['blue', 'red', 'purple', 'pink', 'gray'];
  it.each(AA_COLORS)(
    'TAG_COLOR_PAIRS.%s bg/text pair passes WCAG AA (passesAA)',
    (color) => {
      const { bg, text } = TAG_COLOR_PAIRS[color];
      expect(passesAA(text, bg)).toBe(true);
    },
  );

  // green (4.42:1), yellow (4.42:1), and orange (3.83:1) pass WCAG AA Large (≥3:1)
  // but sit below the 4.5:1 normal-text AA threshold (see ColorPicker.test.tsx).
  const AA_LARGE_ONLY_COLORS: TagColor[] = ['green', 'yellow', 'orange'];
  it.each(AA_LARGE_ONLY_COLORS)(
    'TAG_COLOR_PAIRS.%s bg/text pair passes WCAG AA Large (≥3:1) and reports false for passesAA',
    (color) => {
      const { bg, text } = TAG_COLOR_PAIRS[color];
      expect(passesAA(text, bg)).toBe(false);
      expect(contrastRatio(text, bg)).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
    },
  );
});
