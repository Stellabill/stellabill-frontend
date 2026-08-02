# Segmented Control Component — Design Specification

## Overview
A fully accessible segmented control component with ARIA semantics that allows users to toggle between mutually exclusive options.

## Visual Design
- Horizontal button group with rounded outer corners (8px)
- Active segment: primary color bg (#3B82F6), white text
- Inactive: transparent bg, slate text (#64748B)
- Hover: light bg (#F1F5F9)
- Focus: 2px outline (#93C5FD), offset 2px
- Divider between segments: 1px #E2E8F0
- Height: 40px, min segment width: 80px
- Transition: background-color 150ms ease

## Accessibility
-  on container
-  on each segment
- 
-  for group label
- Keyboard: Arrow keys navigate, Tab enters group
- Screen reader: announces 'selected' state

## States
- Enabled (default)
- Disabled (greyed out, cursor not-allowed)
- Loading (skeleton segments)

## Responsive
- Mobile: Full width, segments equal width
- Desktop: Intrinsic width, segments auto-size

## Edge Cases
- Single segment: renders as toggle button
- Overflow segments: horizontal scroll with gradient fade
- RTL: mirror layout
