# Notification Snooze & Mute

Design-system documentation for per-item snooze and mute affordances in `NotificationsCenter`.

---

## Overview

Users can silence a single noisy notification thread without dismissing it. Two modes are available:

| Mode | Behaviour | Resume |
|------|-----------|--------|
| **Snooze** | Hides the item for a fixed duration (1 h, 8 h, or 1 day). | Automatic — the item reappears when the timer expires. |
| **Mute** | Hides the item indefinitely. | Manual — the user must open the *Muted (n)* section and unmute. |

Silenced items collapse behind a **Muted (n)** footer section. The count reflects both muted and snoozed items. Expanding the section shows all silenced items with their individual unmute/resume controls.

---

## Anatomy

```
┌─────────────────────────────────────┐
│ Billing alerts      [×]             │  ← panel header
│ 2 unread            Mark all read   │  ← toolbar
├─────────────────────────────────────┤
│ ⚠  Charge failed for Pro Seat       │
│    4 min ago              [⏱ ▾]    │  ← snooze trigger (per item)
│    Update the payment method…       │
│    failed charge      Fix payment ▶ │
├─────────────────────────────────────┤
│ 🔕  Muted (1)                    ▾  │  ← silenced section toggle
│  ↳ [expanded list of muted items]   │
└─────────────────────────────────────┘
```

---

## Snooze trigger

The **snooze trigger** is a small icon button (`[⏱ ▾]`) at the top-right of each notification item, to the right of the timestamp.

- **Idle** — Timer icon + chevron. `aria-label`: *"Snooze or mute: {title}"*
- **Snoozed** — Clock icon (amber) + resume hint (*"Resumes in 2 h"*). `aria-label`: *"Snoozed — {title}. Open to change"*
- **Muted** — VolumeX icon (muted) + "Muted" hint. `aria-label`: *"Muted — {title}. Open to unmute"*

---

## Snooze dropdown menu

Triggered by clicking or pressing **ArrowDown** on the snooze trigger.

```
┌──────────────────────┐
│ SNOOZE FOR           │  heading (not focusable)
│   🕐  1 hour         │  menuitem
│   🕑  8 hours        │  menuitem
│   🕙  1 day          │  menuitem
│ ─────────────────── │  separator
│   🔇  Mute this…     │  menuitem (danger style)
└──────────────────────┘
```

When the item is already snoozed, an additional **Resume now** menuitem replaces the snooze options at the top.  
When the item is muted, snooze options are hidden and only **Unmute** is shown.

### Keyboard interaction

| Key | Action |
|-----|--------|
| `Click` / `Enter` / `Space` on trigger | Opens menu |
| `ArrowDown` on trigger | Opens menu and focuses first item |
| `ArrowDown` / `ArrowUp` in menu | Move between items |
| `Home` | Focus first item |
| `End` | Focus last item |
| `Escape` | Close menu, return focus to trigger |
| `Enter` / `Space` on item | Activate item |

---

## Muted (n) section

A collapsible footer section shown whenever `silencedCount > 0`.

- **Toggle button** — `aria-expanded`, `aria-controls` wired to the list. Label: *"Muted (n)"*.
- **Expanded list** — shows muted items first, then snoozed items. Each item has a snooze trigger with its own unmute/resume options.
- **Silenced item appearance** — 50% opacity (`notifications-item-muted`) to visually distinguish from active items.

---

## Live region announcements

All silence/resume actions announce via an `aria-live="polite"` region:

| Action | Announcement |
|--------|-------------|
| Snooze 1 h | *"{title} snoozed for 1 hour"* |
| Snooze 8 h | *"{title} snoozed for 8 hours"* |
| Snooze 1 d | *"{title} snoozed for 1 day"* |
| Mute | *"{title} muted"* |
| Unmute / Resume | *"{title} notifications resumed"* |

The live region uses `aria-atomic="true"` so the full sentence is read on every update.

---

## State model

State lives in `NotificationsCenter` as a `Map<string, NotificationSilenceState>`:

```ts
// expiresAt = number  → snoozed until that Unix ms timestamp
// expiresAt = null    → muted indefinitely
interface NotificationSilenceState {
  expiresAt: number | null;
}
```

Helpers:

```ts
isSnoozed(id)  // expiresAt > Date.now()
isMuted(id)    // expiresAt === null
isSilenced(id) // isSnoozed || isMuted
```

Snooze expiry is checked at render time using `getNow()` (injectable for tests). The item reappears automatically on the next render after expiry — no polling timer is needed for the panel, which is opened on demand.

