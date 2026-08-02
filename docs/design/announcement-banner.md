# In-App Announcement Banner System — Design Specification

## Overview
A flexible announcement banner system for in-app notifications, promotions, and status updates with priority levels and dismissal behavior.

## Visual Design
- Full-width banner below header (48-64px height)
- Priority colors: Critical #DC2626, Warning #F59E0B, Info #3B82F6, Success #22C55E
- Icon left, text center, close button right
- Optional CTA button on right
- Shadow: 0 2px 4px rgba(0,0,0,0.1)
- Entrance: slide-down 300ms ease-out
- Exit: slide-up 200ms ease-in

## Interaction
- Dismiss: × button or swipe up (mobile)
- Snooze: 'Remind later' option
- Multiple banners: stack with 4px gap
- Priority: higher priority replaces lower
- Persist dismissals in localStorage

## Accessibility
-  for critical,  for others
- Focus trap NOT used (banner is non-modal)
- Close button: 
- Auto-announce to screen readers

## States
- Active (visible)
- Dismissed (hidden for session)
- Snoozed (hidden for duration)
- Expired (auto-removed after deadline)

## Edge Cases
- Banner queue when multiple active
- Screen size <320px: stacked layout
- Print: hidden
- Reduced motion: instant show/hide
