# System-Theme Sync Toggle with Per-Page Override

## Overview

The `ThemeToggle` component was a binary light/dark button. It has been upgraded to a **tri-state segmented control** (System / Light / Dark) that:

- Honors `prefers-color-scheme` when "System" is selected
- Persists selection to `localStorage` (`stellabill-theme-preference`)
- Uses `'system'` as a sentinel value — removing the key from storage entirely
- Announces every change to assistive technology via a polite `aria-live` region
- Supports a scoped per-page override for printable / PDF-preview views

---

## ThemeToggle component

**File:** `src/components/ThemeToggle.tsx`

### Props

None. Reads and writes via the `useTheme` hook.

### Behavior

| State | `localStorage` value | `<html data-theme>` |
|---|---|---|
| System (default) | key absent | follows `prefers-color-scheme` |
| Light | `"light"` | `"light"` |
| Dark | `"dark"` | `"dark"` |

### Keyboard interaction

The control uses `role="radiogroup"` / `role="radio"` semantics with **roving tabindex**:

| Key | Action |
|---|---|
| `Tab` | Enter / leave the group |
| `ArrowRight` / `ArrowDown` | Next option |
| `ArrowLeft` / `ArrowUp` | Previous option |
| `Home` | First option (System) |
| `End` | Last option (Dark) |
| `Enter` / `Space` | Select focused option (native radio behaviour) |

### Accessibility

- `role="radiogroup"` on the track, `role="radio"` + `aria-checked` on each segment
- Off-screen `role="status"` `aria-live="polite"` region announces e.g. *"Theme set to Dark."* or *"Theme set to System (currently dark)."*
- `title` attribute on each button provides a tooltip and fallback AT label
- Labels are visually hidden below 480 px (icon-only) but remain in the accessibility tree
- Focus ring via `:focus-visible` using `--color-focus-ring` token

### Responsive

| Viewport | Appearance |
|---|---|
| ≥ 481 px | Icon + label on each segment |
| ≤ 480 px | Icon only (labels visually hidden, still in AT tree) |

---

## useTheme hook

**File:** `src/hooks/useTheme.ts`  *(unchanged — already tri-state)*

The hook was already designed for three preferences. Key exports:

```ts
preference: ThemePreference   // 'system' | 'light' | 'dark'
theme: Theme                  // resolved: 'light' | 'dark'
isSystemPreference: boolean
setThemePreference(p: ThemePreference): void
toggleTheme(): void           // kept for backward compatibility
```

**Storage failure** (`localStorage` disabled / private mode): falls back to `'system'` silently — no crash.

**`prefers-color-scheme` change**: the hook subscribes to `MediaQueryList.addEventListener('change', …)` and updates `systemTheme` reactively, which re-resolves `theme` when preference is `'system'`.

---

## Per-page scoped override

**File:** `src/hooks/useScopedTheme.ts`

A lightweight hook that locks a DOM subtree to a specific theme without touching the global `<html data-theme>` attribute.

```ts
function useScopedTheme<T extends HTMLElement = HTMLDivElement>(
  forcedTheme: Theme | null,
): React.RefObject<T | null>
```

- Sets `data-theme` + `color-scheme` directly on the ref'd element
- All CSS custom-property tokens cascade correctly within that subtree
- Pass `null` to remove the override and re-inherit the global theme
- Cleans up on unmount

### Applied to printable views

| Component | File | Override |
|---|---|---|
| Receipt paper (`rp-paper`) | `src/components/past-periods/ReceiptPreview.tsx` | `'light'` |
| Statement of Account section | `src/pages/UsageBilling.tsx` | `'light'` |

This ensures PDF/print output always renders with a white background and dark text regardless of the user's current theme selection.

### Usage example

```tsx
import { useScopedTheme } from '../../hooks/useScopedTheme';

function PrintableReport() {
  // Always render this subtree in light mode
  const containerRef = useScopedTheme<HTMLDivElement>('light');

  return (
    <div ref={containerRef} className="report-paper">
      {/* content here inherits light-mode tokens */}
    </div>
  );
}
```

To allow the user to override the scoped theme (e.g. a toggle inside the report page itself):

```tsx
const [reportTheme, setReportTheme] = useState<Theme | null>('light');
const containerRef = useScopedTheme(reportTheme);
```

---

## Edge cases

| Scenario | Behaviour |
|---|---|
| `localStorage` disabled (private mode) | `getStoredPreference()` catches the error and returns `'system'`; no crash |
| `window.matchMedia` unavailable (SSR / old browsers) | `getSystemTheme()` returns `'light'` as safe default |
| `prefers-color-scheme` changes at runtime | `useTheme` re-renders with the new system theme; if preference is `'system'`, `<html data-theme>` updates immediately |
| Per-page override reset | Pass `null` to `useScopedTheme` or unmount the component — the override attribute is removed in the cleanup effect |
| Multiple scoped overrides on the same page | Each call operates on its own ref independently; no conflicts |
| Reduced motion | `theme-toggle__option` transitions are suppressed via `@media (prefers-reduced-motion: reduce)` |
