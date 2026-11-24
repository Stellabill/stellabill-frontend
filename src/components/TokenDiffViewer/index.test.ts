/**
 * Barrel-contract tests for `src/components/TokenDiffViewer/index.ts`.
 *
 * The barrel is the only public entry point of the TokenDiffViewer feature, so
 * its *contract* matters as much as the behaviour of the modules it re-exports:
 *
 *   - the runtime export surface must stay exactly the intended set (no leaked
 *     internals, no type-only names accidentally shipped as values),
 *   - every re-export must be identity-stable with the originating module
 *     (guards against a stale copy or a renamed default),
 *   - the two re-exported modules must still compose through the barrel
 *     (`tokenVersions` -> `diffEngine`) without reaching past it,
 *   - the re-exported components must remain renderable from the barrel alone.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { createElement } from 'react';

import * as barrel from './index';
import * as diffEngine from './diffEngine';
import * as tokenVersions from './tokenVersions';
import TokenDiffViewerModule from './TokenDiffViewer';
import TokenDiffRowModule from './TokenDiffRow';

/* ────────────────────────────────────────────
   Expected contract
   ──────────────────────────────────────────── */

/** Every value export the barrel is allowed to expose, sorted. */
const EXPECTED_RUNTIME_EXPORTS = [
  'TokenDiffRow',
  'TokenDiffViewer',
  'computeContrastDelta',
  'computeTokenDiff',
  'contrastRatio',
  'formatChangelog',
  'getImpactScope',
  'getVersion',
  'getVersionIds',
  'isColor',
  'meetsAA',
  'parseHex',
  'relativeLuminance',
  'TOKEN_VERSIONS',
].sort();

/** TypeScript-only names that must be erased and never appear at runtime. */
const TYPE_ONLY_EXPORTS = [
  'AddedToken',
  'RemovedToken',
  'ChangedToken',
  'UnchangedToken',
  'DiffEntry',
  'DiffResult',
  'TokenEntry',
  'TokenCategory',
  'TokenVersion',
];

/** Helpers that are deliberately module-private and must not leak via `export *`. */
const INTERNAL_NAMES = ['buildMap', 'v001Tokens', 'v002Tokens', 'v003Tokens', 'IMPACT_MAP', 'STATUS_CONFIG'];

const DIFF_ENGINE_FUNCTIONS = [
  'parseHex',
  'relativeLuminance',
  'contrastRatio',
  'computeContrastDelta',
  'meetsAA',
  'getImpactScope',
  'computeTokenDiff',
  'formatChangelog',
  'isColor',
] as const;

afterEach(cleanup);

/* ────────────────────────────────────────────
   Runtime export surface
   ──────────────────────────────────────────── */

describe('TokenDiffViewer barrel — runtime export surface', () => {
  it('exposes exactly the intended set of runtime exports', () => {
    expect(Object.keys(barrel).sort()).toEqual(EXPECTED_RUNTIME_EXPORTS);
  });

  it('never exposes a runtime binding as `undefined`', () => {
    for (const name of EXPECTED_RUNTIME_EXPORTS) {
      expect((barrel as Record<string, unknown>)[name], `${name} must be defined`).toBeDefined();
    }
  });

  it('erases every type-only export from the runtime module object', () => {
    for (const name of TYPE_ONLY_EXPORTS) {
      expect(Object.prototype.hasOwnProperty.call(barrel, name), `${name} must not exist at runtime`).toBe(false);
    }
  });

  it('does not leak module-internal helpers through `export *`', () => {
    for (const name of INTERNAL_NAMES) {
      expect(Object.prototype.hasOwnProperty.call(barrel, name), `${name} must stay private`).toBe(false);
    }
  });
});

/* ────────────────────────────────────────────
   Identity of re-exports
   ──────────────────────────────────────────── */

