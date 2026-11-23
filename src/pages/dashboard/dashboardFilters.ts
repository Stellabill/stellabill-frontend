import type { DashboardFilters } from '../../hooks/useDashboardWidgets';

export const DEFAULT_FILTERS: DashboardFilters = {
  status: 'active',
  planId: 'pro',
  range: 'last30Days',
};

export const SAVED_FILTERS_STORAGE_KEY = 'stellabill.dashboard.savedFilters';

export const FILTER_QUERY_KEYS = ['status', 'planId', 'range', 'filters'] as const;

export interface DashboardFilterState {
  filters: DashboardFilters;
  announcement: string;
}

export interface ActiveFilter {
  id: keyof DashboardFilters;
  label: string;
}

export function filtersFromSearchParams(
  searchParams: URLSearchParams,
): DashboardFilters | null {
  if (!FILTER_QUERY_KEYS.some((key) => searchParams.has(key))) return null;
  if (searchParams.get('filters') === 'none') return {};

  return {
    ...(searchParams.get('status') === 'active' ? { status: 'active' as const } : {}),
    ...(searchParams.get('planId') ? { planId: searchParams.get('planId')! } : {}),
    ...(searchParams.get('range') === 'last30Days'
      ? { range: 'last30Days' as const }
      : {}),
  };
}

export function parseSavedFilters(value: unknown): DashboardFilters {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Saved dashboard filters are invalid.');
  }

  const saved = value as Record<string, unknown>;
  if (
    (saved.status !== undefined && saved.status !== 'active') ||
    (saved.planId !== undefined && typeof saved.planId !== 'string') ||
    (saved.range !== undefined && saved.range !== 'last30Days')
  ) {
    throw new Error('Saved dashboard filters are invalid.');
  }

  return {
    ...(saved.status === 'active' ? { status: 'active' as const } : {}),
    ...(typeof saved.planId === 'string' ? { planId: saved.planId } : {}),
    ...(saved.range === 'last30Days' ? { range: 'last30Days' as const } : {}),
  };
}

export function initialFilterState(searchParams: URLSearchParams): DashboardFilterState {
  const urlFilters = filtersFromSearchParams(searchParams);
  if (urlFilters) return { filters: urlFilters, announcement: '' };
  if (typeof window === 'undefined') {
    return { filters: DEFAULT_FILTERS, announcement: '' };
  }

  try {
    const saved = window.localStorage.getItem(SAVED_FILTERS_STORAGE_KEY);
    return {
      filters: saved ? parseSavedFilters(JSON.parse(saved)) : DEFAULT_FILTERS,
      announcement: '',
    };
  } catch {
    return {
      filters: DEFAULT_FILTERS,
      announcement: 'Unable to restore the saved filter view.',
    };
  }
}

export function writeFiltersToSearchParams(
  searchParams: URLSearchParams,
  filters: DashboardFilters,
): URLSearchParams {
  const nextParams = new URLSearchParams(searchParams);
  FILTER_QUERY_KEYS.forEach((key) => nextParams.delete(key));
  if (filters.status) nextParams.set('status', filters.status);
  if (filters.planId) nextParams.set('planId', filters.planId);
  if (filters.range) nextParams.set('range', filters.range);
  if (!filters.status && !filters.planId && !filters.range) {
    nextParams.set('filters', 'none');
  }
  return nextParams;
}

/** Readable filter chips shown in the filter bar. */
export function activeFiltersFor(
  filters: DashboardFilters,
  plans: ReadonlyArray<{ planId: string; planName: string }>,
): ActiveFilter[] {
  return [
    ...(filters.status
      ? [{ id: 'status' as const, label: 'Status: Active' }]
      : []),
    ...(filters.planId
      ? [{
          id: 'planId' as const,
          label: `Plan: ${plans.find((plan) => plan.planId === filters.planId)?.planName ?? filters.planId}`,
        }]
      : []),
    ...(filters.range
      ? [{ id: 'range' as const, label: 'Date: Last 30 Days' }]
      : []),
  ];
}
