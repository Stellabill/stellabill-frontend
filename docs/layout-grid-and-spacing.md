# Layout Grid & Spacing System

Design reference for breakpoints, spacing scale, and reusable layout patterns
in the Stellarbill frontend.

---

## Breakpoints

| Name      | Range             | Min / Max        | Container max-width |
|-----------|-------------------|------------------|---------------------|
| Mobile    | ≤ 767 px          | `max-width: 767px`  | 100% – 16 px padding each side |
| Tablet    | 768 px – 1279 px  | `min-width: 768px`  | 100% – 24 px padding each side |
| Desktop   | 1280 px – 1439 px | `min-width: 1280px` | 1280 px centered    |
| Wide      | ≥ 1440 px         | `min-width: 1440px` | 1440 px centered    |

These align with the breakpoints already used in `src/index.css` (`760 px`, `1200 px`)
and `src/components/Landing/` modules (`768 px`, `1024 px`), consolidated into one set.

**Usage in CSS:**

```css
/* Mobile — default (mobile-first) */
.component { padding: 16px; }

/* Tablet and up */
@media (min-width: 768px) {
  .component { padding: 24px; }
}

/* Desktop and up */
@media (min-width: 1280px) {
  .component { padding: 40px; }
}
```

---

## Spacing Scale

Base unit: **4 pt**. Primary rhythm uses **8 pt** steps (every even key).
Fine-grained steps (odd keys) fill the gaps between primary steps.

| Token        | Value  | Step type        | Common use                         |
|--------------|--------|------------------|------------------------------------|
| `--space-0`  | 0 px   | —                | Reset / no spacing                 |
| `--space-1`  | 4 px   | 4 pt fine        | Icon gap, badge padding            |
| `--space-2`  | 8 px   | **8 pt primary** | Tight gap between related items    |
| `--space-3`  | 12 px  | 4 pt fine        | Input internal padding             |
| `--space-4`  | 16 px  | **8 pt primary** | Base padding, card inner           |
| `--space-5`  | 20 px  | 4 pt fine        | Medium gap                         |
| `--space-6`  | 24 px  | **8 pt primary** | Comfortable gap, section padding   |
| `--space-8`  | 32 px  | **8 pt primary** | Between cards / list items         |
| `--space-10` | 40 px  | **8 pt primary** | Horizontal page padding (desktop)  |
| `--space-12` | 48 px  | **8 pt primary** | Section vertical padding           |
| `--space-16` | 64 px  | **8 pt primary** | Large section gap                  |
| `--space-20` | 80 px  | **8 pt primary** | Hero / landing section gap         |
| `--space-24` | 96 px  | **8 pt primary** | Page-level vertical rhythm         |

### Usage rules

- **Always pick a value from this scale.** No hardcoded spacing values (e.g. `padding: 13px`) anywhere in the codebase.
- Prefer primary (8 pt) steps for structural spacing (padding, margins between sections).
- Use fine-grained (4 pt) steps only for micro-adjustments within a component (icon gaps, badge padding, etc.).
- Horizontal page padding: `--space-4` (mobile) → `--space-6` (tablet) → `--space-10` (desktop).

---

## Container

The container centres content and constrains max-width at larger viewports.

```css
.container {
  width: 100%;
  max-width: var(--container-max);   /* 1280px */
  margin-inline: auto;
  padding-inline: var(--container-padding-sm); /* 16px — default */
}

@media (min-width: 768px) {
  .container {
    padding-inline: var(--container-padding-md); /* 24px */
  }
}

@media (min-width: 1280px) {
  .container {
    padding-inline: var(--container-padding-lg); /* 40px */
  }
}
```

---

## Layout Patterns

### 1 · Page Header

Full-width sticky header bar with title, optional subtitle, optional breadcrumb,
and an optional action slot (buttons, search, etc.).

```tsx
<PageHeader
  title="Browse Plans"
  subtitle="Find a subscription that works for you."
  breadcrumb={<Breadcrumb />}
  action={<Button>Create Plan</Button>}
/>
```

**Behaviour across breakpoints:**

| Breakpoint | Layout                              |
|------------|-------------------------------------|
| Desktop    | Title left, actions right — one row |
| Tablet     | Same, with reduced horizontal padding |
| Mobile     | Actions stack below title           |

---

