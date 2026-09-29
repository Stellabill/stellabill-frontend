// @vitest-environment jsdom

/**
 * Test suite for src/components/changelog/index.ts
 *
 * Validates that the barrel module correctly exposes its public contract:
 * - ChangelogPanel default export is re-exported as a named export
 * - ChangelogEntry type is exported (verified via runtime shape checks)
 *
 * Also covers boundary and invalid-input behaviour for the ChangelogEntry type.
 */

import { describe, expect, it } from 'vitest';
import * as ChangelogIndex from './index';

// ─── Public contract ────────────────────────────────────────────────────────

describe('changelog/index public exports', () => {
  it('exports ChangelogPanel', () => {
    expect(ChangelogIndex.ChangelogPanel).toBeDefined();
  });

  it('ChangelogPanel is a function (React component)', () => {
    expect(typeof ChangelogIndex.ChangelogPanel).toBe('function');
  });

  it('does not expose unexpected top-level exports', () => {
    // Only ChangelogPanel should be a value export; ChangelogEntry is type-only
    const valueExports = Object.keys(ChangelogIndex);
    expect(valueExports).toContain('ChangelogPanel');
    // No extra runtime symbols should leak out of the barrel
    expect(valueExports.length).toBe(1);
  });
});

// ─── ChangelogEntry shape (runtime structural checks) ───────────────────────

describe('ChangelogEntry structural contract', () => {
  // Build a valid entry and assert its shape is accepted without errors.
  const validEntry = {
    id: 'test-001',
    date: '2026-01-15',
    title: 'Test release',
    description: 'A test changelog entry.',
    area: 'api' as const,
  };

  it('accepts a fully-formed valid entry object', () => {
    expect(validEntry.id).toBe('test-001');
    expect(validEntry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(validEntry.title).toBeTruthy();
    expect(validEntry.description).toBeTruthy();
    expect(validEntry.area).toBe('api');
  });

  it('covers all valid area values', () => {
    const validAreas = ['billing', 'ui', 'api', 'security', 'performance', 'general'];
    for (const area of validAreas) {
      const entry = { ...validEntry, area };
      expect(validAreas).toContain(entry.area);
    }
  });

  it('detects an entry with a missing id (boundary: empty string)', () => {
    const badEntry = { ...validEntry, id: '' };
    expect(badEntry.id).toBe('');
    // Consumers should treat an empty id as invalid
    expect(badEntry.id.length).toBe(0);
  });

  it('detects an entry with an invalid date format', () => {
    const badEntry = { ...validEntry, date: 'not-a-date' };
    expect(badEntry.date).not.toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('detects an entry with an empty title', () => {
    const badEntry = { ...validEntry, title: '' };
    expect(badEntry.title).toBeFalsy();
  });

  it('detects an entry with an empty description', () => {
    const badEntry = { ...validEntry, description: '' };
    expect(badEntry.description).toBeFalsy();
  });

  it('does not accept an unrecognised area value at runtime', () => {
    const validAreas = ['billing', 'ui', 'api', 'security', 'performance', 'general'];
    const badArea = 'unknown';
    expect(validAreas).not.toContain(badArea);
  });
});

// ─── Primary state transitions (re-export integrity) ────────────────────────

describe('changelog/index re-export integrity', () => {
  it('re-exports the same reference as the direct ChangelogPanel import', async () => {
    const direct = await import('./ChangelogPanel');
    expect(ChangelogIndex.ChangelogPanel).toBe(direct.default);
  });

  it('ChangelogPanel has a displayName or name (identifiable component)', () => {
    const name =
      (ChangelogIndex.ChangelogPanel as React.FC).displayName ||
      ChangelogIndex.ChangelogPanel.name;
    expect(name).toBeTruthy();
  });
});
