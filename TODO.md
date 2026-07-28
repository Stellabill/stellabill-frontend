# Implementation TODO

## Part 1: Tax Summary Breakdown Section for Invoices
- [x] Create `src/components/TaxSummaryBreakdown.css` — Component styles
- [x] Create `src/components/TaxSummaryBreakdown.tsx` — Tax breakdown component with:
  - [x] TaxLine interface (rate, name, taxableAmount, taxAmount, currency)
  - [x] TaxSummaryBreakdownProps interface
  - [x] Loading skeleton state
  - [x] Empty state (no taxes)
  - [x] Data table with tax lines
  - [x] Total row
  - [x] Accessibility (ARIA labels, roles)
- [x] Update `src/components/InvoiceList.tsx` — Add expandable tax summary to invoice rows
- [x] Ensure dark theme consistency

## Part 2: Multi-Token Onboarding Checklist Documentation
- [x] Create `docs/MULTI_TOKEN_ONBOARDING_CHECKLIST.md` — Comprehensive document
  - [x] Overview
  - [x] Pre-flight Checklist
  - [x] Integration Steps (Token Contract → UI → Testing → Deployment)
  - [x] Risk & Compliance
  - [x] Verification Runbook

