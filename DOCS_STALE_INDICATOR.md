# Stale-Data Indicator

Design-system reference for the `StaleIndicator` component and its associated
token system. Covers thresholds, CSS custom properties, API, accessibility
guarantees, and edge-case behaviour.

---

## Problem

Merchant Dashboard KPI cards (Active Subscriptions, MRR, Pending Charges,
Available to Withdraw) display cached numbers. The cache can be minutes old
with no visual signal to the user. Without a freshness indicator, users have
no way to know whether the numbers they're looking at are current or stale,
leading to potentially costly decisions based on outdated data.

---

## Solution

Each card grows a small badge that:

1. Continuously shows "Updated N min ago" relative to the last successful
   fetch — the count updates every 30 seconds.
2. Transitions from invisible (fresh) → amber warning (stale) → red alert
   (very-stale) as the data ages, using configurable threshold tokens.
3. Exposes a one-click "Refresh" button with a spinner for the in-flight
   pending state and a green success flash when the refresh completes.

---

## Files

| File | Purpose |
|---|---|
| `src/tokens/stalenessTokens.ts` | JS/TS threshold constants and pure utility functions |
| `src/components/StaleIndicator.tsx` | The React component |
| `src/components/StaleIndicator.module.css` | Component-scoped CSS (references `tokens.css`) |
| `src/styles/tokens.css` | Global CSS custom properties for colours (appended section) |
| `src/components/StaleIndicator.test.tsx` | Component tests |
| `src/tokens/stalenessTokens.test.ts` | Token utility unit tests |

---

## Threshold tokens

Thresholds are defined in `src/tokens/stalenessTokens.ts` as named
constants. Support can tune them per-environment via Vite environment
variables without touching source code.

| Constant | Default | Env var override | Description |
|---|---|---|---|
| `STALE_THRESHOLD_MS` | `300 000` (5 min) | `VITE_STALE_THRESHOLD_MS` | Age at which a card transitions fresh → stale |
| `VERY_STALE_THRESHOLD_MS` | `900 000` (15 min) | `VITE_VERY_STALE_THRESHOLD_MS` | Age at which a card transitions stale → very-stale |
| `STALENESS_TICK_INTERVAL_MS` | `30 000` (30 s) | — | How often the relative-time clock re-renders |

To override thresholds for a staging environment, set in `.env.staging`:

```dotenv
VITE_STALE_THRESHOLD_MS=120000       # 2 minutes
VITE_VERY_STALE_THRESHOLD_MS=600000  # 10 minutes
```

---

## CSS custom property tokens

Defined in `src/styles/tokens.css` under separate `:root` / `[data-theme="dark"]`
blocks so they respond automatically to the app's existing theme system.

### Colour ramp

| Token | Light value | Dark value | Used for |
|---|---|---|---|
| `--stale-badge-color` | `#b45309` | `#fbbf24` | Amber badge text |
| `--stale-badge-bg` | `rgba(217,119,6,.12)` | `rgba(245,158,11,.14)` | Amber badge fill |
| `--stale-badge-border` | `rgba(217,119,6,.28)` | `rgba(251,191,36,.28)` | Amber badge ring |
| `--very-stale-badge-color` | `#b91c1c` | `#f87171` | Red badge text |
| `--very-stale-badge-bg` | `rgba(220,38,38,.12)` | `rgba(239,68,68,.14)` | Red badge fill |
| `--very-stale-badge-border` | `rgba(220,38,38,.28)` | `rgba(248,113,113,.28)` | Red badge ring |
| `--stale-refresh-color` | `#0369a1` | `#38bdf8` | Refresh button text |
| `--stale-refresh-color-hover` | `#0284c7` | `#7dd3fc` | Refresh button hover |
| `--stale-tooltip-bg` | `#1e293b` | `#0f172a` | Tooltip background |
| `--stale-tooltip-color` | `#f1f5f9` | `#f8fafc` | Tooltip text |
| `--stale-tooltip-border` | `rgba(148,163,184,.20)` | `rgba(148,163,184,.16)` | Tooltip ring |
| `--stale-success-color` | `#15803d` | `#34d399` | Success flash text |
| `--stale-success-bg` | `rgba(22,163,74,.10)` | `rgba(16,185,129,.14)` | Success flash fill |
| `--stale-success-border` | `rgba(22,163,74,.20)` | `rgba(52,211,153,.28)` | Success flash ring |