describe('TokenDiffViewer barrel — re-export identity', () => {
  it('re-exports the component defaults by reference', () => {
    expect(barrel.TokenDiffViewer).toBe(TokenDiffViewerModule);
    expect(barrel.TokenDiffRow).toBe(TokenDiffRowModule);
  });

  it('re-exports every diffEngine function by reference', () => {
    for (const name of DIFF_ENGINE_FUNCTIONS) {
      expect(barrel[name], `${name} must be the same function object`).toBe(diffEngine[name]);
    }
  });

  it('re-exports every tokenVersions value by reference', () => {
    expect(barrel.TOKEN_VERSIONS).toBe(tokenVersions.TOKEN_VERSIONS);
    expect(barrel.getVersion).toBe(tokenVersions.getVersion);
    expect(barrel.getVersionIds).toBe(tokenVersions.getVersionIds);
  });

  it('keeps the components as distinct bindings (no default/name collision)', () => {
    expect(barrel.TokenDiffViewer).not.toBe(barrel.TokenDiffRow);
  });
});

/* ────────────────────────────────────────────
   Cross-module composition through the barrel only
   ──────────────────────────────────────────── */

describe('TokenDiffViewer barrel — cross-module composition', () => {
  it('lists version ids that are consistent with the exported version table', () => {
    expect(barrel.getVersionIds()).toEqual(barrel.TOKEN_VERSIONS.map((v) => v.id));
    expect(barrel.getVersionIds()).toHaveLength(barrel.TOKEN_VERSIONS.length);
  });

  it('resolves each advertised id to the exact exported version object', () => {
    for (const version of barrel.TOKEN_VERSIONS) {
      expect(barrel.getVersion(version.id)).toBe(version);
    }
  });

  it('returns undefined for ids that are not advertised', () => {
    expect(barrel.getVersion('')).toBeUndefined();
    expect(barrel.getVersion('v9.9.9')).toBeUndefined();
    expect(barrel.getVersion('V0.0.1')).toBeUndefined();
  });

  it('reports a version diffed against itself as fully unchanged', () => {
    for (const version of barrel.TOKEN_VERSIONS) {
      const diff = barrel.computeTokenDiff(version, version);
      expect(diff.added).toEqual([]);
      expect(diff.removed).toEqual([]);
      expect(diff.changed).toEqual([]);
      expect(diff.unchanged).toHaveLength(version.tokens.length);
      expect(diff.all.every((e) => e.type === 'unchanged')).toBe(true);
    }
  });

  it('partitions the new version into added/changed/unchanged with no losses', () => {
    const from = barrel.getVersion(barrel.getVersionIds()[0])!;
    const to = barrel.getVersion(barrel.getVersionIds()[barrel.getVersionIds().length - 1])!;

    const diff = barrel.computeTokenDiff(from, to);

    // Every token of the new version appears exactly once across the three buckets.
    const newSideNames = [...diff.added, ...diff.changed, ...diff.unchanged].map((e) => e.name);
    expect(newSideNames).toHaveLength(to.tokens.length);
    expect(new Set(newSideNames).size).toBe(to.tokens.length);
    expect([...newSideNames].sort()).toEqual(to.tokens.map((t) => t.name).sort());

    // Removed tokens are exactly the old names absent from the new version.
    const newNames = new Set(to.tokens.map((t) => t.name));
    const expectedRemoved = from.tokens.filter((t) => !newNames.has(t.name)).map((t) => t.name).sort();
    expect(diff.removed.map((e) => e.name).sort()).toEqual(expectedRemoved);

    // `all` is the concatenation of the buckets, in a stable bucket order.
    expect(diff.all).toEqual([...diff.added, ...diff.removed, ...diff.changed, ...diff.unchanged]);
  });

  it('treats missing versions as empty snapshots', () => {
    const diff = barrel.computeTokenDiff(undefined, undefined);
    expect(diff.added).toEqual([]);
    expect(diff.removed).toEqual([]);
    expect(diff.changed).toEqual([]);
    expect(diff.unchanged).toEqual([]);
    expect(diff.all).toEqual([]);
  });

  it('computes contrast deltas for changed colours and null for non-colours', () => {
    const from = {
      id: 'a',
      label: 'A',
      date: '2025-01-01',
      tokens: [
        { name: '--color-x', value: '#000000', category: 'brand' as const },
        { name: '--space-1', value: '4px', category: 'spacing' as const },
      ],
    };
    const to = {
      id: 'b',
      label: 'B',
      date: '2025-02-01',
      tokens: [
        { name: '--color-x', value: '#ffffff', category: 'brand' as const },
        { name: '--space-1', value: '8px', category: 'spacing' as const },
      ],
    };

    const diff = barrel.computeTokenDiff(from, to);
    expect(diff.changed).toHaveLength(2);

    const colour = diff.changed.find((e) => e.name === '--color-x')!;
    const spacing = diff.changed.find((e) => e.name === '--space-1')!;

    expect(colour.contrastDelta).toBe(1); // black -> white luminance delta
    expect(spacing.contrastDelta).toBeNull();
  });

  it('formats a changelog with the exported labels and bucket counts', () => {
    const from = barrel.TOKEN_VERSIONS[0];
    const to = barrel.TOKEN_VERSIONS[barrel.TOKEN_VERSIONS.length - 1];
    const diff = barrel.computeTokenDiff(from, to);

    const md = barrel.formatChangelog(from.label, to.label, diff);

    expect(md).toContain('# Token Changelog');
    expect(md).toContain(`**${from.label}** → **${to.label}**`);
    expect(md).toContain(`| Added  | ${diff.added.length} |`);
    expect(md).toContain(`| Removed | ${diff.removed.length} |`);
    expect(md).toContain(`| Changed | ${diff.changed.length} |`);
    expect(md).toContain(`| Unchanged | ${diff.unchanged.length} |`);
  });
});

