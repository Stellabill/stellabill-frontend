# Revenue Chart Component API & Accessibility Guide

## Overview
The `RevenueChart` component renders an interactive, responsive multi-series line chart with full WCAG 2.1 AA accessibility, interactive legend, keyboard traversal, screen reader support, and customizable data inputs.

## Props API

```typescript
export interface RevenueChartProps {
  /** Initial selected time range preset. Defaults to '30D'. */
  initialTimeRange?: '7D' | '30D' | '90D';
  /** Optional custom data array for single-series compatibility. */
  data?: DataPoint[];
  /** Optional multi-series data with interactive legend support. */
  series?: SeriesData[];
  /** Accessible label for the chart region landmark. Defaults to 'Revenue over time'. */
  ariaLabel?: string;
}

export interface DataPoint {
  date: string;
  revenue: number;
}

export interface SeriesData {
  id: string;
  name: string;
  data: DataPoint[];
  color: string;
  visible: boolean;
}
```

## Interactive Legend Features

✅ **Focusable Chips**: Each legend chip is keyboard focusable with proper ARIA attributes  
✅ **Roving TabIndex**: Arrow key navigation within the legend with only one chip tabbable  
✅ **Toggle with Space/Enter**: Show/hide series using keyboard activation  
✅ **Visual State Indicators**: Clear visual distinction between visible/hidden series  
✅ **Pattern Fill for Hidden Series**: Hidden series use pattern fills for accessibility  
✅ **Prevent All Hidden**: Cannot hide the last visible series (chip becomes disabled)  
✅ **Live Region Announcements**: Screen reader feedback on series visibility changes  
✅ **Responsive Design**: Legend wraps appropriately on smaller screens  

## Chart Navigation Features

✅ **Multi-Series Navigation**: Use `ArrowUp`/`ArrowDown` to switch between series at the same data point  
✅ **Data Point Navigation**: Use `ArrowLeft`/`ArrowRight` to move between data points in the same series  
✅ **Home/End Keys**: Jump to first/last data points within the current series  
✅ **Escape Key**: Dismiss tooltip and clear focus  
✅ **RTL Support**: Automatic direction reversal for right-to-left layouts  
✅ **Stable Tooltip**: Enhanced tooltip showing series name, value, and date  

## General Accessibility Features

✅ **WCAG 2.1 AA Compliant**: Meets accessibility guidelines for color contrast and keyboard access  
✅ **Screen Reader Summary**: Comprehensive chart description with series information  
✅ **Live Region Updates**: Real-time announcements of data point and trend changes  
✅ **Focus Management**: Clear visual focus indicators and proper focus trapping  
✅ **Reduced Motion Support**: Respects user motion preferences  

## Usage Examples

### Basic Multi-Series Chart
```tsx
import RevenueChart from './RevenueChart';

const seriesData = [
  {
    id: 'total',
    name: 'Total Revenue',
    color: '#0072b2',
    visible: true,
    data: [
      { date: 'Jan 1', revenue: 1000 },
      { date: 'Jan 2', revenue: 1200 },
      // ... more data points
    ]
  },
  {
    id: 'subscriptions',
    name: 'Subscriptions',
    color: '#e69f00',
    visible: true,
    data: [
      { date: 'Jan 1', revenue: 800 },
      { date: 'Jan 2', revenue: 900 },
      // ... more data points
    ]
  }
];

export function DashboardPage() {
  return (
    <RevenueChart 
      series={seriesData}
      initialTimeRange="30D" 
      ariaLabel="Revenue Performance by Category"
    />
  );
}
```

### Backward Compatible Single-Series
```tsx
import RevenueChart from './RevenueChart';

const singleSeriesData = [
  { date: 'Jan 1', revenue: 1000 },
  { date: 'Jan 2', revenue: 1200 },
  // ... more data points
];

export function SimpleDashboard() {
  return (
    <RevenueChart 
      data={singleSeriesData}
      initialTimeRange="7D" 
    />
  );
}
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Enter/exit chart and legend areas |
| `Arrow Left/Right` | Navigate between data points (reversed in RTL) |
| `Arrow Up/Down` | Navigate between series at same data point |
| `Home` | Jump to first data point in current series |
| `End` | Jump to last data point in current series |
| `Space/Enter` | Toggle series visibility (in legend) |
| `Escape` | Dismiss tooltip and clear focus |

## Legend Interaction States

- **Visible Series**: Blue background with solid color indicator
- **Hidden Series**: Gray background with striped pattern indicator  
- **Only Visible Series**: Disabled state (cannot be hidden)
- **Keyboard Focus**: Clear focus ring around entire chip
- **Hover**: Subtle elevation and color changes

## Design Tokens Integration

The component uses the design system's CSS custom properties:
- `--chart-series-1` through `--chart-series-8` for series colors
- `--color-focus-ring` for accessibility focus indicators
- `--space-*` and `--radius-*` for consistent spacing and borders
- `--chart-series-pattern-ink` for hidden series pattern overlay
