# Offline-Mode Banner and Cached-View Badges — Design Specification

## Overview
A persistent offline-mode banner and cached-view badges that provide clear user feedback when the application is disconnected or displaying cached data.

## Visual Design

### Offline Banner
- **Position**: Fixed top of viewport, below app header (z-index: 100)
- **Colors**: Amber/Orange background (#FFF3CD), dark text (#856404)
- **Icon**: Wi-Fi-off icon (left-aligned, 20px)
- **Typography**: 14px system font, medium weight
- **Animation**: Slide-down entrance (300ms ease-out), auto-dismiss on reconnect with fade-out (500ms)
- **Dimensions**: Full-width, 48px height, 16px horizontal padding
- **States**:
  - *Connected*: Hidden (display: none)
  - *Disconnected*: Shown with "You are offline. Changes will sync when connection is restored."
  - *Reconnecting*: Shown with "Reconnecting..." + spinner animation

### Cached-View Badge
- **Position**: Top-right corner of any component/data section (absolute)
- **Colors**: Semi-transparent slate (#64748B at 85% opacity)
- **Typography**: 11px uppercase "CACHED" label
- **Icon**: Small clock icon (12px)
- **Animation**: Fade-in (200ms) when data source is cache
- **Variants**:
  - *Stale cache* (>5 min): Orange tint warning
  - *Fresh cache* (<5 min): Default slate

## Interaction Design

### Offline Detection
- Use `navigator.onLine` + periodic health-check pings (every 30s)
- Network status change events trigger immediate banner update
- Debounce reconnect events (2s) to prevent flicker

### User Actions
- **Dismiss**: Banner has a close (×) button — dismisses for current session
- **Manual Retry**: "Retry" button triggers immediate health check
- **View Offline Queue**: Link to pending action queue (if applicable)

## Accessibility
- `role="alert"` on banner for screen reader announcement
- `aria-live="polite"` for status changes
- Cached badge: `aria-label="Data shown from cache"`
- Focus management: banner receives focus on appearance

## Responsive Behavior
- **Mobile** (<768px): Full-width banner, stacked layout for long messages
- **Tablet** (768-1024px): Banner with max-width 720px centered
- **Desktop** (>1024px): Same as tablet

## Performance
- CSS-only animations (no JS animation frames)
- Banner rendered via CSS `transform` for GPU acceleration
- Lazy hydration: banner component loads after critical path

## Edge Cases
- Flapping connection (alternating online/offline): 3s cooldown between state changes
- Very slow connection: Treat as offline after 5s health-check timeout
- Service Worker active: Coordinate with SW cache strategy
