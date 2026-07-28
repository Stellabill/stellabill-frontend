# Shimmer Motion Primitive

Design-system reference for the loading-placeholder primitive defined in
`src/styles/shimmer.css` and `src/components/common/Shimmer.tsx`.

## Problem

`DashboardSkeleton` (and the KPI-card / activity-list loading states beside
it) painted a static three-stop gradient (`--skeleton-base` →
`--skeleton-highlight` → `--skeleton-base`) and relied on Tailwind's generic
`animate-pulse` utility for motion. `animate-pulse` fades the whole block's
opacity in and out; on a gradient background the highlight streak never
moves, it just fades in place. On slow networks — exactly when users stare
at the skeleton the longest — this reads as inert, "broken" UI rather than
active loading.

`Shimmer` replaces that with a directional highlight that sweeps across the
placeholder, the pattern users recognize as "content is on its way."

## Tokens

Defined in `src/styles/tokens.css` under `:root` (theme-agnostic — the same
values apply in light and dark mode):

| Token | Value | Purpose |
|---|---|---|
| `--shimmer-duration` | `1.6s` | Default sweep duration. |
| `--shimmer-duration-fast` | `1.1s` | Opt-in faster sweep for small/dense placeholders. |
| `--shimmer-duration-slow` | `2.2s` | Opt-in slower sweep for large placeholders (e.g. a chart). |
| `--shimmer-timing` | `ease-in-out` | Easing curve for the sweep. |
| `--shimmer-angle` | `90deg` | Gradient angle (horizontal sweep). |
| `--shimmer-reduced-duration` | `2.4s` | Duration of the `prefers-reduced-motion` opacity-pulse fallback. |

The gradient stops themselves reuse the existing theme-aware
`--skeleton-base` / `--skeleton-highlight` tokens (already defined per light
and dark theme in `tokens.css`), so shimmer contrast is correct in both
themes with no extra work.

## The `.sb-shimmer` CSS mixin

`src/styles/shimmer.css` exposes a plain CSS class, importable anywhere a
component already owns hand-rolled skeleton markup (no React dependency
required):

```css
@import '../../styles/shimmer.css';

.my-skeleton-row {
  /* compose the mixin's motion with your own sizing/shape */
  height: 1rem;
  width: 12rem;
  border-radius: var(--radius-sm);
}
```

```html
<div class="sb-shimmer my-skeleton-row"></div>
```

`.sb-shimmer` only owns **background + animation** — it intentionally does
not set a default `border-radius` on the base "block" form, so it never
fights a consumer's own shape class for CSS specificity. Two additional
modifier classes provide sensible defaults for shapes that are typically
used standalone:

- `.sb-shimmer--circle` → `border-radius: var(--radius-full)` (avatars)
- `.sb-shimmer--text` → `border-radius: var(--radius-sm)` (copy lines)

### Direction

The sweep auto-detects the ancestor/document writing direction via the
`:dir(rtl)` pseudo-class and reverses automatically — no JS required. To
force a direction regardless of locale (e.g. a chart placeholder that should
always sweep left-to-right), set `data-direction="ltr"` or `"rtl"` on the
element; the explicit attribute always wins over the auto-detected
direction.

### Reduced motion

