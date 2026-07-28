# Revenue Split by Plan Panel

## Overview

Merchant dashboards previously showed **total revenue** without explaining how that total splits across subscription plans. The **Revenue Split by Plan** panel adds a WCAG 2.1 AA–oriented visualization with:

- A **stacked-bar** chart (default on viewports ≥640px)
- A **ranked-list** fallback (default under 640px when stacked is selected, or via explicit toggle)
- A **data-table** equivalent for the same metrics
- Per-plan **delta chips** vs the previous period
- A **polite live region** for screen-reader announcements
- A **colorblind-safe** series palette with **pattern fills**

## Before / after

| Before | After |
| --- | --- |
| KPI / MRR total only; no plan mix | Total + share per plan with period deltas |
| No chart↔table alternative | Stacked / ranked / table modes |
| Color-only legend risk | Okabe–Ito–inspired tokens + distinct pattern fills |
| No SR summary of composition | Hidden summary + `aria-live="polite"` updates |

## Component API

```tsx
import RevenueSplitByPlanPanel from "@/components/Dashboard/RevenueSplitByPlanPanel";

<RevenueSplitByPlanPanel
  plans={[
    { planId: "pro", planName: "Pro", revenue: 19200, previousRevenue: 17600 },
    { planId: "basic", planName: "Basic", revenue: 8500, previousRevenue: 7800 },
  ]}
  title="Revenue by plan"
  subtitle="Share of total revenue across subscription plans."
  periodLabel="this month"
  previousPeriodLabel="vs last month"
  defaultView="stacked"
/>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `plans` | `PlanRevenueSlice[]` | **required** | Current + previous revenue per plan |
| `title` | `string` | `"Revenue by plan"` | Panel heading |
| `subtitle` | `string` | Share copy | Supporting sentence |
| `periodLabel` | `string` | `"this period"` | Used in SR summary / empty state |
| `previousPeriodLabel` | `string` | `"vs previous period"` | Delta chip label |
| `defaultView` | `"stacked" \| "ranked" \| "table"` | `"stacked"` | Initial display mode |
| `className` | `string` | `""` | Optional root class |

### `PlanRevenueSlice`

| Field | Type | Description |
| --- | --- | --- |
| `planId` | `string` | Stable id |
| `planName` | `string` | Display name |
| `revenue` | `number` | Current-period revenue |
| `previousRevenue` | `number` | Previous-period revenue |
| `currency` | `string?` | Defaults to `USDC` |

## Design tokens

Defined in `src/styles/tokens.css`:

- `--chart-series-1` … `--chart-series-8` — colorblind-safe fills (≥3:1 non-text contrast on canvas)
- `--chart-series-pattern-ink` — pattern overlay ink
- `--delta-positive-*` / `--delta-negative-*` / `--delta-neutral-*` — delta chip colors

## Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
| --- | --- |
| 1.1.1 Non-text content | Segments expose `aria-label`; SR summary describes the full split |
| 1.4.1 Use of color | Pattern fills + text labels/share values, not color alone |
| 1.4.11 Non-text contrast | Series tokens chosen for ≥3:1 against light/dark card surfaces |
| 1.3.1 Info and relationships | Ranked list / data table with row headers; toggle is a `role="group"` |
| 2.4.7 Focus visible | Segments, toggles, and delta focus targets use focus rings |
| 4.1.2 Name, role, value | `aria-pressed` on view buttons; table caption for data view |
| 4.1.3 Status messages | Polite live region announces summary, view changes, and focused segment |

### axe / Storybook notes

- Run Storybook a11y addon on the panel (or axe DevTools on `/` dashboard after load).
- Expected: **0 serious/critical** for color-contrast on text; chart fills validated as non-text (≥3:1).
- Confirm a single `aria-live="polite"` status region updates without interrupting; duplicate `role="status"` on delta chips is intentional short-name exposure for AT that surface status children.
- RTL: wrap in `dir="rtl"` — flex row + logical spacing keep segment order and reading order coherent.

## Responsive behavior

| Viewport | Stacked selected | Ranked / Table selected |
| --- | --- | --- |
| `< 640px` | Ranked list via `matchMedia` fallback | Chosen view |
| `≥ 640px` | Stacked bar + legend | Chosen view |

Only one visualization is mounted at a time (no duplicate AT trees).

## Edge cases

- **Single plan** — one segment at 100% share
- **Many plans** — ranked list scrolls; series index wraps modulo 8
- **New plan** (`previousRevenue === 0`, current > 0) — delta chip shows **New**
- **Empty** — polite empty copy, no chart chrome

## Integration

- Live route: `src/pages/Dashboard.tsx` (`MOCK_PLAN_REVENUE` until API)
- Legacy mock strip: `src/components/MerchantDashboard.tsx`
- Utils (pure, unit-tested): `src/components/Dashboard/revenueSplitUtils.ts`

## Testing

```bash
pnpm exec vitest run src/components/Dashboard/RevenueSplitByPlanPanel.test.tsx --coverage
pnpm run lint
```

Coverage target for the panel + utils: **≥95%**.
