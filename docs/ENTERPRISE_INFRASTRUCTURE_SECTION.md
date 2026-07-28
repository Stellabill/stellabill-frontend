# Enterprise Infrastructure Section

## Purpose
The Enterprise Infrastructure section highlights the core operating model for Web3 billing and settlement flows. It combines an animated architecture diagram with keyboard-accessible callouts, a reduced-motion fallback, and a data-table equivalent for assistive technology users.

## Accessibility requirements
- Provide a descriptive alt-text summary via the figure caption and hidden image label.
- Expose the same information through a screen-reader-only table for non-visual access.
- Ensure each architecture node is reachable by keyboard and exposes tooltip guidance via `aria-describedby`.
- Respect `prefers-reduced-motion` by removing the animated flow line and preserving a static equivalent.
- Maintain contrast and focus states that meet WCAG 2.1 AA expectations.

## Visual pattern
- Use a dark, high-contrast shell with cyan accent tokens for the architecture flow.
- Present the diagram in a responsive two-column layout on large screens and a stacked layout on smaller screens.
- Keep callouts concise and task-oriented: one sentence summary plus a short detail string.

## Motion guidance
- The flow line uses a lightweight looping animation to imply movement between layers.
- The animation is disabled when the user prefers reduced motion.

## Content notes
- Keep component labels short and descriptive.
- Use the same terminology across the visual diagram, tooltip content, and data table.
