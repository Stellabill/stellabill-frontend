/**
 * chartPalette.test.ts — issue #314
 *
 * Unit tests for the chart palette token module.
 * Verifies:
 *   - Correct number of palette entries
 *   - All contrast ratios meet WCAG 2.1 §1.4.11 AA (≥ 3:1) for both surfaces
 *   - seriesVar / seriesHexLight / seriesHexDark wrap-around
 *   - resolveHeatmapBand returns correct band for sample percentages
 *   - SPARKLINE_DEFAULT_COLOR token resolves to series-1
 */

import { describe, it, expect } from 'vitest';
import {
  CHART_PALETTE,
  LIGHT_PALETTE,
  DARK_PALETTE,
  CHART_SERIES_VARS,
  seriesVar,
  seriesHexLight,
  seriesHexDark,
  HEATMAP_BANDS,
  resolveHeatmapBand,
  HEATMAP_NULL_LIGHT,
  HEATMAP_NULL_DARK,
  SPARKLINE_DEFAULT_COLOR,
} from './chartPalette';

/* ── Palette shape ──────────────────────────────────────────────────────── */

describe('CHART_PALETTE', () => {
  it('contains exactly 8 series', () => {
    expect(CHART_PALETTE).toHaveLength(8);
  });

  it('every entry has required fields', () => {
    CHART_PALETTE.forEach((swatch, i) => {
      expect(swatch.token, `series ${i + 1} token`).toMatch(/^--chart-series-\d+$/);
      expect(swatch.light, `series ${i + 1} light hex`).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(swatch.dark, `series ${i + 1} dark hex`).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(typeof swatch.contrastLight, `series ${i + 1} contrastLight type`).toBe('number');
      expect(typeof swatch.contrastDark, `series ${i + 1} contrastDark type`).toBe('number');
    });
  });

  it('all light-mode contrast ratios are ≥ 3:1 (WCAG AA non-text)', () => {
    CHART_PALETTE.forEach((swatch, i) => {
      expect(swatch.contrastLight, `series ${i + 1} light CR`).toBeGreaterThanOrEqual(3);
    });
  });

  it('all dark-mode contrast ratios are ≥ 3:1 (WCAG AA non-text)', () => {
    CHART_PALETTE.forEach((swatch, i) => {
      expect(swatch.contrastDark, `series ${i + 1} dark CR`).toBeGreaterThanOrEqual(3);
    });
  });

  it('wcagLight is AA Large, AA, or AAA for every series', () => {
    const valid = ['AA Large', 'AA', 'AAA'];
    CHART_PALETTE.forEach((swatch, i) => {
      expect(valid, `series ${i + 1} wcagLight`).toContain(swatch.wcagLight);
    });
  });

  it('wcagDark is AA Large, AA, or AAA for every series', () => {
    const valid = ['AA Large', 'AA', 'AAA'];
    CHART_PALETTE.forEach((swatch, i) => {
      expect(valid, `series ${i + 1} wcagDark`).toContain(swatch.wcagDark);
    });
  });

  it('series 1 light hex matches expected cobalt value', () => {
    expect(CHART_PALETTE[0].light).toBe('#0072b2');
  });

  it('series 1 dark hex matches expected sky-blue value', () => {
    expect(CHART_PALETTE[0].dark).toBe('#38bdf8');
  });
});

/* ── LIGHT_PALETTE / DARK_PALETTE maps ──────────────────────────────────── */

describe('LIGHT_PALETTE', () => {
  it('contains 8 entries keyed 1–8', () => {
    for (let i = 1; i <= 8; i++) {
      expect(LIGHT_PALETTE[i], `key ${i}`).toBeDefined();
    }
  });

  it('values match CHART_PALETTE.light', () => {
    CHART_PALETTE.forEach((swatch, i) => {
      expect(LIGHT_PALETTE[i + 1]).toBe(swatch.light);
    });
  });
});

describe('DARK_PALETTE', () => {
  it('contains 8 entries keyed 1–8', () => {
    for (let i = 1; i <= 8; i++) {
      expect(DARK_PALETTE[i], `key ${i}`).toBeDefined();
    }
  });

  it('values match CHART_PALETTE.dark', () => {
    CHART_PALETTE.forEach((swatch, i) => {
      expect(DARK_PALETTE[i + 1]).toBe(swatch.dark);
    });
  });
});

/* ── CHART_SERIES_VARS ──────────────────────────────────────────────────── */

describe('CHART_SERIES_VARS', () => {
  it('has exactly 8 entries', () => {
    expect(CHART_SERIES_VARS).toHaveLength(8);
  });

  it('each entry is a CSS variable reference', () => {
    CHART_SERIES_VARS.forEach((v, i) => {
      expect(v, `index ${i}`).toMatch(/^var\(--chart-series-\d+\)$/);
    });
  });
});

/* ── seriesVar ──────────────────────────────────────────────────────────── */

