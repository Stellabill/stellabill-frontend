Title: design: chord shortcut affordance

Description:
This PR introduces chord and sequence shortcut affordances, addressing the issue of single-key shortcuts running out and avoiding collisions.

Changes:
- **KeyboardChordIndicator**: Added a floating "waiting" badge near the app shell corner with motion tokens for enter/exit animations.
- **Accessibility**: Implemented a polite live region (`aria-live="polite"`) to announce the pending state of chord shortcuts.
- **Layout Logic**: Updated `Layout.tsx` to handle chord states (`g s` for Subscriptions) and sequence logic.
- **Documentation**: Documented chord conventions in `KeyboardShortcutsOverlay.tsx`.
- **Edge Cases Handled**: Handled chord timeouts, reduced motion, IME composition, and responsive (hidden on mobile) assumptions.
- **Testing**: Added unit tests for the indicator and chord functionality to ensure robust coverage.