---

## CSS classes

| Class | Purpose |
|-------|---------|
| `.notifications-snooze-wrapper` | Relative-positioned container for trigger + menu |
| `.notifications-snooze-trigger` | Icon button — idle / snoozed / muted variants via `data-snoozed` / `data-muted` |
| `.notifications-snooze-menu` | Dropdown `role="menu"` panel |
| `.notifications-snooze-menu-heading` | Non-interactive section heading inside menu |
| `.notifications-snooze-menu-item` | Base menuitem style |
| `.notifications-snooze-menu-item-mute` | Danger-tinted mute action |
| `.notifications-snooze-menu-item-unmute` | Teal-tinted unmute action |
| `.notifications-snooze-menu-item-unsnooze` | Teal-tinted resume action |
| `.notifications-snooze-divider` | Horizontal rule between snooze options and mute action |
| `.notifications-snooze-resume` | Inline resume hint shown below the trigger |
| `.notifications-item-muted` | 50% opacity on silenced list items |
| `.notifications-silenced-section` | Wrapper for the collapsible footer section |
| `.notifications-silenced-toggle` | Expand/collapse button for the section |
| `.notifications-silenced-chevron` | Animated chevron inside toggle |
| `.notifications-silenced-chevron-open` | 180° rotation when expanded |
| `.notifications-list-silenced` | Inner list of silenced items |

---

## RTL support

The snooze dropdown uses `right: 0` by default so it aligns with the trigger.  
In `[dir="rtl"]` contexts the rule is overridden to `left: 0; right: auto` so the menu opens towards the leading edge.

---

## i18n keys

All new keys live under `notifications.snooze.*` in `src/locales/en.json`.

| Key | Default (en) |
|-----|--------------|
| `snooze.triggerLabel` | *"Snooze or mute: {{title}}"* |
| `snooze.triggerLabelSnoozed` | *"Snoozed — {{title}}. Open to change"* |
| `snooze.triggerLabelMuted` | *"Muted — {{title}}. Open to unmute"* |
| `snooze.menuLabel` | *"Snooze or mute options for {{title}}"* |
| `snooze.snoozeFor` | *"Snooze for"* |
| `snooze.1h` | *"1 hour"* |
| `snooze.8h` | *"8 hours"* |
| `snooze.24h` | *"1 day"* |
| `snooze.mute` | *"Mute this notification"* |
| `snooze.unmute` | *"Unmute"* |
| `snooze.unsnooze` | *"Resume now"* |
| `snooze.mutedLabel` | *"Muted"* |
| `snooze.resumesInHours` | *"Resumes in {count} h"* |
| `snooze.resumesInMinutes` | *"Resumes in {count} min"* |
| `snooze.silencedCount` | *"Muted ({count})"* |
| `snooze.silencedListLabel` | *"Muted and snoozed notifications"* |
| `snooze.announceSnoozed1h` | *"{{title}} snoozed for 1 hour"* |
| `snooze.announceSnoozed8h` | *"{{title}} snoozed for 8 hours"* |
| `snooze.announceSnoozed24h` | *"{{title}} snoozed for 1 day"* |
| `snooze.announceMuted` | *"{{title}} muted"* |
| `snooze.announceResumed` | *"{{title}} notifications resumed"* |

---

## Accessibility checklist (WCAG 2.1 AA)

- [x] All interactive elements meet 44 × 28 px minimum touch target
- [x] Focus visible on every interactive element (`outline: 2px solid #22d3ee`)
- [x] Snooze trigger: `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`
- [x] Menu: `role="menu"`, `aria-label` tied to notification title
- [x] Menu items: `role="menuitem"`, keyboard-navigable with Arrow / Home / End
- [x] Escape closes the menu and restores focus to the trigger
- [x] Live region: `aria-live="polite"`, `aria-atomic="true"` — announces every silence/resume action
- [x] Silenced section toggle: `aria-expanded`, `aria-controls`
- [x] Colour is not the only differentiator — icon shape also changes (Timer → Clock → VolumeX)
- [x] Contrast: all text meets 4.5 : 1 against `#0d121f` / `#131c2e` backgrounds

---

## Component API

```tsx
<NotificationsCenter
  initialNotifications={BillingNotification[]}  // optional; defaults to built-in sample data
  getNow={() => number}                          // optional; overrides Date.now() for deterministic tests
/>
```

The `getNow` prop is intentionally **not** part of the public production API surface — it is typed as optional and defaults to `Date.now`. Pass it only in tests.
