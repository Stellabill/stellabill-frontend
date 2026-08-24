# Saved Views — Design System Documentation

## Overview

The **saved-views manager** lets users on the Subscriptions page capture the current filter state under a named view, switch between saved views with a single click, and share a view with a team-mate via URL. Views are persisted locally (localStorage) and optionally encoded in the page URL, so a direct link always reopens the same filtered view.

The feature is built from four pieces:

| Piece | File | Role |
|---|---|---|
| `useSavedViews` | `src/hooks/useSavedViews.ts` | State, persistence, URL sync |
| `SavedViewsDropdown` | `src/components/SavedViewsDropdown/` | Trigger button + dropdown panel |
| `SaveViewModal` | `src/components/SaveViewModal/` | Save-new / rename dialog |
| `ShareURLModal` | `src/components/ShareURLModal/` | Copy-to-clipboard share dialog |

---

## Architecture

### `useSavedViews` hook

`useSavedViews` is the single source of truth. It:

- **Loads** the view store from `localStorage` under key `sb:saved-views` on mount (falls back gracefully when storage is unavailable or the JSON is corrupt).
- **Writes** back to localStorage on every state change (via a `useEffect` on `[views, activeViewId]`).
- **Syncs from the URL** on mount: if `?view=<id>` is present and the matching view exists in the store it is activated; if `?sv_status=<status>` is present it is applied as an ad-hoc filter without activating a named view.
- **Writes to the URL** when `applyView` or `setFilters` is called, so the browser history accurately reflects the view state.
- Exposes **CRUD operations**: `saveView`, `updateView`, `renameView`, `deleteView`, `setDefault`, `clearDefault`, `togglePin`.
- Derives **`isUnsaved`**: `true` when `currentFilters` differs from `activeView.filters` (or from `DEFAULT_FILTERS` when no view is active).
- Enforces a hard cap of `MAX_VIEWS = 20`; `saveView` drops the oldest entry when the limit is exceeded.
- Provides **`getShareURL(id)`** which builds `<origin><pathname>?view=<encodedId>`.

```
useSavedViews
 ├── reads: localStorage("sb:saved-views")
 ├── reads/writes: URLSearchParams via react-router-dom useSearchParams
 ├── exposes: views, pinnedViews, recentViews, activeView, currentFilters, isUnsaved
 └── exposes: saveView, updateView, renameView, deleteView, setDefault,
              clearDefault, togglePin, applyView, setFilters, getShareURL, MAX_VIEWS
```

### `SavedViewsDropdown`

The UI entry point. A controlled component that receives hook values as props and calls back when the user acts:

- **Trigger button** — shows active view name (or "All subscriptions"), amber "Unsaved" badge when `isUnsaved`, and a chevron that rotates on open.
- **Pinned section** — lists views with `isPinned: true` under a "📌 Pinned" heading. Hidden when empty.
- **Recent section** — lists unpinned views (up to 5, sorted by `updatedAt` desc) under a "Recent" heading if pinned views are also present.
- **Unsaved-changes banner** — appears at the top of the panel when `isUnsaved`. Offers "Save changes" (in-place update) and "Save as new" when an active view exists, or just "Save as new view" when filters are unsaved with no active view.
- **Per-row three-dot sub-menu** — flyout with Rename, Set/Remove default, Pin/Unpin, Share URL, Delete.
- **Footer** — "Save current view" button, disabled when `views.length >= MAX_VIEWS`.
- **See all link** — shown when `views.length > displayedViews.length` (i.e. total views exceed pinned + 5 recent). Placeholder for a future full views manager.

See [SavedViewsDropdown.api.md](SavedViewsDropdown.api.md) for the full props table and accessibility notes.

### `SaveViewModal`

A focused dialog used for two modes, controlled by the `mode` prop:

- **`save`** — Names and saves the current filter state as a new view.
- **`rename`** — Renames an existing view. Duplicate-name validation skips the current name so "renaming to the same name" is not an error.

