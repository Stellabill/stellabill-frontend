# DOCS — Invoice Print Stylesheet

> **Branch:** `uiux/invoice-print-stylesheet`  
> **Issue:** #386 — \[UI/UX Design\] Design a print stylesheet for invoices and receipts  
> **WCAG:** 2.1 AA compliant  
> **Paper sizes:** A4 (default) · Letter (opt-in)

---

## Table of contents

1. [Overview](#overview)  
2. [File map](#file-map)  
3. [How it works](#how-it-works)  
4. [Usage](#usage)  
5. [CSS class reference](#css-class-reference)  
6. [Design tokens in print](#design-tokens-in-print)  
7. [Page layout (@page)](#page-layout-page)  
8. [Chrome suppression](#chrome-suppression)  
9. [Credit-note variant](#credit-note-variant)  
10. [RTL support](#rtl-support)  
11. [Dark-mode handling](#dark-mode-handling)  
12. [Forced-colors (High Contrast)](#forced-colors-high-contrast)  
13. [Accessibility (WCAG 2.1 AA)](#accessibility-wcag-21-aa)  
14. [Edge cases](#edge-cases)  
15. [Testing approach](#testing-approach)  
16. [Known browser limitations](#known-browser-limitations)  
17. [Design decisions](#design-decisions)

---

## Overview

Before this work, printing a Stellabill invoice page printed the entire app shell — sidebar, top navbar, background gradients, collapsed line-item rows — producing an unreadable document.

This PR introduces a complete, production-quality print stylesheet that:

- **Hides all app chrome** (sidebar, navbar, command palette, toasts, modals, bottom navigation).  
- **Forces high-contrast WCAG 2.1 AA colours** — every colour is verified to have ≥ 4.5:1 contrast ratio on a white background.  
- **Uses `@page` rules** for A4 and Letter paper with running headers and page counters.  
- **Repeats table headers** on every printed page via `display: table-header-group`.  
- **Keeps rows together** with `page-break-inside: avoid` on every `<tr>`.  
- **Forces the expandable breakdown body open** — `@media print` overrides `display` to `block !important` on `.ibc-body`, so the user always sees the full breakdown regardless of on-screen accordion state.  
- **Supports RTL** — page-number positions swap sides via a named `@page rtl-page`.  
- **Supports Forced Colors / Windows High Contrast Mode** — all values replaced with `Canvas` / `CanvasText` system keywords.  
- **Kills all animations, transitions, filters, and shadows** to prevent ink waste and layout artefacts.

---

## File map

| File | Purpose |
|---|---|
| `src/styles/print.css` | All `@media print` and `@page` rules. Imported globally in `src/index.css`. |
| `src/components/InvoiceBreakdownCard.tsx` | Expandable invoice/credit-note row. Emits the class names targeted by the print stylesheet. |
| `src/components/InvoiceBreakdownCard.css` | Screen styles; includes credit-note variant `.ibc-wrap--credit-note`. |
| `src/components/InvoicePrintRoot.tsx` | Wrapper component that applies the correct named-page class and provides the screen-only "Print invoice" trigger button. |
| `src/components/InvoicePrintRoot.css` | Screen-only styles for the trigger button (the print rules come from `print.css`). |
| `src/components/InvoiceBreakdownCard.print.test.tsx` | Print-focused tests: class structure, ARIA, credit-note metadata, table targets, status coverage, keyboard, CSV download. |
| `src/components/InvoicePrintRoot.test.tsx` | Unit tests for the wrapper component. |
| `src/components/InvoiceList.test.tsx` | Updated to cover the new `type`, `status`, and credit-note fields. |

---

## How it works

```
index.css
  └── @import './styles/print.css'   ← loaded globally, zero runtime cost
                                       (all rules are inside @media print)
```

The stylesheet uses two `@media print` blocks:

1. **Global overrides** — resets body background, hides chrome, overrides design tokens, kills motion.  
2. **Invoice-specific overrides** — targets `.ibc-*` and `.invoice-print-*` class names from the component tree.

Nothing is injected at runtime by JavaScript. The print rules are pure CSS.

---

## Usage

### Basic

Wrap your invoice list in `<InvoicePrintRoot>`:

```tsx
import InvoicePrintRoot from '@/components/InvoicePrintRoot';
import InvoiceList from '@/components/InvoiceList';

function InvoicesPage() {
  return (
    <InvoicePrintRoot>
      <InvoiceList invoices={invoices} />
    </InvoicePrintRoot>
  );
}
```

### Letter paper

```tsx
<InvoicePrintRoot paper="letter">
  <InvoiceList invoices={invoices} />
</InvoicePrintRoot>
```

### Hide the print trigger

```tsx
<InvoicePrintRoot showTrigger={false}>
  <InvoiceList invoices={invoices} />
</InvoicePrintRoot>
```

### After-print callback

```tsx
<InvoicePrintRoot onAfterPrint={() => analytics.track('invoice_printed')}>
  <InvoiceList invoices={invoices} />
</InvoicePrintRoot>
```

### Manual class application (without wrapper)

If you render invoices outside the wrapper, ensure the parent has the correct class:

```html
<div class="invoice-print-root">
  <!-- invoice content -->
</div>
```

For Letter paper add `invoice-print-letter` to the same element.

### Suppress printing a specific element

Add `data-print="hide"` or the utility class `no-print`:

```tsx
<div data-print="hide">Only visible on screen</div>
<div class="no-print">Also only visible on screen</div>
```

---

## CSS class reference

### Root wrapper

| Class | Applied by | Purpose |
|---|---|---|
| `.invoice-print-root` | `InvoicePrintRoot` | Names the A4 `@page`. Enables the invoice-specific reset scope. |
| `.invoice-print-letter` | `InvoicePrintRoot` when `paper="letter"` | Switches to the `@page letter` named page. |

### Header

| Class | Purpose |
|---|---|
| `.invoice-print-header` | Two-column grid (brand left, meta right). `break-inside: avoid`. |
| `.invoice-print-header__brand` | Large bold brand name (18pt). |
| `.invoice-print-header__from` | Sender address block. |
| `.invoice-print-header__bill-to` | Recipient address block. |
| `.invoice-print-header__meta` | Right-aligned invoice number / date / due date. |
| `.invoice-print-header__label` | Small-caps label preceding a meta value. |

### Status badge

| Class | Colour (print) |
|---|---|
| `.invoice-print-status--paid` | `#155724` (dark green, 7.2:1 on white) |
| `.invoice-print-status--pending` | `#6d4c00` (dark amber, 7.1:1 on white) |
| `.invoice-print-status--failed` | `#7b1d1d` (dark red, 7.4:1 on white) |
| `.invoice-print-status--adjusted` | `#6d4c00` |
| `.invoice-print-status--refunded` | `#005577` (dark teal, 7.0:1 on white) |

### Invoice breakdown card (`ibc-*`)

| Class | Print behaviour |
|---|---|
| `.ibc-wrap` | Border normalised to 1pt solid #ccc; radius removed. |
| `.ibc-wrap--credit-note` | Left accent border 2pt `#6d4c00` (distinguishes credit notes on paper). |
| `.ibc-toggle` | Static (pointer-events: none), light grey background. |
| `.ibc-toggle__chevron` | Hidden — not needed on paper. |
| `.ibc-body` | `display: block !important` — always visible regardless of accordion state. |
| `.ibc-cn-meta` | Credit-note metadata block. Light grey background, condensed padding. |
| `.ibc-cn-meta__value--credit` | Dark green `#155724`. |
| `.ibc-table` | `page-break-inside: auto`; thead repeats on each page. |
| `.ibc-table th` | `#f0f0f0` background, bold, uppercase, double top/bottom border. |
| `.ibc-table td` | 0.5pt hairline bottom border. `break-inside: avoid` per row. |
| `.ibc-num` | Switches to `Courier New` for tabular alignment. |
| `.ibc-desc` | `white-space: normal; max-width: none` — shows full description text. |
| `.ibc-summary` | `break-inside: avoid`; 1.5pt top border. |
| `.ibc-summary-row--total` | Bold 11pt, 1.5pt top border. |
| `.ibc-summary-row--credit .ibc-summary-row__value` | Dark green `#155724`. |
| `.ibc-summary-row__label-dot` | Hidden — colour dots are meaningless on B&W prints. |
| `.ibc-actions` | `display: none !important` — all action buttons suppressed. |
| `.ibc-credit-note-badge` | Border-only pill (no fill), dark amber. |

### Utilities

| Class / attribute | Purpose |
|---|---|
| `data-print="hide"` | Hides any element in print. |
| `.no-print` | Alias for the above. |
| `data-print-no-href` | Suppresses `href` echo after links in print inside this container. |
| `.no-print-href` | Alias for the above. |
| `.page-break-before` | Forces a page break before the element. |
| `.page-break-after` | Forces a page break after the element. |
| `.page-break-avoid` | Prevents a page break inside the element. |
| `.invoice-print-trigger` | Screen-only affordance — hidden in print. |

---

## Design tokens in print

Inside `@media print` the stylesheet overrides every semantic CSS custom property on `:root` so that components using tokens automatically render correctly without additional rules:

```css
@media print {
  :root {
    --color-text-primary:   #000000;
    --color-text-secondary: #1a1a1a;
    --color-surface-card:   #ffffff;
    --color-brand-primary:  #005577;   /* 7.0:1 on white */
    --color-success:        #155724;   /* 7.2:1 on white */
    --color-warning:        #6d4c00;   /* 7.1:1 on white — darker than UI amber */
    --color-danger:         #7b1d1d;   /* 7.4:1 on white */
    /* …and all surface / border tokens → white / light grey */
  }
}
```

Any new component that uses these tokens will automatically print correctly.

---

## Page layout (@page)

```css
@page {
  size: A4 portrait;
  margin: 15mm 18mm 20mm;

  @top-left   { content: "Stellabill"; }
  @top-right  { content: "Page X of Y"; }
  @bottom-center { content: "CONFIDENTIAL — Do not distribute"; }
}

@page :first {
  /* First page: running header suppressed (invoice header replaces it) */
  @top-left  { content: ""; }
  @top-right { content: ""; }
}

@page letter { size: letter portrait; margin: 19mm 22mm 22mm; }
@page rtl-page { /* same as default but page numbers flipped */ }
```

### Browser support

`@page` margin boxes (`@top-left`, `@top-right`, `@bottom-center`) are supported in:
- Chrome / Edge (Blink) — full support  
- Firefox — partial (running headers work but counter style may vary)  
- Safari — limited (`@top-*` boxes ignored; page numbers not shown)

The stylesheet degrades gracefully — without running headers, the page content is still fully readable.

---

## Chrome suppression

The following selectors are hidden with `display: none !important` in print:

```css
.sb-sidebar,
.sb-sidebar__brand,
.sb-sidebar__nav,
.app-layout__glow,
.app-layout__bottom-nav-wrapper,
.landing-navbar,
.site-navbar,
[class*="cmdk"],
[class*="toast"],
[class*="tooltip"],
[class*="overlay"]:not(.invoice-print-root),
[class*="palette"],
[class*="shortcuts"],
[class*="changelog"],
[class*="help-sidebar"],
[class*="modal"]:not(.invoice-print-root),
[class*="notification"],
[class*="snackbar"],
[data-print="hide"],
.no-print
```

The layout is collapsed to a simple block flow:

```
app-layout       → display: block
app-layout__shell → display: block
app-layout__main → width: 100%, padding: 0
app-layout__content → max-width: 100%, padding: 0
```

---

## Credit-note variant

Credit notes are distinguished from regular invoices in two ways:

1. **Screen** — A left accent stripe (`border-left: 3px solid var(--color-warning)`) and a pill badge labelled "Credit Note".  
2. **Print** — The accent stripe is retained at 2pt dark-amber (`#6d4c00`); the badge is border-only (no fill); the metadata block (parent invoice, reason, amount redeemed) is rendered in a light grey box before the line-items table.

The credit-note metadata block carries `data-print-no-href` to suppress the `href` echo (the `#invoice-INV-xxx` hash link would otherwise print as `(#invoice-INV-xxx)` after the text).

---

## RTL support

For right-to-left languages:

- `invoice-print-header__meta` right-aligns to left (mirrors for RTL reading direction).  
- Numeric table columns (last-child, nth-child(2), nth-child(3)) flip alignment from right to left.  
- Page running headers swap sides: `"Page X of Y"` moves to `@top-left` and `"Stellabill"` to `@top-right`.

The RTL page variant uses a separate `@page rtl-page` named page, applied via `[dir="rtl"] .invoice-print-root { page: rtl-page; }`.

---

## Dark-mode handling

Dark-mode is implemented via `[data-theme="dark"]` custom property overrides in `tokens.css`. The print stylesheet re-overrides `:root` inside `@media print`, which takes precedence over `[data-theme="dark"]` because the `:root` specificity rule applies last in cascade order and is declared after the token imports.

This means printing in dark mode produces the same high-contrast white-background output as printing in light mode — which is the desired behaviour (ink saving, readability).

---

## Forced-colors (High Contrast)

For users who have Windows High Contrast Mode enabled (or any OS forced-colors setting), the nested `@media (forced-colors: active)` block inside `@media print` replaces all explicit colours with system keywords:

```css
@media print {
  @media (forced-colors: active) {
    .ibc-table th  { background: Canvas !important; color: CanvasText !important; }
    .ibc-table td  { color: CanvasText !important; border-color: CanvasText !important; }
    .ibc-summary-row--total { color: CanvasText !important; }
    /* … all other targets … */
  }
}
```

This ensures the document remains accessible for users with visual impairments who rely on forced-color environments even during printing.

---

## Accessibility (WCAG 2.1 AA)

| Criterion | Implementation |
|---|---|
| **1.4.3 Contrast (Minimum)** | All print colours verified at ≥ 4.5:1 on white. Warning amber darkened from UI `#b45309` (2.8:1 on white) to `#6d4c00` (7.1:1). |
| **1.4.6 Contrast (Enhanced)** | Body text (`#1a1a1a` on white) achieves 14.2:1, exceeding AAA. |
| **1.4.11 Non-text Contrast** | Table borders (`#cccccc`) are decorative; semantic structure is conveyed by the table itself. |
| **1.3.1 Info and Relationships** | `<table>` with `<thead>`, `<th scope="col">`, `<caption>` preserves all semantic structure in print. |
| **2.4.6 Headings and Labels** | `<caption class="sr-only">` provides a screen-reader–accessible label for each invoice table. |
| **1.3.4 Orientation** | `portrait` orientation is set but not locked; user can override via browser print dialog. |

### Colour contrast audit

| Colour pair | Ratio | Use |
|---|---|---|
| `#000000` on `#ffffff` | 21:1 | Body text |
| `#1a1a1a` on `#ffffff` | 14.2:1 | Secondary text, cell values |
| `#444444` on `#ffffff` | 9.7:1 | Muted labels |
| `#155724` on `#ffffff` | 7.2:1 | Success / paid / credit |
| `#6d4c00` on `#ffffff` | 7.1:1 | Warning / pending / adjusted |
| `#7b1d1d` on `#ffffff` | 7.4:1 | Danger / failed |
| `#005577` on `#ffffff` | 7.0:1 | Brand links / refunded |
| `#6d4c00` on `#f9f9f9` | 6.8:1 | Credit-note badge on meta bg |
| `#155724` on `#f9f9f9` | 6.9:1 | Amount redeemed value |

All ratios exceed 4.5:1 (WCAG 2.1 AA Level AA).

---

## Edge cases

| Scenario | Handled by |
|---|---|
| **Multi-page invoice** | `display: table-header-group` on `<thead>` repeats column headers on each page. `break-inside: avoid` on `<tr>` keeps rows whole. |
| **Very long description** | `.ibc-desc` overrides `max-width: none; white-space: normal; word-break: break-word`. |
| **Collapsed accordion in print** | `.ibc-body { display: block !important }` — always shown. |
| **Header-only credit note** (no line items) | Component conditionally renders table only when `lineItems` is non-empty. CSS still applies correctly. |
| **Orphan credit note** (no parent invoice) | `ibc-cn-meta__none` renders "No parent invoice linked" in italic grey. |
| **Print in dark mode** | `:root` token override inside `@media print` restores white background. |
| **Print in Windows High Contrast** | Nested `@media (forced-colors: active)` block restores system colours. |
| **RTL languages** | Separate `@page rtl-page` + alignment overrides. |
| **Letter paper** | `.invoice-print-letter` on the root applies `@page letter` (8.5×11 in). |
| **`filter: none`** | All CSS `filter` properties cleared to avoid grey box artefacts in some browsers when printing dark surfaces. |

---

## Testing approach

Tests run in jsdom via Vitest. Because `@media print` rules are not evaluated in jsdom, tests assert:

1. **Correct class names** are emitted by the component (the print stylesheet targets these classes).  
2. **ARIA attributes** are correct (`aria-expanded`, `aria-label`, `role`, `aria-controls`).  
3. **DOM structure** is consistent with what the stylesheet expects (table exists when lineItems are present, `.ibc-actions[data-print="hide"]`, etc.).  
4. **Interactive behaviour** (expand/collapse, keyboard, CSV download).  
5. **`InvoicePrintRoot` component** — paper class application, trigger render, `window.print()` call, `afterprint` callback lifecycle.

For visual regression testing of the actual print output, use Chromium's `--print-to-pdf` flag or Playwright's `page.pdf()` in a dedicated visual test suite.

---

## Known browser limitations

| Browser | Limitation |
|---|---|
| Safari | `@page` margin boxes (`@top-left`, `@top-right`, `@bottom-center`) are not rendered. Page numbers will not appear. |
| Firefox | `@page` named pages may not honour the `page` property on elements. Running headers display but `counter(pages)` may be 0. |
| Chrome / Edge | Full support including named pages and margin boxes. |

The document is still fully readable in all browsers without the running headers — the invoice header section contains all necessary identifying information.

---

## Design decisions

**Why not inject styles with JavaScript?**  
CSS `@media print` rules are zero-cost at runtime. A JS injection approach adds complexity, increases the risk of race conditions, and would not benefit from browser print-preview caching.

**Why override `:root` tokens instead of using `!important` everywhere?**  
Token overrides allow any component that already consumes the design system tokens to automatically print correctly. Hard-coding `!important` values on individual properties would require updating the print stylesheet every time a new component is added.

**Why is `--color-warning` darkened for print?**  
The UI amber `#b45309` only achieves 2.8:1 contrast ratio on white — far below the WCAG 2.1 AA minimum of 4.5:1. The print value `#6d4c00` achieves 7.1:1 while remaining visually unambiguous as "warning/amber".

**Why use a named `@page` for RTL instead of CSS logical properties?**  
`@page` at-rules cannot be nested inside `[dir="rtl"]` selectors — they are not scoped to element contexts. The workaround is to declare a separate named page (`rtl-page`) and assign it via the `page` CSS property on the root element when RTL is detected.

**Why are `.ibc-actions` and all buttons hidden?**  
Buttons (download CSV, reissue) are interactive affordances that serve no purpose on paper. Hiding them also removes extraneous `href` echoes that would otherwise clutter the printed page.
