# Responsive Notes

Behaviour of each layout pattern across the four tested viewport widths.

## Viewport widths tested

| Label        | Width   |
|--------------|---------|
| Mobile       | 375 px  |
| Tablet       | 768 px  |
| Desktop      | 1280 px |
| Wide desktop | 1440 px |

Screenshots are stored in `docs/screenshots/layout/`.
See `docs/screenshots/layout/README.md` for capture instructions.

---

## 1 · Page Header

| Viewport | Behaviour |
|----------|-----------|
| 375 px   | Title and subtitle stack vertically. Action slot moves below the title block, full width. Horizontal padding is 16 px (--space-4). |
| 768 px   | Title is left-aligned, actions are right-aligned in one row. Horizontal padding is 24 px (--space-6). |
| 1280 px  | Same as tablet layout. Content is centred within 1280 px container. Horizontal padding is 40 px (--space-10). |
| 1440 px  | Container expands to 1440 px wide. Layout otherwise identical to 1280 px. |

**Known edge cases:**
- Very long titles (>80 chars) may wrap and push the action slot down even on desktop. Use `min-width: 0` on the title container to allow truncation if needed.
- Action slot with 3+ buttons can wrap on tablet; consider hiding secondary actions behind a dropdown at that breakpoint.

---

## 2 · Content Section

| Viewport | Behaviour |
|----------|-----------|
| 375 px   | 24 px vertical / 16 px horizontal padding. Section title is 1.25 rem. |
| 768 px   | 32 px vertical / 24 px horizontal padding. Section title scales up via `clamp`. |
| 1280 px  | 48 px vertical / 40 px horizontal padding. Content centred within 1280 px. |
| 1440 px  | Container expands to 1440 px. Padding unchanged. |

**Known edge cases:**
- Nested `ContentSection` components double the vertical padding; avoid nesting.
- If a section contains a full-bleed image or chart, override `padding-inline: 0` on the body slot and add internal padding inside the child component.

---

## 3 · Sidebar Layout

| Viewport | Behaviour |
|----------|-----------|
| 375 px   | **Stacked:** sidebar renders above main content, full width. Gap between them is 24 px (--space-6). |
| 768 px   | **Side by side:** sidebar is 220 px wide, gap is 24 px. Sidebar content is scrollable independently. |
| 1280 px  | **Side by side:** sidebar widens to 260 px, gap increases to 32 px (--space-8). |
| 1440 px  | Same as 1280 px. Main area benefits from extra horizontal space. |

**Known edge cases:**
- On mobile, if the sidebar contains navigation links the user must scroll past them to reach main content. Consider making the sidebar collapsible (accordion or off-canvas) for navigation-heavy use cases.
- The sidebar does not scroll independently on mobile (stacked layout). If the sidebar contains long content (e.g. a filter panel), add `overflow-y: auto; max-height: Xpx` at the mobile breakpoint.

---

## 4 · Empty State

| Viewport | Behaviour |
|----------|-----------|
| 375 px   | Full-width block, 16 px horizontal padding, content centred. Icon size 40 px. |
| 768 px   | Block constrained to 400 px, centred in page. |
| 1280 px  | Block constrained to 480 px, centred. |
| 1440 px  | Same as 1280 px. |

**Known edge cases:**
- If an action button label is very long it can overflow the 375 px container. Keep CTA labels under 30 characters.
- Empty states inside a modal inherit the modal's width; the `max-width` constraints are not needed there.

---

## 5 · Card Grid

| Viewport | Columns | Gap    | Behaviour |
|----------|---------|--------|-----------|
| 375 px   | 1       | 16 px  | Single-column stack. Cards are full width. |
| 768 px   | 2       | 24 px  | Two-column grid. Cards can have slightly uneven heights due to varying content length. |
| 1280 px  | 3       | 24 px  | Three-column grid. |
| 1440 px  | 3       | 24 px  | Same as 1280 px. Extra space is absorbed by the container padding. |

**Known edge cases:**
- With an odd number of cards on tablet (2-col), the last card fills only the left column. This is expected CSS grid behaviour. If a symmetrical layout is required, add a spacer element or use `justify-items: stretch`.
- Cards with dramatically different content heights produce a ragged bottom edge. Use `align-items: start` on the grid if consistent top-alignment is preferred over matched heights.

---

## 6 · Dense Table

| Viewport | Behaviour |
|----------|-----------|
| 375 px   | Table scrolls horizontally inside a `overflow-x: auto` wrapper. All columns remain visible; no columns are hidden. Row height is `auto`, cell padding is 8 px vertical / 12 px horizontal. |
| 768 px   | Table fits within the viewport for typical column counts (≤ 5 columns). |
| 1280 px  | Full table displayed with 48 px row height and comfortable padding. |
| 1440 px  | Same as 1280 px. |

**Known edge cases:**
- Tables with 6+ columns overflow on tablet as well as mobile. Either reduce column count, merge columns, or provide a responsive "card per row" fallback view below 768 px.
- Long text in table cells does not wrap by default (dense tables use `white-space: nowrap`). Add `min-width` on columns where wrapping is acceptable.
- Horizontal scroll on iOS requires `-webkit-overflow-scrolling: touch` on the wrapper for momentum scrolling.

---

## Screenshot capture instructions

Screenshots in `docs/screenshots/layout/` should be regenerated after any
change to layout components. Use the Playwright script:

```bash
pnpm playwright install chromium   # first time only
pnpm playwright test --reporter=html
```

The test suite in `tests/screenshots.spec.ts` opens each layout pattern at
375 px, 768 px, 1280 px, and 1440 px and writes PNG files to
`docs/screenshots/layout/`.

If Playwright is not available, capture screenshots manually using browser
DevTools device emulation and save them with the naming convention:

```
{pattern}-{viewport}.png
# e.g.
page-header-375.png
page-header-768.png
sidebar-layout-375.png
card-grid-1280.png
```
