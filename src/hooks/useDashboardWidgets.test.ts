import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ApiError, DashboardMetricsResponse } from '../api/client';
import {
  useDashboardWidgets,
  type DashboardFilters,
  type WidgetId,
} from './useDashboardWidgets';

const dashboardMock = vi.hoisted(() => ({
  metrics: vi.fn(),
  activity: vi.fn(),
  revenueByPlan: vi.fn(),
}));

vi.mock('../api/client', () => ({
  dashboard: dashboardMock,
}));

const ALL_WIDGET_IDS: WidgetId[] = [
  'kpi_active_subscriptions',
  'kpi_mrr',
  'kpi_failed_charges',
  'kpi_upcoming_renewals',
  'chart_revenue',
  'activity_feed',
  'revenue_split',
];

const DEFAULT_FILTERS: DashboardFilters = {
  status: 'active',
  range: 'last30Days',
};

function metricsPayload(value = '1,284', mrr = '$42,500'): DashboardMetricsResponse {
  return {
    activeSubscriptions: { value },
    mrr: { value: mrr },
    failedCharges: { value: '12' },
    upcomingRenewals: { value: '48' },
    revenue: [{ date: 'Day 1', revenue: 100 }],
  };
}

function apiError(message: string, status = 503): ApiError {
  const error = new Error(message) as ApiError;
  error.kind = 'http';
  error.status = status;
  return error;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useDashboardWidgets', () => {
  beforeEach(() => {
    dashboardMock.metrics.mockReset().mockImplementation(() =>
      Promise.resolve(metricsPayload()),
    );
    dashboardMock.activity.mockReset().mockImplementation(() =>
      Promise.resolve({ activities: [] }),
    );
    dashboardMock.revenueByPlan.mockReset().mockImplementation(() =>
      Promise.resolve({ plans: [] }),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initialises every WidgetId as idle with null error, empty failedWidgetIds, and isInitialLoading true', () => {
    const { result } = renderHook(() => useDashboardWidgets(DEFAULT_FILTERS));

    for (const id of ALL_WIDGET_IDS) {
      expect(result.current.widgets[id]).toEqual({ status: 'idle', error: null });
    }
    expect(result.current.isInitialLoading).toBe(true);
    expect(result.current.failedWidgetIds).toEqual([]);
  });

  it('fetches every widget from the API with the active filters and an AbortSignal', async () => {
    const { result } = renderHook(() => useDashboardWidgets(DEFAULT_FILTERS));

    act(() => {
      result.current.loadAll();
    });

    for (const id of ALL_WIDGET_IDS) {
      expect(result.current.widgets[id]).toEqual({ status: 'loading', error: null });
    }
    expect(dashboardMock.metrics).toHaveBeenCalledTimes(5);
    expect(dashboardMock.activity).toHaveBeenCalledTimes(1);
    expect(dashboardMock.revenueByPlan).toHaveBeenCalledTimes(1);

    for (const [filters, options] of dashboardMock.metrics.mock.calls) {
      expect(filters).toEqual(DEFAULT_FILTERS);
      expect(options.signal).toBeInstanceOf(AbortSignal);
    }
    expect(dashboardMock.activity.mock.calls[0][0]).toEqual(DEFAULT_FILTERS);
    expect(dashboardMock.activity.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    expect(dashboardMock.revenueByPlan.mock.calls[0][0]).toEqual(DEFAULT_FILTERS);
    expect(dashboardMock.revenueByPlan.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);

    await flush();

    for (const id of ALL_WIDGET_IDS) {
      expect(result.current.widgets[id]).toEqual({ status: 'success', error: null });
    }
    expect(result.current.isInitialLoading).toBe(false);
    expect(result.current.failedWidgetIds).toEqual([]);
    expect(result.current.data.activeSubscriptions?.value).toBe('1,284');
    expect(result.current.data.revenueSeries).toEqual([{ date: 'Day 1', revenue: 100 }]);
  });

  it('keeps widget failures isolated and retries only the failed widget', async () => {
    let metricsCalls = 0;
    dashboardMock.metrics.mockImplementation(() => {
      metricsCalls += 1;
      return metricsCalls === 2
        ? Promise.reject(apiError('MRR service unavailable'))
        : Promise.resolve(metricsPayload());
    });

    const { result } = renderHook(() => useDashboardWidgets(DEFAULT_FILTERS));

    act(() => {
      result.current.loadAll();
    });
    await flush();

    expect(result.current.failedWidgetIds).toEqual(['kpi_mrr']);
    expect(result.current.widgets.kpi_mrr).toEqual({
      status: 'error',
      error: expect.objectContaining({ message: 'MRR service unavailable', status: 503 }),
    });
    expect(result.current.widgets.kpi_active_subscriptions.status).toBe('success');
    expect(result.current.widgets.activity_feed.status).toBe('success');
    expect(result.current.widgets.revenue_split.status).toBe('success');

    dashboardMock.metrics.mockImplementation(() =>
      Promise.resolve(metricsPayload(undefined, 'FIXED')),
    );

    act(() => {
      result.current.retryWidget('kpi_mrr');
    });

    expect(result.current.widgets.kpi_mrr).toEqual({ status: 'loading', error: null });
    expect(result.current.widgets.kpi_active_subscriptions).toEqual({
      status: 'success',
      error: null,
    });
    expect(dashboardMock.metrics).toHaveBeenCalledTimes(6);

    await flush();

    expect(result.current.widgets.kpi_mrr).toEqual({ status: 'success', error: null });
    expect(result.current.data.mrr?.value).toBe('FIXED');
    expect(result.current.failedWidgetIds).toEqual([]);
  });

  it('aborts in-flight requests on unmount and ignores their late responses', async () => {
    const pending = deferred<DashboardMetricsResponse>();
    dashboardMock.metrics.mockImplementation(() => pending.promise);

    const { result, unmount } = renderHook(() => useDashboardWidgets(DEFAULT_FILTERS));

    act(() => {
      result.current.loadAll();
    });

    const signal = dashboardMock.metrics.mock.calls[0][1].signal as AbortSignal;
    expect(signal.aborted).toBe(false);

    unmount();

    expect(signal.aborted).toBe(true);

    await act(async () => {
      pending.resolve(metricsPayload('LATE'));
      await Promise.resolve();
    });

    expect(result.current.widgets.kpi_active_subscriptions.status).toBe('loading');
  });

  it('aborts stale filter requests and ignores responses from the previous filters', async () => {
    const stale = deferred<DashboardMetricsResponse>();
    dashboardMock.metrics.mockImplementationOnce(() => stale.promise);

    const { result, rerender } = renderHook(
      ({ filters }: { filters: DashboardFilters }) => useDashboardWidgets(filters),
      { initialProps: { filters: DEFAULT_FILTERS } },
    );

    act(() => {
      result.current.loadAll();
    });

    const staleSignal = dashboardMock.metrics.mock.calls[0][1].signal as AbortSignal;

    rerender({ filters: { planId: 'pro', status: 'active', range: 'last30Days' } });

    expect(staleSignal.aborted).toBe(true);

    dashboardMock.metrics.mockImplementation(() => Promise.resolve(metricsPayload('FRESH')));

    act(() => {
      result.current.loadAll();
    });
    await flush();

    const metricsCalls = dashboardMock.metrics.mock.calls;
    expect(metricsCalls[metricsCalls.length - 1][0]).toEqual({
      planId: 'pro',
      status: 'active',
      range: 'last30Days',
    });
    expect(result.current.data.activeSubscriptions?.value).toBe('FRESH');

    await act(async () => {
      stale.resolve(metricsPayload('STALE'));
      await Promise.resolve();
    });

    expect(result.current.data.activeSubscriptions?.value).toBe('FRESH');
    expect(result.current.widgets.kpi_active_subscriptions).toEqual({
      status: 'success',
      error: null,
    });
  });
});