Under `@media (prefers-reduced-motion: reduce)`, the sweeping gradient is
replaced by a slow (`--shimmer-reduced-duration`), gentle opacity pulse
between `100%` and `55%` — motion is present but calm, and the direction
override no longer applies (there's no directional sweep left to reverse).

## The `<Shimmer/>` component

Location: `src/components/common/Shimmer.tsx`.

```tsx
import Shimmer from '../common/Shimmer';

<Shimmer width="12rem" height="2rem" />                 // rectangle
<Shimmer shape="text" width="16rem" height="1rem" />     // copy line
<Shimmer shape="circle" width="2.5rem" height="2.5rem" /> // avatar
<Shimmer direction="rtl" />                               // forced sweep direction
<Shimmer duration="0.9s" />                                // overrides --shimmer-duration
<Shimmer delay="0.1s" />                                   // stagger multiple shimmers
```

### Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `width` / `height` | `string \| number` | — | Any CSS length. |
| `shape` | `'block' \| 'circle' \| 'text'` | `'block'` | Controls the default radius and modifier class. |
| `radius` | `string` | shape default | Explicit override; `'block'` has no default so a wrapping class (e.g. `dashboard-skeleton__button`) can own it instead. |
| `direction` | `'ltr' \| 'rtl'` | auto (document direction) | Forces sweep direction. |
| `duration` | `string` | `--shimmer-duration` | Per-instance speed override. |
| `delay` | `string` | — | Staggers the animation start (`animation-delay`). |
| `className` / `style` | — | — | Merged with the computed class list / inline style. |
| `aria-label` | `string` | — | See Accessibility below. |

### Composing with existing skeleton classes

Most call sites (`DashboardSkeleton`, `DashboardCard`, `ActivityList`) keep
their existing per-element CSS classes for sizing and pass them straight
through `className` — `Shimmer` supplies only the motion:

```tsx
<Shimmer className="dashboard-skeleton__line dashboard-skeleton__line--title" />
```

## Accessibility (WCAG 2.1 AA)

- **One status region, not N.** The container that renders a group of
  shimmers (`DashboardSkeleton`, the `DashboardCard` loading state, the
  `ActivityList` loading state) carries `role="status"`, `aria-busy="true"`,
  and a descriptive `aria-label` (e.g. `"Loading dashboard"`). Individual
  `<Shimmer/>` instances default to `aria-hidden="true"` — they're
  decorative once the container has already announced that content is
  loading. Pass `aria-label` to a `Shimmer` only for a placeholder that
  stands alone with no enclosing status region; it then renders
  `role="status"` itself instead of `aria-hidden`.
- **Motion is decorative, not essential.** The sweep conveys "still
  loading," which the `aria-label`/`aria-busy` pair already communicates to
  assistive tech independent of the animation.
- **`prefers-reduced-motion: reduce`** swaps the sweep for a slow opacity
  pulse (see above) — verified via manual OS-level toggle plus an axe scan
  showing no new violations.
- **Contrast.** `--skeleton-base` / `--skeleton-highlight` are decorative
  fill colors (not text), so WCAG 1.4.3 doesn't apply directly, but both
  pairs were chosen to stay clearly distinguishable from the surrounding
  `--color-surface-*` tokens in both themes.

## Responsive behaviour

The sweep uses **percentage-based** `background-position` keyframes
(`-135%` → `135%` against a `200% 100%` background-size), not fixed pixel
offsets. That means the animation looks correct at any container width
without recalculating anything in JS — verified by resizing a shimmer from
mobile (320px) to a wide desktop chart placeholder (900px+) and confirming
the sweep timing/coverage stays consistent.

## Edge cases covered

- **Reduced motion** — opacity-pulse fallback (see above).
- **RTL** — auto-reverses via `:dir(rtl)`; can be forced with `direction`.
- **Dark theme** — reuses the existing themed `--skeleton-base` /
  `--skeleton-highlight` tokens, no separate dark-mode branch needed.
- **Container width changes** — percentage-based keyframes, resize-safe.
- **Multiple shimmers in one card** — `delay` prop lets composing components
  stagger sweeps slightly so a group of placeholders doesn't animate in
  perfect lockstep (see `DashboardCard`'s loading state).

## Testing

Unit tests: `src/components/common/Shimmer.test.tsx` — covers default
classes/ARIA, per-shape radius defaults (and the intentional "no default"
for `block`), radius override, direction attribute (present vs. auto),
custom duration via the `--shimmer-duration` custom property, animation
delay, className/style merging, and the `aria-label` → `role="status"`
behavior.

Consumers (`DashboardSkeleton.test.tsx` via `Dashboard.test.tsx`,
`DashboardCard.test.tsx`, `ActivityList.test.tsx`) assert the loading state
exposes exactly one `role="status"` region with `aria-busy="true"` and that
at least one `.sb-shimmer` element is rendered underneath it.

Run:

```bash
npm test -- Shimmer
npm run test:coverage
```

## Storybook

`src/components/common/Shimmer.stories.tsx` documents: a bare block, a text
line, a circle (avatar), a custom-speed example, a forced-RTL example, a
staggered group mimicking a card, and a standalone example with an
`aria-label`.
