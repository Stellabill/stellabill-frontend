# Partial-Error Pattern for Hybrid Data Views

## Overview

The Dashboard aggregates data from multiple independent endpoints.  Previously a single failure blanked the entire page.  The partial-error pattern allows successful widgets to render normally while failed widgets display an in-card error slot with a per-widget retry button.

---

## Components

### `CardErrorSlot` (`src/components/Dashboard/CardErrorSlot.tsx`)

An in-card error placeholder rendered in place of the normal metric/chart body.

| Prop | Type | Description |
|---|---|---|
| `widgetLabel` | `string` | Name of the widget (used in accessible labels). |
| `message` | `string?` | Human-readable error text.  Defaults to "Failed to load data". |
| `isOffline` | `boolean?` | Switches icon to WifiOff and message to "No internet connection". |
| `onRetry` | `() => void` | Called when the Retry button is pressed. |
| `retrying` | `boolean?` | Shows a spinner and disables the button while in-flight. |
| `className` | `string?` | Extra class names (e.g. `card-error-slot--chart` for tall panels). |

**Sizing modifiers (CSS)**

| Class | Use case |
|---|---|
| `.card-error-slot` (default) | KPI cards — `min-height: 4.5rem` matches metric block |
| `.card-error-slot--chart` | Chart panels — `min-height: 18rem`, centred layout |

---

### `useDashboardWidgets` (`src/hooks/useDashboardWidgets.ts`)

A `useReducer`-based hook that manages per-widget loading/success/error state and fires widget fetches in parallel.

```tsx
const { widgets, loadAll, retryWidget, isInitialLoading, failedWidgetIds } =
  useDashboardWidgets();
```

| Return | Type | Description |
|---|---|---|
| `widgets` | `Record<WidgetId, WidgetState>` | State per widget (`idle \| loading \| success \| error`, plus `error: ApiError \| null`). |
| `loadAll` | `() => void` | Resets all widgets and re-fires every fetch in parallel. |
| `retryWidget` | `(id: WidgetId) => void` | Retries a single failed widget. |
| `isInitialLoading` | `boolean` | True while every widget is still idle/loading (shows full-page skeleton). |
| `failedWidgetIds` | `WidgetId[]` | IDs of widgets currently in an error state. |

**Widget IDs**

```
kpi_active_subscriptions | kpi_mrr | kpi_failed_charges | kpi_upcoming_renewals
chart_revenue | activity_feed
```

---

## Error propagation in `DashboardCard`

`DashboardCard` now accepts three additional props:

```tsx
<DashboardCard
  title="MRR"
  value="$42,500"
  error="Failed to load data"          // string | null — triggers error slot
  isOfflineError={false}               // switches to offline icon/copy
  onRetry={() => retryWidget('kpi_mrr')}
  retrying={widgets.kpi_mrr.status === 'loading'}
/>
```

When `error` is non-null the card body is swapped for a `CardErrorSlot` while the header (title + icon) stays visible.  The card border gains `--color-danger-border`.  Card dimensions are **unchanged** — no layout shift.

---

## Partial-error banner

A page-level warning bar appears whenever `failedWidgetIds.length > 0`:

```
⚠ 2 sections failed to load. The rest of the dashboard is still available.
  Use the individual Retry buttons to reload failed sections.  [Retry all]
```

- Uses `role="status"` (not `role="alert"`) so it does not interrupt in-progress screen-reader announcements.
- An off-screen `aria-live="polite"` region announces the same text for screen readers.
- Disappears automatically once all retries succeed.

---

## Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|---|---|
| Error communicated to AT | `CardErrorSlot` has `role="status"` with full descriptive `aria-label` |
| Failure summary announced | `aria-live="polite" aria-atomic="true"` region in `Dashboard.tsx` |
| Retry button focus & label | `aria-label="Retry <widget>"`, `aria-busy` during retry, `:focus-visible` ring |
| No layout shift | `min-height` on `CardErrorSlot` matches replaced content; border only |
| Reduced motion | Spinner animation suppressed via `@media (prefers-reduced-motion: reduce)` |
| Touch targets | Retry button `min-height: 1.75rem` + padding ≥ 44 px effective area |
| Offline detection | `isOffline` prop switches icon and copy; detected via `ApiError.isOffline` |

---

## Testing the pattern

Add query-string flags to simulate failures in any browser:

| Flag | Effect |
|---|---|
| `?simulate_error` | All widgets fail with HTTP 500 |
| `?simulate_offline` | All widgets fail with offline error |
| `?fail_kpi_mrr=1` | Only the MRR card fails |
| `?fail_chart_revenue=1` | Only the Revenue chart fails |
| Multiple flags | `?fail_kpi_mrr=1&fail_activity_feed=1` — partial failure |

---

## Edge cases

| Scenario | Behaviour |
|---|---|
| All widgets fail | Banner shows all names; every card shows error slot; full-page skeleton is gone |
| Retry in progress | Button shows "Retrying…" spinner, `aria-busy=true`, disabled |
| Retry succeeds | Widget transitions `error → loading → success`; card body restores; banner auto-hides if no more failures |
| Retry fails again | Widget stays in error state; button re-enables |
| No internet (offline) | Offline icon + "No internet connection" copy in each failed slot |
