# Invoice print stylesheet

## Summary

The invoice history list now includes print-oriented styling so invoice records can be printed without the application chrome, sidebar, or background treatment.

## What changed

- Added a dedicated print stylesheet for the invoice list component.
- Introduced a print header and stronger contrast for invoice status and table rows.
- Used `@page` sizing with A4-friendly margins and page-break rules for table rows and cells.
- Kept the interactive download actions hidden during printing while preserving the readable invoice table.

## Accessibility notes

- The print layout uses high-contrast black-on-white values for body text and table borders.
- The table remains semantically structured with a caption and column headers.
- The print experience avoids decorative app chrome and supports multi-page documents without awkward row splits.
