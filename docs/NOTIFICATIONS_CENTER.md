# Notifications Center

**Issue:** #219
**Status:** Component design spec
**Last updated:** 2026-05-31

## Overview

The notifications center gives billing events a persistent home in the app shell. Transient `TransactionToast` messages remain useful for immediate feedback after a user action, while this center stores events that need later review: failed charges, low prepaid balances, and plan changes.

## Entry Point

- The bell trigger sits with other shell actions and uses a high-contrast unread badge.
- The trigger announces the unread count through its accessible name.
- The panel can be opened by pointer or keyboard and closed with Escape, the close button, or outside click.

## Notification Types

| Type | Use | Visual treatment |
| --- | --- | --- |
| Error | Failed charge, retry exhausted, payment method failure | Red icon background and urgent label |
| Warning | Low prepaid balance or upcoming service interruption | Amber icon background and warning label |
| Info | Plan changes, billing settings updates, successful lifecycle events | Cyan icon background and info label |

Each item includes a title, concise message, received time, billing category, and optional action link.

## States

- **Unread:** Badge visible on the trigger and unread dot beside item title.
- **All caught up:** Shown after every item is marked read.
- **Empty:** Used when no persistent billing alerts exist yet.
- **Many items:** The panel keeps a fixed max height and scrolls the list without moving the header or toolbar.

## Accessibility Notes

- Color is paired with text labels and icons, so severity is not color-only.
- Focus outlines meet WCAG 2.1 AA expectations and all controls have keyboard-sized targets.
- The unread count is mirrored in a polite live region for screen reader updates.
- The panel uses `role="dialog"` with `aria-modal="false"` because it is a non-blocking shell popover.
- Badge colors use white on red for strong contrast against the dark shell.

## Responsive Notes

On small screens the panel switches to a fixed viewport-width sheet below the navbar. It preserves the same action order, readable line lengths, and scroll behavior.

## Toast Reconciliation

Use `TransactionToast` for immediate transaction status such as pending, success, or error after the current user action. Add a persistent notification when the event can affect billing state later, requires follow-up, or should remain discoverable after the toast disappears.
