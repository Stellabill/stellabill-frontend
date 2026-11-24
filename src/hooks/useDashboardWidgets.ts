import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  dashboard,
  type ApiError,
  type DashboardActivity,
  type DashboardFilters as DashboardApiFilters,
  type DashboardMetric,
  type DashboardRevenueByPlanResponse,
  type DashboardRevenuePoint,
} from '../api/client';

// ─── Widget identifiers ────────────────────────────────────────────────────

export type WidgetId =
  | 'kpi_active_subscriptions'
  | 'kpi_mrr'
  | 'kpi_failed_charges'
  | 'kpi_upcoming_renewals'
  | 'chart_revenue'
  | 'activity_feed'
  | 'revenue_split';

export type DashboardFilters = DashboardApiFilters;

// ─── Per-widget state ──────────────────────────────────────────────────────

export type WidgetStatus = 'idle' | 'loading' | 'success' | 'error';

export interface WidgetState {
  status: WidgetStatus;
  error: ApiError | null;
}

type WidgetsState = Record<WidgetId, WidgetState>;

/** Payloads fetched by the widget fetchers, keyed by the widget that owns them. */
export interface DashboardWidgetData {
  activeSubscriptions?: DashboardMetric;
  mrr?: DashboardMetric;
  failedCharges?: DashboardMetric;
  upcomingRenewals?: DashboardMetric;
  revenueSeries?: DashboardRevenuePoint[];
  activities?: DashboardActivity[];
  revenueByPlan?: DashboardRevenueByPlanResponse;
}

const DEFAULT_WIDGET_STATE: WidgetState = { status: 'idle', error: null };

export const ALL_WIDGET_IDS: WidgetId[] = [
  'kpi_active_subscriptions',
  'kpi_mrr',
  'kpi_failed_charges',
  'kpi_upcoming_renewals',
  'chart_revenue',
  'activity_feed',
  'revenue_split',
];

function buildInitialState(): WidgetsState {
  return Object.fromEntries(
    ALL_WIDGET_IDS.map((id) => [id, { ...DEFAULT_WIDGET_STATE }]),
  ) as WidgetsState;
}

// ─── Reducer ──────────────────────────────────────────────────────────────

type Action =
  | { type: 'LOAD'; widgetId: WidgetId }
  | { type: 'SUCCESS'; widgetId: WidgetId }
  | { type: 'ERROR'; widgetId: WidgetId; error: ApiError }
  | { type: 'RESET_ALL' };

function reducer(state: WidgetsState, action: Action): WidgetsState {
  switch (action.type) {
    case 'LOAD':
      return { ...state, [action.widgetId]: { status: 'loading', error: null } };
    case 'SUCCESS':
      return { ...state, [action.widgetId]: { status: 'success', error: null } };
    case 'ERROR':
      return {
        ...state,
        [action.widgetId]: { status: 'error', error: action.error },
      };
    case 'RESET_ALL':
      return buildInitialState();
    default:
      return state;
  }
}

// ─── Fake per-widget fetch helpers ────────────────────────────────────────
//
// In production each would call a real API endpoint.  For now they reuse the
// same simulate_offline query-string flag that the existing Dashboard uses,
// but each widget can fail independently (so the pattern can
// be demonstrated by adding e.g. ?fail_kpi_mrr=1 in the URL).

function makeWidgetError(message: string, opts: Partial<ApiError> = {}): ApiError {
  const err = new Error(message) as ApiError;
  Object.assign(err, opts);
  return err;
}
// ─── API-backed fetch helpers ─────────────────────────────────────────────

function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' || error.message === 'The operation was aborted')
  );
}

  // The global offline flag still works for all widgets.
  if (search.includes('simulate_offline')) {
    await delay(300);
    throw makeWidgetError('No internet connection', { isOffline: true });
  }

  // Happy-path: simulate a short network round-trip
  await delay(200 + Math.random() * 300);
function toApiError(error: unknown): ApiError {
  if (error instanceof Error) return error as ApiError;
  const apiError = new Error(String(error)) as ApiError;
  apiError.kind = 'network';
  return apiError;
}

