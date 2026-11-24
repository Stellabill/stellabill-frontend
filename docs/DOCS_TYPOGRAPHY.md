# Stellabill Typography Scale

Design-system reference for the fluid type scale defined in `src/styles/tokens.css` and `src/styles/typography.css`.

---

## Principles

- **Fluid scaling** — every size uses `clamp()` so text scales smoothly between the minimum (320 px viewport) and maximum (1280 px+ viewport) without breakpoint jumps.
- **Token-first** — never write a raw `font-size` value in component styles. Use a `--text-*` token or a semantic class.
- **No inline overrides** — inline `style={{ fontSize: … }}` on heading elements is forbidden; it breaks the scale and defeats fluid sizing.
- **WCAG 2.1 AA** — minimum body text resolves to ≥ 15 px; heading contrast ratios must meet 4.5 : 1 (normal text) or 3 : 1 (large text, ≥ 18 pt / 24 px).

---

## Token reference (`--text-*`)

All tokens are defined in `src/styles/tokens.css` under `:root`.

| Token | Min size | Max size | Typical use |
|---|---|---|---|
| `--text-xs` | 11.1 px | 12 px | Labels, captions, legal copy |
| `--text-sm` | 13.3 px | 15 px | Secondary body, helper text |
| `--text-base` | 16 px | 18 px | Primary body copy |
| `--text-lg` | 18 px | 21.3 px | Lead paragraphs, card subtitles |
| `--text-xl` | 20.3 px | 25.6 px | h5, section sub-headings |
| `--text-2xl` | 22.8 px | 31.2 px | h4, card headings |
| `--text-3xl` | 25.6 px | 39 px | h3, feature headings |
| `--text-4xl` | 28.8 px | 48.8 px | h2, page sub-headings |
| `--text-5xl` | 32.4 px | 61 px | h1, page titles |

> Min/max sizes are approximate; exact values depend on the `clamp()` formula and viewport width.

---

## Semantic type roles

### Display

Used for hero headlines only (landing page, marketing sections).

```css
.sb-display {
  font-family: var(--font-family-display);   /* Sora / DM Sans */
  font-size: clamp(2.5rem, 5vw + 1rem, 5rem);
  font-weight: var(--font-bold);             /* 700 */
  line-height: var(--leading-none);          /* 1 */
  letter-spacing: var(--tracking-tighter);   /* -0.05em */
}
```

### Headings h1–h6

Applied automatically to `<h1>`–`<h6>` elements via the element selector in `typography.css`. Utility classes `.sb-h1`–`.sb-h6` are available when a non-heading element must carry heading styles (e.g. a `<div role="heading">`).

| Level | Class | Token | Weight | Line-height | Letter-spacing |
|---|---|---|---|---|---|
| h1 | `.sb-h1` | `--text-5xl` | bold (700) | tight (1.2) | tight (−0.025em) |
| h2 | `.sb-h2` | `--text-4xl` | bold (700) | tight (1.2) | tight (−0.025em) |
| h3 | `.sb-h3` | `--text-3xl` | semibold (600) | snug (1.35) | normal (0) |
| h4 | `.sb-h4` | `--text-2xl` | semibold (600) | snug (1.35) | — |
| h5 | `.sb-h5` | `--text-xl` | medium (500) | normal (1.5) | — |
| h6 | `.sb-h6` | `--text-lg` | medium (500) | normal (1.5) | — |

All headings use `font-family: var(--font-family-display)` (Sora → DM Sans fallback).

### Body copy

| Class | Token | Line-height | Use |
|---|---|---|---|
| `.sb-body-lg` | `--text-lg` | relaxed (1.65) | Lead paragraphs, introductory text |
| `.sb-body` | `--text-base` | normal (1.5) | Default body copy (also the `<body>` default) |
| `.sb-body-sm` | `--text-sm` | normal (1.5) | Secondary text, helper copy |

### Labels & captions

| Class | Token | Weight | Letter-spacing | Notes |
|---|---|---|---|---|
| `.sb-label` | `--text-xs` | semibold (600) | widest (0.1em) | Uppercase; use for form labels, badge text |
| `.sb-caption` | `--text-xs` | regular (400) | normal | Timestamps, footnotes, image captions |

### Code

`<code>`, `<kbd>`, `<samp>`, `<pre>` automatically use `font-family: var(--font-family-mono)` (JetBrains Mono → Fira Code) at `0.875em` relative to the surrounding text.

---

## Utility classes

| Class | Effect |
|---|---|
| `.sb-text-left` | `text-align: left` |
| `.sb-text-center` | `text-align: center` |
| `.sb-text-right` | `text-align: right` |
| `.sb-truncate` | Single-line ellipsis overflow |
| `.sb-balance` | `text-wrap: balance` (multi-line headings) |

---

## Usage rules

### ✅ Do

```tsx
// Heading — element selector handles everything
<h1>Plans</h1>

// Non-heading element that needs heading appearance
<div role="heading" aria-level={2} className="sb-h2">Section Title</div>

// Body copy
<p className="sb-body-lg">Lead paragraph text.</p>

// Caption
<span className="sb-caption">Last updated 2 hours ago</span>
```

### ❌ Don't

```tsx
// Inline font-size override — breaks fluid scale
<h1 style={{ fontSize: '1.5rem' }}>Plans</h1>

// Raw rem value outside the token system
<p style={{ fontSize: '0.9rem' }}>…</p>

// Skipping heading levels (h1 → h3) — fails WCAG 1.3.1
<h1>Page title</h1>
<h3>Section</h3>
```

---

## Responsive behaviour

The fluid scale is continuous — no media queries are needed for font sizes. The `clamp()` formula interpolates linearly between the minimum viewport (320 px) and the maximum (1280 px). At viewports wider than 1280 px the size is capped at the max value.

To verify the resolved size at any viewport, open DevTools → Computed → `font-size` on the element.

---

## Accessibility notes

- **Heading hierarchy** — every page must have exactly one `<h1>`. Levels must not skip (h1 → h2 → h3, never h1 → h3). The `runAudit()` utility in `src/utils/spacingTypographyAudit.js` checks this at runtime.
- **Minimum contrast** — body text (`--text-base`, ~16–18 px) is "normal" text; it requires 4.5 : 1 contrast. Headings at `--text-3xl` and above (≥ 24 px bold) qualify as "large text" and require 3 : 1.
- **Zoom** — because sizes are in `rem`/`clamp()`, text reflows correctly when the user zooms the browser up to 200 % (WCAG 1.4.4).
- **`text-size-adjust: 100%`** — set on `<html>` in `typography.css` to prevent mobile browsers from inflating text in landscape mode.

---

## Adding a new type style

1. Check whether an existing token or class covers the need.
2. If a new size is required, add a `--text-*` token to `tokens.css` using the same `clamp()` pattern.
3. Add a semantic class to `typography.css` with the appropriate `font-size`, `line-height`, and `letter-spacing`.
4. Document it in this file.
5. Do **not** add one-off sizes in component CSS or inline styles.
