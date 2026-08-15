# Component Conventions

This guide describes the conventions used for UI components in this codebase.
It is intended for contributors adding or modifying React components.

## General principles

- **Accessibility first.** Every interactive element must be keyboard operable
  and expose the correct ARIA semantics. Custom controls (sliders, segmented
  controls, toggles) must announce their state to assistive technology.
- **Controlled inputs.** Form components are controlled: their value comes from
  props and changes are surfaced through callbacks, never mutated locally.
- **Responsive by default.** Layouts must degrade gracefully from desktop to
  mobile. Test narrow viewports for every new component.
- **Composable over monolithic.** Prefer small, single-purpose components that
  can be composed, over large components that do everything.

## Structure of a new component

```
src/components/<Name>/
  index.tsx          public export + component
  <Name>.test.tsx    unit tests
  <Name>.stories.tsx optional storybook story
  <Name>.module.css  scoped styles (if any)
```

## State management

- Keep transient UI state (slider position, open/closed panels) local with
  `useState`/`useReducer`.
- Lift state to a parent only when more than one component must observe it.
- Server/domain data is fetched through the data layer and passed down as
  props; components must not fetch directly.

## Accessibility checklist

- Every image has a meaningful `alt` (or is marked decorative).
- Every form control has an associated `<label>` or `aria-label`.
- Focus order matches visual order.
- Focus is visibly indicated (`:focus-visible`).
- State changes are announced via `aria-live` regions where appropriate.

## Styling

- Use design tokens for colors, spacing, and typography rather than raw values.
- Colors must respect the active theme; avoid hard-coded light-only values.
- Animation should respect `prefers-reduced-motion`.

## Testing

- Unit tests assert the component's behavior from the user's perspective
  (render + interaction), not implementation details.
- For components with numeric inputs (pricing calculators, meters), add
  boundary tests for min/max/step handling and empty state.