describe('seriesVar', () => {
  it('returns the correct CSS var for index 0', () => {
    expect(seriesVar(0)).toBe('var(--chart-series-1)');
  });

  it('returns the correct CSS var for index 7', () => {
    expect(seriesVar(7)).toBe('var(--chart-series-8)');
  });

  it('wraps around for index 8', () => {
    expect(seriesVar(8)).toBe('var(--chart-series-1)');
  });

  it('wraps around for index 15', () => {
    expect(seriesVar(15)).toBe('var(--chart-series-8)');
  });

  it('wraps around for index 16', () => {
    expect(seriesVar(16)).toBe('var(--chart-series-1)');
  });
});

/* ── seriesHexLight / seriesHexDark ─────────────────────────────────────── */

describe('seriesHexLight', () => {
  it('returns correct hex for index 0', () => {
    expect(seriesHexLight(0)).toBe(CHART_PALETTE[0].light);
  });

  it('wraps around for index 8', () => {
    expect(seriesHexLight(8)).toBe(CHART_PALETTE[0].light);
  });

  it('returns a valid hex string', () => {
    for (let i = 0; i < 8; i++) {
      expect(seriesHexLight(i)).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe('seriesHexDark', () => {
  it('returns correct hex for index 0', () => {
    expect(seriesHexDark(0)).toBe(CHART_PALETTE[0].dark);
  });

  it('wraps around for index 8', () => {
    expect(seriesHexDark(8)).toBe(CHART_PALETTE[0].dark);
  });

  it('returns a valid hex string', () => {
    for (let i = 0; i < 8; i++) {
      expect(seriesHexDark(i)).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

/* ── HEATMAP_BANDS ──────────────────────────────────────────────────────── */

describe('HEATMAP_BANDS', () => {
  it('has at least 2 bands', () => {
    expect(HEATMAP_BANDS.length).toBeGreaterThanOrEqual(2);
  });

  it('first band starts at minPct 0', () => {
    expect(HEATMAP_BANDS[0].minPct).toBe(0);
  });

  it('every band has valid hex colours', () => {
    HEATMAP_BANDS.forEach((band, i) => {
      expect(band.light, `band ${i} light`).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(band.dark, `band ${i} dark`).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('bands are sorted in ascending minPct order', () => {
    for (let i = 1; i < HEATMAP_BANDS.length; i++) {
      expect(HEATMAP_BANDS[i].minPct).toBeGreaterThan(HEATMAP_BANDS[i - 1].minPct);
    }
  });
});

/* ── resolveHeatmapBand ─────────────────────────────────────────────────── */

describe('resolveHeatmapBand', () => {
  it('returns null-band style for null input (light)', () => {
    const result = resolveHeatmapBand(null, false);
    expect(result.backgroundColor).toBe(HEATMAP_NULL_LIGHT);
  });

  it('returns null-band style for null input (dark)', () => {
    const result = resolveHeatmapBand(null, true);
    expect(result.backgroundColor).toBe(HEATMAP_NULL_DARK);
  });

  it('returns null-band style for negative input', () => {
    const result = resolveHeatmapBand(-1, false);
    expect(result.backgroundColor).toBe(HEATMAP_NULL_LIGHT);
  });

  it('returns a backgroundColor for 0%', () => {
    const result = resolveHeatmapBand(0, false);
    expect(result.backgroundColor).toBeDefined();
    expect(result.backgroundColor).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('returns a backgroundColor for 50% (light)', () => {
    const result = resolveHeatmapBand(50, false);
    expect(result.backgroundColor).toBeDefined();
  });

  it('returns a backgroundColor for 50% (dark)', () => {
    const result = resolveHeatmapBand(50, true);
    expect(result.backgroundColor).toBeDefined();
  });

  it('returns a backgroundColor for 100%', () => {
    const result = resolveHeatmapBand(100, false);
    expect(result.backgroundColor).toBeDefined();
  });

  it('clamps values above 100 to the highest band', () => {
    const at100 = resolveHeatmapBand(100, false);
    const above100 = resolveHeatmapBand(150, false);
    expect(above100.backgroundColor).toBe(at100.backgroundColor);
  });

  it('light and dark results differ for the same percentage', () => {
    const light = resolveHeatmapBand(70, false);
    const dark = resolveHeatmapBand(70, true);
    expect(light.backgroundColor).not.toBe(dark.backgroundColor);
  });

  it('higher percentage → higher band (monotone progression)', () => {
    // The backgroundColor for 90% should differ from 10% — not the same band
    const low = resolveHeatmapBand(10, false);
    const high = resolveHeatmapBand(90, false);
    expect(high.backgroundColor).not.toBe(low.backgroundColor);
  });
});

/* ── SPARKLINE_DEFAULT_COLOR ────────────────────────────────────────────── */

describe('SPARKLINE_DEFAULT_COLOR', () => {
  it('is a CSS variable pointing to series-1', () => {
    expect(SPARKLINE_DEFAULT_COLOR).toBe('var(--chart-series-1)');
  });
});
