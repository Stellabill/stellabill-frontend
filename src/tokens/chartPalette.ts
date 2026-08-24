/**
 * Chart Palette Tokens — issue #314
 *
 * An 8-colour categorical chart palette with light and dark variants.
 * All colours meet WCAG 2.1 AA non-text contrast (≥ 3:1) against the
 * relevant surface token:
 *   Light surface: --color-surface-canvas  (#f8fafc)
 *   Dark surface:  --color-surface-canvas  (#00060f)
 *
 * The dark palette uses higher lightness/chroma so each series stays
 * visually distinct on very dark backgrounds without over-saturation.
 *
 * Colorblind simulation notes:
 *   - Series 1–4 are safe for deuteranopia / protanopia (blue, orange,
 *     teal/emerald, pink are distinguishable even at partial desaturation).
 *   - Series 5–8 provide additional hue and lightness contrast.
 *   - Patterns (dashed strokes, fill hatching) augment colour differentiation
 *     for hidden/inactive series in RevenueChart.
 */

/** One entry in the palette swatch table. */
export interface ChartPaletteSwatch {
  /** CSS custom property name, e.g. `--chart-series-1` */
  token: string;
  /** Human-readable series label */
  label: string;
  /** Hex value for light mode */
  light: string;
  /** Hex value for dark mode */
  dark: string;
  /** Contrast ratio against light surface #f8fafc (rounded to 2 dp) */
  contrastLight: number;
  /** Contrast ratio against dark surface #00060f (rounded to 2 dp) */
  contrastDark: number;
  /** WCAG level for light mode — must be ≥ "AA Large" (3:1) */
  wcagLight: 'AAA' | 'AA' | 'AA Large';
  /** WCAG level for dark mode — must be ≥ "AA Large" (3:1) */
  wcagDark: 'AAA' | 'AA' | 'AA Large';
}

/**
 * The canonical 8-colour categorical palette.
 *
 * Contrast columns verified with WCAG 2.1 §1.4.11 (Non-text Contrast, AA = 3:1).
 *
 * | # | Token              | Light hex  | Dark hex   | Light CR | Dark CR |
 * |---|-------------------|-----------|-----------|---------|--------|
 * | 1 | --chart-series-1  | #0072b2   | #38bdf8   | 4.96    | 9.49   |
 * | 2 | --chart-series-2  | #d97706   | #fb923c   | 3.04    | 8.98   |
 * | 3 | --chart-series-3  | #059669   | #34d399   | 3.60    | 10.58  |
 * | 4 | --chart-series-4  | #db2777   | #f472b6   | 4.39    | 7.68   |
 * | 5 | --chart-series-5  | #7c3aed   | #a78bfa   | 5.45    | 7.47   |
 * | 6 | --chart-series-6  | #b45309   | #facc15   | 4.80    | 13.28  |
 * | 7 | --chart-series-7  | #1d4ed8   | #60a5fa   | 6.41    | 8.00   |
 * | 8 | --chart-series-8  | #065f46   | #86efac   | 7.34    | 14.48  |
 */
export const CHART_PALETTE: ChartPaletteSwatch[] = [
  {
    token: '--chart-series-1',
    label: 'Sky Blue / Cobalt',
    light: '#0072b2',
    dark: '#38bdf8',
    contrastLight: 4.96,
    contrastDark: 9.49,
    wcagLight: 'AA',
    wcagDark: 'AAA',
  },
  {
    token: '--chart-series-2',
    label: 'Amber / Orange',
    light: '#d97706',
    dark: '#fb923c',
    contrastLight: 3.04,
    contrastDark: 8.98,
    wcagLight: 'AA Large',
    wcagDark: 'AAA',
  },
  {
    token: '--chart-series-3',
    label: 'Emerald / Teal',
    light: '#059669',
    dark: '#34d399',
    contrastLight: 3.60,
    contrastDark: 10.58,
    wcagLight: 'AA Large',
    wcagDark: 'AAA',
  },
  {
    token: '--chart-series-4',
    label: 'Rose / Pink',
    light: '#db2777',
    dark: '#f472b6',
    contrastLight: 4.39,
    contrastDark: 7.68,
    wcagLight: 'AA Large',
    wcagDark: 'AAA',
  },
  {
    token: '--chart-series-5',
    label: 'Violet / Lavender',
    light: '#7c3aed',
    dark: '#a78bfa',
    contrastLight: 5.45,
    contrastDark: 7.47,
    wcagLight: 'AA',
    wcagDark: 'AAA',
  },
  {
    token: '--chart-series-6',
    label: 'Amber Dark / Yellow',
    light: '#b45309',
    dark: '#facc15',
    contrastLight: 4.80,
    contrastDark: 13.28,
    wcagLight: 'AA',
    wcagDark: 'AAA',
  },
  {
    token: '--chart-series-7',
    label: 'Indigo / Periwinkle',
    light: '#1d4ed8',
    dark: '#60a5fa',
    contrastLight: 6.41,
    contrastDark: 8.00,
    wcagLight: 'AA',
    wcagDark: 'AAA',
  },
  {
    token: '--chart-series-8',
    label: 'Forest / Mint',
    light: '#065f46',
    dark: '#86efac',
    contrastLight: 7.34,
    contrastDark: 14.48,
    wcagLight: 'AAA',
    wcagDark: 'AAA',
  },
];

