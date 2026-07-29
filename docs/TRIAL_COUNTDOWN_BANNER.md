# Trial Expiration Countdown Banner

## Overview

`TrialCountdownBanner` is a persistent banner that informs trial subscribers how many days remain before their trial expires. It escalates visual urgency as the deadline approaches, supports a "Remind me later" snooze affordance, and announces tier escalations to assistive technology without spamming the live region on every render.

---

## Urgency tiers

| Days remaining | Tier | Accent colour | Border animation |
|---|---|---|---|
| > 7 | `info` | Blue `#3b82f6` | None |
| 3 – 7 | `warning` | Amber `#f59e0b` | None |
| 1 – 2 | `urgent` | Red `#ef4444` | Pulsing border |
| 0 or expired | `expired` | Red `#ef4444` | None |

---

## Component

**File:** `src/components/TrialCountdownBanner.tsx`  
**Styles:** `src/components/TrialCountdownBanner.css`

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `trialEndsAt` | `string \| Date` | — | UTC date-string or Date when the trial ends |
| `onUpgrade` | `() => void` | — | Called when "Upgrade now" is clicked. If omitted, navigates to `upgradeHref` |
| `upgradeHref` | `string` | `"/plans"` | Fallback URL for the upgrade CTA |
| `onDismiss` | `() => void` | — | Called when the user permanently dismisses the banner |
| `snoozeDurations` | `{ label: string; hours: number }[]` | 1h / 4h / 24h | Options shown in the "Remind me later" menu |

### Usage

```tsx
import TrialCountdownBanner from '../components/TrialCountdownBanner';

<TrialCountdownBanner
  trialEndsAt="2026-08-05"
  upgradeHref="/plans"
  onUpgrade={() => router.push('/plans?source=trial_banner')}
  onDismiss={() => analytics.track('trial_banner_dismissed')}
/>
```

---

## Snooze / remind-me behaviour

- Clicking "Remind me later" opens a small dropdown menu with configurable snooze durations.
- Selecting a duration stores `{ expiry, tier }` in `sessionStorage` (key: `stellabill-trial-banner-snooze`).
- The banner is hidden until the snooze expires **or** the urgency tier escalates — whichever comes first.
- On tier escalation the snooze is cleared automatically so the subscriber always sees the upgraded warning.
- `sessionStorage` means snooze resets on tab close. `localStorage` is intentionally avoided so the banner resurfaces in new sessions.
- If `sessionStorage` is unavailable (private mode, storage disabled) the snooze silently no-ops — the banner stays visible.

---

## Permanent dismiss

- "Don't show again" removes the banner for the lifetime of the component.
- The `onDismiss` callback lets the parent persist this preference to a user profile or `localStorage`.

---

## Live-region / screen-reader escalation

- A **single** `aria-live="assertive"` region is rendered off-screen.
- It is populated **only when the tier changes** (tracked with `useRef` across renders), never on mount.
- Snooze confirmations go through the same region with `aria-live="assertive"`.
- This avoids repeated announcements while still alerting screen-reader users to urgency changes.

---

## Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|---|---|
| Region landmark | `role="region"` + `aria-labelledby` pointing to the headline |
| Tier escalation announced | `aria-live="assertive"` off-screen region, fires only on tier change |
| Countdown badge labelled | `aria-label="N days left"` on the badge `<span>` |
| Upgrade button | Descriptive `aria-label="Upgrade your plan now"` |
| Snooze button | `aria-expanded`, `aria-haspopup="menu"`, `aria-controls` wired to menu |
| Snooze menu items | `role="menu"` / `role="menuitem"` |
| Dismiss button | `aria-label="Dismiss trial expiration banner"` |
| Focus rings | `:focus-visible` on every interactive element |
| Touch targets | All buttons `min-height: 36px`; upgrade CTA 44 px on mobile |
| Reduced motion | Pulsing border animation suppressed via `@media (prefers-reduced-motion: reduce)` |
| All icons | `aria-hidden="true"` |

---

## Responsive

| Viewport | Layout |
|---|---|
| ≥ 641 px | Horizontal: body left, actions right |
| ≤ 640 px | Stacked: body then actions full-width; dismiss shows `×` icon only |

On mobile the snooze dropdown opens **upward** to avoid clipping at the bottom of the viewport.

---

## RTL

- Left border becomes a right border via `[dir="rtl"] .trial-banner`.
- Snooze menu aligns to the left edge in RTL.
- Menu items are right-aligned.

---

## Edge cases

| Scenario | Behaviour |
|---|---|
| Timezone boundary | `getDaysRemaining` normalises both ends to midnight local time. A trial ending "today" at any hour resolves to 0 days and shows the `expired` tier. |
| Expired yesterday | `daysRemaining` returns `-1`; still mapped to `expired` tier. "Remind me later" button hidden (no point snoozing an expired trial). |
| `sessionStorage` disabled | `setSnooze` / `clearSnooze` swallow the error; banner stays visible. |
| Tier escalates while snoozed | `useEffect` watching `tier` clears snooze and sets `snoozed = false`, so the banner reappears immediately with the new urgency level. |
| `snoozeDurations` overridden | Pass any array of `{ label, hours }` pairs; the component renders them as menu items without hardcoding. |
| `trialEndsAt` changes (prop update) | `getDaysRemaining` and `getTier` are pure functions called on every render; they always reflect the latest value. |

---

## Test simulation

Change the `+2` offset in `SubscriptionDetail.tsx` to simulate different tiers:

```tsx
// >7 days  → info (blue)
trialEndsAt.setDate(trialEndsAt.getDate() + 10);

// 3-7 days → warning (amber)
trialEndsAt.setDate(trialEndsAt.getDate() + 5);

// <3 days  → urgent (red, pulsing)
trialEndsAt.setDate(trialEndsAt.getDate() + 2);

// Expired today
// trialEndsAt = new Date();  ← no offset
```
