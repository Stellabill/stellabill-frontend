# Chart Tooltip Accessibility & Keyboard Traversal

This document outlines the accessibility standards and design patterns for interactive charts within the StellarBill application, specifically addressing WCAG 2.1 AA requirements.

## Overview

Data visualizations must be fully usable by screen reader users and keyboard-only navigators. The `RevenueChart` component demonstrates these patterns by enabling interactive exploration of series data points without relying solely on mouse hover.

Key accessibility features:
1. **Roving `tabIndex` Focus Management**: Only the active/focused data point receives `tabIndex="0"`; all other points receive `tabIndex="-1"`.
2. **Arrow Key Traversal**: Keyboard users press `ArrowRight`, `ArrowLeft`, `ArrowUp`, `ArrowDown`, `Home`, and `End` to move between data points seamlessly.
3. **RTL Direction Awareness**: Horizontal arrow key navigation automatically adjusts when rendered in Right-to-Left (`dir="rtl"`) text contexts.
4. **Stable Tooltip Positioning**: Tooltips render on both focus and mouse hover, calculating dynamic coordinate bounds to prevent clipping at SVG boundaries.
5. **Escape Key Dismissal**: Pressing `Escape` dismisses active tooltips and clears focus.
6. **Live Region Announcements (`aria-live="polite"`)**: Series point changes announce date, revenue value, percentage/dollar trend relative to previous points, and index progress.
7. **Screen Reader Summary Overview**: A hidden description element (`.sr-only`) summarizes overall date range, data count, maximum, minimum, and average revenue values.
8. **Reduced Motion (`prefers-reduced-motion`)**: Pulse animations and transitions are disabled when users opt for reduced motion.

---

## Keyboard Interaction Spec

| Key | Action |
|---|---|
| `Tab` | Moves focus into the chart's active data point (or out of the chart). |
| `ArrowRight` | Moves focus to the next data point (or previous in RTL mode). |
| `ArrowLeft` | Moves focus to the previous data point (or next in RTL mode). |
| `ArrowUp` | Moves focus to the next data point. |
| `ArrowDown` | Moves focus to the previous data point. |
| `Home` | Jumps focus to the first data point in the series. |
| `End` | Jumps focus to the last data point in the series. |
| `Escape` | Dismisses active tooltip and blurs the data point. |

---

## ARIA Markup Pattern

```tsx
<div role="region" aria-label="Revenue over time">
  {/* Screen reader dataset summary */}
  <p id="revenue-chart-summary-desc" className="sr-only">
    Revenue chart summary from Jan 1 to Jan 30: 30 total data points. Highest revenue is $1,400 on Jan 25...
  </p>

  {/* Status announcement for active focus */}
  <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
    Jan 15: $1,200, up $150 from previous. Data point 15 of 30.
  </div>

  <svg role="img" aria-label="Revenue data visualization" aria-describedby="revenue-chart-summary-desc">
    {/* Interactive data point */}
    <circle
      role="button"
      tabIndex={isFocused ? 0 : -1}
      aria-label="Jan 15: $1,200 (Point 15 of 30)"
      aria-describedby="chart-active-tooltip"
    />
  </svg>
</div>
```

---

## High Contrast & Visual Focus Rings

Data points implement custom SVG focus rings styled with CSS variables from `tokens.css`:
- `--color-focus-ring`: Primary focus stroke color (min 3:1 contrast against surface).
- Drop shadow filter for elevated depth on focused state.
- Distinct pulse animation ring indicating active point location.

```css
.data-point:focus-visible,
.data-point.focused {
  r: 7px;
  fill: var(--color-surface-card);
  stroke: var(--color-focus-ring);
  stroke-width: 3px;
  filter: drop-shadow(0 0 4px var(--color-focus-ring));
}
```

---

## Verification & Testing

Verify chart accessibility using Vitest unit tests:
```bash
pnpm test src/components/RevenueChart.test.tsx
```

Ensure test coverage maintains >= 95% and automated WCAG checks pass clean.
