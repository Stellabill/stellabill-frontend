# Accessibility Guide

This document describes the accessibility standards for UI components in this
codebase.

## Standards

Components target WCAG 2.1 AA. Key requirements:

- All functionality is keyboard operable.
- Text has sufficient contrast against its background.
- State and status changes are announced to assistive technology.
- Focus is visible and follows a logical order.

## Keyboard operation

Every interactive element must be reachable and operable with the keyboard
alone. Custom controls must implement the expected keyboard patterns:

- A slider responds to arrow keys (increment/decrement) and Home/End.
- A segmented control moves focus with arrow keys and selects with Enter or
  Space.
- A toggle responds to Space or Enter.
- A dialog traps focus while open and restores it on close.

## Focus management

- Focus moves in DOM order, which should match visual order.
- `:focus-visible` provides a visible indicator without showing it on mouse
  clicks.
- Focus is restored to the triggering element when an overlay closes.

## ARIA

- Custom controls expose correct roles (`role="slider"`, `role="tablist"`,
  etc.) and `aria-*` state attributes.
- State changes are announced via `aria-live` regions or `aria-*` updates.
- Every form control has an associated `<label>` or `aria-label`.

## Contrast and color

- Do not rely on color alone to convey state; pair color with an icon or text.
- Respect the active theme; verify contrast in both light and dark modes.

## Motion

- Respect `prefers-reduced-motion` by disabling non-essential animation.
- Keep essential motion subtle and short.

## Testing

Accessibility is verified in component tests (keyboard + ARIA assertions) and
should also be spot-checked with a screen reader during review.
