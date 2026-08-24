# SavedViewsDropdown — Component API Reference

## Overview

`SavedViewsDropdown` is the UI entry point for the saved-views manager on the Subscriptions page. It renders a compact trigger button that opens a dropdown panel listing all saved views, organised into **Pinned** and **Recent** sections.

The component is a controlled, purely presentational widget: it holds no view data of its own. All state lives in the `useSavedViews` hook; the parent (e.g. `Subscriptions.tsx`) wires hook values to props and passes callback handlers. When an action is triggered (apply, rename, delete …) the component calls the relevant prop and the hook updates localStorage and the URL.

Key responsibilities:

- Display the active view name (or "All subscriptions" when none is active) in the trigger button.
- Show an **Unsaved** amber badge and an in-panel banner when `isUnsaved` is `true`.
- List pinned views (with a "Pinned" section header) followed by recent views.
- Expose per-row actions via a three-dot (⋯) sub-menu: Rename, Set as default, Pin/Unpin, Share URL, Delete.
- Announce view changes to screen readers through an ARIA live region.
- Handle keyboard navigation (↑/↓ arrows, Enter/Space, Escape).
- Disable the **Save current view** footer button when `MAX_VIEWS` is reached.

---

## Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `views` | `SavedView[]` | ✅ | Full sorted list of all saved views (pinned first, then by `updatedAt` desc). Used to check `MAX_VIEWS` and look up view names when announcing. |
| `pinnedViews` | `SavedView[]` | ✅ | Views with `isPinned === true`, pre-filtered from `views`. Rendered in the "Pinned" section. |
| `recentViews` | `SavedView[]` | ✅ | Non-pinned views, up to 5 most recently updated. Rendered in the "Recent" section. |
| `activeView` | `SavedView \| null` | ✅ | The currently applied view, or `null` when no named view is active. Drives the trigger label and the unsaved-changes banner wording. |
| `isUnsaved` | `boolean` | ✅ | `true` when current filter state diverges from `activeView.filters` (or from defaults when `activeView` is `null`). Activates amber accent styles and the unsaved-changes banner. |
| `currentFilters` | `ViewFilters` | ✅ | The live filter values. Not rendered directly; passed through for completeness and future extension. |
| `onApplyView` | `(id: string) => void` | ✅ | Called when a view row (or its name button) is clicked. Receives the view `id`. |
| `onSaveNew` | `() => void` | ✅ | Called when "Save current view" (footer) or "Save as new" (unsaved banner) is clicked. Should open `SaveViewModal` in `save` mode. |
| `onRename` | `(id: string) => void` | ✅ | Called when Rename is chosen from the three-dot menu. Should open `SaveViewModal` in `rename` mode. |
| `onDelete` | `(id: string) => void` | ✅ | Called when Delete is chosen from the three-dot menu. Panel stays open so the user can continue. |
| `onSetDefault` | `(id: string) => void` | ✅ | Called when "Set as default" is chosen. Marks the view as the default; all other views have `isDefault` cleared by the hook. |
| `onClearDefault` | `() => void` | ✅ | Called when "Remove default" is chosen on a view that is already the default. |
| `onTogglePin` | `(id: string) => void` | ✅ | Called when Pin / Unpin is chosen from the three-dot menu. |
| `onShare` | `(id: string) => void` | ✅ | Called when "Share URL" is chosen. Should open `ShareURLModal`. |
| `onUpdateCurrent` | `() => void` | ✅ | Called when "Save changes" is clicked in the unsaved banner. Updates the active view's filters in-place via `useSavedViews.updateView`. |
| `MAX_VIEWS` | `number` | ✅ | Maximum number of saved views allowed (default: 20). The "Save current view" footer button is disabled and shows an informative label when `views.length >= MAX_VIEWS`. |

### `SavedView` type (from `@/types/savedViews`)

```ts
interface SavedView {
  id: string;
  name: string;
  filters: ViewFilters;
  isDefault: boolean;
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
}
```

### `ViewFilters` type

```ts
interface ViewFilters {
  statusFilter: string; // 'All' | 'Active' | 'Paused' | 'Cancelled'
}
```

---

## Usage example

