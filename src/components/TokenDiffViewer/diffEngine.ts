/**
 * Token Diff Engine
 *
 * Pure-function utilities that compare two token version snapshots and produce
 * a structured diff result with contrast-delta and impact-scope metadata.
 */

import type { TokenEntry, TokenCategory, TokenVersion } from './tokenVersions';

/* ────────────────────────────────────────────
   Public types
   ──────────────────────────────────────────── */

export interface AddedToken {
  type: 'added';
  name: string;
  value: string;
  category: TokenCategory;
}

export interface RemovedToken {
  type: 'removed';
  name: string;
  value: string;
  category: TokenCategory;
}

export interface ChangedToken {
  type: 'changed';
  name: string;
  oldValue: string;
  newValue: string;
  category: TokenCategory;
  /** Absolute WCAG relative-luminance delta (only meaningful for colour tokens) */
  contrastDelta: number | null;
}

export interface UnchangedToken {
  type: 'unchanged';
  name: string;
  value: string;
  category: TokenCategory;
}

export type DiffEntry = AddedToken | RemovedToken | ChangedToken | UnchangedToken;

export interface DiffResult {
  added: AddedToken[];
  removed: RemovedToken[];
  changed: ChangedToken[];
  unchanged: UnchangedToken[];
  all: DiffEntry[];
}

/* ────────────────────────────────────────────
   Colour helpers
   ──────────────────────────────────────────── */

/**
 * Parse a 3-, 4-, 6-, or 8-digit hex colour into [r, g, b] (0-255).
 * Returns `null` when the value is not a recognisable hex colour.
 */
export function parseHex(raw: string): [number, number, number] | null {
  const m = raw.trim().match(/^#([0-9a-fA-F]{3,8})$/);
  if (!m) return null;
  let hex = m[1];
  // Expand shorthand (#abc → #aabbcc, #abcd → #aabbccdd)
  if (hex.length === 3 || hex.length === 4) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  // Take the first 6 hex chars (ignore alpha)
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return [r, g, b];
}

/**
 * WCAG 2.1 relative luminance of an sRGB colour.
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * WCAG contrast ratio between two colours (1 … 21).
 */
export function contrastRatio(
  rgb1: [number, number, number],
  rgb2: [number, number, number],
): number {
  const l1 = relativeLuminance(...rgb1);
  const l2 = relativeLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Compute absolute luminance delta between two hex colours.
 * Returns `null` when either value is not a hex colour.
 */
export function computeContrastDelta(oldVal: string, newVal: string): number | null {
  const a = parseHex(oldVal);
  const b = parseHex(newVal);
  if (!a || !b) return null;
  const lA = relativeLuminance(...a);
  const lB = relativeLuminance(...b);
  return Math.round(Math.abs(lB - lA) * 1000) / 1000;
}

/**
 * Check if a given contrast ratio meets WCAG 2.1 AA for normal text (≥ 4.5).
 */
export function meetsAA(ratio: number): boolean {
  return ratio >= 4.5;
}

/* ────────────────────────────────────────────
   Impact scope
   ──────────────────────────────────────────── */

const IMPACT_MAP: Record<TokenCategory, string> = {
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

/** Human-readable label describing what part of the UI a token category affects. */
export function getImpactScope(category: TokenCategory): string {
  return IMPACT_MAP[category] ?? category;
}

/* ────────────────────────────────────────────
   Diff computation
   ──────────────────────────────────────────── */

/**
 * Build a lookup map from token name → TokenEntry for O(1) access.
 */
function buildMap(tokens: TokenEntry[]): Map<string, TokenEntry> {
  const map = new Map<string, TokenEntry>();
  for (const t of tokens) {
    map.set(t.name, t);
  }
  return map;
}

/**
 * Compute the full diff between two token versions.
 *
 * @param oldVersion – The "from" (baseline) version.  May be `undefined`
 *                     (treated as empty — everything is "added").
 * @param newVersion – The "to" (target) version.  May be `undefined`
 *                     (treated as empty — everything is "removed").
 */
export function computeTokenDiff(
  oldVersion: TokenVersion | undefined,
  newVersion: TokenVersion | undefined,
): DiffResult {
  const oldTokens = oldVersion?.tokens ?? [];
  const newTokens = newVersion?.tokens ?? [];

  const oldMap = buildMap(oldTokens);
  const newMap = buildMap(newTokens);

  const added: AddedToken[] = [];
  const removed: RemovedToken[] = [];
  const changed: ChangedToken[] = [];
  const unchanged: UnchangedToken[] = [];

  // Walk all tokens that exist in the new version
  for (const entry of newTokens) {
    const old = oldMap.get(entry.name);
    if (!old) {
      added.push({ type: 'added', name: entry.name, value: entry.value, category: entry.category });
    } else if (old.value !== entry.value) {
      changed.push({
        type: 'changed',
        name: entry.name,
        oldValue: old.value,
        newValue: entry.value,
        category: entry.category,
        contrastDelta: computeContrastDelta(old.value, entry.value),
      });
    } else {
      unchanged.push({ type: 'unchanged', name: entry.name, value: entry.value, category: entry.category });
    }
  }

  // Walk tokens only present in the old version (removed)
  for (const entry of oldTokens) {
    if (!newMap.has(entry.name)) {
      removed.push({ type: 'removed', name: entry.name, value: entry.value, category: entry.category });
    }
  }

  const all: DiffEntry[] = [...added, ...removed, ...changed, ...unchanged];

  return { added, removed, changed, unchanged, all };
}

/**
 * Format a diff result as a Markdown changelog string.
 */
export function formatChangelog(
  fromLabel: string,
  toLabel: string,
  diff: DiffResult,
): string {
  const lines: string[] = [
    `# Token Changelog`,
    ``,
    `**${fromLabel}** → **${toLabel}**`,
    ``,
    `| Metric | Count |`,
    `|--------|-------|`,
    `| Added  | ${diff.added.length} |`,
    `| Removed | ${diff.removed.length} |`,
    `| Changed | ${diff.changed.length} |`,
    `| Unchanged | ${diff.unchanged.length} |`,
    ``,
  ];

  if (diff.added.length) {
    lines.push(`## Added`, ``);
    for (const t of diff.added) {
      lines.push(`- \`${t.name}\`: \`${t.value}\``);
    }
    lines.push(``);
  }

  if (diff.removed.length) {
    lines.push(`## Removed`, ``);
    for (const t of diff.removed) {
      lines.push(`- \`${t.name}\`: ~~\`${t.value}\`~~`);
    }
    lines.push(``);
  }

  if (diff.changed.length) {
    lines.push(`## Changed`, ``);
    for (const t of diff.changed) {
      const delta = t.contrastDelta !== null ? ` (Δ ${t.contrastDelta.toFixed(3)})` : '';
      lines.push(`- \`${t.name}\`: \`${t.oldValue}\` → \`${t.newValue}\`${delta}`);
    }
    lines.push(``);
  }

  return lines.join('\n');
}

/** Returns `true` when the value looks like a hex colour (for swatch rendering). */
export function isColor(value: string): boolean {
  return parseHex(value) !== null;
}
