# Testing Guide

This guide covers how to run and extend the frontend test suite.

## Running tests

```bash
# Full suite
npm test -- --run

# Watch mode (development)
npm test

# A single file
npm test -- src/components/PricingCalculator/PricingCalculator.test.tsx
```

## Test stack

Tests use a React testing framework with a DOM environment. Query elements by
accessible role or label rather than by CSS class or implementation detail.

## Test categories

### Unit tests

Unit tests cover a single component or utility in isolation. Prefer testing
behavior over implementation: render the component, interact as a user would,
and assert on the rendered output.

### Component tests

For interactive components (sliders, calculators, toggles, forms), test:

- **Initial render** — correct defaults and labels.
- **Interaction** — changing an input updates the derived output.
- **Boundaries** — min/max/step handling and empty state.
- **Accessibility** — keyboard operation and announced state changes.

### Integration tests

Integration tests exercise a feature across multiple components (for example a
calculator that updates a summary and a CTA together).

## Writing tests

- Use table-driven cases for numeric components with many input combinations.
- Keep fixtures minimal and local to the test file.
- Avoid depending on wall-clock time or network access.

## Accessibility assertions

- Interactive elements are reachable by keyboard.
- State changes are exposed to assistive technology.
- Images have meaningful alternative text.

## CI

The `quality.yml` workflow runs type-check, lint, and tests on every pull
request. A PR that fails any of these is blocked from merge.
