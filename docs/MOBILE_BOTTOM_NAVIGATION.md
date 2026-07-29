# Mobile Bottom Navigation

## Overview

A mobile-first bottom navigation bar has been added to authenticated app shell screens to make primary destinations accessible without relying on the sidebar drawer.

## Behavior

- Visible only on screens narrower than 721px.
- Contains 5 primary destinations: Dashboard, Subscriptions, Plans, Browse Plans, Settings.
- Includes icon + label variants for each destination.
- Maintains active state via `aria-current="page"`.
- Adds safe-area padding using `env(safe-area-inset-bottom)` for iOS home bar support.
- Provides a thumb-friendly hit area with at least 4.25rem height and generous spacing.

## Accessibility

- Uses `role="navigation"` and `aria-label="Primary bottom navigation"`.
- Focus state is visible and compliant with WCAG 2.1 AA.
- Reduced motion users receive no transition animation.
- Works with route synchronization from React Router.

## Implementation

- Added bottom navigation markup to `src/components/Layout.tsx`.
- Added bottom nav styles to `src/styles/theme.css`.
- Wrapped authenticated routes with `Layout` in `src/App.tsx`.
- Added route-aware active state handling in the layout shell.

## Related issue

- #381
