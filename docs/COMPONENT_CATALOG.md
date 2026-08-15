# Component Catalog

This catalog lists the reusable UI components in the codebase, grouped by
category, with a short description and their accessibility requirements.

## Data entry

### PricingCalculator

A landing-page widget that computes a monthly total from seat, call, and
storage inputs. Requirements:

- Accessible slider and numeric input for each dimension.
- Live monthly total updates on every change.
- Recommended-plan summary with a jump-to-plans CTA.
- Keyboard operable (arrows for sliders, Home/End for bounds).

### PasswordStrengthMeter

Displays password strength with actionable guidance. Requirements:

- Announces the current strength level to assistive technology.
- Shows concrete suggestions (length, character classes).
- Does not rely on color alone to convey strength.

### SegmentedControl

A single-select control with full ARIA semantics. Requirements:

- `role="radiogroup"` with per-option `role="radio"` and `aria-checked`.
- Arrow-key navigation between options.
- Focus stays on the group while arrowing.

## Feedback & status

### OfflineBanner

A persistent banner shown when the client is offline, with a cached-data
indicator. Requirements:

- Announced via `aria-live` when it appears or dismisses.
- Clearly distinguishes cached (stale) data from live data.

### RateLimitError

An error UI with recovery actions for rate-limited requests. Requirements:

- Explains the limit and when it resets.
- Provides a primary recovery action and a secondary help action.

### AnnouncementBanner

An in-app announcement system. Requirements:

- Dismissible, with the dismissal persisted.
- Announced when a new announcement appears.

## Navigation & layout

### FloatingActionButton

A mobile primary-action button. Requirements:

- Reachable and activatable by keyboard.
- Labeled for screen readers.

### DashboardWidgetGrid

A dashboard widget layout with rearrangement support. Requirements:

- Drag-and-drop with a keyboard-accessible alternative.
- Focus order matches the visual order after rearrangement.

## Notifications

### NotificationPreferences

A preferences page with granular per-category toggles. Requirements:

- Every toggle is labeled and keyboard operable.
- Saved state is announced.

## Styling conventions

- All components use design tokens (no raw color/space values).
- Color is never the only indicator of state.
- Motion respects `prefers-reduced-motion`.