All tokens are overridable at any ancestor element, including within a
specific card (see `MerchantDashboard.css` for an example of scoping them to
`.card [data-testid="stale-indicator"]`).

---

## Freshness states

The component drives its entire visual presentation off a single
`data-freshness` attribute on the root element. This attribute is also
queryable in tests without coupling to class names.

| `data-freshness` | Age | Badge style | Refresh shown |
|---|---|---|---|
| `fresh` | < `STALE_THRESHOLD_MS` | Hidden (height: 0) | — |
| `stale` | `STALE_THRESHOLD_MS` – `VERY_STALE_THRESHOLD_MS` | Amber | Yes |
| `very-stale` | ≥ `VERY_STALE_THRESHOLD_MS` | Red | Yes |
| `unknown` | Timestamp absent | Neutral | No (pass `onRefresh` to show) |
| `refreshing` | — (in-flight) | Neutral + spinner | Disabled |
| `success` | — (just refreshed) | Green flash | Hidden |

---

## Relative-time formatting

`formatRelativeTime(updatedAt, now?)` in `stalenessTokens.ts`:

| Age | Output |
|---|---|
| 0 – 29 s | `just now` |
| 30 – 89 s | `1 min ago` |
| 90 s – 59 m 29 s | `N min ago` (rounded to nearest minute) |
| 1 h – 23 h 59 m | `N hr ago` |
| 24 h – N days | `N day(s) ago` |
| Invalid / future | `just now` |

**Minute rounding:** uses `Math.round` so 4 m 30 s → "5 min ago". This is
intentional: it avoids the badge staying on "4 min ago" for a full 59 extra
seconds.

---

## Component API

```tsx
import StaleIndicator from '@/components/StaleIndicator';

<StaleIndicator
  updatedAt={isoTimestamp}   // string | null | undefined
  cardLabel="Active Subscriptions"  // used in aria-labels
  onRefresh={async () => { ... }}   // optional; shows button when provided
  isRefreshing={false}       // external override (e.g. coordinated refresh)
  className="my-extra-class" // merged onto root element
  _now={Date.now()}          // test/Storybook pin — disables internal timer
/>
```

### Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `updatedAt` | `string \| null \| undefined` | Yes | — | ISO-8601 timestamp of last fetch |
| `cardLabel` | `string` | Yes | — | Human-readable card name for aria-labels |
| `onRefresh` | `() => Promise<void> \| void` | No | — | Called on button click; shows refresh button |
| `isRefreshing` | `boolean` | No | `false` | External refreshing flag |
| `className` | `string` | No | — | Extra CSS class on root |
| `_now` | `number` | No | `Date.now()` | Pin "now" for testing/Storybook |

---

## Accessibility (WCAG 2.1 AA)

### Live region
A `role="status"` / `aria-live="polite"` / `aria-atomic="true"` element is
always present in the DOM and receives announcements on state transitions:

- fresh → stale: _"{cardLabel} data is N min ago."_
- fresh/stale → very-stale: _"{cardLabel} data is significantly outdated — please refresh."_
- anything → refreshing: _"{cardLabel}: refreshing data."_
- refreshing → success: _"{cardLabel}: data refreshed successfully."_

The announcement fires 50 ms after the state change so the live region picks
it up even when the text is unchanged from the previous message.

### Refresh button
- `aria-busy="true"` while a request is in-flight
- `aria-label` is `"Refresh {cardLabel}"` at rest, `"Refreshing {cardLabel}…"` during in-flight
- `disabled` attribute prevents re-triggering while refreshing
- `focus-visible` ring uses `--focus-ring` token (min 2 px offset)