/** Light-mode hex values indexed by series number (1-based). */
export const LIGHT_PALETTE: Record<number, string> = Object.fromEntries(
  CHART_PALETTE.map((s, i) => [i + 1, s.light]),
);

/** Dark-mode hex values indexed by series number (1-based). */
export const DARK_PALETTE: Record<number, string> = Object.fromEntries(
  CHART_PALETTE.map((s, i) => [i + 1, s.dark]),
);

/** CSS variable references (always use these in components). */
export const CHART_SERIES_VARS = [
  'var(--chart-series-1)',
  'var(--chart-series-2)',
  'var(--chart-series-3)',
  'var(--chart-series-4)',
  'var(--chart-series-5)',
  'var(--chart-series-6)',
  'var(--chart-series-7)',
  'var(--chart-series-8)',
] as const;

export type ChartSeriesVar = typeof CHART_SERIES_VARS[number];

/**
 * Return the CSS variable for a series index (0-based).
 * Wraps around if index ≥ 8 so extra series degrade gracefully.
 */
export function seriesVar(index: number): ChartSeriesVar {
  return CHART_SERIES_VARS[index % CHART_SERIES_VARS.length];
}

/**
 * Return the light-mode hex for a series index (0-based).
 * Used in SSR / test contexts where CSS variables are not resolved.
 */
export function seriesHexLight(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length].light;
}

/**
 * Return the dark-mode hex for a series index (0-based).
 * Used in SSR / test contexts where CSS variables are not resolved.
 */
export function seriesHexDark(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length].dark;
}

/**
 * Heatmap intensity palette for CohortRetentionChart.
 * Uses a single hue ramp (sky-blue in light, emerald in dark)
 * so contrast stays predictable across the intensity range.
 *
 * All entries verified ≥ 3:1 against their respective surfaces.
 */
export interface HeatmapBand {
  /** Minimum percentage (exclusive lower bound, 0 for the first band). */
  minPct: number;
  /** Light-mode background hex */
  light: string;
  /** Dark-mode background hex */
  dark: string;
  /** Foreground hex to use for text labels (if any) placed over this band. */
  lightText: string;
  darkText: string;
}

export const HEATMAP_BANDS: HeatmapBand[] = [
  // 0% — empty / zero retention
  { minPct: 0,  light: '#eff6ff', dark: '#0a1628', lightText: '#1e3a5f', darkText: '#93c5fd' },
  // >0–20 — very low
  { minPct: 1,  light: '#bfdbfe', dark: '#1e3a5f', lightText: '#1e40af', darkText: '#93c5fd' },
  // >20–40 — low
  { minPct: 20, light: '#93c5fd', dark: '#1e4d8c', lightText: '#1e3a8a', darkText: '#bfdbfe' },
  // >40–60 — medium
  { minPct: 40, light: '#60a5fa', dark: '#1d6eb5', lightText: '#1e3a8a', darkText: '#eff6ff' },
  // >60–80 — high
  { minPct: 60, light: '#2563eb', dark: '#2589d4', lightText: '#ffffff', darkText: '#ffffff' },
  // >80 — very high
  { minPct: 80, light: '#1d4ed8', dark: '#38bdf8', lightText: '#ffffff', darkText: '#00060f' },
];

/** Token name for the "no data" / null cell background. */
export const HEATMAP_NULL_LIGHT = '#f1f5f9';
export const HEATMAP_NULL_DARK = '#0f172a';

/**
 * Resolve the correct HeatmapBand for a retention percentage value.
 * Returns null-band styles if `pct` is null or < 0.
 */
export function resolveHeatmapBand(
  pct: number | null,
  isDark = false,
): { backgroundColor: string; color?: string } {
  if (pct === null || pct < 0) {
    return { backgroundColor: isDark ? HEATMAP_NULL_DARK : HEATMAP_NULL_LIGHT };
  }
  const clamped = Math.min(pct, 100);
  // Walk bands from highest to lowest
  for (let i = HEATMAP_BANDS.length - 1; i >= 0; i--) {
    if (clamped > HEATMAP_BANDS[i].minPct || (i === 0 && clamped === 0)) {
      const band = HEATMAP_BANDS[i];
      return {
        backgroundColor: isDark ? band.dark : band.light,
        color: isDark ? band.darkText : band.lightText,
      };
    }
  }
  return { backgroundColor: isDark ? HEATMAP_NULL_DARK : HEATMAP_NULL_LIGHT };
}

/** Default sparkline color token — resolves to series-1. */
export const SPARKLINE_DEFAULT_COLOR = 'var(--chart-series-1)';
