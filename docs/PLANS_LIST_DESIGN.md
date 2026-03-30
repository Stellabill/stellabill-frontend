# Plans List Page Design Specification

**Issue:** #130  
**Status:** Design & Implementation Spec  
**Last Updated:** 2026-03-30  

---

## Table of Contents

1. [Overview](#overview)
2. [Page Layout](#page-layout)
3. [Table Structure](#table-structure)
4. [Filter Controls](#filter-controls)
5. [Empty States](#empty-states)
6. [Bulk Actions](#bulk-actions)
7. [Responsive Design](#responsive-design)
8. [Accessibility](#accessibility)
9. [Performance Considerations](#performance-considerations)
10. [Future Pagination & Sorting](#future-pagination--sorting)

---

## Overview

The **Plans List Page** displays all billing plans configured in Stellabill. It provides:
- **Tabular view** of plans with key metadata
- **Filter & search** to quickly find specific plans
- **Bulk actions** for managing multiple plans (delete, archive, duplicate)
- **Responsive design** that gracefully adapts to mobile (card layout)
- **Empty state** guidance for first-time setup
- **Future extensibility** for pagination and advanced sorting

### Key Features

| Feature | Status | Notes |
|---------|--------|-------|
| Table display (5+ columns) | ✅ Spec | Name, Type, Price, Currency, Status, Actions |
| Search by plan name | ✅ Spec | Case-insensitive, real-time filtering |
| Status filter (Active/Inactive/Draft) | ✅ Spec | Multi-select chip filters |
| Sorting by column headers | ✅ Future | Clickable headers, ascending/descending |
| Pagination (offset/limit) | ✅ Future | Load 10/25/50 rows per page |
| Bulk select & delete | ✅ Spec | Scaffolding with checkboxes |
| Empty state UI | ✅ Spec | CTA to create first plan |
| Mobile responsive | ✅ Spec | Card layout for screens < 768px |

---

## Page Layout

### Header Section

```
┌─────────────────────────────────────────────────────────────┐
│ Plans                                 [+ Create Plan Button] │
│ Manage your subscription plans and pricing                   │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- Page title: "Plans" (24px, bold)
- Subtitle: "Manage your subscription plans and pricing" (14px, gray)
- Primary CTA: "+ Create Plan" button (blue, top-right alignment)

### Filter Bar Section

```
┌─────────────────────────────────────────────────────────────┐
│ [Search...] [Status ▼] [Type ▼] [Clear Filters] [Sort ▼]   │
└─────────────────────────────────────────────────────────────┘
```

**Controls (left to right):**
1. **Search input** — Search by plan name (debounced, 300ms)
2. **Status filter** — Chip selector: All (default), Active, Draft, Inactive
3. **Type filter** — Chip selector: All, Fixed, Usage-based, Tiered
4. **Clear Filters** — Resets all filters and search (gray button, only when active)
5. **Sort dropdown** — Default: "Newest", options: Name (A-Z), Price (Low-High), Status

---

## Table Structure

### Column Definitions

| Column | Width | Content | Truncation | Alignment |
|--------|-------|---------|-----------|-----------|
| **Checkbox** | 40px | Select row | N/A | Center |
| **Name** | 200px | Plan name + badge | Ellipsis (2 lines max) | Left |
| **Type** | 140px | Billing type | No truncate | Left |
| **Price** | 120px | Amount + currency | No truncate | Right |
| **Status** | 100px | Badge (Active/Draft/Inactive) | No truncate | Center |
| **Actions** | 120px | Edit, Duplicate, Delete (icons) | N/A | Right |

### Column Headers

- **Clickable headers** (future sorting)
  - Indicate sortable columns with up/down chevron when active
  - Visual feedback: text color changes, chevron appears
  - Cursor: pointer on hover

- **Minimum table height**: 300px (shows 5-8 rows without scrolling)
- **Row height**: 52px (padding: 12px 16px)

### Row States

#### Normal Row
```
[☐] Plan Name (12mo)      Fixed      $99.00/yr    Active    [✎] [⋯] [🗑]
```
- Background: White
- Hover: Light gray (#f8fafc)
- Border-bottom: 1px #e2e8f0

#### Selected Row
```
[☑] Plan Name (12mo)      Fixed      $99.00/yr    Active    [✎] [⋯] [🗑]
```
- Background: Light blue (#eff6ff)
- Checkbox: Checked (blue)

#### Disabled Row (due to bulk delete pending)
```
[☐] Plan Name (12mo)      Fixed      $99.00/yr    Active    [✎] [⋯] [🗑] ✔
```
- Opacity: 0.6
- Actions: Disabled (grayed out)
- Checkmark icon: Shows confirmation state

### Example Data Rows

```
[☐] Pro Plan               Fixed      $29.00/mo    Active    [✎] [⋯] [🗑]
[☐] Enterprise            Fixed      $99.00/mo    Active    [✎] [⋯] [🗑]
[☐] Starter (Trial)       Fixed      FREE         Draft     [✎] [⋯] [🗑]
[☐] Usage-Based API       Usage      $0.10/req    Active    [✎] [⋯] [🗑]
[☐] Tiered Volume         Tiered     $25-100/mo   Inactive  [✎] [⋯] [🗑]
```

---

## Filter Controls

### 1. Search Input

- **Placeholder**: "Search by plan name..."
- **Icon**: Magnifying glass (left side)
- **Clear button**: Appears when input has text (right side, gray 'x')
- **Behavior**: Debounced filtering (300ms delay)
- **Case-insensitive** matching against plan name
- **Results update** immediately on API call completion

### 2. Status Filter Chips

**Available options:**
- "All" (default)
- "Active" (green badge)
- "Draft" (yellow badge)
- "Inactive" (gray badge)

**Behavior:**
- Single-select (only one status visible at a time)
- Chip appearance when selected: blue background, white text
- Multiple status filtering in future versions

### 3. Type Filter Chips

**Available options:**
- "All" (default)
- "Fixed" (static monthly/annual pricing)
- "Usage-based" (per-unit charges)
- "Tiered" (quantity-based pricing tiers)

**Display logic:**
- Show only types that exist in current dataset
- Hide empty filters with `display: none`

### 4. Clear Filters Button

- **Label**: "Clear Filters"
- **Visibility**: Only visible when search OR any filter is active
- **Action**: Resets search input, status filter, type filter, sort
- **Visual**: Gray outline button with 'x' icon

### 5. Sort Dropdown

**Default:** "Newest" (creation date, descending)

**Options:**
1. Newest (created_at DESC)
2. Name (name ASC)
3. Name (Z-A) (name DESC)
4. Price (Low-High) (price ASC)
5. Price (High-Low) (price DESC)
6. Status (Active first, then Draft, then Inactive)

---

## Empty States

### Empty State: No Plans (First-Time)

**Trigger:** `plans.length === 0 && !hasFiltersApplied`

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                    📋 No Plans Yet                           │
│                                                               │
│          Get started by creating your first billing          │
│             plan and pricing structure.                      │
│                                                               │
│              [+ Create Your First Plan] (Blue)               │
│                                                               │
│  Learn more: [📖 Pricing Setup Guide]                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Styling:**
- Centered, min-height: 300px
- Icon: Large (48px), gray (#94a3b8)
- Heading: 18px, bold (#1e293b)
- Description: 14px, gray (#64748b)
- CTA Button: Primary blue, 40px height
- Helper link: Gray, underline on hover

### Empty State: No Search Results

**Trigger:** `plans.length === 0 && hasSearchApplied`

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                  🔍 No Plans Found                           │
│                                                               │
│     No results match "enterprise-annual". Try:              │
│     • Check spelling                                         │
│     • Use shorter search terms                              │
│     • Clear filters and try again                           │
│                                                               │
│                   [Clear Search] (Gray)                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Bulk Actions

### Bulk Action Bar (Sticky Header When Rows Selected)

**Trigger:** When 1+ rows are selected (checkbox checked)

```
┌─────────────────────────────────────────────────────────────┐
│ ✓ 3 plans selected   [Duplicate] [Archive] [Delete] [✕]     │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
1. **Selection badge** — "✓ N plans selected" (blue text)
2. **Action buttons:**
   - "Duplicate" → Copy selected plan(s) with suffix " (copy)"
   - "Archive" → Move to inactive status
   - "Delete" → Soft delete with confirmation modal
3. **Close button** (✕) → Deselect all, hide bar

### Confirmation Modal (Bulk Delete)

```
┌─────────────────────────────────────────┐
│ Delete 3 Plans?                         │
│                                         │
│ Are you sure? This action cannot       │
│ be undone.                             │
│                                         │
│ Plans to delete:                       │
│ • Pro Plan                             │
│ • Enterprise                           │
│ • Starter (Trial)                      │
│                                         │
│ [Cancel] [Delete (Red)]                │
└─────────────────────────────────────────┘
```

**Behavior:**
- Show affected plan names in modal
- "Delete" button is RED with destructive styling
- Confirmation required (no undo)
- Disable table during deletion (loading state)

---

## Responsive Design

### Breakpoints & Layout Changes

#### Desktop (≥ 1024px)
- **Table layout** → Full table display
- **Filter bar** → Horizontal (all controls in one row)
- **Actions** → Icon buttons (compact)

#### Tablet (768px – 1023px)
- **Table layout** → Full table with horizontal scroll
- **Filter bar** → Wrap to 2 rows if needed
- **Actions** → Show icons + text labels (e.g., "Edit")

#### Mobile (< 768px)
- **Card layout** → Replace table with vertical cards
- **Card height** → ~120px per plan
- **Filter bar** → Stack vertically (one control per row)
- **Search** → Full width
- **Actions** → Slide-out menu (swipe or tap icon)

### Mobile Card Layout

```
┌──────────────────────────────────┐
│ Pro Plan                    [☰]  │  ← Swipe menu or tap
│ Fixed • $29/mo                   │
│                                  │
│ Status: Active    [Created 2 mo] │
│                                  │
└──────────────────────────────────┘
```

**Card actions** (revealed on swipe or tap menu):
- Edit
- Duplicate
- Delete

### Mobile Filter Bar

```
[Search...       ]
[Status: All ▼  ]
[Type: All ▼    ]
[Clear] [Sort ▼]
```

**Behavior:**
- Filters collapse/expand on tap
- Full-width inputs and selects
- Sticky header with table/list content

---

## Accessibility

### ARIA Labels & Roles

- **table** → `role="table"`
- **headers** → `<th scope="col">`
- **checkbox** → `aria-label="Select plan: {planName}"`
- **action buttons** → `aria-label="Edit Pro Plan"`, etc.
- **filter buttons** → `aria-pressed="true/false"`
- **sort indicators** → `aria-sort="ascending/descending/none"`

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Navigate through table, buttons |
| `Enter` | Activate filter, open modal |
| `Escape` | Close modals, hide menus |
| `Space` | Toggle checkbox |
| `Ctrl+F` | Focus search input |

### Color Contrast

- **Minimum WCAG AA** (4.5:1 for text, 3:1 for UI components)
- Status badges: Ensure text is readable on colored backgrounds
- Disabled state: Not relied upon as sole indicator (also check icon/text)

---

## Performance Considerations

### Optimization Strategies

1. **Virtual scrolling** (if 100+ plans)
   - Render only visible rows
   - Maintain smooth scrolling
   - Lazy-load images (if applicable)

2. **Debounced search**
   - Wait 300ms after user stops typing
   - Reduce API calls
   - Show loading spinner while fetching

3. **Pagination support** (future)
   - Load 10 rows by default
   - "Load more" or "Next page" button
   - Keep scroll position on page change

4. **Lazy filter evaluation**
   - Only fetch/filter on filter change
   - Cache search results if possible
   - Clear cache on data mutation

5. **Memoization**
   - Use `React.memo()` for row components
   - Prevent unnecessary re-renders on filter changes

---

## Future Pagination & Sorting

### Pagination (Roadmap)

**Implementation pattern:**
```typescript
// Query parameters
?offset=0&limit=10

// Response structure
{
  data: Plan[],
  total: 250,
  hasMore: true,
  offset: 0,
  limit: 10
}
```

**UI elements:**
- Page indicator: "Showing 1-10 of 250"
- Page size selector: [10] [25] [50]
- Prev/Next buttons or page numbers

### Advanced Sorting (Roadmap)

**Secondary sort support:**
- Primary: Status (Active, Draft, Inactive)
- Secondary: Creation date (newest first)
- Example: Show all Active plans, newest first

**URL representation:**
```
/plans?sort=status:asc,createdAt:desc
```

---

## Implementation Checklist

### MVP (Issue #130)

- [ ] Page header with title, subtitle, CTA button
- [ ] Filter bar (search, status, type, clear, sort)
- [ ] Table with 5+ columns (Name, Type, Price, Currency, Status)
- [ ] Row selection checkboxes
- [ ] Bulk action bar & confirmation modal
- [ ] Empty states (no plans, no search results)
- [ ] Responsive design (table → cards at < 768px)
- [ ] Accessibility (ARIA labels, keyboard nav)
- [ ] 95%+ test coverage
- [ ] Documentation (this spec + inline code comments)

### Future (Post-MVP)

- [ ] Pagination (offset/limit API support)
- [ ] Multi-column sorting
- [ ] Bulk archive/duplicate
- [ ] Export plans as CSV
- [ ] Plan templates / quick-start plans
- [ ] Advanced filters (date created, price range)
- [ ] Analytics: usage trends per plan

---

## Design References

**Existing mockups:**
- `docs/designs/plans-header.png` — Header layout reference
- `docs/designs/plans-table.png` — Table structure reference
- `docs/designs/dashboard-header.png` — Color/typography system

**External inspiration:**
- Stripe Dashboard → Table + bulk actions pattern
- GitHub Issues → Filter chips + sort dropdown
- Linear → Responsive card layout for mobile
