/**
 * Curated list of design tokens exposed to the Token Playground.
 *
 * Every `cssVar` here must already exist in src/styles/tokens.css or
 * src/styles/theme.css - the playground reads its starting values from the
 * live cascade (via getComputedStyle) rather than duplicating them, so it
 * can never drift from the real tokens the way a hardcoded doc page can.
 */

export type PlaygroundTokenCategory = 'color' | 'spacing' | 'radius';
export type PlaygroundTokenType = 'color' | 'rem';

export interface PlaygroundToken {
  /** The CSS custom property this control edits, e.g. "--color-brand-primary". */
  cssVar: string;
  /** Human-readable label shown next to the control. */
  label: string;
  /** A short note on where this token is used in the stage below. */
  usedIn: string;
  category: PlaygroundTokenCategory;
  type: PlaygroundTokenType;
  /** Only used for type "rem" controls. */
  min?: number;
  max?: number;
  step?: number;
}

export const PLAYGROUND_TOKENS: PlaygroundToken[] = [
  // Color
  {
    cssVar: '--color-brand-primary',
    label: 'Brand primary',
    usedIn: 'Button (primary)',
    category: 'color',
    type: 'color',
  },
  {
    cssVar: '--color-brand-accent',
    label: 'Brand accent',
    usedIn: 'Button (primary gradient)',
    category: 'color',
    type: 'color',
  },
  {
    cssVar: '--color-surface-card',
    label: 'Card surface',
    usedIn: 'Card (default)',
    category: 'color',
    type: 'color',
  },
  {
    cssVar: '--color-success',
    label: 'Success',
    usedIn: 'Alert (success)',
    category: 'color',
    type: 'color',
  },
  {
    cssVar: '--color-warning',
    label: 'Warning',
    usedIn: 'Alert (warning)',
    category: 'color',
    type: 'color',
  },
  {
    cssVar: '--color-danger',
    label: 'Danger',
    usedIn: 'Alert (danger)',
    category: 'color',
    type: 'color',
  },
  {
    cssVar: '--color-info',
    label: 'Info',
    usedIn: 'Alert (info)',
    category: 'color',
    type: 'color',
  },
  // Spacing
  {
    cssVar: '--space-2',
    label: 'Space 2',
    usedIn: 'Tag (gap)',
    category: 'spacing',
    type: 'rem',
    min: 0,
    max: 2,
    step: 0.05,
  },
  {
    cssVar: '--space-3',
    label: 'Space 3',
    usedIn: 'Button (vertical padding), Tag (padding)',
    category: 'spacing',
    type: 'rem',
    min: 0,
    max: 3,
    step: 0.05,
  },
  {
    cssVar: '--space-4',
    label: 'Space 4',
    usedIn: 'Card (padding sm)',
    category: 'spacing',
    type: 'rem',
    min: 0,
    max: 4,
    step: 0.05,
  },
  {
    cssVar: '--space-5',
    label: 'Space 5',
    usedIn: 'Button (horizontal padding)',
    category: 'spacing',
    type: 'rem',
    min: 0,
    max: 5,
    step: 0.05,
  },
  {
    cssVar: '--space-6',
    label: 'Space 6',
    usedIn: 'Card (padding md)',
    category: 'spacing',
    type: 'rem',
    min: 0,
    max: 6,
    step: 0.05,
  },
  // Radius
  {
    cssVar: '--radius-sm',
    label: 'Radius sm',
    usedIn: 'Alert (dismiss button)',
    category: 'radius',
    type: 'rem',
    min: 0,
    max: 1,
    step: 0.05,
  },
  {
    cssVar: '--radius-lg',
    label: 'Radius lg',
    usedIn: 'Alert (container)',
    category: 'radius',
    type: 'rem',
    min: 0,
    max: 2,
    step: 0.05,
  },
  {
    cssVar: '--radius-xl',
    label: 'Radius xl',
    usedIn: 'Button (container)',
    category: 'radius',
    type: 'rem',
    min: 0,
    max: 2,
    step: 0.05,
  },
  {
    cssVar: '--radius-2xl',
    label: 'Radius 2xl',
    usedIn: 'Card (container)',
    category: 'radius',
    type: 'rem',
    min: 0,
    max: 3,
    step: 0.05,
  },
];

export const PLAYGROUND_TOKEN_CATEGORIES: { key: PlaygroundTokenCategory; label: string }[] = [
  { key: 'color', label: 'Color' },
  { key: 'spacing', label: 'Spacing' },
  { key: 'radius', label: 'Radius' },
];

/** Hex color validation, allowing #rgb or #rrggbb. */
export const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function parseRemValue(raw: string): number | null {
  const trimmed = raw.trim();
  const match = /^(-?\d*\.?\d+)rem$/.exec(trimmed);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

export function formatRemValue(value: number): string {
  return `${Number(value.toFixed(2))}rem`;
}
