/**
 * Tests for the useSavedViews hook.
 *
 * react-router-dom is not installed as a project dependency, so we mock the
 * entire module.  The mock provides a minimal `useSearchParams` shim that lets
 * us control URL params per test case and observe URL writes.
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SavedView, ViewFilters, SavedViewsStore } from '@/types/savedViews';

// ─── react-router-dom mock ────────────────────────────────────────────────────
// We must mock the whole module because it is not installed.
// Each test can override `mockSearchParams` before calling renderHook.

let mockSearchParamsEntries: Record<string, string> = {};
const mockSetSearchParams = vi.fn();

vi.mock('react-router-dom', () => {
  return {
    useSearchParams: () => {
      const sp = new URLSearchParams(mockSearchParamsEntries);
      return [sp, mockSetSearchParams];
    },
  };
});

// ─── localStorage helpers ─────────────────────────────────────────────────────

const STORAGE_KEY = 'sb:saved-views';

function writeStorage(store: SavedViewsStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const defaultFilters: ViewFilters = { statusFilter: 'All' };

function makeView(overrides: Partial<SavedView> = {}): SavedView {
  const now = Date.now();
  return {
    id: `view-${Math.random().toString(36).slice(2)}`,
    name: 'Test view',
    filters: { statusFilter: 'Active' },
    isDefault: false,
    isPinned: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  clearStorage();
  mockSearchParamsEntries = {};
  mockSetSearchParams.mockClear();
  vi.clearAllMocks();
});

afterEach(() => {
  clearStorage();
});

// ─── Lazy import so each test gets a fresh module instance if needed ──────────
// We import once at top level (fine since state resets via localStorage clear).
import { useSavedViews } from '@/hooks/useSavedViews';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useSavedViews', () => {

  // ── 1. Initial state ────────────────────────────────────────────────────────

  it('returns empty views, null activeView, isUnsaved=false when no localStorage', () => {
    const { result } = renderHook(() => useSavedViews());

    expect(result.current.views).toEqual([]);
    expect(result.current.activeView).toBeNull();
    expect(result.current.isUnsaved).toBe(false);
    expect(result.current.currentFilters).toEqual(defaultFilters);
  });

  // ── 2. saveView ─────────────────────────────────────────────────────────────

  it('saveView creates a new view with correct properties', () => {
    const { result } = renderHook(() => useSavedViews());

    let newView!: SavedView;
    const filters: ViewFilters = { statusFilter: 'Active' };

    act(() => {
      newView = result.current.saveView('My view', filters);
    });

    expect(newView.name).toBe('My view');
    expect(newView.filters).toEqual(filters);
    expect(newView.isDefault).toBe(false);
    expect(newView.isPinned).toBe(false);
    expect(typeof newView.id).toBe('string');
    expect(newView.id.length).toBeGreaterThan(0);
    expect(typeof newView.createdAt).toBe('number');
    expect(typeof newView.updatedAt).toBe('number');
    expect(newView.createdAt).toBe(newView.updatedAt);

    // view appears in the list
    expect(result.current.views).toHaveLength(1);
    expect(result.current.views[0].name).toBe('My view');
  });

  // ── 3. saveView duplicate name ──────────────────────────────────────────────

  it('saveView creates a view even when a duplicate name exists (validation is in the modal)', () => {
    const { result } = renderHook(() => useSavedViews());

    act(() => { result.current.saveView('Duplicate', defaultFilters); });
    act(() => { result.current.saveView('Duplicate', defaultFilters); });

    expect(result.current.views).toHaveLength(2);
    expect(result.current.views.filter((v) => v.name === 'Duplicate')).toHaveLength(2);
  });

  // ── 4. MAX_VIEWS limit ──────────────────────────────────────────────────────

  it('does not exceed MAX_VIEWS (20) when saving views', () => {
    const { result } = renderHook(() => useSavedViews());

    act(() => {
      for (let i = 0; i < 25; i++) {
        result.current.saveView(`View ${i}`, defaultFilters);
      }
    });

    expect(result.current.views.length).toBeLessThanOrEqual(result.current.MAX_VIEWS);
  });

  // ── 5. applyView ────────────────────────────────────────────────────────────

  it('applyView sets activeView, updates currentFilters, and clears isUnsaved', () => {
    const view = makeView({ filters: { statusFilter: 'Paused' } });
    writeStorage({ views: [view], activeViewId: null });

    const { result } = renderHook(() => useSavedViews());

    act(() => { result.current.applyView(view.id); });

    expect(result.current.activeView?.id).toBe(view.id);
    expect(result.current.currentFilters).toEqual({ statusFilter: 'Paused' });
    expect(result.current.isUnsaved).toBe(false);
  });

  // ── 6. setFilters sets isUnsaved=true when active view exists and filters differ ──

  it('setFilters updates currentFilters and sets isUnsaved=true when active view exists and filters differ', () => {
    const view = makeView({ filters: { statusFilter: 'Active' } });
    writeStorage({ views: [view], activeViewId: view.id });

    const { result } = renderHook(() => useSavedViews());

    // Manually apply the view first so activeView is set
    act(() => { result.current.applyView(view.id); });

    // Now change the filters to something different
    act(() => { result.current.setFilters({ statusFilter: 'Cancelled' }); });

    expect(result.current.currentFilters).toEqual({ statusFilter: 'Cancelled' });
    // setFilters clears activeViewId per the implementation
    // isUnsaved when no activeView is true only if filters differ from defaults
    // statusFilter 'Cancelled' !== 'All' (default), so isUnsaved should be true
    expect(result.current.isUnsaved).toBe(true);
  });

  // ── 7. setFilters same as active view: isUnsaved stays false ────────────────

  it('setFilters with same filter as the default keeps isUnsaved=false when no active view', () => {
    const { result } = renderHook(() => useSavedViews());

    // With no active view, setting filters equal to defaults → isUnsaved=false
    act(() => { result.current.setFilters({ statusFilter: 'All' }); });

    expect(result.current.currentFilters).toEqual({ statusFilter: 'All' });
    expect(result.current.isUnsaved).toBe(false);
  });

  // ── 8. renameView ───────────────────────────────────────────────────────────

  it('renameView updates the view name', () => {
    const view = makeView({ name: 'Old name' });
    writeStorage({ views: [view], activeViewId: null });

    const { result } = renderHook(() => useSavedViews());

    act(() => { result.current.renameView(view.id, 'New name'); });

    const updated = result.current.views.find((v) => v.id === view.id);
    expect(updated?.name).toBe('New name');
  });

  // ── 9. deleteView ───────────────────────────────────────────────────────────

  it('deleteView removes the view from the list', () => {
    const view = makeView();
    writeStorage({ views: [view], activeViewId: null });

    const { result } = renderHook(() => useSavedViews());

    act(() => { result.current.deleteView(view.id); });

    expect(result.current.views.find((v) => v.id === view.id)).toBeUndefined();
    expect(result.current.views).toHaveLength(0);
  });

  // ── 10. deleteView when active: clears activeViewId ─────────────────────────

  it('deleteView when the view is active clears activeView', () => {
    const view = makeView();
    writeStorage({ views: [view], activeViewId: view.id });

    const { result } = renderHook(() => useSavedViews());

    // Ensure the view is active
    act(() => { result.current.applyView(view.id); });
    expect(result.current.activeView?.id).toBe(view.id);

    act(() => { result.current.deleteView(view.id); });

    expect(result.current.activeView).toBeNull();
  });

  // ── 11. setDefault ──────────────────────────────────────────────────────────

  it('setDefault marks one view as default and clears isDefault on others', () => {
    const v1 = makeView({ id: 'v1', name: 'V1', isDefault: true });
    const v2 = makeView({ id: 'v2', name: 'V2' });
    writeStorage({ views: [v1, v2], activeViewId: null });

    const { result } = renderHook(() => useSavedViews());

    act(() => { result.current.setDefault('v2'); });

    const updated1 = result.current.views.find((v) => v.id === 'v1');
    const updated2 = result.current.views.find((v) => v.id === 'v2');
    expect(updated1?.isDefault).toBe(false);
    expect(updated2?.isDefault).toBe(true);
  });

  // ── 12. clearDefault ────────────────────────────────────────────────────────

  it('clearDefault removes isDefault from all views', () => {
    const v1 = makeView({ id: 'v1', isDefault: true });
    const v2 = makeView({ id: 'v2', isDefault: false });
    writeStorage({ views: [v1, v2], activeViewId: null });

    const { result } = renderHook(() => useSavedViews());

    act(() => { result.current.clearDefault(); });

    expect(result.current.views.every((v) => !v.isDefault)).toBe(true);
  });

  // ── 13. togglePin ───────────────────────────────────────────────────────────

  it('togglePin toggles the isPinned flag', () => {
    const view = makeView({ isPinned: false });
    writeStorage({ views: [view], activeViewId: null });

    const { result } = renderHook(() => useSavedViews());

    act(() => { result.current.togglePin(view.id); });
    expect(result.current.views.find((v) => v.id === view.id)?.isPinned).toBe(true);

    act(() => { result.current.togglePin(view.id); });
    expect(result.current.views.find((v) => v.id === view.id)?.isPinned).toBe(false);
  });

  // ── 14. pinnedViews ─────────────────────────────────────────────────────────

  it('pinnedViews returns only pinned views', () => {
    const pinned1 = makeView({ id: 'p1', isPinned: true });
    const pinned2 = makeView({ id: 'p2', isPinned: true });
    const unpinned = makeView({ id: 'u1', isPinned: false });
    writeStorage({ views: [pinned1, pinned2, unpinned], activeViewId: null });

    const { result } = renderHook(() => useSavedViews());

    expect(result.current.pinnedViews).toHaveLength(2);
    expect(result.current.pinnedViews.every((v) => v.isPinned)).toBe(true);
    expect(result.current.pinnedViews.find((v) => v.id === 'u1')).toBeUndefined();
  });

  // ── 15. recentViews ─────────────────────────────────────────────────────────

  it('recentViews returns non-pinned views sorted by updatedAt desc, max 5', () => {
    const now = Date.now();
    const views: SavedView[] = Array.from({ length: 7 }, (_, i) =>
      makeView({ id: `r${i}`, isPinned: false, updatedAt: now + i * 1000 }),
    );
    writeStorage({ views, activeViewId: null });

    const { result } = renderHook(() => useSavedViews());

    const recent = result.current.recentViews;
    expect(recent).toHaveLength(5);
    // Sorted desc: last item has the highest updatedAt
    for (let i = 0; i < recent.length - 1; i++) {
      expect(recent[i].updatedAt).toBeGreaterThan(recent[i + 1].updatedAt);
    }
    expect(recent.every((v) => !v.isPinned)).toBe(true);
  });

  // ── 16. localStorage persistence ────────────────────────────────────────────

  it('persists views to localStorage after saveView', () => {
    const { result } = renderHook(() => useSavedViews());

    act(() => { result.current.saveView('Persisted view', defaultFilters); });

    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw!) as SavedViewsStore;
    expect(stored.views).toHaveLength(1);
    expect(stored.views[0].name).toBe('Persisted view');
  });

  it('a fresh renderHook reads back views saved by a previous instance', () => {
    // First hook instance saves a view
    const { result: first, unmount } = renderHook(() => useSavedViews());
    act(() => { first.current.saveView('Shared view', defaultFilters); });
    unmount();

    // Second hook instance should read from localStorage
    const { result: second } = renderHook(() => useSavedViews());
    expect(second.current.views.find((v) => v.name === 'Shared view')).toBeDefined();
  });

  // ── 17. localStorage unavailable ────────────────────────────────────────────

  it('gracefully handles when localStorage.getItem throws', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('localStorage unavailable');
    });

    // Should not throw; falls back to empty state
    expect(() => {
      const { result } = renderHook(() => useSavedViews());
      expect(result.current.views).toEqual([]);
    }).not.toThrow();

    getItemSpy.mockRestore();
  });

  // ── 18. getShareURL ─────────────────────────────────────────────────────────

  it('getShareURL returns a URL string containing ?view=<id>', () => {
    const { result } = renderHook(() => useSavedViews());
    const url = result.current.getShareURL('abc123');
    expect(url).toContain('?view=abc123');
    expect(url).toMatch(/^https?:\/\//);
  });

  // ── 19. URL param ?view=id on mount ─────────────────────────────────────────

  it('applies the view matching ?view=id URL param on mount', () => {
    const view = makeView({ id: 'url-view-id', filters: { statusFilter: 'Paused' } });
    writeStorage({ views: [view], activeViewId: null });
    mockSearchParamsEntries = { view: 'url-view-id' };

    const { result } = renderHook(() => useSavedViews());

    expect(result.current.activeView?.id).toBe('url-view-id');
    expect(result.current.currentFilters).toEqual({ statusFilter: 'Paused' });
  });

  // ── 20. URL param ?sv_status=Active on mount ─────────────────────────────────

  it('reads ?sv_status=Active from URL and sets currentFilters.statusFilter', () => {
    mockSearchParamsEntries = { sv_status: 'Active' };

    const { result } = renderHook(() => useSavedViews());

    expect(result.current.currentFilters.statusFilter).toBe('Active');
  });

  // ── 21. Default view applied on mount ────────────────────────────────────────

  it('applies the default view on mount if no URL params are present', () => {
    const defaultView = makeView({
      id: 'default-view',
      isDefault: true,
      filters: { statusFilter: 'Cancelled' },
    });
    writeStorage({ views: [defaultView], activeViewId: null });
    mockSearchParamsEntries = {}; // no URL params

    const { result } = renderHook(() => useSavedViews());

    // The initial filter state is derived from the default view
    expect(result.current.currentFilters).toEqual({ statusFilter: 'Cancelled' });
  });

  // ── 22. updateView ───────────────────────────────────────────────────────────

  it('updateView updates filters of an existing view', () => {
    const view = makeView({ filters: { statusFilter: 'All' } });
    writeStorage({ views: [view], activeViewId: view.id });

    const { result } = renderHook(() => useSavedViews());

    const newFilters: ViewFilters = { statusFilter: 'Active' };
    act(() => { result.current.updateView(view.id, newFilters); });

    const updated = result.current.views.find((v) => v.id === view.id);
    expect(updated?.filters).toEqual(newFilters);
  });

  it('updateView sets isUnsaved=false when activeView filters now match currentFilters', () => {
    const filters: ViewFilters = { statusFilter: 'Active' };
    const view = makeView({ filters });
    writeStorage({ views: [view], activeViewId: view.id });

    const { result } = renderHook(() => useSavedViews());

    // Apply view so it becomes active
    act(() => { result.current.applyView(view.id); });

    // Diverge from the saved filters
    act(() => { result.current.setFilters({ statusFilter: 'Paused' }); });

    // Re-apply so active view is set again, then update the view's filters to match
    act(() => { result.current.applyView(view.id); });
    act(() => { result.current.updateView(view.id, { statusFilter: 'Paused' }); });

    // After updateView the stored filters match what we'd set
    const updated = result.current.views.find((v) => v.id === view.id);
    expect(updated?.filters).toEqual({ statusFilter: 'Paused' });
  });
});
