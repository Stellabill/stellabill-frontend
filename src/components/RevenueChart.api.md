# Revenue Chart Component API & Accessibility Guide

## Overview
The `RevenueChart` component renders an interactive, responsive line chart with full WCAG 2.1 AA accessibility, keyboard traversal, screen reader support, and customizable data inputs.

## Props API

```typescript
export interface RevenueChartProps {
  /** Initial selected time range preset. Defaults to '30D'. */
  initialTimeRange?: '7D' | '30D' | '90D';
  /** Optional custom data array for deterministic chart rendering or API data integration. */
  data?: DataPoint[];
  /** Accessible label for the chart region landmark. Defaults to 'Revenue over time'. */
  ariaLabel?: string;
}

export interface DataPoint {
  date: string;
  revenue: number;
}
```

## Features Implemented

✅ **Accessible Keyboard Traversal**: Navigate data points via `ArrowRight`, `ArrowLeft`, `ArrowUp`, `ArrowDown`, `Home`, and `End` keys.
✅ **Roving TabIndex**: Only active point has `tabIndex=0` to ensure clean tabbing into and out of chart.
✅ **Stable Tooltip Positioning**: Dynamic coordinate calculations prevent tooltips from clipping at chart canvas edges.
✅ **Hover & Focus Synchronization**: Tooltips render seamlessly on mouse hover or keyboard focus.
✅ **Screen Reader Summary**: Hidden description element (`#revenue-chart-summary-desc`) summarizes min, max, average revenue, and date range.
✅ **Live Region Status (`aria-live="polite"`)**: Updates screen reader on point change with exact value, trend delta, and position index.
✅ **RTL Support**: Detects `dir="rtl"` and inverts horizontal arrow navigation directions.
✅ **Escape Key Dismissal**: Pressing `Escape` hides tooltip and clears active focus.
✅ **Reduced Motion**: Disables smooth transitions and animations when `prefers-reduced-motion: reduce` is active.

## Usage Example

```tsx
import RevenueChart from './RevenueChart';

export function DashboardPage() {
  return (
    <RevenueChart 
      initialTimeRange="30D" 
      ariaLabel="Monthly Revenue Performance"
    />
  );
}
```