Behaviour:

- Uses `useModalFocus` (the project's shared focus-trap hook) to trap focus within the dialog, handle Escape, and restore focus to the trigger on close.
- Validates on submit (not on every keystroke); shows inline error via `role="alert"`.
- Enforces a 50-character name limit with a live character counter (`aria-live="polite"`).
- `onSave(name: string)` is called with the trimmed name; the parent decides whether to call `sv.saveView` or `sv.renameView`.

Props:

| Prop | Type | Description |
|---|---|---|
| `isOpen` | `boolean` | Mount/unmount guard |
| `mode` | `'save' \| 'rename'` | Drives title text and duplicate-name logic |
| `initialName` | `string` | Pre-fills the input in rename mode |
| `existingNames` | `string[]` | Used for duplicate detection |
| `onSave` | `(name: string) => void` | Called on valid submit |
| `onClose` | `() => void` | Called on Cancel, Escape, or backdrop click |

### `ShareURLModal`

A simple read-only dialog that displays the shareable URL and a copy-to-clipboard button:

- Uses `useModalFocus` with initial focus on the Copy button.
- `navigator.clipboard.writeText` with a `document.execCommand('copy')` fallback.
- Copy button transitions to a "Copied!" state for 2 seconds after a successful copy, using `aria-live="polite"` on the button so the change is announced.

Props:

| Prop | Type | Description |
|---|---|---|
| `isOpen` | `boolean` | Mount/unmount guard |
| `url` | `string` | The pre-built shareable URL (from `getShareURL`) |
| `viewName` | `string` | Displayed in the dialog description |
| `onClose` | `() => void` | Called on Done, Escape, or backdrop click |

---

## Data model

```ts
/** Filter dimensions a view captures */
interface ViewFilters {
  statusFilter: string; // 'All' | 'Active' | 'Paused' | 'Cancelled'
  // Extensible — add new fields here (see "Adding a new filter dimension")
}

/** A single named view */
interface SavedView {
  id: string;        // Collision-resistant ID: Date.now().toString(36) + random suffix
  name: string;      // User-chosen label, 1–50 characters
  filters: ViewFilters;
  isDefault: boolean; // At most one view may have isDefault: true at a time
  isPinned: boolean;  // Pinned views appear in the dedicated Pinned section
  createdAt: number;  // Date.now() timestamp at creation
  updatedAt: number;  // Date.now() timestamp at last mutation (filters, pin, name)
}

/** Root shape persisted to localStorage */
interface SavedViewsStore {
  views: SavedView[];
  activeViewId: string | null; // null = no named view active
}
```

Field notes:

- `id` — Generated with `Date.now().toString(36) + Math.random().toString(36).slice(2, 7)`. Long enough to avoid collisions in a single user's store; not globally unique.
- `isDefault` — The hook's `setDefault(id)` sets all other views' `isDefault` to `false` in the same pass. `clearDefault()` sets all to `false`.
- `isPinned` — `togglePin(id)` flips the flag and sets `updatedAt`, which moves the view to the top of its section.
- `createdAt` / `updatedAt` — Used for sorting within sections (most-recently-updated first). `updatedAt` is bumped on `updateView`, `renameView`, and `togglePin`.

---

## URL encoding

The hook uses two URL search parameters, managed via react-router-dom's `useSearchParams`:

### `?view=<id>`

Set when a named view is applied (`applyView`), saved (`saveView`), or when the default view is auto-applied on mount. The `id` is URL-encoded with `encodeURIComponent`.

On mount the hook reads `?view`: if a matching view exists in the store it is activated; if it does not (deleted, different device) the parameter is ignored and the default view (or `DEFAULT_FILTERS`) is used instead.

```
/subscriptions?view=lfb2z3k1m
```

### `?sv_status=<status>`

Set when the user changes filters without applying a named view (`setFilters`). The value is the raw `statusFilter` string (`Active`, `Paused`, `Cancelled`). When `statusFilter === 'All'` the parameter is omitted entirely (no noise in the URL for the default state).

```
/subscriptions?sv_status=Active
```

The two parameters are mutually exclusive: `applyView` deletes `sv_status`; `setFilters` deletes `view`. Both are deleted when a view is deleted and it was the active one.

---

## Accessibility

### WCAG 2.1 AA checklist

| Criterion | How it is met |
|---|---|
| **1.3.1 Info and Relationships** | Semantic roles (`menu`, `menuitem`, `dialog`, `separator`) convey structure; section labels are `role="presentation"` to avoid polluting the menu role |
| **1.3.3 Sensory Characteristics** | Actions are not described by shape or position alone; all icons have adjacent text labels or descriptive `aria-label` |
| **1.4.1 Use of Color** | The "Unsaved" state is communicated by badge text and icon change, not colour alone |
| **1.4.3 Contrast (Minimum)** | All text/background pairs ≥ 4.5:1 in the default dark theme (see contrast values in the component API doc) |
| **2.1.1 Keyboard** | All interactive elements are reachable and operable by keyboard; arrow navigation on view rows |
| **2.1.2 No Keyboard Trap** | Escape always closes; focus-trap in modals releases on Escape or Done/Cancel |
| **2.4.3 Focus Order** | Logical DOM order matches visual order; focus restored to trigger on close |
| **2.4.7 Focus Visible** | All focusable elements have `:focus-visible` styles using the project's `--focus-ring-shadow` token |
| **4.1.2 Name, Role, Value** | Every interactive element has an accessible name; expanded/collapsed state conveyed via `aria-expanded`; modal state via `aria-modal="true"` |
| **4.1.3 Status Messages** | The ARIA live region (`role="status" aria-live="polite"`) announces the applied view name without moving focus |

### Keyboard navigation

```
Trigger (button)
  ↓ Enter / Space — open panel
  Panel (role=menu)
    ↓ Tab          — move between footer/banner buttons
    ↓ ↓ / ↑       — move between view rows
    ↓ Enter/Space  — apply focused row's view
    ↓ Escape       — close panel, return focus to trigger
    Row actions (three-dot sub-menu)
      ↓ Click ⋯    — open sub-menu
      ↓ Escape      — close sub-menu only
      ↓ Click item  — execute action, close sub-menu
```

### Focus management

- Dropdown opens: focus stays on trigger (panel is not a true modal; keyboard users navigate with Tab or ↓).
- Dropdown closes (Escape / view applied): `triggerRef.current?.focus()`.
- `SaveViewModal` opens: focus moves to the name `<input>` (via `useModalFocus` + `initialFocusRef`). Escape and backdrop-click close the modal; focus restores to the element that triggered it.
- `ShareURLModal` opens: focus moves to the Copy button. Done / Escape / backdrop close and restore focus.

### ARIA roles summary

```
.svd (div)
  div [role="status" aria-live="polite"]   ← live region
  button [aria-haspopup="menu" aria-expanded aria-controls]   ← trigger
  div [role="menu" aria-labelledby]   ← panel
    div [role="none"]   ← unsaved bar
    div [role="none"]   ← pinned section wrapper
      div [role="presentation"]   ← section label
      div [role="menuitem" tabIndex=0 data-view-row]   ← row
        button [tabIndex=-1]   ← name (apply) button
        div [aria-hidden]   ← indicators
        button [aria-haspopup="menu" aria-expanded]   ← three-dot
          div [role="menu"]   ← sub-menu
            button [role="menuitem"]   ← Rename, Set default, …
            div [role="separator"]
            button [role="menuitem" class="--danger"]   ← Delete
    div [role="separator"]
    button [role="menuitem"]   ← Save current view (footer)
```

### Screen reader announce pattern

When a view is applied the component:

1. Calls `onApplyView(id)`.
2. Closes the panel.
3. Calls `announce("View applied: <name>")`, which:
   a. Clears the live region (forces a DOM mutation).
   b. After 50 ms writes the announcement string.
   c. `role="status" aria-live="polite" aria-atomic="true"` causes screen readers to announce the new text without interrupting ongoing speech.

---

## Responsive behavior

### Desktop (> 480 px)

- The trigger button renders inline, next to filter controls in the page toolbar.
- The dropdown panel positions `position: absolute; top: calc(100% + 6px); left: 0` below the trigger.
- Width: `min-width: 280px; max-width: 340px`. Truncates long view names with `text-overflow: ellipsis`.
- The three-dot sub-menu flies out to the **left** of the row (`right: calc(100% + 4px)`).
- Entry animation: `svd-panel-in` — fade + translate Y (-4 px) + scale (0.98 → 1.0), 140 ms.

### Mobile (≤ 480 px)

- The trigger label truncates earlier (`max-width: 120px`).
- The panel switches to `position: fixed; bottom: 0; left: 0; right: 0`, presenting as a **bottom sheet**:
  - `border-radius: 16px 16px 0 0`
  - `max-width: 100%; min-width: unset`
  - Entry animation: `svd-panel-in-mobile` — fade + translate Y (12 px → 0), 200 ms.
- The three-dot sub-menu repositions to `right: 0; top: calc(100% + 4px)` to avoid clipping against the viewport edge.
- All animations respect `prefers-reduced-motion: reduce` — both keyframe sets fall back to opacity-only transitions.

---

## Edge cases handled

| Edge case | Behaviour |
|---|---|
| **Deleted default view** | If a view with `isDefault: true` is deleted, no other view is automatically promoted. On next mount `DEFAULT_FILTERS` are used unless the URL has a `?view` param. |
| **MAX_VIEWS limit (20)** | `saveView` drops the oldest entry (index 0 of the pre-save array) when `views.length >= MAX_VIEWS`. The "Save current view" footer button is disabled with an informative `aria-label` ("Cannot save — maximum of 20 views reached"). |
| **localStorage unavailable** | `readStore` and `writeStore` both catch all exceptions and return/ignore silently. The feature degrades gracefully: no views persist but the UI remains functional in-session. |
| **RTL layout** | The BEM CSS uses `position: absolute/fixed` and logical-property-compatible flex layout. The `dir="rtl"` test confirms the panel opens and renders without breaking (see test 25 in the dropdown test file). The action sub-menu margin uses `right: calc(100% + 4px)` which naturally flips in RTL. |
| **Many views (> pinned + recent)** | Views beyond the 5 most-recent non-pinned views are hidden from the panel. A "See all views (N)" footer link is shown. (Full views manager is a planned future feature.) |
| **?view= pointing to deleted/absent view** | On mount the hook attempts `views.find(v => v.id === viewParam)`. If not found, the param is ignored; the default view (or `DEFAULT_FILTERS`) is applied instead. No error is thrown. |
| **Duplicate view names** | `SaveViewModal` validates client-side and rejects duplicates (case-insensitive). In rename mode the original name is excluded from the duplicate check. |
| **Clipboard unavailable** | `ShareURLModal` catches `navigator.clipboard.writeText` rejections and falls back to `document.execCommand('copy')` via selecting the URL input. |

---

## Testing

### Strategy

The test suite uses **Vitest** + **@testing-library/react** + **@testing-library/user-event**. All tests run in jsdom (unit/component pool) and are kept fast and isolated.

Each of the four modules has a dedicated test file:

| Test file | Tests | Focus |
|---|---|---|
| `src/hooks/useSavedViews.test.ts` | 24 | Hook state transitions, localStorage read/write, URL sync, CRUD, `isUnsaved` derivation, MAX_VIEWS enforcement |
| `src/components/SavedViewsDropdown/SavedViewsDropdown.test.tsx` | 26 | Trigger render, open/close, Pinned/Recent sections, row actions (apply, rename, delete, default, pin, share), unsaved banner, live region, keyboard navigation (arrow keys), MAX_VIEWS disabled state, RTL |
| `src/components/SaveViewModal/SaveViewModal.test.tsx` | 14 | Mount/unmount, save/rename modes, validation (empty, duplicate, max length), submit, Escape, backdrop, character counter |
| `src/components/ShareURLModal/ShareURLModal.test.tsx` | 9 | Render, URL display, copy (success + clipboard fallback), copied-state timer reset, close mechanisms |

### What is covered

- All callback props are exercised via interaction and verified with `vi.fn()` spy assertions.
- ARIA attributes (`aria-expanded`, `aria-label`, `role`, `aria-live`) are asserted as part of the accessibility contract.
- localStorage read and write paths are tested with a `vi.stubGlobal('localStorage', ...)` mock.
- URL read/write is tested by controlling a `useSearchParams` mock (react-router-dom is mocked in the hook test file).
- The `prefers-reduced-motion` media query is not tested (CSS-only; outside jsdom scope).

### How to run

```bash
# Run all tests once
pnpm test

# Run in watch mode
pnpm test --watch

# Run a specific file
pnpm test src/hooks/useSavedViews.test.ts
pnpm test src/components/SavedViewsDropdown/SavedViewsDropdown.test.tsx

# Run with coverage
pnpm test --coverage
```

All four saved-views test files are in the `unit` pool (configured in `vitest.config.ts`). No browser environment is needed.

---

## Adding a new filter dimension

This guide walks through extending `ViewFilters` with a new field — for example a text search query.

### Step 1 — Add the field to `ViewFilters`

```ts
// src/types/savedViews.ts

export interface ViewFilters {
  statusFilter: string;
  searchQuery: string;  // ← new field
}
```

### Step 2 — Update `DEFAULT_FILTERS` in the hook

```ts
// src/hooks/useSavedViews.ts

const DEFAULT_FILTERS: ViewFilters = {
  statusFilter: 'All',
  searchQuery: '',     // ← default value
};
```

### Step 3 — Update `filtersEqual`

```ts
function filtersEqual(a: ViewFilters, b: ViewFilters): boolean {
  return a.statusFilter === b.statusFilter
    && a.searchQuery === b.searchQuery;   // ← add comparison
}
```

### Step 4 — Optionally add a URL param

If you want `?sv_search=<query>` to be reflected in the URL, update `pushFiltersURL`:

```ts
function pushFiltersURL(filters: ViewFilters) {
  const params = new URLSearchParams(searchParams);
  params.delete('view');

  if (filters.statusFilter && filters.statusFilter !== 'All') {
    params.set('sv_status', filters.statusFilter);
  } else {
    params.delete('sv_status');
  }

  if (filters.searchQuery) {
    params.set('sv_search', filters.searchQuery);       // ← new
  } else {
    params.delete('sv_search');                         // ← new
  }

  setSearchParams(params, { replace: false });
}
```

And read it back in the `useState` initialiser and the mount `useEffect`:

```ts
const searchParam = searchParams.get('sv_search');
if (searchParam) return { statusFilter: 'All', searchQuery: searchParam };
```

### Step 5 — Wire the new field in the page component

```tsx
// In Subscriptions.tsx (or wherever filters are applied)
sv.setFilters({ ...sv.currentFilters, searchQuery: searchInput });
```

### Step 6 — Update tests

- Add `searchQuery` to fixture `ViewFilters` objects in existing test helpers.
- Add a test case for "saving a view preserves searchQuery" in `useSavedViews.test.ts`.
- Add a test case for "filtersEqual returns false when searchQuery differs".

TypeScript will surface every place that needs updating when you add the field to `ViewFilters` — follow the compiler errors to completion.
