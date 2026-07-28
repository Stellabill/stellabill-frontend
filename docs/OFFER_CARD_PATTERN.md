# Offer Card Pattern

## Purpose
Use the offer card pattern to present promotional actions with a clear eligibility message, an expiration countdown, and a prominent claim action.

## Variants
- Banner: for a single prominent offer spanning a section.
- Card: for standard inline promotional content in a grid or list.
- Tile: for compact, equal-height cards that appear in dense layouts.

## Accessibility
- Keep the CTA label action-oriented and descriptive.
- Ensure the countdown and eligibility text are announced clearly to assistive technology.
- Respect `prefers-reduced-motion` and avoid animated countdown changes.
- Maintain WCAG 2.1 AA contrast and focus visibility.

## Do
- Pair a short headline with a concise detail line.
- Use the same spacing and tokenized colors across all variants.
- Keep the claim action above the fold on mobile screens.

## Don't
- Hide eligibility and expiration details behind icon-only affordances.
- Use multiple competing CTA styles inside the same promotion.
- Overload small tiles with long descriptions.