```tsx
import { useSavedViews } from '@/hooks/useSavedViews';
import { SavedViewsDropdown } from '@/components/SavedViewsDropdown';
import { SaveViewModal } from '@/components/SaveViewModal';
import { ShareURLModal } from '@/components/ShareURLModal';
import { useState } from 'react';

export function SubscriptionsPageHeader() {
  const sv = useSavedViews();

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<{ id: string; name: string; url: string } | null>(null);

  function handleSaveNew() {
    setRenameTargetId(null);
    setSaveModalOpen(true);
  }

  function handleRename(id: string) {
    setRenameTargetId(id);
    setSaveModalOpen(true);
  }

  function handleShare(id: string) {
    const view = sv.views.find((v) => v.id === id);
    if (!view) return;
    setShareTarget({ id, name: view.name, url: sv.getShareURL(id) });
  }

  const renameTarget = renameTargetId ? sv.views.find((v) => v.id === renameTargetId) : null;

  return (
    <>
      <SavedViewsDropdown
        views={sv.views}
        pinnedViews={sv.pinnedViews}
        recentViews={sv.recentViews}
        activeView={sv.activeView}
        isUnsaved={sv.isUnsaved}
        currentFilters={sv.currentFilters}
        onApplyView={sv.applyView}
        onSaveNew={handleSaveNew}
        onRename={handleRename}
        onDelete={sv.deleteView}
        onSetDefault={sv.setDefault}
        onClearDefault={sv.clearDefault}
        onTogglePin={sv.togglePin}
        onShare={handleShare}
        onUpdateCurrent={() =>
          sv.activeView && sv.updateView(sv.activeView.id, sv.currentFilters)
        }
        MAX_VIEWS={sv.MAX_VIEWS}
      />

      {/* Save / rename modal */}
      <SaveViewModal
        isOpen={saveModalOpen}
        mode={renameTargetId ? 'rename' : 'save'}
        initialName={renameTarget?.name ?? ''}
        existingNames={sv.views.map((v) => v.name)}
        onSave={(name) => {
          if (renameTargetId) {
            sv.renameView(renameTargetId, name);
          } else {
            sv.saveView(name, sv.currentFilters);
          }
        }}
        onClose={() => {
          setSaveModalOpen(false);
          setRenameTargetId(null);
        }}
      />

      {/* Share URL modal */}
      {shareTarget && (
        <ShareURLModal
          isOpen={true}
          url={shareTarget.url}
          viewName={shareTarget.name}
          onClose={() => setShareTarget(null)}
        />
      )}
    </>
  );
}
```

---

## Keyboard shortcuts

| Key | Context | Effect |
|---|---|---|
| `Enter` / `Space` | Trigger button | Opens the dropdown panel |
| `Escape` | Panel open, no sub-menu open | Closes panel, returns focus to trigger |
| `Escape` | Sub-menu (three-dot) open | Closes sub-menu only; panel stays open |
| `↓` ArrowDown | Focus on a view row | Moves focus to the next row |
| `↑` ArrowUp | Focus on a view row | Moves focus to the previous row |
| `Enter` / `Space` | Focus on a view row | Applies the focused view (calls `onApplyView`) |
| `Tab` | Inside panel | Native tab order through footer / banner buttons |
| Click outside | Panel or sub-menu open | Closes panel (mousedown listener on `document`) |

Arrow navigation targets elements with `data-view-row` attribute. Focus is managed imperatively: after `setFocusedRowIndex(n)` the corresponding DOM node is focused in a `useEffect`.

---

## Accessibility notes

### ARIA roles

| Element | Role | Notes |
|---|---|---|
| Trigger `<button>` | `button` (implicit) | `aria-haspopup="menu"`, `aria-expanded`, `aria-controls` pointing to panel `id` |
| Dropdown panel `<div>` | `menu` | `aria-labelledby` → trigger `id` |
| View rows `<div>` | `menuitem` | `tabIndex={0}`, `data-view-row`; full context in `aria-label` (name + ", default view" + ", pinned") |
| Name `<button>` inside row | button | `tabIndex={-1}` (navigation handled by parent row); `aria-label="Apply view: <name>"` |
| Three-dot `<button>` | button | `aria-haspopup="menu"`, `aria-expanded`, `aria-label="More options for view <name>"` |
| Sub-menu `<div>` | `menu` | `aria-label="Options for <name>"` |
| Sub-menu items `<button>` | `menuitem` | Descriptive `aria-label` for each action (e.g. "Rename view: <name>", "Delete view: <name>") |
| Footer save `<button>` | `menuitem` | Disabled with `aria-label` explaining the MAX_VIEWS limit when at capacity |
| Dividers | `separator` | `role="separator"` |
| Section wrappers | `none` / `presentation` | Prevents nested menu role |
| Section label | `presentation` | Visual grouping only |
| Unsaved badge | `<span>` | `aria-label="Unsaved changes"` |

### Live region

