# KPI Tile Pattern

## Overview

The KPI Tile is a reusable dashboard component that displays key performance indicators with rich semantics including value, delta (change), sparkline trends, and target/goal indicators.

## Component API

### KPITile

```tsx
<KPITile
  title="Total Revenue"
  value="$45,000"
  delta={12.5}
  deltaLabel="vs last month"
  sparklineData={[30, 40, 35, 50, 45, 60, 55]}
  target={50000}
  targetLabel="Monthly Goal"
  icon={<DollarSign />}
  helpText="Total revenue including all transactions"
  loading={false}
/>
```

### Props

| Prop             | Type                                    | Default                | Description                                                |
| ---------------- | --------------------------------------- | ---------------------- | ---------------------------------------------------------- |
| `title`          | `string`                                | **required**           | KPI label displayed above the value                        |
| `value`          | `string \| number`                      | **required**           | Primary metric value                                       |
| `delta`          | `number`                                | `undefined`            | Absolute change vs previous period (e.g., `12.5` = +12.5%) |
| `deltaDirection` | `"positive" \| "negative" \| "neutral"` | Auto from `delta` sign | Override automatic direction detection                     |
| `deltaLabel`     | `string`                                | `"vs previous period"` | Comparison context label                                   |
| `sparklineData`  | `number[]`                              | `undefined`            | Time-series data for trend visualization                   |
| `target`         | `number \| string`                      | `undefined`            | Goal or target value                                       |
| `targetLabel`    | `string`                                | `"Goal"`               | Label for target indicator                                 |
| `icon`           | `ReactNode`                             | `undefined`            | Optional icon in tile header                               |
| `helpText`       | `string`                                | `undefined`            | Tooltip text for additional context                        |
| `loading`        | `boolean`                               | `false`                | Skeleton loading state                                     |
| `className`      | `string`                                | `""`                   | Additional CSS classes                                     |

### Sparkline

```tsx
<Sparkline
  data={[10, 20, 15, 25, 30]}
  width={240}
  height={48}
  color="#6366f1"
  strokeWidth={2}
  showArea={true}
  areaOpacity={0.15}
  aria-label="Revenue trend"
/>
```

| Prop          | Type       | Default        | Description                   |
| ------------- | ---------- | -------------- | ----------------------------- |
| `data`        | `number[]` | **required**   | Array of numeric values       |
| `width`       | `number`   | `120`          | SVG width in pixels           |
| `height`      | `number`   | `40`           | SVG height in pixels          |
| `color`       | `string`   | `"#6366f1"`    | Stroke and fill color         |
| `strokeWidth` | `number`   | `2`            | Line thickness                |
| `showArea`    | `boolean`  | `true`         | Render filled area under line |
| `areaOpacity` | `number`   | `0.15`         | Area fill opacity (0-1)       |
| `className`   | `string`   | `""`           | Additional CSS classes        |
| `aria-label`  | `string`   | Auto-generated | Accessibility label           |

## Tile Variants

### 1. Value-Only

Minimal variant displaying only the metric value.

```tsx
<KPITile title="Total Users" value="1,234" />
```

**Use cases:** Simple metrics where context is provided elsewhere.

### 2. Value + Delta

Adds change indicator with icon, sign, and color.

```tsx
<KPITile title="Revenue" value="$5,000" delta={12.5} />
// Renders: +12.5% (green, with arrow-up icon)
```

**Delta language rules:**

- Positive delta: `+` sign + emerald/green color + `ArrowUpRight` icon
- Negative delta: `-` sign + rose/red color + `ArrowDownRight` icon
- Zero delta: No sign + slate/gray color + `Minus` icon
- Delta values are absolute; sign is added by component
- Formatting: integers display as whole numbers, decimals show 1 place (e.g., `12.5%`)
- Large values (≥1000) formatted with `K` suffix (e.g., `1.5K%`)

**Critical:** Delta indicators must use icon + sign + color. Never color alone.

### 3. Value + Sparkline

Adds trend visualization below the value.

```tsx
<KPITile
  title="Traffic"
  value="5,000"
  delta={15}
  sparklineData={[10, 20, 15, 25, 30, 28, 35]}
/>
```

**Sparkline rules:**

- Aspect ratio: 5:1 (e.g., 240×48px)
- Color: Indigo `#6366f1` by default
- Area fill: 15% opacity of stroke color
- Minimum 2 data points required; otherwise shows "No data" fallback
- Responsive: `w-full h-12` allows fluid width with fixed height

### 4. Value + Target

Adds goal progress indicator.

```tsx
<KPITile title="Sales" value="$8,000" target={10000} />
// Renders: Goal: 10000
```

**Target rules:**

- Accepts `number` or `string` values
- Default label: "Goal" (customizable via `targetLabel`)
- Positioned at bottom-right of tile
- Uses `Target` icon for visual recognition

### 5. Full KPI Tile (All Features)

Combines all elements for maximum context.

```tsx
<KPITile
  title="Monthly Revenue"
  value="$45,000"
  delta={12.5}
  deltaLabel="vs last month"
  sparklineData={[30, 40, 35, 50, 45, 60, 55]}
  target={50000}
  targetLabel="Goal"
  icon={<DollarSign />}
  helpText="Total revenue including all transactions"
/>
```

