# Usage Anomaly Alerts Panel

Design spec and implementation notes for the anomaly-alerts panel on the
Usage & Billing page (Issue: "Sudden usage spikes surprise subscribers").

Component: `src/components/UsageAnomalyPanel.tsx` (+ `UsageAnomalyPanel.css`)
Used on: `src/pages/UsageBilling.tsx`

## Problem

Sudden usage spikes currently only show up as a surprise on the invoice.
This panel surfaces day-over-day and week-over-week usage anomalies inline
on the Usage & Billing page, with a plain-language explanation and a way to
quiet alerts a subscriber doesn't want to see again.

## Anatomy

```
┌───────────────────────────────────────────────────────────────────┐
│ Anomaly alerts                                    [Reset all mutes]│
│ We flag usage changes greater than 50% day-over-day or 100%        │
│ week-over-week compared to your trailing 7-day average.            │
│                                                                     │
│  ● API calls   Day-over-day   [+340%]                    [Mute]   │
│    Usage jumped well beyond your typical daily pattern...          │
│    8,820 calls vs 2,005 calls previously                           │
│                                                                     │
│  ● Storage     Week-over-week [+128%]                    [Mute]   │
│    Storage usage more than doubled compared to last week...        │
│    41.2 GB vs 18.1 GB previously                                    │
│                                                                     │
│ ─────────────────────────────────────────────────────────────────  │
│ Muted alert types (1)                                               │
└───────────────────────────────────────────────────────────────────┘
```

- **Severity dot** — critical (red), warning (amber), info (cyan). Severity
  is never conveyed by color alone: a visually-hidden `"{Severity} alert:"`
  prefix is read by screen readers before the metric name (WCAG 1.4.1).
- **Delta chip** — signed percentage with a direction arrow. For usage
  billing, an *increase* is the concerning direction (more usage → a bigger
  invoice), so up-deltas use the danger color and down-deltas use the
  success color — the inverse of a typical revenue metric. The chip's
  `aria-label` spells out the direction and magnitude in words (e.g. "Up 340
  percent") rather than relying on the "+"/"−" glyph and arrow icon, which
  can be lost or misread by assistive tech.
- **Reason line** — one sentence of plain-language context for why this was
  flagged (not just the raw numbers).
- **Values line** — the raw current-vs-previous numbers for anyone who wants
  the underlying data.
- **Mute control** — per anomaly *type* (e.g. "API calls spikes"), not per
  individual alert instance. Muting hides all current and future rows of
  that type. A collapsible "Muted alert types (N)" section lists muted
  types with individual "Unmute" actions, plus a single "Reset all mutes"
  control in the header once anything is muted.

## Threshold microcopy

The subtitle under the panel title states the detection thresholds in
plain language so subscribers understand *why* something was flagged:

> We flag usage changes greater than 50% day-over-day or 100% week-over-week
> compared to your trailing 7-day average.

This is static copy today; if per-metric thresholds become configurable,
the copy should be generated from the same config the anomaly-detection
service uses, so it never drifts out of sync with actual behavior.

## Mute persistence

Mute state is scoped to a `typeId` (the kind of anomaly, e.g.
`api_calls_spike`) and persisted in `localStorage` under
`stellabill.usageBilling.mutedAnomalyTypes.{userId}`, where `userId` is
passed in by the host page (`UsageBilling.tsx` passes the subscription
`id` from the route today; swap in the authenticated user id once auth
context is available). This namespacing means:

- Muting is per-user, not global to the browser.
- A "Reset all mutes" control clears the stored set for that user in one
  action, and reloading the page keeps the reset applied (the exact
  behavior a subscriber expects from "reset").
- Storage reads/writes are wrapped in `try`/`catch` — private browsing mode
  or a full storage quota degrades to "mute lasts for this session only"
  rather than throwing.

## Accessibility (WCAG 2.1 AA)

- The panel is a labeled landmark: `<section aria-label="Usage anomaly
  alerts">`.
- A visually-hidden `role="status" aria-live="polite"` region announces
  mute/unmute/reset actions ("Muted future API calls alerts.", "Unmuted
  Storage alerts.", "All muted anomaly types have been reset.") so screen
  reader users get feedback without focus being moved.
- Empty and fully-muted states use `role="status"` so their message is
  announced when they appear.
- Severity is never color-only (see above).
- Every mute button has an explicit `aria-label` ("Mute alerts for API
  calls") rather than relying on the row's visual context.
- The muted-types list is behind a `button[aria-expanded]` disclosure, not
  a native `<details>`, to match the rest of the app's toggle pattern
  (e.g. `ErrorState`'s "Technical Details" toggle).
- All interactive elements are plain `<button>`s — full keyboard operability
  (Tab/Shift+Tab/Enter/Space) comes for free, no custom key handling needed.
- Layout uses `flex` + `gap` (no absolute left/right offsets), so the panel
  holds up under `dir="rtl"` without additional CSS.

## Responsive behavior

- Rows wrap (`flex-wrap: wrap`) so the metric name, period badge, and delta
  chip re-flow on narrow viewports instead of clipping.
- Below 640px, each row switches to a stacked column layout and the mute
  button left-aligns under the row content instead of sitting flush right.
- The panel's outer padding shrinks on small screens to match the existing
  `main-card` treatment on the Usage & Billing page.

## Edge cases handled

| Case | Behavior |
|---|---|
| No anomalies for the period | "No usage anomalies detected for this period." (`role="status"`) |
| Every anomaly type muted | "All anomaly types are currently muted." with an inline reset action |
| Mixed muted/active types | Active rows render normally; muted types collapse into the "Muted alert types (N)" disclosure |
| Malformed/corrupt localStorage value | Treated as "nothing muted"; never throws |
| RTL document direction | Delta values and labels render unchanged; flex/gap layout re-flows correctly |
| Screen reader users | Mute/unmute/reset actions are announced via a live region; severity and delta direction are available as text, not just color/iconography |

## Testing

`src/components/UsageAnomalyPanel.test.tsx` covers: rendering of anomaly
rows (metric, period, delta, reason), the accessible delta label, the
severity text-alternative, muting/unmuting a type, the "all muted" and
"no anomalies" empty states, the header reset control, per-user mute
persistence (including isolation between two different `userId`s),
recovery from malformed `localStorage` data, and rendering under
`dir="rtl"`.

Run:

```bash
npm test src/components/UsageAnomalyPanel.test.tsx
npm run test:coverage
```

## Files changed

- `src/components/UsageAnomalyPanel.tsx` — new
- `src/components/UsageAnomalyPanel.css` — new
- `src/components/UsageAnomalyPanel.test.tsx` — new
- `src/pages/UsageBilling.tsx` — renders the panel with mock anomaly data
- `docs/USAGE_ANOMALY_PANEL.md` — this document