### 2 · Content Section

Padded section wrapper with an optional header (title + description) and a body slot.
Centres content up to `--container-max`.

```tsx
<ContentSection title="Recent Payments" description="Last 30 days of activity.">
  <RecentPayments />
</ContentSection>
```

**Behaviour across breakpoints:**

| Breakpoint | Padding (top/bottom × left/right) |
|------------|------------------------------------|
| Desktop    | 48 px × 40 px                     |
| Tablet     | 32 px × 24 px                     |
| Mobile     | 24 px × 16 px                     |

---

### 3 · Sidebar Layout

Two-column layout: a fixed-width sidebar plus a fluid main content area.
On mobile the sidebar **stacks above** the main content.

```tsx
<SidebarLayout
  sidebar={<DashboardNav />}
>
  <Outlet />
</SidebarLayout>
```

**Behaviour across breakpoints:**

| Breakpoint | Layout                                          |
|------------|-------------------------------------------------|
| Desktop    | Sidebar (260 px) + main side by side, gap 32 px |
| Tablet     | Sidebar (220 px) + main side by side, gap 24 px |
| Mobile     | Sidebar stacked above main, full width          |

> **Edge case:** Long sidebar content on mobile creates extra vertical scroll.
> Wrap sidebar content in a collapsible if needed.

---

### 4 · Empty State

Centred block shown when a list or data view has no items.

```tsx
<EmptyState
  icon={<InboxIcon />}
  title="No plans yet"
  description="Create your first plan to get started."
  action={<Button>Create Plan</Button>}
/>
```

**Behaviour across breakpoints:**

| Breakpoint | Max-width of block |
|------------|--------------------|
| Desktop    | 480 px centred     |
| Tablet     | 400 px centred     |
| Mobile     | Full width, 16 px padding each side |

---

### 5 · Card Grid

Responsive CSS grid for displaying plan cards, pricing cards, or any card-based content.

```tsx
<CardGrid>
  {plans.map(p => <PlanCard key={p.id} {...p} />)}
</CardGrid>
```

| Breakpoint | Columns |
|------------|---------|
| Desktop    | 3       |
| Tablet     | 2       |
| Mobile     | 1       |

Gap: `--space-6` (24 px) on desktop/tablet, `--space-4` (16 px) on mobile.

**Example — existing `browse-grid` in `src/index.css` follows this same pattern:**

```css
.browse-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px; /* var(--space-6) */
}

@media (max-width: 1200px) {
  .browse-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 760px) {
  .browse-grid { grid-template-columns: 1fr; }
}
```

---

### 6 · Dense Table

Full-width data table with compact row padding, suitable for the Plans table
and Recent Payments views.

```tsx
<DenseTable
  columns={[
    { key: 'name',   label: 'Plan'    },
    { key: 'price',  label: 'Price'   },
    { key: 'status', label: 'Status'  },
  ]}
  rows={plans}
  caption="Active plans"
/>
```

| Breakpoint | Row height | Cell padding              |
|------------|------------|---------------------------|
| Desktop    | 48 px      | 12 px top/bottom, 16 px sides |
| Tablet     | 48 px      | same                      |
| Mobile     | auto       | 8 px top/bottom, 12 px sides; table scrolls horizontally |

> **Edge case:** On narrow viewports the table overflows horizontally.
> Always wrap in a scrollable container rather than truncating content.

---

## Rules

1. **No hardcoded spacing values** anywhere outside `src/design/tokens.css`.
   Always reference a token: `var(--space-4)` not `16px`.

2. **No layout logic in page components.** Pages compose layout primitives
   (`PageHeader`, `ContentSection`, `SidebarLayout`, etc.) and pass content as children.
   Pages must not contain padding, margin, grid, or flexbox layout rules directly.

3. **Mobile-first CSS.** Write default styles for mobile, then override with
   `min-width` media queries for tablet and desktop.

4. **Token selection guide:**
   - Component internals (icon gaps, badge padding): fine-grained `--space-1` / `--space-3` / `--space-5`
   - Component padding: primary `--space-4` (mobile) → `--space-6` (tablet) → `--space-8`+ (desktop)
   - Between cards / list rows: `--space-6` or `--space-8`
   - Between page sections: `--space-12` or `--space-16`
   - Hero / landing sections: `--space-20` or `--space-24`
