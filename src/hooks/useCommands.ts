/**
 * useCommands — owns the command palette's data layer:
 *   - builds the full catalog from COMMAND_DEFS
 *   - persists and reads recent command IDs (via safeStorage)
 *   - persists and reads pinned command IDs (via safeStorage)
 *   - exposes assembled paletteItems ready for <CommandPalette>
 *   - handles select (record recent) and togglePin
 *
 * guardedNavigate is accepted as a parameter so the hook works with
 * Layout's UnsavedChangesGuard-aware navigation wrapper.
 */
import { useMemo, useState } from 'react';
import { readJson, writeJson, remove } from '../utils/safeStorage';
import type { CommandItem } from '../components/CommandPalette';
import { buildCatalog } from '../components/layout/commands';

// ── Storage keys & limits ──────────────────────────────────────────────────

export const RECENT_COMMANDS_KEY = 'sb:recent-commands';
export const RECENT_COMMANDS_LIMIT = 5;

export const PINNED_COMMANDS_KEY = 'sb:pinned-commands';
export const PINNED_COMMANDS_LIMIT = 5;

// ── Pure helpers (exported for testing) ───────────────────────────────────

export function readRecentCommands(): string[] {
  return readJson<string[]>(RECENT_COMMANDS_KEY, [], Array.isArray);
}

export function readPinnedCommands(): string[] {
  return readJson<string[]>(PINNED_COMMANDS_KEY, [], Array.isArray);
}

export function persistPinnedCommands(ids: string[]): void {
  if (ids.length === 0) {
    remove(PINNED_COMMANDS_KEY);
  } else {
    writeJson(PINNED_COMMANDS_KEY, ids);
  }
}

/**
 * Given current pinned IDs, a command ID, and the max limit, compute
 * the next pinned IDs array (toggle: add if absent, remove if present).
 */
export function computeNextPinnedIds(
  prev: string[],
  itemId: string,
  limit = PINNED_COMMANDS_LIMIT,
): string[] {
  const isPinned = prev.includes(itemId);
  if (isPinned) return prev.filter((id) => id !== itemId);
  return [itemId, ...prev].slice(0, limit);
}

/**
 * Given current recent IDs and a newly selected command ID, compute
 * the next recent IDs array (deduplicate, prepend, cap at limit).
 */
export function computeNextRecentIds(
  prev: string[],
  selectedId: string,
  limit = RECENT_COMMANDS_LIMIT,
): string[] {
  return [selectedId, ...prev.filter((id) => id !== selectedId)].slice(0, limit);
}

// ── Hook ──────────────────────────────────────────────────────────────────

export interface UseCommandsResult {
  /** Full assembled list for <CommandPalette items={...}>. */
  paletteItems: CommandItem[];
  /** Record a selection; updates recents in state + storage. */
  handleCommandSelect: (item: CommandItem) => void;
  /** Toggle pin; updates pins in state + storage. */
  handleTogglePin: (itemId: string) => void;
}

/**
 * guardedNavigate is Layout's UnsavedChangesGuard-aware wrapper around
 * navigate(). Pass it in so the commands fire it instead of raw navigate.
 */
export function useCommands(guardedNavigate: (to: string) => void): UseCommandsResult {
  const [recentIds, setRecentIds] = useState<string[]>(() => readRecentCommands());
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => readPinnedCommands());

  // Build catalog once per guardedNavigate reference (stable across renders).
  const catalog = useMemo(() => buildCatalog(guardedNavigate), [guardedNavigate]);

  const handleCommandSelect = (item: CommandItem) => {
    const baseId = item.id.replace(/^recent-/, '');
    setRecentIds((prev) => {
      const next = computeNextRecentIds(prev, baseId);
      writeJson(RECENT_COMMANDS_KEY, next);
      return next;
    });
  };

  const handleTogglePin = (itemId: string) => {
    setPinnedIds((prev) => {
      const next = computeNextPinnedIds(prev, itemId);
      persistPinnedCommands(next);
      return next;
    });
  };

  // Build palette items: each command appears once — in Pinned if pinned,
  // in Recent if recently used (and not pinned), or in its original group.
  const paletteItems = useMemo<CommandItem[]>(() => {
    const pinned = pinnedIds
      .map((id) => catalog.find((item) => item.id === id))
      .filter((item): item is CommandItem => Boolean(item))
      .map((item) => ({ ...item, group: 'Pinned' as const }));

    const recent = recentIds
      .map((id) => catalog.find((item) => item.id === id))
      .filter((item): item is CommandItem => Boolean(item))
      .filter((item) => !pinnedIds.includes(item.id))
      .map((item) => ({ ...item, id: `recent-${item.id}`, group: 'Recent' as const }));

    const unpinnedNonRecent = catalog.filter((item) => !pinnedIds.includes(item.id));

    return [...pinned, ...unpinnedNonRecent, ...recent];
  }, [catalog, recentIds, pinnedIds]);

  return { paletteItems, handleCommandSelect, handleTogglePin };
}
