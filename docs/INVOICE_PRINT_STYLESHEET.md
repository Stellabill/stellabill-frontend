# Invoice Print Stylesheet

**Design system reference — `src/styles/print.css`**
Branch: `uiux/386-invoice-print-stylesheet`
Issue: [#386 — Design a print stylesheet for invoices and receipts](https://github.com/Stellabill/stellabill-frontend/issues/386)

---

## Overview

Printing an invoice from the Stellabill app previously dumped the full app chrome (sidebar, background gradients, toast stack, command palette) onto the page. This stylesheet replaces that behaviour with a clean, high-contrast, paginated print layout that meets **WCAG 2.1 AA**, works on both **A4 and Letter** paper, and supports **RTL page numbering**.

---

## Files changed

| File | Purpose |
|---|---|
| `src/styles/print.css` | Core `@media print` stylesheet |
| `src/index.css` | Import of `print.css` |
| `src/components/InvoiceBreakdownCard.tsx` | `useIsPrinting` hook; force-expand on print; `data-print` attrs |
| `src/components/InvoiceList.tsx` | `invoice-print-root` class on list wrapper |
| `src/components/InvoicePrintView.tsx` | Dedicated print-only invoice view component |
| `src/components/__tests__/InvoicePrintView.test.tsx` | Unit + integration tests |
| `docs/INVOICE_PRINT_STYLESHEET.md` | This document |

---

## Design decisions

### `@page` rules

```css
@page {
  size: A4 portrait;
  margin: 15mm 18mm 20mm;
  @top-left  { content: "Stellabill"; }
  @top-right { content: "Page " counter(page) " of " counter(pages); }
}

@page letter {
  size: letter portrait;
  margin: 19mm 22mm 22mm;
}
```

- A4 (210 × 297 mm) is the default.  
- Letter (8.5 × 11 in) is activated by adding `invoice-print-letter` to the root element, which enables the named `@page letter` rule.
- Running header repeats the brand name and page counter on every page *except* the first (`@page :first`).

### Chrome suppression

The following selectors are hidden with `display: none !important` in `@media print`:

- `.sb-sidebar` — left navigation
- `.landing-navbar` — top navigation bar
- `.app-layout__glow` — decorative radial gradient
- `.app-layout__bottom-nav-wrapper` — mobile bottom navigation
- `[class*="cmdk"]` — command palette and trigger
- `[class*="toast"]` — toast notifications
- `[class*="tooltip"]` — floating tooltips
- `[class*="overlay"]`, `[class*="palette"]`, `[class*="shortcuts"]` — all layered UI
- `[class*="changelog"]`, `[class*="help-sidebar"]` — slide-over panels
- `[data-print="hide"]` — opt-out any element with this data attribute

### Layout collapse

```css
.app-layout        { display: block; }
.app-layout__shell { display: block; }
.app-layout__main  { width: 100%; margin: 0; padding: 0; }
.app-layout__content { max-width: 100%; padding: 0; }
```

The shell's flex/grid layout is collapsed to plain block flow so the main content takes the full paper width.

### High-contrast token override

All CSS custom properties that reference dark-mode colours are overridden inside `:root` within `@media print`:

```css
--color-text-primary:    #000000;
--color-surface-card:    #ffffff;
--app-background:        #ffffff;
--color-brand-primary:   #006699; /* A-link colour printable on white */
```

Contrast ratios on white paper for all body text exceed **4.5:1** (AA level for normal text). Status badges use a bordered style without relying on background colour fills alone, passing AA for non-text contrast (3:1).

### Force-colours (Windows High Contrast Mode)

```css
@media (forced-colors: active) {
  .ibc-wrap { border: 1pt solid CanvasText; }
  .ibc-table th { background: Canvas; color: CanvasText; }
  .invoice-print-status { border-color: CanvasText; color: CanvasText; }
}
```

### Reduced motion

All animations and transitions are `none !important` within `@media print`. The `useIsPrinting()` hook also fires a synchronous state update on the `change` event of `window.matchMedia("print")`, so `InvoiceBreakdownCard` is already force-expanded before the browser paints the print preview — no layout-triggered animation can fire.

---

## Component API

### `InvoicePrintView`

A standalone, always-expanded view suitable for embedding in a print-only page or PDF export pipeline.

```tsx
import InvoicePrintView from "@/components/InvoicePrintView";

<InvoicePrintView
  invoice={invoice}          // InvoiceWithBreakdown (required)
  from="Stellabill"          // Sender name — default "Stellabill"
  billTo="Jane Doe"          // Optional bill-to address block
  paperSize="a4"             // "a4" | "letter" — default "a4"
/>
```

### `useIsPrinting` (internal hook in `InvoiceBreakdownCard`)

Subscribes to `window.matchMedia("print")` and returns `true` while the browser is in print preview / printing. Used to force `InvoiceBreakdownCard` into the expanded state without requiring the user to manually expand each card before printing.

```ts
// Fires before the browser paints the print layout
const isPrinting = useIsPrinting();
const isExpanded = userExpanded || isPrinting;
```

### `data-print` attribute

Any element can be marked for suppression:

```html
<div data-print="hide">…</div>
```

The CSS targets `[data-print="hide"]` with `display: none !important` in `@media print`.

---

## Page-break rules

| Selector | Rule |
|---|---|
| `.ibc-wrap` | `page-break-inside: avoid` — keeps a card on one page if possible |
| `.ibc-table thead` | `display: table-header-group` — repeats column headers on every page |
| `.ibc-table tr` | `page-break-inside: avoid; break-inside: avoid` — prevents row splitting |
| `.ibc-summary` | `page-break-inside: avoid; break-inside: avoid` — keeps totals together |
| `.invoice-print-header` | `page-break-inside: avoid; break-inside: avoid` |
| `.page-break-before` | Utility class — forces a new page before the element |
| `.page-break-after` | Utility class — forces a new page after the element |
| `.page-break-avoid` | Utility class — avoids page break inside |

---

## Multi-page invoice behaviour

For invoices with many line items that span multiple pages:

1. `thead { display: table-header-group }` repeats the column header on each new page.
2. Each `<tr>` has `break-inside: avoid` to prevent a row being split mid-cell.
3. `.ibc-wrap` wraps the card with `break-inside: avoid`; if a single invoice is longer than a page, the browser will naturally break inside the card body.

---

## RTL support

```css
[dir="rtl"] .invoice-print-header__meta { text-align: left; }
[dir="rtl"] .ibc-table th:last-child,
[dir="rtl"] .ibc-table td:last-child    { text-align: left; }

[dir="rtl"] @page {
  @top-left  { content: "Page " counter(page) " of " counter(pages); }
  @top-right { content: "Stellabill"; }
}
```

Page-number direction is swapped in RTL documents (numbers to the left, brand name to the right).

---

## Dark-mode / `prefers-color-scheme: dark`

Dark-mode styles only apply on-screen. The print stylesheet is scoped entirely to `@media print` and overrides every dark-mode token to pure black-on-white. No special `prefers-color-scheme` condition is required because `@media print` already takes precedence.

---

## Accessibility (WCAG 2.1 AA audit)

| Criterion | Technique | Status |
|---|---|---|
| 1.4.3 Contrast (minimum) | All body text on white ≥ 4.5:1; headings ≥ 3:1 | ✅ Pass |
| 1.4.6 Contrast (enhanced) | `.ibc-num` monospace: #1a1a1a on #fafafa ≈ 14:1 | ✅ Pass (AAA) |
| 1.4.11 Non-text contrast | Status badges use border + text colour; no colour-only encoding | ✅ Pass |
| 1.3.3 Sensory characteristics | Status conveyed via text label, not colour alone | ✅ Pass |
| 2.4.6 Headings and labels | `<th scope="col">` on all column headers; `<caption>` on table | ✅ Pass |
| 2.4.2 Page titled | `@top-left` running header provides page identity | ✅ Pass |
| 1.4.12 Text spacing | No print styles override `line-height` below 1.5 | ✅ Pass |
| 1.3.4 Orientation | `portrait` is declared but user can override via browser print dialog | ✅ Pass |

### Axe notes

- `sr-only` captions are preserved (`position: absolute; overflow: hidden`) — screen-reader-accessible even in print contexts.
- All status badges carry their label as text content, not background-colour alone.
- No information is conveyed solely through colour (status = text + border style).

---

## Testing

```bash
pnpm test src/components/__tests__/InvoicePrintView.test.tsx
```

Tests cover:

- All invoice field rendering (id, date, status, line items, subtotal, taxes, credits, totals)
- Status badge class names (`--paid`, `--pending`, `--failed`)
- `billTo` conditional rendering
- Letter vs A4 paper-size class
- `useIsPrinting` force-expand via `matchMedia` mock
- Print-state collapse restore after print ends

---

## Usage example

```tsx
// On an invoice detail page, render both the interactive card
// AND a hidden print-only view:
import InvoiceBreakdownCard from "@/components/InvoiceBreakdownCard";
import InvoicePrintView from "@/components/InvoicePrintView";

function InvoicePage({ invoice }) {
  return (
    <>
      {/* Screen view — interactive expand/collapse */}
      <div className="no-print">
        <InvoiceBreakdownCard invoice={invoice} />
      </div>

      {/* Print view — always expanded, paper-optimised */}
      <div className="screen:hidden">  {/* hide on screen, show on print */}
        <InvoicePrintView invoice={invoice} billTo="Customer Name" />
      </div>
    </>
  );
}
```

---

*Made with IBM Bob*
