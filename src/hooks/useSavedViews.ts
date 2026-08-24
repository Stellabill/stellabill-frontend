import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { SavedView, SavedViewsStore, ViewFilters } from '@/types/savedViews';

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'sb:saved-views';
const MAX_VIEWS = 20;
const MAX_RECENT = 5;

const DEFAULT_FILTERS: ViewFilters = { statusFilter: 'All' };

// ─── ID generation ────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── localStorage helpers (safe — handles quota / unavailable) ────────────────

function readStore(): SavedViewsStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { views: [], activeViewId: null };
    const parsed = JSON.parse(raw) as Partial<SavedViewsStore>;
    return {
      views: Array.isArray(parsed.views) ? parsed.views : [],
      activeViewId: parsed.activeViewId ?? null,
    };
  } catch {
    return { views: [], activeViewId: null };
  }
}

function writeStore(store: SavedViewsStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Quota exceeded or storage unavailable — silently ignore
  }
}

// ─── Filter equality ──────────────────────────────────────────────────────────

function filtersEqual(a: ViewFilters, b: ViewFilters): boolean {
  return a.statusFilter === b.statusFilter;
}

// ─── Public interface ─────────────────────────────────────────────────────────

export interface UseSavedViewsReturn {
  views: SavedView[];
  pinnedViews: SavedView[];
  recentViews: SavedView[]; // non-pinned, sorted by updatedAt desc, max 5
  activeView: SavedView | null;
  currentFilters: ViewFilters;
  isUnsaved: boolean;
  saveView: (name: string, filters: ViewFilters) => SavedView;
  updateView: (id: string, filters: ViewFilters) => void;
  renameView: (id: string, name: string) => void;
  deleteView: (id: string) => void;
  setDefault: (id: string) => void;
  clearDefault: () => void;
  togglePin: (id: string) => void;
  applyView: (id: string) => void;
  setFilters: (filters: ViewFilters) => void;
  getShareURL: (id: string) => string;
  MAX_VIEWS: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSavedViews(): UseSavedViewsReturn {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Initialise state from localStorage, then URL ──────────────────────────
  const [views, setViews] = useState<SavedView[]>(() => readStore().views);
  const [activeViewId, setActiveViewId] = useState<string | null>(() => {
    const store = readStore();
    return store.activeViewId;
  });
  const [currentFilters, setCurrentFiltersState] = useState<ViewFilters>(() => {
    // Determine initial filters from URL first, then default view, then defaults
    const viewParam = searchParams.get('view');
    const statusParam = searchParams.get('sv_status');

    const store = readStore();

    if (viewParam) {
      const found = store.views.find((v) => v.id === viewParam);
      if (found) return found.filters;
    }

    if (statusParam) {
      return { statusFilter: statusParam };
    }

    // Apply default view if one exists
    const defaultView = store.views.find((v) => v.isDefault);
    if (defaultView) return defaultView.filters;

    return DEFAULT_FILTERS;
  });

  // ── Sync to localStorage whenever views or activeViewId changes ───────────
  useEffect(() => {
    writeStore({ views, activeViewId });
  }, [views, activeViewId]);

  // ── On mount: sync active view from URL params ────────────────────────────
  useEffect(() => {
    const viewParam = searchParams.get('view');
    const statusParam = searchParams.get('sv_status');

    if (viewParam) {
      const found = views.find((v) => v.id === viewParam);
      if (found) {
        setActiveViewId(found.id);
        setCurrentFiltersState(found.filters);
        return;
      }
    }

    if (statusParam) {
      setActiveViewId(null);
      setCurrentFiltersState({ statusFilter: statusParam });
      return;
    }

    // No URL params — apply default view if not already active
    const defaultView = views.find((v) => v.isDefault);
    if (defaultView && !viewParam && !statusParam) {
      setActiveViewId(defaultView.id);
      setCurrentFiltersState(defaultView.filters);
      const params = new URLSearchParams(searchParams);
      params.set('view', defaultView.id);
      setSearchParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // ── Derived ───────────────────────────────────────────────────────────────

  const activeView = useMemo(
    () => (activeViewId ? (views.find((v) => v.id === activeViewId) ?? null) : null),
    [views, activeViewId],
  );

  const isUnsaved = useMemo(() => {
    if (!activeView) {
      // No active view — unsaved if filters differ from defaults
      return !filtersEqual(currentFilters, DEFAULT_FILTERS);
    }
    return !filtersEqual(currentFilters, activeView.filters);
  }, [activeView, currentFilters]);

  // Sorted list: pinned first (by updatedAt desc), then unpinned (by updatedAt desc)
  const sortedViews = useMemo(() => {
    const pinned = views.filter((v) => v.isPinned).sort((a, b) => b.updatedAt - a.updatedAt);
    const unpinned = views.filter((v) => !v.isPinned).sort((a, b) => b.updatedAt - a.updatedAt);
    return [...pinned, ...unpinned];
  }, [views]);

  const pinnedViews = useMemo(() => sortedViews.filter((v) => v.isPinned), [sortedViews]);

  const recentViews = useMemo(
    () =>
      sortedViews
        .filter((v) => !v.isPinned)
        .slice(0, MAX_RECENT),
    [sortedViews],
  );

  // ── Helpers ───────────────────────────────────────────────────────────────

  const pushViewURL = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams);
      params.set('view', id);
      params.delete('sv_status');
      setSearchParams(params, { replace: false });
    },
    [searchParams, setSearchParams],
  );

  const pushFiltersURL = useCallback(
    (filters: ViewFilters) => {
      const params = new URLSearchParams(searchParams);
      params.delete('view');
      if (filters.statusFilter && filters.statusFilter !== 'All') {
        params.set('sv_status', filters.statusFilter);
      } else {
        params.delete('sv_status');
      }
      setSearchParams(params, { replace: false });
    },
    [searchParams, setSearchParams],
  );

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const saveView = useCallback(
    (name: string, filters: ViewFilters): SavedView => {
      const now = Date.now();
      const newView: SavedView = {
        id: generateId(),
        name: name.trim(),
        filters,
        isDefault: false,
        isPinned: false,
        createdAt: now,
        updatedAt: now,
      };

      setViews((prev) => {
        // Enforce max 20 views
        const trimmed = prev.length >= MAX_VIEWS ? prev.slice(1) : prev;
        return [...trimmed, newView];
      });
      setActiveViewId(newView.id);
      pushViewURL(newView.id);

      return newView;
    },
    [pushViewURL],
  );

  const updateView = useCallback(
    (id: string, filters: ViewFilters): void => {
      setViews((prev) =>
        prev.map((v) =>
          v.id === id ? { ...v, filters, updatedAt: Date.now() } : v,
        ),
      );
    },
    [],
  );

  const renameView = useCallback((id: string, name: string): void => {
    setViews((prev) =>
      prev.map((v) =>
        v.id === id ? { ...v, name: name.trim(), updatedAt: Date.now() } : v,
      ),
    );
  }, []);

  const deleteView = useCallback(
    (id: string): void => {
      setViews((prev) => {
        const updated = prev.filter((v) => v.id !== id);
        // If deleted view was default, no need to adjust — it's gone
        return updated;
      });

      if (activeViewId === id) {
        setActiveViewId(null);
        setCurrentFiltersState(DEFAULT_FILTERS);
        const params = new URLSearchParams(searchParams);
        params.delete('view');
        params.delete('sv_status');
        setSearchParams(params, { replace: false });
      }
    },
    [activeViewId, searchParams, setSearchParams],
  );

  const setDefault = useCallback((id: string): void => {
    setViews((prev) =>
      prev.map((v) => ({ ...v, isDefault: v.id === id })),
    );
  }, []);

  const clearDefault = useCallback((): void => {
    setViews((prev) => prev.map((v) => ({ ...v, isDefault: false })));
  }, []);

  const togglePin = useCallback((id: string): void => {
    setViews((prev) =>
      prev.map((v) =>
        v.id === id ? { ...v, isPinned: !v.isPinned, updatedAt: Date.now() } : v,
      ),
    );
  }, []);

  const applyView = useCallback(
    (id: string): void => {
      const view = views.find((v) => v.id === id);
      if (!view) return;
      setActiveViewId(id);
      setCurrentFiltersState(view.filters);
      pushViewURL(id);
    },
    [views, pushViewURL],
  );

  const setFilters = useCallback(
    (filters: ViewFilters): void => {
      setCurrentFiltersState(filters);
      setActiveViewId(null);
      pushFiltersURL(filters);
    },
    [pushFiltersURL],
  );

  const getShareURL = useCallback(
    (id: string): string => {
      const base = `${window.location.origin}${window.location.pathname}`;
      return `${base}?view=${encodeURIComponent(id)}`;
    },
    [],
  );

  return {
    views: sortedViews,
    pinnedViews,
    recentViews,
    activeView,
    currentFilters,
    isUnsaved,
    saveView,
    updateView,
    renameView,
    deleteView,
    setDefault,
    clearDefault,
    togglePin,
    applyView,
    setFilters,
    getShareURL,
    MAX_VIEWS,
  };
}
