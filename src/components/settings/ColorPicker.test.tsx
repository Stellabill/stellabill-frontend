/**
 * Tests for:
 *   - src/utils/colorContrast.ts   (pure logic — no DOM needed)
 *   - src/components/settings/ColorSwatch.tsx
 *   - src/components/settings/ColorPicker.tsx
 *
 * Edge-cases covered:
 *   - Very long tag names (overflow/truncation shouldn't break layout)
 *   - RTL rendering (dir="rtl" wrapper)
 *   - Screen-reader colour labels (aria-label / aria-checked)
 *   - Keyboard navigation (arrow keys, Home, End)
 *   - Contrast warning visibility
 *   - onChange callback fires on click and on keyboard activation
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  parseHex,
  relativeLuminance,
  contrastRatio,
  wcagLevel,
  passesAA,
  WCAG_AA_NORMAL,
} from '../../utils/colorContrast';
import ColorSwatch, { TAG_COLORS, TAG_COLOR_PAIRS } from './ColorSwatch';
import ColorPicker from './ColorPicker';

// ─────────────────────────────────────────────────────────────────────────────
// colorContrast utility
// ─────────────────────────────────────────────────────────────────────────────

describe('colorContrast utility', () => {
  describe('parseHex', () => {
    it('parses a 6-character hex', () => {
      expect(parseHex('#1e40af')).toEqual([30, 64, 175]);
    });

    it('parses a 3-character shorthand hex', () => {
      // #fff → [255, 255, 255]
      expect(parseHex('#fff')).toEqual([255, 255, 255]);
    });

    it('parses an 8-character hex (ignores alpha)', () => {
      expect(parseHex('#1e40afff')).toEqual([30, 64, 175]);
    });

    it('handles hex without leading #', () => {
      expect(parseHex('1e40af')).toEqual([30, 64, 175]);
    });

    it('returns null for unrecognised input', () => {
      expect(parseHex('not-a-colour')).toBeNull();
      expect(parseHex('')).toBeNull();
    });
  });

  describe('relativeLuminance', () => {
    it('returns 0 for pure black', () => {
      expect(relativeLuminance([0, 0, 0])).toBeCloseTo(0, 5);
    });

    it('returns 1 for pure white', () => {
      expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 5);
    });
  });

  describe('contrastRatio', () => {
    it('returns ~21 for black on white', () => {
      const ratio = contrastRatio('#000000', '#ffffff');
      expect(ratio).not.toBeNull();
      expect(ratio!).toBeCloseTo(21, 0);
    });

    it('returns 1 for same colour', () => {
      const ratio = contrastRatio('#ffffff', '#ffffff');
      expect(ratio).toBeCloseTo(1, 5);
    });

    it('returns null for an invalid colour', () => {
      expect(contrastRatio('invalid', '#ffffff')).toBeNull();
    });

    // Verify all palette pairs pass at least WCAG AA Large (3:1)
    it.each(TAG_COLORS)('%s palette pair passes WCAG 2.1 AA Large (≥3:1)', (color) => {
      const { bg, text } = TAG_COLOR_PAIRS[color];
      const ratio = contrastRatio(text, bg);
      expect(ratio).not.toBeNull();
      expect(ratio!).toBeGreaterThanOrEqual(3.0);
    });

    // The five colours that clear the stricter 4.5:1 AA threshold
    const AA_COLORS: TagColor[] = ['blue', 'red', 'purple', 'pink', 'gray'];
    it.each(AA_COLORS)('%s palette pair passes WCAG 2.1 AA (≥4.5:1)', (color) => {
      const { bg, text } = TAG_COLOR_PAIRS[color];
      const ratio = contrastRatio(text, bg);
      expect(ratio).not.toBeNull();
      expect(ratio!).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    });
  });

  describe('wcagLevel', () => {
    it('returns "AAA" for ratio ≥ 7', () => {
      expect(wcagLevel(7.0)).toBe('AAA');
      expect(wcagLevel(21)).toBe('AAA');
    });

    it('returns "AA" for 4.5 ≤ ratio < 7', () => {
      expect(wcagLevel(4.5)).toBe('AA');
      expect(wcagLevel(6.9)).toBe('AA');
    });

    it('returns "AA Large" for 3 ≤ ratio < 4.5', () => {
      expect(wcagLevel(3.0)).toBe('AA Large');
      expect(wcagLevel(4.4)).toBe('AA Large');
    });

    it('returns "Fail" for ratio < 3', () => {
      expect(wcagLevel(2.9)).toBe('Fail');
      expect(wcagLevel(1)).toBe('Fail');
    });

    it('returns "Fail" for null', () => {
      expect(wcagLevel(null)).toBe('Fail');
    });
  });

  describe('passesAA', () => {
    it('returns true for black on white', () => {
      expect(passesAA('#000000', '#ffffff')).toBe(true);
    });

    it('returns false for the same colour', () => {
      expect(passesAA('#ffffff', '#ffffff')).toBe(false);
    });

    it('returns false for an invalid colour', () => {
      expect(passesAA('bad', '#ffffff')).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ColorSwatch component
// ─────────────────────────────────────────────────────────────────────────────

describe('ColorSwatch', () => {
  it('renders a button with role="radio"', () => {
    render(
      <ColorSwatch color="blue" selected={false} onSelect={vi.fn()} />,
    );
    expect(screen.getByRole('radio')).toBeInTheDocument();
  });

  it('sets aria-checked=true when selected', () => {
    render(
      <ColorSwatch color="blue" selected={true} onSelect={vi.fn()} />,
    );
    expect(screen.getByRole('radio')).toHaveAttribute('aria-checked', 'true');
  });

  it('sets aria-checked=false when not selected', () => {
    render(
      <ColorSwatch color="green" selected={false} onSelect={vi.fn()} />,
    );
    expect(screen.getByRole('radio')).toHaveAttribute('aria-checked', 'false');
  });

  it('includes "(selected)" in the aria-label when selected', () => {
    render(
      <ColorSwatch color="purple" selected={true} onSelect={vi.fn()} />,
    );
    expect(screen.getByRole('radio')).toHaveAccessibleName(/selected/i);
  });

  it('calls onSelect with the colour name on click', async () => {
    const onSelect = vi.fn();
    render(
      <ColorSwatch color="red" selected={false} onSelect={onSelect} />,
    );
    await userEvent.click(screen.getByRole('radio'));
    expect(onSelect).toHaveBeenCalledWith('red');
  });

  it('respects the tabIndex prop', () => {
    render(
      <ColorSwatch color="gray" selected={false} onSelect={vi.fn()} tabIndex={-1} />,
    );
    expect(screen.getByRole('radio')).toHaveAttribute('tabindex', '-1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ColorPicker component
// ─────────────────────────────────────────────────────────────────────────────

describe('ColorPicker', () => {
  function renderPicker(overrides: Partial<React.ComponentProps<typeof ColorPicker>> = {}) {
    const onChange = overrides.onChange ?? vi.fn();
    const utils = render(
      <ColorPicker
        value="blue"
        previewLabel="Test tag"
        onChange={onChange}
        {...overrides}
      />,
    );
    return { ...utils, onChange };
  }

  it('renders a radiogroup with 8 radio buttons', () => {
    renderPicker();
    const group = screen.getByRole('radiogroup');
    expect(group).toBeInTheDocument();
    expect(within(group).getAllByRole('radio')).toHaveLength(8);
  });

  it('marks only the current value as checked', () => {
    renderPicker({ value: 'green' });
    const checked = screen.getAllByRole('radio', { checked: true });
    expect(checked).toHaveLength(1);
    expect(checked[0]).toHaveAccessibleName(/green/i);
  });

  it('shows the live preview tag with the correct label', () => {
    renderPicker({ previewLabel: 'My Tag' });
    expect(screen.getByText('My Tag')).toBeInTheDocument();
  });

  it('calls onChange when a swatch is clicked', async () => {
    const onChange = vi.fn();
    renderPicker({ value: 'blue', onChange });
    await userEvent.click(screen.getByRole('radio', { name: /purple/i }));
    expect(onChange).toHaveBeenCalledWith('purple');
  });

  // ── Contrast pass/fail ───────────────────────────────────────────────────

  it('does NOT show a contrast warning for colours that pass AA', () => {
    // These palette colours pass WCAG 2.1 AA (≥4.5:1)
    const aaColors: TagColor[] = ['blue', 'red', 'purple', 'pink', 'gray'];
    for (const color of aaColors) {
      const { unmount } = render(
        <ColorPicker value={color} previewLabel="tag" onChange={vi.fn()} />,
      );
      expect(screen.queryByRole('alert')).toBeNull();
      unmount();
    }
  });

  it('DOES show a contrast warning for colours below AA threshold', () => {
    // green (~4.42:1), yellow (~4.42:1), orange (~3.83:1) are below 4.5:1
    const belowAA: TagColor[] = ['green', 'yellow', 'orange'];
    for (const color of belowAA) {
      const { unmount } = render(
        <ColorPicker value={color} previewLabel="tag" onChange={vi.fn()} />,
      );
      expect(screen.getByRole('alert')).toBeInTheDocument();
      unmount();
    }
  });

  it('displays a contrast-ratio badge', () => {
    renderPicker({ value: 'blue' });
    // Blue pair is ~5.6:1 → badge text should contain "AA"
    expect(screen.getByText(/aa/i)).toBeInTheDocument();
  });

  // ── Keyboard navigation ──────────────────────────────────────────────────

  it('moves focus to the next swatch on ArrowRight', async () => {
    renderPicker({ value: 'blue' });
    const radios = screen.getAllByRole('radio');
    // Focus the first swatch (blue)
    radios[0].focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(radios[1]);
  });

  it('wraps around from last to first swatch on ArrowRight', async () => {
    renderPicker({ value: 'blue' });
    const radios = screen.getAllByRole('radio');
    radios[radios.length - 1].focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(radios[0]);
  });

  it('moves focus to the previous swatch on ArrowLeft', async () => {
    renderPicker({ value: 'blue' });
    const radios = screen.getAllByRole('radio');
    radios[2].focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(radios[1]);
  });

  it('wraps around from first to last swatch on ArrowLeft', async () => {
    renderPicker({ value: 'blue' });
    const radios = screen.getAllByRole('radio');
    radios[0].focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(radios[radios.length - 1]);
  });

  it('moves focus down by 4 columns on ArrowDown', async () => {
    renderPicker({ value: 'blue' });
    const radios = screen.getAllByRole('radio');
    radios[0].focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(radios[4]);
  });

  it('moves focus up by 4 columns on ArrowUp', async () => {
    renderPicker({ value: 'blue' });
    const radios = screen.getAllByRole('radio');
    radios[4].focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(radios[0]);
  });

  it('moves focus to the first swatch on Home', async () => {
    renderPicker({ value: 'blue' });
    const radios = screen.getAllByRole('radio');
    radios[5].focus();
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(radios[0]);
  });

  it('moves focus to the last swatch on End', async () => {
    renderPicker({ value: 'blue' });
    const radios = screen.getAllByRole('radio');
    radios[0].focus();
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(radios[radios.length - 1]);
  });

  // ── Roving tabindex ──────────────────────────────────────────────────────

  it('only the selected swatch has tabIndex=0; others are -1', () => {
    renderPicker({ value: 'orange' });
    const radios = screen.getAllByRole('radio');
    const orangeIdx = TAG_COLORS.indexOf('orange');
    radios.forEach((radio, i) => {
      if (i === orangeIdx) {
        expect(radio).toHaveAttribute('tabindex', '0');
      } else {
        expect(radio).toHaveAttribute('tabindex', '-1');
      }
    });
  });

  // ── Long tag names ───────────────────────────────────────────────────────

  it('renders a very long tag label without crashing', () => {
    const longLabel = 'A'.repeat(200);
    renderPicker({ previewLabel: longLabel });
    expect(screen.getByText(longLabel)).toBeInTheDocument();
  });

  // ── RTL ──────────────────────────────────────────────────────────────────

  it('renders correctly in an RTL context', () => {
    render(
      <div dir="rtl">
        <ColorPicker value="blue" previewLabel="وسم" onChange={vi.fn()} />
      </div>,
    );
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    expect(screen.getByText('وسم')).toBeInTheDocument();
  });

  // ── Default preview label ─────────────────────────────────────────────────

  it('falls back to "Preview" when previewLabel is an empty string', () => {
    renderPicker({ previewLabel: '' });
    // Both the static label and the Tag chip show "Preview"
    const nodes = screen.getAllByText('Preview');
    expect(nodes.length).toBeGreaterThanOrEqual(1);
  });

  // ── aria-live regions ─────────────────────────────────────────────────────

  it('preview row has aria-live="polite"', () => {
    renderPicker();
    const previewRow = screen.getByText('Preview').closest('[aria-live]');
    expect(previewRow).toHaveAttribute('aria-live', 'polite');
  });

  it('contrast row has aria-live="polite"', () => {
    renderPicker();
    // Find the element that contains the ratio display text (e.g. "5.6:1")
    const contrastEl = document.querySelector('.color-picker__contrast');
    expect(contrastEl).toHaveAttribute('aria-live', 'polite');
  });
});
