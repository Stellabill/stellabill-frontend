/**
 * Unit tests for useCommands helpers and hook.
 *
 * Tests cover:
 *   - readRecentCommands / readPinnedCommands (safe parse, bad JSON, missing key)
 *   - computeNextRecentIds (deduplicate, prepend, cap at limit)
 *   - computeNextPinnedIds (pin, unpin, cap at limit)
 *   - persistPinnedCommands (write / remove)
 *   - useCommands() integration: initial state, handleCommandSelect, handleTogglePin
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import {
  readRecentCommands,
  readPinnedCommands,
  persistPinnedCommands,
  computeNextRecentIds,
  computeNextPinnedIds,
  RECENT_COMMANDS_KEY,
  RECENT_COMMANDS_LIMIT,
  PINNED_COMMANDS_KEY,
  PINNED_COMMANDS_LIMIT,
  useCommands,
} from './useCommands';

// ── localStorage helpers ───────────────────────────────────────────────────

describe('readRecentCommands', () => {
  beforeEach(() => localStorage.clear());

  it('returns an empty array when nothing is stored', () => {
    expect(readRecentCommands()).toEqual([]);
  });

  it('returns stored ids', () => {
    localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(['a', 'b']));
    expect(readRecentCommands()).toEqual(['a', 'b']);
  });

  it('returns an empty array for malformed JSON', () => {
    localStorage.setItem(RECENT_COMMANDS_KEY, '{bad json}');
    expect(readRecentCommands()).toEqual([]);
  });

  it('returns an empty array when stored value is not an array', () => {
    localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify({ not: 'array' }));
    expect(readRecentCommands()).toEqual([]);
  });
});

describe('readPinnedCommands', () => {
  beforeEach(() => localStorage.clear());

  it('returns an empty array when nothing is stored', () => {
    expect(readPinnedCommands()).toEqual([]);
  });

  it('returns stored ids', () => {
    localStorage.setItem(PINNED_COMMANDS_KEY, JSON.stringify(['x', 'y']));
    expect(readPinnedCommands()).toEqual(['x', 'y']);
  });

  it('returns an empty array for malformed JSON', () => {
    localStorage.setItem(PINNED_COMMANDS_KEY, 'not-json');
    expect(readPinnedCommands()).toEqual([]);
  });
});

describe('persistPinnedCommands', () => {
  beforeEach(() => localStorage.clear());

  it('writes ids to localStorage', () => {
    persistPinnedCommands(['a', 'b']);
    expect(localStorage.getItem(PINNED_COMMANDS_KEY)).toBe(JSON.stringify(['a', 'b']));
  });

  it('removes the key when given an empty array', () => {
    localStorage.setItem(PINNED_COMMANDS_KEY, JSON.stringify(['a']));
    persistPinnedCommands([]);
    expect(localStorage.getItem(PINNED_COMMANDS_KEY)).toBeNull();
  });
});

// ── computeNextRecentIds ───────────────────────────────────────────────────

describe('computeNextRecentIds', () => {
  it('prepends a new id', () => {
    expect(computeNextRecentIds(['b', 'c'], 'a')).toEqual(['a', 'b', 'c']);
  });

  it('moves an existing id to the front', () => {
    expect(computeNextRecentIds(['a', 'b', 'c'], 'c')).toEqual(['c', 'a', 'b']);
  });

  it('caps the list at the given limit', () => {
    const prev = ['b', 'c', 'd', 'e', 'f'];
    const next = computeNextRecentIds(prev, 'a', 5);
    expect(next).toHaveLength(5);
    expect(next[0]).toBe('a');
  });

  it('defaults to RECENT_COMMANDS_LIMIT', () => {
    const prev = Array.from({ length: RECENT_COMMANDS_LIMIT }, (_, i) => `cmd-${i}`);
    const next = computeNextRecentIds(prev, 'new');
    expect(next).toHaveLength(RECENT_COMMANDS_LIMIT);
    expect(next[0]).toBe('new');
  });

  it('deduplicates when the id already appears elsewhere', () => {
    const result = computeNextRecentIds(['a', 'b', 'a'], 'a');
    expect(result.filter((id) => id === 'a')).toHaveLength(1);
  });
});

// ── computeNextPinnedIds ───────────────────────────────────────────────────

describe('computeNextPinnedIds', () => {
  it('pins a new id by prepending it', () => {
    expect(computeNextPinnedIds(['b'], 'a')).toEqual(['a', 'b']);
  });

  it('unpins an already-pinned id by removing it', () => {
    expect(computeNextPinnedIds(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });

  it('caps at the given limit when pinning', () => {
    const prev = ['a', 'b', 'c', 'd'];
    const next = computeNextPinnedIds(prev, 'e', 4);
    expect(next).toHaveLength(4);
    expect(next[0]).toBe('e');
    // 'd' should be dropped
    expect(next).not.toContain('d');
  });

  it('defaults to PINNED_COMMANDS_LIMIT', () => {
    const prev = Array.from({ length: PINNED_COMMANDS_LIMIT }, (_, i) => `pin-${i}`);
    const next = computeNextPinnedIds(prev, 'new');
    expect(next).toHaveLength(PINNED_COMMANDS_LIMIT);
    expect(next[0]).toBe('new');
  });

  it('does not duplicate when pinning the same id twice', () => {
    // Pin once: ['a']
    const after1 = computeNextPinnedIds([], 'a');
    // "Pin" again should actually unpin it
    const after2 = computeNextPinnedIds(after1, 'a');
    expect(after2).toEqual([]);
  });
});

// ── useCommands hook ───────────────────────────────────────────────────────

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(MemoryRouter, { initialEntries: ['/'] }, children);
}

describe('useCommands', () => {
  const mockNav = vi.fn();
  beforeEach(() => { localStorage.clear(); mockNav.mockClear(); });
  afterEach(() => localStorage.clear());

  it('returns paletteItems derived from the catalog', () => {
    const { result } = renderHook(() => useCommands(mockNav), { wrapper });
    expect(result.current.paletteItems.length).toBeGreaterThan(0);
  });

  it('records a selection in recents and in localStorage', () => {
    const { result } = renderHook(() => useCommands(mockNav), { wrapper });

    act(() => {
      const item = result.current.paletteItems.find((i) => i.id === 'page-dashboard');
      if (item) result.current.handleCommandSelect(item);
    });

    const stored = JSON.parse(localStorage.getItem(RECENT_COMMANDS_KEY) ?? '[]');
    expect(stored).toContain('page-dashboard');
  });

  it('strips the recent- prefix before recording', () => {
    const { result } = renderHook(() => useCommands(mockNav), { wrapper });

    act(() => {
      result.current.handleCommandSelect({
        id: 'recent-page-plans',
        label: 'Plans',
        group: 'Recent',
        perform: () => {},
      });
    });

    const stored: string[] = JSON.parse(localStorage.getItem(RECENT_COMMANDS_KEY) ?? '[]');
    expect(stored).toContain('page-plans');
    expect(stored).not.toContain('recent-page-plans');
  });

  it('recent ordering: most-recently selected appears first', () => {
    const { result } = renderHook(() => useCommands(mockNav), { wrapper });

    act(() => {
      result.current.handleCommandSelect({ id: 'page-dashboard', label: 'Dashboard', group: 'Pages', perform: () => {} });
    });
    act(() => {
      result.current.handleCommandSelect({ id: 'page-plans', label: 'Plans', group: 'Pages', perform: () => {} });
    });

    const stored: string[] = JSON.parse(localStorage.getItem(RECENT_COMMANDS_KEY) ?? '[]');
    expect(stored[0]).toBe('page-plans');
    expect(stored[1]).toBe('page-dashboard');
  });

  it('recent list does not exceed RECENT_COMMANDS_LIMIT', () => {
    const { result } = renderHook(() => useCommands(mockNav), { wrapper });

    const ids = ['page-dashboard', 'page-plans', 'page-subscriptions', 'page-settings', 'page-ui-kit', 'page-brand'];
    for (const id of ids) {
      act(() => {
        result.current.handleCommandSelect({ id, label: id, group: 'Pages', perform: () => {} });
      });
    }

    const stored: string[] = JSON.parse(localStorage.getItem(RECENT_COMMANDS_KEY) ?? '[]');
    expect(stored.length).toBeLessThanOrEqual(RECENT_COMMANDS_LIMIT);
  });

  it('pins a command and reflects it in paletteItems under the Pinned group', () => {
    const { result } = renderHook(() => useCommands(mockNav), { wrapper });

    act(() => {
      result.current.handleTogglePin('page-dashboard');
    });

    const pinned = result.current.paletteItems.filter((i) => i.group === 'Pinned');
    expect(pinned.some((i) => i.id === 'page-dashboard')).toBe(true);
    expect(localStorage.getItem(PINNED_COMMANDS_KEY)).toContain('page-dashboard');
  });

  it('unpins a command that was previously pinned', () => {
    localStorage.setItem(PINNED_COMMANDS_KEY, JSON.stringify(['page-dashboard']));
    const { result } = renderHook(() => useCommands(mockNav), { wrapper });

    act(() => {
      result.current.handleTogglePin('page-dashboard');
    });

    const pinned = result.current.paletteItems.filter((i) => i.group === 'Pinned');
    expect(pinned.some((i) => i.id === 'page-dashboard')).toBe(false);
    expect(localStorage.getItem(PINNED_COMMANDS_KEY)).toBeNull();
  });

  it('pinned list does not exceed PINNED_COMMANDS_LIMIT', () => {
    const { result } = renderHook(() => useCommands(mockNav), { wrapper });

    const ids = ['page-dashboard', 'page-plans', 'page-subscriptions', 'page-settings', 'page-ui-kit', 'page-brand'];
    for (const id of ids) {
      act(() => {
        result.current.handleTogglePin(id);
      });
    }

    const pinned = result.current.paletteItems.filter((i) => i.group === 'Pinned');
    expect(pinned.length).toBeLessThanOrEqual(PINNED_COMMANDS_LIMIT);
  });

  it('a pinned item does not also appear in Recent', () => {
    const { result } = renderHook(() => useCommands(mockNav), { wrapper });

    act(() => {
      result.current.handleCommandSelect({ id: 'page-dashboard', label: 'Dashboard', group: 'Pages', perform: () => {} });
    });
    act(() => {
      result.current.handleTogglePin('page-dashboard');
    });

    const recent = result.current.paletteItems.filter((i) => i.group === 'Recent');
    expect(recent.some((i) => i.id.replace(/^recent-/, '') === 'page-dashboard')).toBe(false);
  });
});
