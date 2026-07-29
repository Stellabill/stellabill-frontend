import type { TagProps } from '../Tag';
import './ColorPicker.css';

/** The ordered list of available tag colours. */
export const TAG_COLORS = [
  'blue',
  'green',
  'yellow',
  'red',
  'purple',
  'pink',
  'orange',
  'gray',
] as const satisfies ReadonlyArray<NonNullable<TagProps['color']>>;

export type TagColor = (typeof TAG_COLORS)[number];

/** Canonical background → foreground hex pairs for each tag colour. */
export const TAG_COLOR_PAIRS: Record<TagColor, { bg: string; text: string }> = {
  blue:   { bg: '#1e40af', text: '#dbeafe' },
  green:  { bg: '#15803d', text: '#d1fae5' },
  yellow: { bg: '#a16207', text: '#fef3c7' },
  red:    { bg: '#b91c1c', text: '#fee2e2' },
  purple: { bg: '#7e22ce', text: '#f3e8ff' },
  pink:   { bg: '#be185d', text: '#fce7f3' },
  orange: { bg: '#c2410c', text: '#fed7aa' },
  gray:   { bg: '#475569', text: '#e2e8f0' },
};

/** Human-friendly colour names for screen readers. */
const COLOR_LABELS: Record<TagColor, string> = {
  blue:   'Blue',
  green:  'Green',
  yellow: 'Yellow',
  red:    'Red',
  purple: 'Purple',
  pink:   'Pink',
  orange: 'Orange',
  gray:   'Gray',
};

export interface ColorSwatchProps {
  /** The colour this swatch represents. */
  color: TagColor;
  /** Whether this swatch is the currently-selected option. */
  selected: boolean;
  /** Called when the user activates this swatch (click or keyboard). */
  onSelect: (color: TagColor) => void;
  /** Passed through to the button to allow roving-tabindex management. */
  tabIndex?: number;
}

/**
 * A single accessible colour swatch button inside the colour-picker grid.
 *
 * Implements the radio-button interaction pattern (roving tabindex) so the
 * parent `ColorPicker` can manage arrow-key navigation between swatches.
 */
export default function ColorSwatch({
  color,
  selected,
  onSelect,
  tabIndex = 0,
}: ColorSwatchProps) {
  const { bg } = TAG_COLOR_PAIRS[color];
  const label = COLOR_LABELS[color];

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${label}${selected ? ' (selected)' : ''}`}
      tabIndex={tabIndex}
      className={`color-swatch${selected ? ' color-swatch--selected' : ''}`}
      style={{ '--swatch-bg': bg } as React.CSSProperties}
      onClick={() => onSelect(color)}
      data-color={color}
    />
  );
}