### Touch targets
The refresh button has `min-height: 44px; min-width: 44px` to meet WCAG
2.5.5 (Target Size, AA). This applies at all breakpoints.

### Decorative icons
All Lucide icons are `aria-hidden="true"` — they are visual affordances only
and must not be announced by screen readers.

### Tooltip
The absolute-timestamp tooltip uses `role="tooltip"` linked to its anchor
via `aria-describedby`. It is shown on `:hover` and `:focus-within` so
keyboard users can access it via Tab.

---

## Responsive behaviour

- Badge text uses `var(--text-xs)` (fluid clamp, ~0.75 rem on desktop,
  smaller on mobile) so it reads comfortably without overflowing the
  330 px card width.
- At `max-width: 360px` the badge font-size and padding are further reduced.
- The tooltip is `min-width: 12rem; max-width: 18rem` and centred over the
  badge. At narrow widths it can extend outside the card boundary — this is
  acceptable because the tooltip is purely informational and not interactive.

---

## RTL support

- Tooltip position flips to right-aligned (`right: 50%; transform: translateX(50%)`)
  under `[dir="rtl"]`.
- Arrow pseudo-elements are adjusted accordingly.
- Spinner animation direction is unaffected by writing direction.

---

## Reduced-motion

Under `@media (prefers-reduced-motion: reduce)`:
- `stale-spin` and `stale-success-flash` animations are suppressed.
- The spinner becomes a static icon at 80% opacity.
- The success icon is shown at full opacity with no animation.
- All CSS `transition` rules are removed from badge, button, and tooltip.

---

## Edge cases covered in tests

| Edge case | Test file | Description |
|---|---|---|
| `null` / `undefined` updatedAt | `stalenessTokens.test.ts` | Returns `"unknown"` state |
| Invalid ISO string | `stalenessTokens.test.ts` | Returns `"unknown"` / `"just now"` |
| Future timestamp | `stalenessTokens.test.ts` | Age treated as 0 (negative diff → `"just now"`) |
| Minute rounding (4m 29s vs 4m 30s) | `stalenessTokens.test.ts` | `Math.round` boundary confirmed |
| UTC offset strings (`+05:30`) | `stalenessTokens.test.ts` | Browser `Date` handles normalisation |
| Offline / rejected fetch | `StaleIndicator.test.tsx` | Button re-enables; no crash |
| Double-click prevention | `StaleIndicator.test.tsx` | Disabled button ignores second click |
| External `isRefreshing` flag | `StaleIndicator.test.tsx` | Overrides internal state |
| Success flash expiry | `StaleIndicator.test.tsx` | Timer advances → button returns |
| Screen-reader live region | `StaleIndicator.test.tsx` | role, aria-live, aria-atomic verified |
| Integration smoke (4 cards) | `StaleIndicator.test.tsx` | All 4 dashboard cards render an indicator |

---

## Before / After

### Before
```
┌──────────────────────────────┐
│  Active subscriptions        │
│  24                          │
│  +3 this month               │
└──────────────────────────────┘
```
_(No freshness signal — user doesn't know if "24" is live or cached)_

### After (stale state)
```
┌──────────────────────────────┐
│  Active subscriptions        │
│  24                          │
│  +3 this month               │
│  ⏰ Updated 7 min ago  ↻     │
│  ↑ amber badge   ↑ refresh   │
└──────────────────────────────┘
```
Badge is hidden when data is fresh (< 5 min), appears in amber at 5 min,
transitions to red at 15 min.

---

## Related docs

- [DOCS_SHIMMER.md](./DOCS_SHIMMER.md) — loading-skeleton shimmer primitive (complementary UX)
- [DOCS_ERROR_HANDLING.md](./DOCS_ERROR_HANDLING.md) — `CardErrorSlot` for hard-error recovery
- [DOCS_MODAL_ACCESSIBILITY.md](./DOCS_MODAL_ACCESSIBILITY.md) — focus management system
