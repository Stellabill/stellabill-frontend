# Payment-Method Health Score Badge -- UI/UX Design Specification

## Overview

A **payment-method health score badge** provides merchants with an at-a-glance visual indicator of each saved payment method's reliability. The badge surfaces aggregated health signals (success rate, expiry status, decline history) as a compact, color-coded component.

## Target Issue

Closes #375

## Design Goals

1. **Glanceability** -- Users should understand payment-method health in under 500ms
2. **Actionability** -- Badge should link to detailed health information
3. **Accessibility** -- Color is never the sole differentiator; text + icon support all states
4. **Consistency** -- Follows the existing Stellabill design system (spacing, typography, color tokens)

## Health Score Tiers

| Tier | Score Range | Color Token | Icon | Description |
|------|-------------|-------------|------|-------------|
| Excellent | 90-100 | color-success-500 | shield-check | Payment method is reliable with high success rate |
| Good | 70-89 | color-success-300 | shield | Payment method works well, minor issues |
| Fair | 50-69 | color-warning-400 | shield-alert | Some decline history, needs monitoring |
| Poor | 0-49 | color-error-400 | shield-off | High failure rate, requires update |
| Unknown | N/A | color-neutral-400 | shield-question | Insufficient data for scoring |

## Component Anatomy

### Desktop (Horizontal)

```
[Icon]  Health Score  [Score Badge: 92]
        4 metrics assessed
```

### Mobile (Stacked, Compact)

```
[Icon]
Excellent
92/100
```

### Sub-components

1. **Icon** -- Visual indicator matching the health tier
2. **Score Value** -- Numeric score (0-100) with optional label
3. **Tier Label** -- Text label (Excellent/Good/Fair/Poor/Unknown)
4. **Metric Count** -- Small text showing how many signals contributed
5. **Tooltip (hover/focus)** -- Breakdown of individual health signals:
   - Success rate: 94% (last 30 days)
   - Expiry: Valid until 12/2027
   - Decline streak: 0
   - AVS/CVV match rate: 97%

## Interaction States

### Default
- Compact badge inline with payment method row
- Shows tier icon + score

### Hover (Desktop) / Long-press (Mobile)
- Expandable tooltip with detailed breakdown
- Smooth 200ms ease-out animation

### Focus (Keyboard)
- Visible focus ring
- Tooltip appears on :focus-visible

### Loading
- Skeleton pulse animation while fetching health data
- Width: 120px (desktop) / 80px (mobile)

### Error
- If health data fetch fails, show "Unavailable" state
- Retry button appears after 5 seconds

## Responsive Behavior

| Breakpoint | Layout | Max Width |
|------------|--------|-----------|
| >= 768px | Horizontal (icon + score + label) | 200px |
| < 768px | Stacked (icon only + score) | 80px |
| < 480px | Icon only (score in tooltip) | 48px |

## Color & Typography

- **Background**: Semi-transparent surface color
- **Border**: 1px solid, medium border radius
- **Font**: UI small (12px), medium weight
- **Score number**: UI large (16px), bold weight

## Accessibility (WCAG 2.1 AA)

- All color indicators have corresponding aria-label text
- Score presented as aria-valuenow + aria-valuemin/aria-valuemax
- Tooltip content is keyboard-accessible via role="tooltip"
- Focus order: badge to tooltip content
- Color contrast ratio >= 4.5:1 for all text on badge background

## Implementation Notes

### Component Props (React/TypeScript)

```typescript
interface PaymentMethodHealthBadgeProps {
  paymentMethodId: string;
  healthScore: number | null;  // 0-100, null = unknown
  metricsCount?: number;
  onViewDetails?: () => void;
  loading?: boolean;
  error?: boolean;
  compact?: boolean;  // Force compact mode
}
```

## States Matrix

| State | Icon | Color | Text | Interactive |
|-------|------|-------|------|-------------|
| Excellent | shield-check | green | "Excellent" | Clickable |
| Good | shield | green-light | "Good" | Clickable |
| Fair | shield-alert | yellow | "Fair" | Clickable |
| Poor | shield-off | red | "Poor" | Clickable |
| Unknown | shield-question | gray | "No data" | Not clickable |
| Loading | spinner | gray-light | "Loading..." | Not clickable |
| Error | alert-circle | red-light | "Unavailable" | Retry button |
| Disabled | shield | gray-light | Score value | Not clickable |

## Success Metrics

- Merchants can identify unhealthy payment methods 40% faster than list view
- Payment-method update rate increases (measured via method edit events)
- Zero accessibility violations (axe-core audit)

## References

- Stellabill Design System: component tokens + spacing scale
- WCAG 2.1: Understanding Success Criterion 1.4.1 (Use of Color)
- Payment method health scoring: backend endpoint GET /v1/payment-methods/{id}/health

---

**Author**: @laurentketterle-hub
**Date**: 2026-08-08
**Status**: Draft -- ready for design review

Signed-off-by: laurentketterle-hub <laurentketterle-hub@users.noreply.github.com>