async function fetchWidget(
  id: WidgetId,
  filters: DashboardFilters,
  signal: AbortSignal,
): Promise<DashboardWidgetData> {
  switch (id) {
    case 'kpi_active_subscriptions': {
      const response = await dashboard.metrics(filters, { signal });
      return { activeSubscriptions: response?.activeSubscriptions };
    }
    case 'kpi_mrr': {
      const response = await dashboard.metrics(filters, { signal });
      return { mrr: response?.mrr };
    }
    case 'kpi_failed_charges': {
      const response = await dashboard.metrics(filters, { signal });
      return { failedCharges: response?.failedCharges };
    }
    case 'kpi_upcoming_renewals': {
      const response = await dashboard.metrics(filters, { signal });
      return { upcomingRenewals: response?.upcomingRenewals };
    }
    case 'chart_revenue': {
      const response = await dashboard.metrics(filters, { signal });
      return { revenueSeries: response?.revenue };
    }
    case 'activity_feed': {
      const response = await dashboard.activity(filters, { signal });
      return { activities: response?.activities };
    }
    case 'revenue_split': {
      const response = await dashboard.revenueByPlan(filters, { signal });
      return { revenueByPlan: response };
    }
  }
}

function abortWidget(
  controllers: Map<WidgetId, AbortController>,
  id: WidgetId,
): void {
  controllers.get(id)?.abort();
  controllers.delete(id);
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export interface UseDashboardWidgetsReturn {
  widgets: WidgetsState;
  /** Data returned by the widget fetchers. */
  data: DashboardWidgetData;
  /** Kick off a fresh load of all widgets. */
  loadAll: () => void;
  /** Retry a single failed widget. */
  retryWidget: (id: WidgetId) => void;
  /** True when every widget is either loading or idle (i.e. initial page load). */
  isInitialLoading: boolean;
  /** Ids of widgets currently in an error state. */
  failedWidgetIds: WidgetId[];
}

export function useDashboardWidgets(
  filters: DashboardFilters,
): UseDashboardWidgetsReturn {
  const [widgets, dispatch] = useReducer(reducer, undefined, buildInitialState);
  const [data, setData] = useState<DashboardWidgetData>({});

  const controllersRef = useRef<Map<WidgetId, AbortController>>(new Map());
  const generationRef = useRef(0);
  const mountedRef = useRef(true);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const filtersKey = JSON.stringify(filters);

  const abortAll = useCallback(() => {
    controllersRef.current.forEach((controller) => controller.abort());
    controllersRef.current.clear();
  }, []);

  const loadWidget = useCallback(
    async (id: WidgetId, generation: number) => {
      abortWidget(controllersRef.current, id);
      const controller = new AbortController();
      controllersRef.current.set(id, controller);
      dispatch({ type: 'LOAD', widgetId: id });

      const isCurrent = () =>
        mountedRef.current &&
        generationRef.current === generation &&
        controllersRef.current.get(id) === controller;

      try {
        const patch = await fetchWidget(id, filtersRef.current, controller.signal);
        if (!isCurrent()) return;
        setData((previous) => ({ ...previous, ...patch }));
        dispatch({ type: 'SUCCESS', widgetId: id });
      } catch (error) {
        if (isAbortError(error) || !isCurrent()) return;
        dispatch({ type: 'ERROR', widgetId: id, error: toApiError(error) });
      } finally {
        if (controllersRef.current.get(id) === controller) {
          controllersRef.current.delete(id);
        }
      }
    },
    [],
  );

  const loadAll = useCallback(() => {
    const generation = ++generationRef.current;
    abortAll();
    setData({});
    dispatch({ type: 'RESET_ALL' });
    ALL_WIDGET_IDS.forEach((id) => {
      void loadWidget(id, generation);
    });
  }, [abortAll, loadWidget]);

  const retryWidget = useCallback(
    (id: WidgetId) => {
      void loadWidget(id, generationRef.current);
    },
    [loadWidget],
  );

  // A filter change invalidates every in-flight response, even before the
  // consumer's effect has started the next load.
  useEffect(() => {
    generationRef.current += 1;
    abortAll();
  }, [filtersKey, abortAll]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
      abortAll();
    };
  }, [abortAll]);

  const isInitialLoading = useMemo(
    () =>
      ALL_WIDGET_IDS.every(
        (id) => widgets[id].status === 'idle' || widgets[id].status === 'loading',
      ),
    [widgets],
  );

  const failedWidgetIds = useMemo(
    () => ALL_WIDGET_IDS.filter((id) => widgets[id].status === 'error'),
    [widgets],
  );

  return { widgets, data, loadAll, retryWidget, isInitialLoading, failedWidgetIds };
}