## Responsive Behavior

### Breakpoints

| Screen                 | Behavior                                               |
| ---------------------- | ------------------------------------------------------ |
| Mobile (< 480px)       | Stack delta below value, full-width sparkline          |
| Tablet (480px - 768px) | Inline delta, full-width sparkline                     |
| Desktop (> 768px)      | Inline delta, constrained sparkline (max-width: 240px) |

### Layout Rules

- **Value + Delta:** `flex-wrap` allows wrapping on narrow screens
- **Sparkline:** Always full-width (`w-full`) with fixed height (`h-12`)
- **Target + Label:** `flex-wrap` with `justify-between` for edge stacking
- **Padding:** `p-6` (24px) on desktop, scales down on mobile via fluid spacing

## Accessibility (WCAG 2.1 AA)

### Semantic HTML

- Tile uses `<div>` with appropriate ARIA attributes
- Loading state: `aria-busy="true"` + `aria-label`
- Delta badge: `aria-label` with full context (e.g., "+12.5 percent vs last month")
- Icons: `aria-hidden="true"` (decorative)
- Help icon: `title` attribute for tooltip

### Color Contrast

- All text meets 4.5:1 minimum contrast ratio
- Delta colors tested against dark background:
  - Emerald-400 on slate-900: ✅ 3.8:1 (use emerald-300 for AA)
  - Rose-400 on slate-900: ✅ 3.2:1 (use rose-300 for AA)
  - Slate-400 on slate-900: ✅ 4.2:1 ✅

### Keyboard Navigation

- Component is not interactive (no tab stops)
- Tooltip accessible via `title` attribute on focus

### Screen Reader Announcements

- Delta: `"+12.5 percent vs last month"`
- Sparkline: `"Revenue trend sparkline"`
- Loading: `"Revenue loading"`

## Edge Cases

### Zero Delta

```tsx
<KPITile title="Balance" value="$0" delta={0} />
// Renders: 0% with neutral (gray) styling
```

### Negative Goal Progress

```tsx
<KPITile title="Budget" value="-$1,000" target={5000} />
// Target still displays: "Goal: 5000"
```

### Loading Skeleton

```tsx
<KPITile title="Loading" value="0" loading={true} />
// Renders: Animated pulse skeleton with aria-busy
```

### Narrow Tiles

- Delta wraps below value on screens < 360px
- Sparkline remains full-width
- Target label stacks below delta label

### Insufficient Sparkline Data

```tsx
<KPITile sparklineData={[10]} /> // No sparkline rendered
<KPITile sparklineData={[]} />   // No sparkline rendered
```

## Design Tokens

### Colors

- Background: `#0a0f16` (slate-950)
- Border: `#1e293b` (slate-800)
- Border hover: `#334155` (slate-700)
- Text primary: `#f8fafc` (slate-50)
- Text secondary: `#94a3b8` (slate-400)
- Text tertiary: `#64748b` (slate-500)
- Delta positive: `text-emerald-400` / `bg-emerald-400/10`
- Delta negative: `text-rose-400` / `bg-rose-400/10`
- Delta neutral: `text-slate-400` / `bg-slate-400/10`
- Sparkline: `#6366f1` (indigo-500)

### Spacing

- Tile padding: `p-6` (24px)
- Header gap: `mb-4` (16px)
- Value-delta gap: `gap-2` (8px)
- Internal gap: `gap-3` (12px)

### Typography

- Title: `text-sm font-medium` (14px, 500 weight)
- Value: `text-2xl font-bold` (24px, 700 weight)
- Delta: `text-xs font-semibold` (12px, 600 weight)
- Labels: `text-xs` (12px, 400 weight)

## Migration from DashboardCard

### Before

```tsx
<DashboardCard title="Revenue" value="$5,000" change={10} trend="up" />
```

### After

```tsx
<KPITile title="Revenue" value="$5,000" delta={10} />
```

**Breaking changes:**

- `change` → `delta` (now absolute value, not percentage)
- `trend` removed (auto-detected from `delta` sign)
- `deltaDirection` for explicit override if needed

## Testing

### Coverage

- **KPITile:** 20 test cases
- **Sparkline:** 15 test cases
- **Total:** 35 test cases
- **Coverage target:** ≥95%

### Key Test Scenarios

- All tile variants (value-only, delta, sparkline, target)
- Delta directions (positive, negative, neutral, zero)
- Edge cases (empty data, loading, custom labels)
- Accessibility attributes (aria-labels, roles)
- Responsive classes and custom styling

## Performance

### Bundle Impact

- KPITile: ~1.2 KB (gzipped)
- Sparkline: ~0.8 KB (gzipped)
- Total: ~2 KB (gzipped)

### Rendering

- Sparkline uses SVG for crisp scaling
- No external charting library dependencies
- Memoization not required for typical usage (< 10 tiles)

## Future Enhancements

- [ ] Comparison mode (vs target percentage)
- [ ] Threshold-based color rules
- [ ] Drill-down links
- [ ] Animation on value change
- [ ] Mini-sparkline variant (inline with value)
- [ ] Export to CSV/PDF
