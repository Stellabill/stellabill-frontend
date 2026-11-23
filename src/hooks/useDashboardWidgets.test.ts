import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useDashboardWidgets,
  type WidgetId,
  type DashboardFilters,
} from './useDashboardWidgets';

const ALL_WIDGET_IDS: WidgetId[] = [
  'kpi_active_subscriptions',
  'kpi_mrr',
  'kpi_failed_charges',
  'kpi_upcoming_renewals',
  'chart_revenue',
  'activity_feed',
];

const DEFAULT_FILTERS: DashboardFilters = {
  status: 'active',
  range: 'last30Days',
};

function setSearch(search: string) {
  window.history.replaceState({}, '', search ? '/' + search : '/');
}

describe('useDashboardWidgets', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setSearch('');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    setSearch('');
  });

  it('initialises every WidgetId as idle with null error, empty failedWidgetIds, and isInitialLoading true', () => {
    const { result } = renderHook(() => useDashboardWidgets(DEFAULT_FILTERS));

    for (const id of ALL_WIDGET_IDS) {
      expect(result.current.widgets[id]).toEqual({ status: 'idle', error: null });
    }
    expect(result.current.isInitialLoading).toBe(true);
    expect(result.current.failedWidgetIds).toEqual([]);
  });

  it('loadAll moves all widgets to loading then resolves them independently with fake timers', async () => {
    // Give the first widget 0 jitter (200ms) and the rest max jitter (500ms)
    const randomSpy = vi
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValue(1);

    const { result } = renderHook(() => useDashboardWidgets(DEFAULT_FILTERS));

    act(() => {
      result.current.loadAll();
    });

    // Immediately after loadAll, every widget is loading and isInitialLoading stays true
    for (const id of ALL_WIDGET_IDS) {
      expect(result.current.widgets[id]).toEqual({ status: 'loading', error: null });
    }
    expect(result.current.isInitialLoading).toBe(true);

    // Advance past the fastest widget (200ms) but before the slower ones (500ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(result.current.widgets.kpi_active_subscriptions.status).toBe('success');
    for (const id of ALL_WIDGET_IDS.slice(1)) {
      expect(result.current.widgets[id].status).toBe('loading');
    }
    // Once any widget leaves idle/loading, isInitialLoading becomes false
    expect(result.current.isInitialLoading).toBe(false);

    // Advance to settle the remaining widgets
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    for (const id of ALL_WIDGET_IDS) {
      expect(result.current.widgets[id]).toEqual({ status: 'success', error: null });
    }
    expect(result.current.failedWidgetIds).toEqual([]);
    expect(randomSpy).toHaveBeenCalled();
  });

  it('loadAll handles mixed success and per-widget 503 errors independently', async () => {
    setSearch('?fail_kpi_mrr=1&fail_chart_revenue=1');
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const { result } = renderHook(() => useDashboardWidgets(DEFAULT_FILTERS));

    act(() => {
      result.current.loadAll();
    });

    // Succeeding widgets resolve at 200ms; failing widgets reject at 400ms
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(result.current.widgets.kpi_active_subscriptions.status).toBe('success');
    expect(result.current.widgets.kpi_failed_charges.status).toBe('success');
    expect(result.current.widgets.kpi_upcoming_renewals.status).toBe('success');
    expect(result.current.widgets.activity_feed.status).toBe('success');
    expect(result.current.widgets.kpi_mrr.status).toBe('loading');
    expect(result.current.widgets.chart_revenue.status).toBe('loading');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    expect(result.current.failedWidgetIds).toEqual(['kpi_mrr', 'chart_revenue']);
    expect(result.current.widgets.kpi_mrr.status).toBe('error');
    expect(result.current.widgets.kpi_mrr.error?.status).toBe(503);
    expect(result.current.widgets.kpi_mrr.error?.message).toContain('kpi mrr');

    expect(result.current.widgets.chart_revenue.status).toBe('error');
    expect(result.current.widgets.chart_revenue.error?.status).toBe(503);
    expect(result.current.widgets.chart_revenue.error?.message).toContain('chart revenue');
  });

  it('marks all widgets as errored with status 500 when simulate_error is set', async () => {
    setSearch('?simulate_error=1');

    const { result } = renderHook(() => useDashboardWidgets(DEFAULT_FILTERS));

    act(() => {
      result.current.loadAll();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(result.current.failedWidgetIds).toEqual(ALL_WIDGET_IDS);
    expect(result.current.isInitialLoading).toBe(false);
    for (const id of ALL_WIDGET_IDS) {
      expect(result.current.widgets[id].status).toBe('error');
      expect(result.current.widgets[id].error?.status).toBe(500);
    }
  });

  it('marks all widgets as errored with isOffline true when simulate_offline is set', async () => {
    setSearch('?simulate_offline=1');

    const { result } = renderHook(() => useDashboardWidgets(DEFAULT_FILTERS));

    act(() => {
      result.current.loadAll();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(result.current.failedWidgetIds).toEqual(ALL_WIDGET_IDS);
    for (const id of ALL_WIDGET_IDS) {
      expect(result.current.widgets[id].status).toBe('error');
      expect(result.current.widgets[id].error?.isOffline).toBe(true);
    }
  });

  it('retryWidget re-fetches only the specified widget without affecting others', async () => {
    setSearch('?fail_kpi_mrr=1&fail_chart_revenue=1');
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const { result } = renderHook(() => useDashboardWidgets(DEFAULT_FILTERS));

    act(() => {
      result.current.loadAll();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(result.current.failedWidgetIds).toEqual(['kpi_mrr', 'chart_revenue']);

    // Clear failure for kpi_mrr only, keeping chart_revenue failing
    setSearch('?fail_chart_revenue=1');

    act(() => {
      result.current.retryWidget('kpi_mrr');
    });

    // Only kpi_mrr moves back to loading; chart_revenue stays errored and others stay success
    expect(result.current.widgets.kpi_mrr).toEqual({ status: 'loading', error: null });
    expect(result.current.widgets.chart_revenue.status).toBe('error');
    expect(result.current.widgets.kpi_active_subscriptions.status).toBe('success');
    expect(result.current.widgets.kpi_failed_charges.status).toBe('success');
    expect(result.current.widgets.kpi_upcoming_renewals.status).toBe('success');
    expect(result.current.widgets.activity_feed.status).toBe('success');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(result.current.widgets.kpi_mrr).toEqual({ status: 'success', error: null });
    expect(result.current.failedWidgetIds).toEqual(['chart_revenue']);
  });
});
