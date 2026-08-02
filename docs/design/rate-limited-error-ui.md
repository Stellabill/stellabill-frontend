# Rate-Limited Error UI with Recovery Guidance — Design Specification

## Overview
A user-friendly error UI for rate-limited API responses that clearly communicates the restriction, shows a countdown timer, and provides actionable recovery guidance.

## Visual Design

### Error Toast / Banner
- **Position**: Top-center toast (z-index: 200), or inline for smaller sections
- **Colors**: 
  - *Warning state*: Amber #F59E0B background, white text
  - *Info state*: Blue #3B82F6 background, white text
- **Icon**: Clock/timer icon (left-aligned, 20px)
- **Animation**: Slide-in from top (400ms ease-out), slide-up on dismiss

### Countdown Timer
- **Display Format**: 
  - < 60s: "Try again in 45s"
  - < 60min: "Try again in 5m 30s"
  - > 60min: "Try again at 2:30 PM"
- **Update Frequency**: Every second for <60s, every 10s thereafter
- **Typography**: Monospace font for timer digits, 14px
- **Animation**: Timer pulses gently every second for <10s remaining

### Retry Button
- **Position**: Right side of the banner
- **Style**: Outline white button, 14px
- **States**:
  - *Disabled*: Greyed out, shows remaining time instead of "Retry"
  - *Enabled*: White outline, clickable
- **Behavior**: Auto-enables when timer reaches 0

### Recovery Guidance
- **Position**: Below the main message (when expanded)
- **Typography**: 13px, regular
- **Content examples**:
  - "You've made too many requests. Please wait before trying again."
  - "Consider upgrading your plan for higher rate limits."
  - "Last request: 2 minutes ago. Limit resets in 13 minutes."
- **Collapse/Expand**: Chevron toggle for detailed info

## Interaction Design

### Automatic Recovery
- When rate limit resets, banner updates to "Ready to retry"
- Optional: Auto-retry the failed request (with user consent setting)

### Manual Recovery Actions
- **Retry Now**: Replay the last failed request
- **Copy Error Details**: Copy request ID + timestamp for support
- **View API Usage**: Link to usage dashboard

## Accessibility
- `role="alert"` for immediate screen reader announcement
- Timer: `aria-label="Retry available in X minutes Y seconds"`
- Retry button: `aria-disabled="true"` when timer active
- All text meets WCAG 2.1 AA contrast (4.5:1 minimum)

## Responsive
- **Mobile**: Full-width banner at top, stacked layout for long content
- **Desktop**: Max-width 480px toast, centered

## Edge Cases
- **Consecutive rate limits**: Show escalating guidance ("Multiple limits hit — upgrading?")
- **Different endpoints**: Separate timers if different endpoints have different limits
- **429 with Retry-After header**: Parse and display server-provided time
- **429 without Retry-After**: Use exponential backoff (start at 1s, double to max 60s)
- **Browser refresh**: Timer state persisted in sessionStorage

## Implementation Notes
- Use HTTP 429 status + `Retry-After` header parsing
- Fallback: exponential backoff with jitter
- Queue failed requests for auto-retry if configured