A visually-hidden `<div role="status" aria-live="polite" aria-atomic="true">` sits at the top of `.svd`. After a view is applied, the announcement text `"View applied: <name>"` is written to it (via a 50 ms `setTimeout` to guarantee screen readers pick up the change). The element uses the `.svd__live-region` CSS class which clips it to a 1×1 px area (SR-only pattern).

### Focus management

- When the panel opens, no programmatic focus is moved; keyboard users Tab into the panel or press ↓ to begin row navigation.
- When the panel closes (Escape or view applied), focus is returned to the trigger button via `triggerRef.current?.focus()`.
- The three-dot sub-menus are inline flyouts; Escape closes the sub-menu without closing the panel.

### Color contrast

The default color palette (dark theme) achieves at least 4.5:1 for all text/background pairs at the sizes used:

- Primary text `#e2e8f0` on surface `#0f172a` ≈ 13.5:1
- Secondary text `#cbd5e1` on surface `#0f172a` ≈ 10.7:1
- Brand/active text `#22d3ee` on surface `#0f172a` ≈ 9.1:1
- Warning text `#fbbf24` on warning bg `rgba(245,158,11,0.10)` on `#0f172a` ≈ 7.9:1
- Danger text `#f87171` on danger bg `rgba(239,68,68,0.14)` on `#0f172a` ≈ 5.2:1

---

## Design tokens used

All values below come from `src/styles/tokens.css` or `src/styles/theme.css`. Fallback raw values are shown for environments where CSS custom properties may not resolve.

| Token | Fallback | Used for |
|---|---|---|
| `--color-surface-elevated` | `#0f172a` | Panel and sub-menu background |
| `--color-surface-control` | `rgba(148,163,184,0.10)` | Trigger background (default) |
| `--color-surface-control-hover` | `rgba(148,163,184,0.16)` | Trigger, action-button hover |
| `--color-surface-card-hover` | `rgba(148,163,184,0.08)` | View row hover background |
| `--color-surface-active` | `rgba(34,211,238,0.10)` | Active view row background |
| `--color-border-subtle` | `rgba(255,255,255,0.08)` | Panel border, divider lines |
| `--color-border-default` | `rgba(255,255,255,0.14)` | Trigger hover border, sub-menu border |
| `--color-text-primary` | `#e2e8f0` | Row name text, trigger hover |
| `--color-text-secondary` | `#cbd5e1` | Trigger label, action items |
| `--color-text-muted` | `#94a3b8` | Three-dot icon, secondary actions |
| `--color-text-subtle` | `#64748b` | Section labels, pin icon, empty state |
| `--color-brand-primary` | `#22d3ee` | Active check, active row text, save-btn hover |
| `--color-brand-text` | `#7dd3e0` | "See all views" link |
| `--color-brand-text-hover` | `#a5e8f3` | "See all views" link hover |
| `--color-warning` | `#fbbf24` | Unsaved badge, unsaved-bar label, trigger--unsaved |
| `--color-warning-bg` | `rgba(245,158,11,0.14)` | Unsaved-bar background, badge background |
| `--color-warning-border` | `rgba(251,191,36,0.42)` | Unsaved-bar border, trigger--unsaved border |
| `--color-danger` | `#f87171` | Delete action text |
| `--color-danger-bg` | `rgba(239,68,68,0.14)` | Delete action hover background |
| `--radius-lg` | `0.75rem` | Panel, trigger, sub-menu border-radius |
| `--radius-md` | `0.5rem` | Action item, more-btn border-radius |
| `--radius-full` | `9999px` | Unsaved badge pill |
| `--shadow-xl` | `0 24px 56px rgba(0,0,0,0.52)` | Panel drop shadow |
| `--shadow-lg` | `0 16px 32px rgba(0,0,0,0.40)` | Sub-menu drop shadow |
| `--focus-ring-shadow` | `0 0 0 2px #0a0f16, 0 0 0 4px #22d3ee, 0 0 12px rgba(56,189,248,0.45)` | Focus-visible outline on trigger and footer buttons |
| `--focus-ring` | `#22d3ee` | Focus-visible inset ring on rows and action items |
| `--z-dropdown` | `100` | Panel z-index |
| `--font-family-body` | `'DM Sans', sans-serif` | All text |
| `--text-sm` | `0.875rem` | Row names, action items, footer button |
| `--text-xs` | `0.75rem` | Section label, unsaved bar label, action micro-copy |
| `--font-medium` | `500` | Trigger label, active row name, section headings |
| `--font-semibold` | `600` | Section labels (uppercase), unsaved badge |