/* ────────────────────────────────────────────
   Components render from the barrel alone
   ──────────────────────────────────────────── */

describe('TokenDiffViewer barrel — components render', () => {
  it('renders TokenDiffViewer from the barrel with its accessible shell', () => {
    render(createElement(barrel.TokenDiffViewer));

    expect(screen.getByRole('region', { name: 'Token Diff Viewer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Token Diff Viewer' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Version selection' })).toBeInTheDocument();
    expect(screen.getByLabelText('Baseline version')).toBeInTheDocument();
    expect(screen.getByLabelText('Target version')).toBeInTheDocument();
  });

  it('renders TokenDiffViewer defaulting to the first/last advertised versions', () => {
    const ids = barrel.getVersionIds();
    render(createElement(barrel.TokenDiffViewer));

    expect((screen.getByLabelText('Baseline version') as HTMLSelectElement).value).toBe(ids[0]);
    expect((screen.getByLabelText('Target version') as HTMLSelectElement).value).toBe(ids[ids.length - 1]);

    const diff = barrel.computeTokenDiff(
      barrel.getVersion(ids[0]),
      barrel.getVersion(ids[ids.length - 1]),
    );
    expect(screen.getByText(`${diff.added.length} added`)).toBeInTheDocument();
    expect(screen.getByText(`${diff.removed.length} removed`)).toBeInTheDocument();
    expect(screen.getByText(`${diff.changed.length} changed`)).toBeInTheDocument();
    expect(screen.getByText(`${diff.unchanged.length} unchanged`)).toBeInTheDocument();
  });

  it('renders TokenDiffRow for an added token through the barrel', () => {
    render(
      createElement(barrel.TokenDiffRow, {
        entry: { type: 'added', name: '--color-new', value: '#123456', category: 'brand' },
      }),
    );

    expect(screen.getByRole('row', { name: 'Added token: --color-new' })).toBeInTheDocument();
    expect(screen.getByText('--color-new')).toBeInTheDocument();
    expect(screen.getByText('#123456')).toBeInTheDocument();
  });

  it('renders TokenDiffRow for a removed token without a new-value swatch', () => {
    render(
      createElement(barrel.TokenDiffRow, {
        entry: { type: 'removed', name: '--color-gone', value: '#abcdef', category: 'surface' },
      }),
    );

    expect(screen.getByRole('row', { name: 'Removed token: --color-gone' })).toBeInTheDocument();
    expect(screen.getByLabelText('Old value: #abcdef')).toBeInTheDocument();
    expect(screen.queryByLabelText('New value: #abcdef')).not.toBeInTheDocument();
  });

  it('renders TokenDiffRow contrast delta for a changed colour token', () => {
    render(
      createElement(barrel.TokenDiffRow, {
        entry: {
          type: 'changed',
          name: '--color-brand-primary',
          oldValue: '#000000',
          newValue: '#ffffff',
          category: 'brand',
          contrastDelta: 1,
        },
      }),
    );

    expect(screen.getByRole('row', { name: 'Changed token: --color-brand-primary' })).toBeInTheDocument();
    expect(screen.getByText('1.000')).toBeInTheDocument();
    expect(screen.getByText(barrel.getImpactScope('brand'))).toBeInTheDocument();
  });
});
