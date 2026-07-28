import {
  parseHex,
  relativeLuminance,
  contrastRatio,
  computeContrastDelta,
  meetsAA,
  getImpactScope,
  computeTokenDiff,
  formatChangelog,
  isColor,
} from './diffEngine';
import type { TokenVersion, TokenEntry, TokenCategory } from './tokenVersions';

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

/** Build a minimal TokenVersion for testing. */
function makeVersion(
  id: string,
  tokens: TokenEntry[],
): TokenVersion {
  return { id, label: id, date: '2025-01-01', tokens };
}

/** Shorthand for creating a TokenEntry. */
function tok(
  name: string,
  value: string,
  category: TokenCategory = 'surface',
): TokenEntry {
  return { name, value, category };
}

/* ════════════════════════════════════════════
   parseHex
   ════════════════════════════════════════════ */

describe('parseHex', () => {
  it('parses a 6-digit hex colour', () => {
    expect(parseHex('#ff0000')).toEqual([255, 0, 0]);
  });

  it('parses #00ff00', () => {
    expect(parseHex('#00ff00')).toEqual([0, 255, 0]);
  });

  it('parses #0000ff', () => {
    expect(parseHex('#0000ff')).toEqual([0, 0, 255]);
  });

  it('parses a 3-digit hex colour (shorthand)', () => {
    // #abc → #aabbcc → (170, 187, 204)
    expect(parseHex('#abc')).toEqual([170, 187, 204]);
  });

  it('parses a 3-digit shorthand #fff', () => {
    expect(parseHex('#fff')).toEqual([255, 255, 255]);
  });

  it('parses an 8-digit hex colour (with alpha), ignoring alpha', () => {
    expect(parseHex('#ff000080')).toEqual([255, 0, 0]);
  });

  it('parses a 4-digit hex colour (shorthand with alpha), ignoring alpha', () => {
    // #abcd → #aabbccdd → (170, 187, 204)
    expect(parseHex('#abcd')).toEqual([170, 187, 204]);
  });

  it('is case insensitive', () => {
    expect(parseHex('#AABBCC')).toEqual([170, 187, 204]);
    expect(parseHex('#AaBbCc')).toEqual([170, 187, 204]);
  });

  it('returns null for rgba(...) values', () => {
    expect(parseHex('rgba(255,0,0,0.5)')).toBeNull();
  });

  it('returns null for non-colour values like "1rem"', () => {
    expect(parseHex('1rem')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(parseHex('')).toBeNull();
  });

  it('returns null for a bare hex string without #', () => {
    expect(parseHex('ff0000')).toBeNull();
  });

  it('trims whitespace before parsing', () => {
    expect(parseHex('  #ff0000  ')).toEqual([255, 0, 0]);
  });

  it('returns null for invalid hex characters', () => {
    expect(parseHex('#gggggg')).toBeNull();
  });

  it('parses #000000 as black', () => {
    expect(parseHex('#000000')).toEqual([0, 0, 0]);
  });

  it('parses #ffffff as white', () => {
    expect(parseHex('#ffffff')).toEqual([255, 255, 255]);
  });

  it('returns null for a hex string that is too short (2 chars)', () => {
    expect(parseHex('#ab')).toBeNull();
  });

  it('returns null for a hex string that is too long (9 chars)', () => {
    expect(parseHex('#aabbccdde')).toBeNull();
  });
});

/* ════════════════════════════════════════════
   relativeLuminance
   ════════════════════════════════════════════ */

describe('relativeLuminance', () => {
  it('returns 0 for black (0, 0, 0)', () => {
    expect(relativeLuminance(0, 0, 0)).toBe(0);
  });

  it('returns 1 for white (255, 255, 255)', () => {
    expect(relativeLuminance(255, 255, 255)).toBeCloseTo(1, 5);
  });

  it('returns a mid-range value for grey (128, 128, 128)', () => {
    const lum = relativeLuminance(128, 128, 128);
    // sRGB grey at ~50% should be around 0.2158
    expect(lum).toBeGreaterThan(0.2);
    expect(lum).toBeLessThan(0.25);
  });

  it('pure red has lower luminance than pure green', () => {
    const redLum = relativeLuminance(255, 0, 0);
    const greenLum = relativeLuminance(0, 255, 0);
    expect(greenLum).toBeGreaterThan(redLum);
  });

  it('green channel dominates luminance', () => {
    // WCAG weight: 0.7152 for green
    const greenLum = relativeLuminance(0, 255, 0);
    expect(greenLum).toBeCloseTo(0.7152, 3);
  });

  it('red channel contributes 0.2126 weight', () => {
    const redLum = relativeLuminance(255, 0, 0);
    expect(redLum).toBeCloseTo(0.2126, 3);
  });

  it('blue channel contributes 0.0722 weight', () => {
    const blueLum = relativeLuminance(0, 0, 255);
    expect(blueLum).toBeCloseTo(0.0722, 3);
  });

  it('handles values at the linearisation threshold (~ 0.04045 sRGB)', () => {
    // 0.04045 * 255 ≈ 10.3 → channel value 10 is below threshold
    const lum = relativeLuminance(10, 10, 10);
    expect(lum).toBeGreaterThan(0);
    expect(lum).toBeLessThan(0.01);
  });
});

/* ════════════════════════════════════════════
   contrastRatio
   ════════════════════════════════════════════ */

describe('contrastRatio', () => {
  it('returns 21 for black vs white', () => {
    const ratio = contrastRatio([0, 0, 0], [255, 255, 255]);
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('returns 1 for the same colour', () => {
    expect(contrastRatio([120, 120, 120], [120, 120, 120])).toBeCloseTo(1, 5);
  });

  it('is symmetric (order does not matter)', () => {
    const ab = contrastRatio([255, 0, 0], [0, 0, 255]);
    const ba = contrastRatio([0, 0, 255], [255, 0, 0]);
    expect(ab).toBeCloseTo(ba, 10);
  });

  it('returns a known ratio for a dark-on-light pair', () => {
    // White-on-black
    const ratio = contrastRatio([255, 255, 255], [0, 0, 0]);
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('returns > 1 for any two different colours', () => {
    const ratio = contrastRatio([100, 100, 100], [101, 101, 101]);
    expect(ratio).toBeGreaterThan(1);
  });
});

/* ════════════════════════════════════════════
   computeContrastDelta
   ════════════════════════════════════════════ */

describe('computeContrastDelta', () => {
  it('returns a number when both values are hex colours', () => {
    const delta = computeContrastDelta('#ff0000', '#0000ff');
    expect(typeof delta).toBe('number');
    expect(delta).not.toBeNull();
  });

  it('returns null when oldVal is not a hex colour', () => {
    expect(computeContrastDelta('rgba(0,0,0,1)', '#ff0000')).toBeNull();
  });

  it('returns null when newVal is not a hex colour', () => {
    expect(computeContrastDelta('#ff0000', '1rem')).toBeNull();
  });

  it('returns null when both values are non-hex', () => {
    expect(computeContrastDelta('1rem', '2rem')).toBeNull();
  });

  it('returns 0 for identical colours', () => {
    expect(computeContrastDelta('#abcdef', '#abcdef')).toBe(0);
  });

  it('returns positive delta for black → white', () => {
    const delta = computeContrastDelta('#000000', '#ffffff');
    expect(delta).toBeCloseTo(1, 0);
    expect(delta!).toBeGreaterThan(0);
  });

  it('result is rounded to 3 decimal places', () => {
    const delta = computeContrastDelta('#ff0000', '#00ff00');
    expect(delta).not.toBeNull();
    // Check no more than 3 decimal places
    const str = delta!.toString();
    const decimals = str.includes('.') ? str.split('.')[1].length : 0;
    expect(decimals).toBeLessThanOrEqual(3);
  });

  it('is symmetric (absolute value)', () => {
    const d1 = computeContrastDelta('#ff0000', '#0000ff');
    const d2 = computeContrastDelta('#0000ff', '#ff0000');
    expect(d1).toBe(d2);
  });
});

/* ════════════════════════════════════════════
   meetsAA
   ════════════════════════════════════════════ */

describe('meetsAA', () => {
  it('returns true for ratio of exactly 4.5', () => {
    expect(meetsAA(4.5)).toBe(true);
  });

  it('returns false for ratio of 4.49', () => {
    expect(meetsAA(4.49)).toBe(false);
  });

  it('returns true for maximum ratio of 21', () => {
    expect(meetsAA(21)).toBe(true);
  });

  it('returns false for ratio of 1', () => {
    expect(meetsAA(1)).toBe(false);
  });

  it('returns true for ratio above 4.5', () => {
    expect(meetsAA(7)).toBe(true);
  });

  it('returns false for ratio of 0', () => {
    expect(meetsAA(0)).toBe(false);
  });
});

/* ════════════════════════════════════════════
   getImpactScope
   ════════════════════════════════════════════ */

describe('getImpactScope', () => {
  const expectedMappings: Record<string, string> = {
    surface:    'Surfaces & Cards',
    text:       'Typography & Readability',
    border:     'Borders & Outlines',
    brand:      'Brand Identity',
    feedback:   'Feedback States',
    shadow:     'Elevation & Depth',
    spacing:    'Layout & Spacing',
    typography: 'Type Scale',
    radius:     'Corner Rounding',
    'z-index':  'Stacking Order',
    component:  'Component Internals',
    status:     'Status Indicators',
  };

  for (const [category, label] of Object.entries(expectedMappings)) {
    it(`maps '${category}' → '${label}'`, () => {
      expect(getImpactScope(category as TokenCategory)).toBe(label);
    });
  }

  it("falls back to the raw category for an unknown category", () => {
    // Force an unknown category through the type system
    expect(getImpactScope('unknown' as TokenCategory)).toBe('unknown');
  });
});

/* ════════════════════════════════════════════
   computeTokenDiff
   ════════════════════════════════════════════ */

describe('computeTokenDiff', () => {
  it('returns all unchanged when two identical versions are compared', () => {
    const tokens: TokenEntry[] = [
      tok('--a', '#fff'),
      tok('--b', '#000'),
    ];
    const v1 = makeVersion('v1', tokens);
    const v2 = makeVersion('v2', [...tokens]);
    const diff = computeTokenDiff(v1, v2);

    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
    expect(diff.changed).toHaveLength(0);
    expect(diff.unchanged).toHaveLength(2);
    expect(diff.all).toHaveLength(2);
  });

  it('correctly identifies added tokens', () => {
    const v1 = makeVersion('v1', [tok('--a', '#fff')]);
    const v2 = makeVersion('v2', [tok('--a', '#fff'), tok('--b', '#000')]);
    const diff = computeTokenDiff(v1, v2);

    expect(diff.added).toHaveLength(1);
    expect(diff.added[0]).toEqual({
      type: 'added',
      name: '--b',
      value: '#000',
      category: 'surface',
    });
    expect(diff.unchanged).toHaveLength(1);
  });

  it('correctly identifies removed tokens', () => {
    const v1 = makeVersion('v1', [tok('--a', '#fff'), tok('--b', '#000')]);
    const v2 = makeVersion('v2', [tok('--a', '#fff')]);
    const diff = computeTokenDiff(v1, v2);

    expect(diff.removed).toHaveLength(1);
    expect(diff.removed[0]).toEqual({
      type: 'removed',
      name: '--b',
      value: '#000',
      category: 'surface',
    });
  });

  it('correctly identifies changed tokens with contrastDelta for colours', () => {
    const v1 = makeVersion('v1', [tok('--a', '#ff0000')]);
    const v2 = makeVersion('v2', [tok('--a', '#0000ff')]);
    const diff = computeTokenDiff(v1, v2);

    expect(diff.changed).toHaveLength(1);
    const c = diff.changed[0];
    expect(c.type).toBe('changed');
    expect(c.name).toBe('--a');
    expect(c.oldValue).toBe('#ff0000');
    expect(c.newValue).toBe('#0000ff');
    expect(typeof c.contrastDelta).toBe('number');
    expect(c.contrastDelta).not.toBeNull();
  });

  it('sets contrastDelta to null for non-colour changed tokens', () => {
    const v1 = makeVersion('v1', [tok('--space', '1rem', 'spacing')]);
    const v2 = makeVersion('v2', [tok('--space', '2rem', 'spacing')]);
    const diff = computeTokenDiff(v1, v2);

    expect(diff.changed).toHaveLength(1);
    expect(diff.changed[0].contrastDelta).toBeNull();
  });

  it('returns empty result when both versions are undefined', () => {
    const diff = computeTokenDiff(undefined, undefined);

    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
    expect(diff.changed).toHaveLength(0);
    expect(diff.unchanged).toHaveLength(0);
    expect(diff.all).toHaveLength(0);
  });

  it('treats undefined old version as empty → everything is added', () => {
    const v2 = makeVersion('v2', [tok('--a', '#fff'), tok('--b', '#000')]);
    const diff = computeTokenDiff(undefined, v2);

    expect(diff.added).toHaveLength(2);
    expect(diff.removed).toHaveLength(0);
    expect(diff.changed).toHaveLength(0);
    expect(diff.unchanged).toHaveLength(0);
  });

  it('treats undefined new version as empty → everything is removed', () => {
    const v1 = makeVersion('v1', [tok('--a', '#fff'), tok('--b', '#000')]);
    const diff = computeTokenDiff(v1, undefined);

    expect(diff.removed).toHaveLength(2);
    expect(diff.added).toHaveLength(0);
    expect(diff.changed).toHaveLength(0);
    expect(diff.unchanged).toHaveLength(0);
  });

  it('handles a large diff (100+ tokens) correctly', () => {
    const oldTokens: TokenEntry[] = [];
    const newTokens: TokenEntry[] = [];

    for (let i = 0; i < 120; i++) {
      const hex = i.toString(16).padStart(2, '0');
      oldTokens.push(tok(`--token-${i}`, `#${hex}${hex}${hex}`));
    }

    // First 50 unchanged, next 30 changed, last 40 removed from old, 20 new added
    for (let i = 0; i < 50; i++) {
      const hex = i.toString(16).padStart(2, '0');
      newTokens.push(tok(`--token-${i}`, `#${hex}${hex}${hex}`));
    }
    for (let i = 50; i < 80; i++) {
      newTokens.push(tok(`--token-${i}`, '#ffffff')); // Changed value
    }
    // tokens 80-119 removed (not in newTokens)
    for (let i = 120; i < 140; i++) {
      const hex = i.toString(16).padStart(2, '0');
      newTokens.push(tok(`--token-${i}`, `#${hex}${hex}${hex}`)); // Added
    }

    const diff = computeTokenDiff(
      makeVersion('old', oldTokens),
      makeVersion('new', newTokens),
    );

    expect(diff.unchanged).toHaveLength(50);
    expect(diff.changed).toHaveLength(30);
    expect(diff.removed).toHaveLength(40);
    expect(diff.added).toHaveLength(20);
    expect(diff.all).toHaveLength(50 + 30 + 40 + 20);
  });

  it('preserves the category of tokens in diff entries', () => {
    const v1 = makeVersion('v1', [tok('--a', '#fff', 'brand')]);
    const v2 = makeVersion('v2', [tok('--a', '#000', 'brand')]);
    const diff = computeTokenDiff(v1, v2);

    expect(diff.changed[0].category).toBe('brand');
  });

  it('populates the `all` array with every diff entry', () => {
    const v1 = makeVersion('v1', [
      tok('--keep', '#fff'),
      tok('--remove', '#aaa'),
      tok('--change', '#ff0000'),
    ]);
    const v2 = makeVersion('v2', [
      tok('--keep', '#fff'),
      tok('--change', '#0000ff'),
      tok('--add', '#bbb'),
    ]);
    const diff = computeTokenDiff(v1, v2);

    expect(diff.all).toHaveLength(
      diff.added.length + diff.removed.length + diff.changed.length + diff.unchanged.length,
    );
  });

  it('the `all` array order is: added, removed, changed, unchanged', () => {
    const v1 = makeVersion('v1', [
      tok('--keep', '#fff'),
      tok('--remove', '#aaa'),
      tok('--change', '#ff0000'),
    ]);
    const v2 = makeVersion('v2', [
      tok('--keep', '#fff'),
      tok('--change', '#0000ff'),
      tok('--add', '#bbb'),
    ]);
    const diff = computeTokenDiff(v1, v2);

    const types = diff.all.map((e) => e.type);
    const addedIdx = types.indexOf('added');
    const removedIdx = types.indexOf('removed');
    const changedIdx = types.indexOf('changed');
    const unchangedIdx = types.indexOf('unchanged');

    expect(addedIdx).toBeLessThan(removedIdx);
    expect(removedIdx).toBeLessThan(changedIdx);
    expect(changedIdx).toBeLessThan(unchangedIdx);
  });
});

/* ════════════════════════════════════════════
   formatChangelog
   ════════════════════════════════════════════ */

describe('formatChangelog', () => {
  it('produces valid markdown with header and table', () => {
    const diff = computeTokenDiff(
      makeVersion('v1', [tok('--a', '#fff')]),
      makeVersion('v2', [tok('--a', '#fff'), tok('--b', '#000')]),
    );
    const md = formatChangelog('v1', 'v2', diff);

    expect(md).toContain('# Token Changelog');
    expect(md).toContain('**v1** → **v2**');
    expect(md).toContain('| Metric | Count |');
  });

  it('contains correct counts in the summary table', () => {
    const diff = computeTokenDiff(
      makeVersion('v1', [tok('--a', '#fff'), tok('--b', '#aaa')]),
      makeVersion('v2', [tok('--a', '#000'), tok('--c', '#bbb')]),
    );
    // --a changed, --b removed, --c added
    const md = formatChangelog('v1', 'v2', diff);

    expect(md).toContain('| Added  | 1 |');
    expect(md).toContain('| Removed | 1 |');
    expect(md).toContain('| Changed | 1 |');
    expect(md).toContain('| Unchanged | 0 |');
  });

  it('contains an Added section when tokens are added', () => {
    const diff = computeTokenDiff(
      makeVersion('v1', []),
      makeVersion('v2', [tok('--new', '#f00')]),
    );
    const md = formatChangelog('v1', 'v2', diff);

    expect(md).toContain('## Added');
    expect(md).toContain('`--new`');
    expect(md).toContain('`#f00`');
  });

  it('contains a Removed section when tokens are removed', () => {
    const diff = computeTokenDiff(
      makeVersion('v1', [tok('--old', '#f00')]),
      makeVersion('v2', []),
    );
    const md = formatChangelog('v1', 'v2', diff);

    expect(md).toContain('## Removed');
    expect(md).toContain('`--old`');
    expect(md).toContain('~~`#f00`~~');
  });

  it('contains a Changed section when tokens are changed', () => {
    const diff = computeTokenDiff(
      makeVersion('v1', [tok('--a', '#ff0000')]),
      makeVersion('v2', [tok('--a', '#0000ff')]),
    );
    const md = formatChangelog('v1', 'v2', diff);

    expect(md).toContain('## Changed');
    expect(md).toContain('`--a`');
    expect(md).toContain('`#ff0000`');
    expect(md).toContain('`#0000ff`');
    expect(md).toContain('Δ');
  });

  it('omits the Changed section contrastDelta annotation for non-colour tokens', () => {
    const diff = computeTokenDiff(
      makeVersion('v1', [tok('--space', '1rem', 'spacing')]),
      makeVersion('v2', [tok('--space', '2rem', 'spacing')]),
    );
    const md = formatChangelog('v1', 'v2', diff);

    expect(md).toContain('## Changed');
    expect(md).not.toContain('Δ');
  });

  it('produces no Added/Removed/Changed sections for an empty diff', () => {
    const tokens = [tok('--a', '#fff')];
    const diff = computeTokenDiff(
      makeVersion('v1', tokens),
      makeVersion('v2', [...tokens]),
    );
    const md = formatChangelog('v1', 'v2', diff);

    expect(md).not.toContain('## Added');
    expect(md).not.toContain('## Removed');
    expect(md).not.toContain('## Changed');
  });

  it('still contains the header for an empty diff', () => {
    const diff = computeTokenDiff(undefined, undefined);
    const md = formatChangelog('v1', 'v2', diff);

    expect(md).toContain('# Token Changelog');
    expect(md).toContain('| Added  | 0 |');
    expect(md).toContain('| Removed | 0 |');
    expect(md).toContain('| Changed | 0 |');
    expect(md).toContain('| Unchanged | 0 |');
  });

  it('returns a string (not empty)', () => {
    const diff = computeTokenDiff(undefined, undefined);
    const md = formatChangelog('a', 'b', diff);
    expect(typeof md).toBe('string');
    expect(md.length).toBeGreaterThan(0);
  });
});

/* ════════════════════════════════════════════
   isColor
   ════════════════════════════════════════════ */

describe('isColor', () => {
  it('returns true for a 6-digit hex colour', () => {
    expect(isColor('#ff0000')).toBe(true);
  });

  it('returns true for a 3-digit hex colour', () => {
    expect(isColor('#abc')).toBe(true);
  });

  it('returns true for an 8-digit hex colour', () => {
    expect(isColor('#ff000080')).toBe(true);
  });

  it('returns false for "1rem"', () => {
    expect(isColor('1rem')).toBe(false);
  });

  it('returns false for "rgba(...)"', () => {
    expect(isColor('rgba(255,0,0,0.5)')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isColor('')).toBe(false);
  });

  it('returns false for a shadow value', () => {
    expect(isColor('0 1px 2px rgba(0,0,0,0.05)')).toBe(false);
  });

  it('returns true for upper-case hex', () => {
    expect(isColor('#ABCDEF')).toBe(true);
  });
});
