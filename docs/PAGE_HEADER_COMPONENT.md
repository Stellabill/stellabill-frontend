# Page Header Component Design Specification

**Issue:** #151  
**Status:** Component Design Spec  
**Last Updated:** 2026-03-30  

---

## Table of Contents

1. [Overview](#overview)
2. [Component Variants](#component-variants)
3. [Layout & Spacing](#layout--spacing)
4. [Breadcrumbs](#breadcrumbs)
5. [Action Buttons](#action-buttons)
6. [Tabs Section](#tabs-section)
7. [Responsive Design](#responsive-design)
8. [Accessibility](#accessibility)
9. [Usage Patterns](#usage-patterns)

---

## Overview

The **Page Header Component** is a reusable UI component for page titles, navigation, and actions. It supports:

- **Title with optional subtitle**
- **Breadcrumb navigation** (with overflow handling)
- **Primary & secondary action buttons**
- **Optional tab navigation**
- **Responsive layout** (desktop to mobile)
- **Light/dark mode support** (future)

### Key Features

| Feature | Status | Notes |
|---------|--------|-------|
| Basic title + subtitle | ✅ Core | Always render |
| Breadcrumbs with overflow | ✅ Core | Dynamic truncation |
| Primary action button | ✅ Core | Blue CTA button |
| Secondary action buttons | ✅ Core | Ghost/outline style |
| Tab navigation | ✅ Optional | Show/hide tabs |
| Responsive layout | ✅ Core | Adapts to screen size |
| Icon support | ✅ Core | Icons in buttons & title |
| Loading state | ✅ Core | Spinner/disabled buttons |

---

## Component Variants

### V1: Basic (Title Only)

```
┌─────────────────────────────────────────────────────────┐
│ Dashboard                                               │
│ Welcome back                                            │
└─────────────────────────────────────────────────────────┘
```

**Props:**
```typescript
<PageHeader
  title="Dashboard"
  subtitle="Welcome back"
/>
```

---

### V2: With Breadcrumbs

```
┌─────────────────────────────────────────────────────────┐
│ Home / Subscriptions / Pro Plan                         │
│ Pro Plan Config                                          │
│ Manage plan pricing and details                         │
└─────────────────────────────────────────────────────────┘
```

**Props:**
```typescript
<PageHeader
  breadcrumbs={[
    { label: 'Home', href: '/' },
    { label: 'Subscriptions', href: '/subscriptions' },
    { label: 'Pro Plan', href: '/plans/pro' },
  ]}
  title="Pro Plan Config"
  subtitle="Manage plan pricing and details"
/>
```

---

### V3: With Actions

```
┌─────────────────────────────────────────────────────────┐
│ Plans                              [+ Create] [Export]  │
│ Manage subscription plans                               │
└─────────────────────────────────────────────────────────┘
```

**Props:**
```typescript
<PageHeader
  title="Plans"
  subtitle="Manage subscription plans"
  primaryAction={{ label: '+ Create Plan', onClick: onCreatePlan }}
  secondaryActions={[
    { label: 'Export', onClick: onExport, icon: '📥' },
  ]}
/>
```

---

### V4: With Tabs

```
┌─────────────────────────────────────────────────────────┐
│ Subscription #1234                            [Cancel]  │
│ View and manage this subscription                       │
│                                                         │
│ [Overview] [Billing] [Usage Stats] [Settings]         │
├─────────────────────────────────────────────────────────┤
│ (Content area)                                          │
```

**Props:**
```typescript
<PageHeader
  title="Subscription #1234"
  subtitle="View and manage this subscription"
  primaryAction={{ label: 'Cancel', onClick: onCancel }}
  tabs={[
    { label: 'Overview', id: 'overview', active: true },
    { label: 'Billing', id: 'billing' },
    { label: 'Usage Stats', id: 'usage' },
    { label: 'Settings', id: 'settings' },
  ]}
  onTabChange={(tabId) => handleTabChange(tabId)}
/>
```

---

### V5: Full Featured

```
┌─────────────────────────────────────────────────────────┐
│ Home / Customers / Acme Corp                [⋯] [Edit] │
│ 🏢 Acme Corporation                                     │
│ Enterprise customer account with AR                     │
│                                                         │
│ [Overview] [Billing] [Contracts] [Activity]            │
├─────────────────────────────────────────────────────────┤
│ (Content area)
```

**Props:**
```typescript
<PageHeader
  breadcrumbs={[...]}
  icon="🏢"
  title="Acme Corporation"
  subtitle="Enterprise customer account with AR"
  primaryAction={{ label: 'Edit', onClick: onEdit }}
  secondaryActions={[
    { label: 'More', onClick: onMore, icon: '⋯' },
  ]}
  tabs={[
    { label: 'Overview', id: 'overview', active: true },
    { label: 'Billing', id: 'billing' },
    { label: 'Contracts', id: 'contracts' },
    { label: 'Activity', id: 'activity' },
  ]}
/>
```

---

## Layout & Spacing

### Header Structure

```
┌────────────────────────────────────────────────┐
│ [Breadcrumbs]                                  │ ← 8px top, 16px sides
├────────────────────────────────────────────────┤
│ [Icon] Title                  [Primary] [Sec]  │ ← 12px vertical padding
│ Subtitle                                       │ ← 4px spacing below title
├────────────────────────────────────────────────┤
│ [Tab 1] [Tab 2] [Tab 3]                        │ ← If tabs present
└────────────────────────────────────────────────┘
```

### Spacing Rules

| Element | Top | Right | Bottom | Left |
|---------|-----|-------|--------|------|
| Breadcrumbs | 8px | 16px | 8px | 16px |
| Title row | 12px | 16px | 4px | 16px |
| Subtitle | 0 | 16px | 12px | 16px |
| Tabs | 8px | 16px | 0 | 16px |
| Buttons | 12px | 8px | 12px | 8px |

### Typography

| Element | Font Size | Weight | Color |
|---------|-----------|--------|-------|
| Title | 28px | 700 (bold) | #1e293b (dark) |
| Subtitle | 14px | 400 | #64748b (gray) |
| Breadcrumb text | 12px | 400 | #475569 (medium gray) |
| Tab label | 14px | 500 | #475569 (active: #0066ff) |

---

## Breadcrumbs

### Layout Rules

- **Normal state:** `Home / Subscriptions / Pro Plan`
- **Separator:** Forward slash `/` with spaces
- **Max width:** 70% of header width (prevent overflow)
- **Ellipsis pattern:** `... / Middle Item / Current Item`

### Overflow Handling (< 768px)

**Mobile breadcrumb truncation:**

When breadcrumb text exceeds available width:

1. **Show only last 2 items** (parent + current)
   ```
   .../Pro Plan
   ```

2. **Add ellipsis button** `...` → Click to expand full breadcrumb
   ```
   [... Show breadcrumb] / Pro Plan
   ```

3. **Modal on click** (optional):
   ```
   Full Breadcrumb Path
   ├─ Home
   ├─ Subscriptions
   ├─ Plans
   └─ Pro Plan (current)
   ```

### Breadcrumb Link Styling

- **Normal:** Gray, underline on hover
- **Current:** Dark gray, no link (not clickable)
- **Hover:** Color changes to blue, cursor: pointer
- **Active:** Bold text, #0066ff color

---

## Action Buttons

### Button Types

#### Primary Action
- **Style:** Solid blue background, white text
- **Size:** 40px height (tall)
- **Position:** Right side of header
- **Example:** "+ Create Plan"
- **States:**
  - Default: Blue (#0066ff)
  - Hover: Darker blue (#0052cc)
  - Disabled: Gray (#cbd5e1)
  - Loading: Spinner icon inside

#### Secondary Actions
- **Style:** Outline/ghost (no background, blue text)
- **Size:** 40px height (tall)
- **Position:** Right side, left of primary
- **Example:** "Export", "Settings", "More" (⋯)
- **States:**
  - Default: Gray text (#475569)
  - Hover: Light gray background (#f1f5f9)
  - Disabled: Light gray (#cbd5e1)

#### Icon Buttons
- **Size:** 32px icon, 40px button
- **Center aligned**
- **Hover:** Light gray background
- **Example:** Menu (≡), Settings (⚙), More (⋯)

### Button Placement Rules

```
┌─────────────────────────────────────────────────┐
│ Title              [Secondary 1] [Secondary 2] [Primary] │
└─────────────────────────────────────────────────┘
```

**Order (left to right):**
1. Title (left side)
2. Secondary actions (right side, multiple)
3. Primary action (far right, rightmost)

**Spacing:**
- Between secondary actions: 8px
- Between secondary and primary: 12px
- Right margin (edge to button): 16px

**Responsive (< 768px):**
- Stack vertically if 3+ actions
- Primary action on new row
- Full width buttons

---

## Tabs Section

### Tab Bar Layout

```
┌──────────────────────────────┐
│ [Overview] [Billing] [Usage] │
└──────────────────────────────┘
```

### Tab Styling

- **Tab height:** 40px
- **Horizontal padding:** 16px per tab
- **Border-bottom:** 2px solid indicator (active tab)
- **Active color:** Blue (#0066ff)
- **Inactive color:** Gray (#64748b)

### Tab Behavior

- **Click to switch:** Calls `onTabChange(tabId)`
- **URL sync:** Update URL pathname with tab ID (optional)
- **Scroll on mobile:** If tabs overflow, enable horizontal scroll
- **Vertical stacking on very small screens:** (<480px) Stack tabs vertically

### Tab Overflow Handling

**When tabs exceed available width:**

1. **Horizontal scroll** (enable swipe)
   - Show left/right scroll indicators
   - Snap to tab on large momentum swipe

2. **Tab dropdown** (alternative)
   - Hide overflow tabs, show dropdown menu
   - Label: "More tabs ▼"

---

## Responsive Design

### Breakpoints

#### Desktop (≥ 1024px)
- **Header layout:** Horizontal (title left, buttons right)
- **Breadcrumbs:** Full display (ellipsis if needed)
- **Buttons:** Inline, side by side
- **Tabs:** Full horizontal bar, scrollable if needed

**Layout:**
```
[Breadcrumbs full]
[Title icon + text] ... [Secondary] [Secondary] [Primary]
[Optional tabs full bar]
```

#### Tablet (768px – 1023px)
- **Header layout:** Horizontal with reduced spacing
- **Breadcrumbs:** Truncated to last 2 items
- **Buttons:** Inline, may wrap slightly
- **Tabs:** Full bar, scrollable

**Layout:**
```
[Breadcrumb abbreviated]
[Title icon + text] ... [Secondary] [Primary]
[Tabs with scroll]
```

#### Mobile (< 768px)
- **Header layout:** Vertical stacking
- **Breadcrumbs:** Expand/collapse or dismiss
- **Buttons:** Stack vertically, full width
- **Tabs:** Scrollable horizontal or stacked

**Layout:**
```
[... Breadcrumbs Expand]
[Icon Title]
[Subtitle if exists]
[Primary button full width]
[Secondary button full width]
[Tabs scrollable or dropdown]
```

#### Very Small (< 480px)
- **Single column layout**
- **Title:** Smaller font (24px)
- **Buttons:** Full width, stacked
- **Tabs:** Dropdown menu or horizontal scroll with visible scroll indicators

---

## Accessibility

### ARIA Labels & Roles

```typescript
<header
  role="banner"
  aria-label="Page header"
>
  <nav aria-label="Breadcrumb">
    {/* breadcrumbs */}
  </nav>
  
  <h1>{title}</h1>
  <p>{subtitle}</p>
  
  <div role="toolbar" aria-label="Page actions">
    {/* buttons */}
  </div>
  
  <nav aria-label="Page navigation">
    {/* tabs */}
  </nav>
</header>
```

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Navigate buttons, breadcrumb links, tabs |
| `Enter` | Activate button, follow breadcrumb link, switch tab |
| `Space` | Toggle button/menu |
| `Escape` | Close any open modals/menus |
| `→` / `←` | Navigate between tabs (optional) |

### Visual Indicators

- **Focus ring:** 2px solid blue (#0066ff), rounded corners
- **Active tab:** Bold text + underline (not just color)
- **Disabled buttons:** Reduced opacity (0.5) + "not-allowed" cursor
- **Loading state:** Icon changes, text optional ("Loading")

### Color Contrast

- **Minimum WCAG AA:** 4.5:1 for text, 3:1 for UI components
- **Title:** Dark gray on white = 14:1 ✓
- **Subtitle:** Medium gray on white = 5.5:1 ✓
- **Active tab:** Blue on white = 3.5:1 ✓

---

## Usage Patterns

### Pattern 1: List Page (Dashboard, Plans, Subscriptions)

```typescript
<PageHeader
  title="Plans"
  subtitle="Manage your subscription pricing"
  primaryAction={{
    label: '+ Create Plan',
    onClick: () => navigate('/plans/create'),
    icon: '➕'
  }}
  secondaryActions={[
    {
      label: 'Export',
      onClick: () => exportPlans(),
      icon: '📥'
    }
  ]}
/>
```

### Pattern 2: Detail Page (View Subscription)

```typescript
<PageHeader
  breadcrumbs={[
    { label: 'Dashboard', href: '/' },
    { label: 'Subscriptions', href: '/subscriptions' },
    { label: 'SUB-1234', href: '' },
  ]}
  icon="📋"
  title="Subscription #1234"
  subtitle="Active since Jan 15, 2024"
  primaryAction={{
    label: 'Cancel',
    onClick: onCancel,
    destructive: true,
  }}
  tabs={[
    { label: 'Overview', id: 'overview', active: true },
    { label: 'Billing', id: 'billing' },
    { label: 'Usage', id: 'usage' },
  ]}
  onTabChange={setActiveTab}
/>
```

### Pattern 3: Settings Section

```typescript
<PageHeader
  breadcrumbs={[
    { label: 'Dashboard', href: '/' },
    { label: 'Settings', href: '/settings' },
  ]}
  title="Account Settings"
  subtitle="Manage your Stellabill account"
  tabs={[
    { label: 'Profile', id: 'profile', active: true },
    { label: 'Billing', id: 'billing' },
    { label: 'Security', id: 'security' },
    { label: 'Team', id: 'team' },
  ]}
  onTabChange={setActiveTab}
/>
```

### Pattern 4: Modal/Detail with Limited Actions

```typescript
<PageHeader
  title="Edit Plan"
  subtitle="Update pricing and billing frequency"
  primaryAction={{
    label: 'Save',
    onClick: onSave,
  }}
  secondaryActions={[
    { label: 'Cancel', onClick: onCancel }
  ]}
  isLoading={isSaving}
/>
```

---

## Design References

**Existing mockups:**
- `docs/designs/dashboard-header.png` — Header style reference
- `docs/designs/plans-header.png` — Plans page header
- `docs/designs/subscription-detail.png` — Detail page pattern

**Component library patterns:**
- Radix UI Tabs → Accessible tab implementation
- Tailwind UI → Button + spacing patterns
- Stripe Dashboard → Multi-action header style

---

## Implementation Checklist

### MVP

- [ ] Core component structure (title, subtitle, icon)
- [ ] Breadcrumb rendering with overflow handling
- [ ] Primary action button
- [ ] Secondary action buttons (multiple)
- [ ] Tab navigation (optional render)
- [ ] Responsive layout (desktop/tablet/mobile)
- [ ] Accessibility (ARIA, keyboard nav, focus management)
- [ ] Loading state (disabled buttons, spinner)
- [ ] 95%+ test coverage
- [ ] Documentation (this spec + component stories)

### Future

- [ ] Light/dark mode support
- [ ] Animation transitions
- [ ] Breadcrumb modal on mobile
- [ ] Tab dropdown menu for overflow
- [ ] URL-synced tab navigation
- [ ] Customizable color themes
- [ ] Icon library integration

