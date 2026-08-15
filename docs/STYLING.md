# Styling Guide

This guide describes the styling system and conventions for UI components.

## Design tokens

Components must use design tokens rather than raw values. Tokens cover:

- **Colors** — background, surface, text, border, and semantic states
  (success, warning, error, info).
- **Spacing** — a fixed scale for padding, margin, and gaps.
- **Typography** — font families, sizes, weights, and line heights.
- **Radii and shadows** — consistent corner rounding and elevation.

## Theming

The application supports light and dark themes. Component styles must:

- Reference semantic tokens that resolve per theme.
- Avoid hard-coded light-only or dark-only colors.
- Verify contrast in both themes.

## Layout

- Use the spacing scale for all spacing; do not introduce ad-hoc values.
- Prefer flex and grid for layout over absolute positioning.
- Keep components responsive: test narrow (mobile) and wide (desktop)
  viewports.

## State styles

Style component states explicitly:

- **Default** — the resting appearance.
- **Hover** — a subtle affordance that the element is interactive.
- **Focus-visible** — a visible focus ring for keyboard users.
- **Active/pressed** — feedback on activation.
- **Disabled** — reduced emphasis with a clear non-interactive signal.

Never rely on color alone to distinguish states; pair color with an icon or
text change.

## Motion

- Animation should be subtle and purposeful.
- Respect `prefers-reduced-motion` by disabling non-essential animation.
- Keep transitions short (under 300ms) for UI feedback.

## Writing styles

- Use CSS modules for component-scoped styles.
- Keep selectors flat and avoid deep nesting.
- Prefer class names that describe purpose, not appearance.
