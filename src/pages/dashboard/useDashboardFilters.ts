import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { DashboardFilters } from '../../hooks/useDashboardWidgets';
import {
  activeFiltersFor,
  initialFilterState,
  SAVED_FILTERS_STORAGE_KEY,
  writeFiltersToSearchParams,
  type ActiveFilter,
} from './dashboardFilters';

export interface UseDashboardFiltersReturn {
  filters: DashboardFilters;
  announcement: string;
  activeFilters: ActiveFilter[];
  removeFilter: (id: keyof DashboardFilters) => void;
  resetFilters: () => void;
  saveView: () => void;
}

/**
 * Owns the dashboard filter state, its live-region announcement, the filter
 * chips and the two-way sync with the URL search params.
 */
export function useDashboardFilters(
  plans: ReadonlyArray<{ planId: string; planName: string }>,
): UseDashboardFiltersReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterState, setFilterState] = useState(() =>
    initialFilterState(searchParams),
  );
  const { filters, announcement } = filterState;

  const activeFilters = activeFiltersFor(filters, plans);

  useEffect(() => {
    const nextParams = writeFiltersToSearchParams(searchParams, filters);
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [filters, searchParams, setSearchParams]);

  const removeFilter = (id: keyof DashboardFilters) => {
    const filter = activeFilters.find((item) => item.id === id);
    if (!filter) return;

    const nextFilters = { ...filters };
    delete nextFilters[id];
    setFilterState({
      filters: nextFilters,
      announcement: `Filter ${filter.label} removed.`,
    });
  };

  const resetFilters = () => {
    setFilterState({ filters: {}, announcement: 'All filters reset.' });
  };

  const saveView = () => {
    try {
      window.localStorage.setItem(
        SAVED_FILTERS_STORAGE_KEY,
        JSON.stringify(filters),
      );
      setFilterState({
        filters,
        announcement: 'Filter view saved successfully.',
      });
    } catch {
      setFilterState({
        filters,
        announcement: 'Unable to save the filter view. Check browser storage and try again.',
      });
    }
  };

  return {
    filters,
    announcement,
    activeFilters,
    removeFilter,
    resetFilters,
    saveView,
  };
}
