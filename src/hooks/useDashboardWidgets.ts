import { useCallback, useReducer } from 'react';
import type { ApiError } from '../api/client';

// ─── Widget identifiers ────────────────────────────────────────────────────

export type WidgetId =
  | 'kpi_active_subscriptions'
  | 'kpi_mrr'
  | 'kpi_failed_charges'
  | 'kpi_upcoming_renewals'
  | 'chart_revenue'
  | 'activity_feed';

// ─── Per-widget state ──────────────────────────────────────────────────────

export type WidgetStatus = 'idle' | 'loading' | 'success' | 'error';

export interface WidgetState {
  status: WidgetStatus;
  error: ApiError | null;
}

type WidgetsState = Record<WidgetId, WidgetState>;

const DEFAULT_WIDGET_STATE: WidgetState = { status: 'idle', error: null };

const ALL_WIDGET_IDS: WidgetId[] = [
  'kpi_active_subscriptions',
  'kpi_mrr',
  'kpi_failed_charges',
  'kpi_upcoming_renewals',
  'chart_revenue',
  'activity_feed',
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
// same simulate_error / simulate_offline query-string flags that the existing
// Dashboard uses, but each widget can fail independently (so the pattern can
// be demonstrated by adding e.g. ?fail_kpi_mrr=1 in the URL).

function makeWidgetError(message: string, opts: Partial<ApiError> = {}): ApiError {
  const err = new Error(message) as ApiError;
  Object.assign(err, opts);
  return err;
}

async function fetchWidget(widgetId: WidgetId): Promise<void> {
  // Honour per-widget failure simulation: ?fail_<widget_id>=1
  const search =
    typeof window !== 'undefined' ? window.location.search : '';

  if (search.includes(`fail_${widgetId}`)) {
    await delay(400 + Math.random() * 400);
    throw makeWidgetError(`Could not load ${widgetId.replace(/_/g, ' ')}`, {
      status: 503,
      technicalDetails: `Simulated failure for ${widgetId}`,
    });
  }

  // Global simulate_offline / simulate_error flags still work for all widgets
  if (search.includes('simulate_offline')) {
    await delay(300);
    throw makeWidgetError('No internet connection', { isOffline: true });
  }

  if (search.includes('simulate_error')) {
    await delay(300);
    throw makeWidgetError('Internal Server Error', {
      status: 500,
      technicalDetails: 'Metrics service timeout [Trace: MET-500]',
    });
  }

  // Happy-path: simulate a short network round-trip
  await delay(200 + Math.random() * 300);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export interface UseDashboardWidgetsReturn {
  widgets: WidgetsState;
  /** Kick off a fresh load of all widgets. */
  loadAll: () => void;
  /** Retry a single failed widget. */
  retryWidget: (id: WidgetId) => void;
  /** True when every widget is either loading or idle (i.e. initial page load). */
  isInitialLoading: boolean;
  /** Ids of widgets currently in an error state. */
  failedWidgetIds: WidgetId[];
}

export function useDashboardWidgets(): UseDashboardWidgetsReturn {
  const [widgets, dispatch] = useReducer(reducer, undefined, buildInitialState);

  const loadWidget = useCallback(
    async (id: WidgetId) => {
      dispatch({ type: 'LOAD', widgetId: id });
      try {
        await fetchWidget(id);
        dispatch({ type: 'SUCCESS', widgetId: id });
      } catch (err) {
        dispatch({ type: 'ERROR', widgetId: id, error: err as ApiError });
      }
    },
    [],
  );

  const loadAll = useCallback(() => {
    dispatch({ type: 'RESET_ALL' });
    // Fire all widget fetches in parallel — each resolves/rejects independently
    ALL_WIDGET_IDS.forEach((id) => loadWidget(id));
  }, [loadWidget]);

  const retryWidget = useCallback(
    (id: WidgetId) => {
      loadWidget(id);
    },
    [loadWidget],
  );

  const isInitialLoading = ALL_WIDGET_IDS.every(
    (id) => widgets[id].status === 'idle' || widgets[id].status === 'loading',
  );

  const failedWidgetIds = ALL_WIDGET_IDS.filter(
    (id) => widgets[id].status === 'error',
  );

  return { widgets, loadAll, retryWidget, isInitialLoading, failedWidgetIds };
}
