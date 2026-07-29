# Downgrade Confirmation Modal

## Overview

`DowngradeConfirmModal` is a confirmation dialog that gives subscribers complete context before they downgrade to a lower-tier plan. It surfaces the features they will lose, the price delta, the effective date, and requires an explicit acknowledgement before the action can proceed.

---

## Component

**File:** `src/components/DowngradeConfirmModal.tsx`  
**Styles:** `src/components/DowngradeConfirmModal.css`

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `isOpen` | `boolean` | — | Controls visibility |
| `onClose` | `() => void` | — | Called on backdrop click, close button, or Escape key |
| `onConfirm` | `() => void` | — | Called when the user checks the checkbox **and** clicks "Confirm downgrade" |
| `currentPlanName` | `string` | — | Display name of the current (higher) plan |
| `currentPlanPrice` | `string` | — | Formatted price string e.g. `"50 USDC / mo"` |
| `newPlanName` | `string` | — | Display name of the target (lower) plan |
| `newPlanPrice` | `string` | — | Formatted price string e.g. `"20 USDC / mo"` |
| `lostFeatures` | `PlanFeature[]` | — | Features the subscriber loses. Pass `[]` to show the "no features lost" variant |
| `isDelayed` | `boolean` | `true` | When `true`, the change takes effect at end of billing period; drives microcopy |
| `effectiveDate` | `string?` | derived | Human-readable effective date e.g. `"Aug 1, 2026"` |
| `comparePlansHref` | `string` | `"/plans"` | URL for the "See full plan comparison" link |
| `isLoading` | `boolean` | `false` | Shows spinner and disables actions during the API call |

### `PlanFeature` type

```ts
interface PlanFeature {
  id: string;      // React key
  label: string;   // Human-readable feature name
}
```

---

## Usage

```tsx
import DowngradeConfirmModal, { type PlanFeature } from '../components/DowngradeConfirmModal';

const lostFeatures: PlanFeature[] = [
  { id: 'api-calls',   label: 'Unlimited API calls (limited to 10k/mo on Basic)' },
  { id: 'support',     label: 'Priority support' },
  { id: 'analytics',   label: 'Advanced analytics dashboard' },
  { id: 'webhooks',    label: 'Custom webhooks' },
];

<DowngradeConfirmModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={handleConfirm}
  currentPlanName="Pro"
  currentPlanPrice="50 USDC / mo"
  newPlanName="Basic"
  newPlanPrice="20 USDC / mo"
  lostFeatures={lostFeatures}
  isDelayed={true}
  effectiveDate="Aug 1, 2026"
  comparePlansHref="/plans"
  isLoading={isDowngrading}
/>
```

---

## Anatomy

```
┌─────────────────────────────────────────────┐
│  ⚠ icon                            [×]      │
│  Downgrade to Basic?                        │
│  Review what changes before confirming.     │
│                                             │
│  ┌──────────────┐  →  ┌──────────────┐      │
│  │ PRO          │     │ BASIC        │      │
│  │ 50 USDC / mo │     │ 20 USDC / mo │      │
│  └──────────────┘     └──────────────┘      │
│                                             │
│  YOU WILL LOSE ACCESS TO                   │
│  ✗ Unlimited API calls                     │
│  ✗ Priority support                        │
│  ✗ Advanced analytics dashboard            │
│  ✗ Custom webhooks                         │
│                                             │
│  ℹ Your plan will change on Aug 1, 2026.   │
│    You keep full access until then.         │
│                                             │
│  See full plan comparison ↗                │
│                                             │
│  ☐ I understand I will lose the features   │
│    listed above at end of billing period.  │
│                                             │
│  [ Keep current plan ]  [ Confirm downgrade]│
└─────────────────────────────────────────────┘
```

---

## Variants

### No-features-lost

Pass `lostFeatures={[]}`. The feature list is replaced with a green success notice:

```
✓ No features will be removed with this downgrade.
```

Acknowledgement checkbox and confirmation button remain to prevent accidental clicks.

### Immediate downgrade (`isDelayed={false}`)

The effective-date notice switches to an amber warning tone:

```
⚠ Your plan changes to Basic immediately. Access to removed features ends now.
```

### Delayed downgrade (`isDelayed={true}`, default)

The effective-date notice uses the informational blue tone:

```
ℹ Your plan will change to Basic on Aug 1, 2026. You keep full access until then.
```

---

## Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|---|---|
| Dialog semantics | `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby` |
| Focus management | `useModalFocus` hook — traps focus inside modal, returns focus on close |
| Initial focus | "Keep current plan" cancel button (safe default, no destructive action on Enter) |
| Keyboard confirm | Checkbox is keyboard-operable; Enter/Space on confirm button submits |
| Escape to close | Handled by `useModalFocus` |
| Acknowledgement gate | Confirm button has `aria-disabled`, `aria-live="polite"`, and `aria-label` describing the disabled state |
| Loading state | Spinner button labelled `"Processing downgrade, please wait"` with `aria-live` |
| Icons | All `aria-hidden="true"` |
| Compare link | `<a>` with descriptive text; SR-only " (opens in new tab)" suffix |
| Touch targets | All buttons `min-height: 48px` (WCAG 2.5.5) |
| Reduced motion | Entry animation and spinner disabled via `@media (prefers-reduced-motion: reduce)` |

---

## Edge cases

| Scenario | Behaviour |
|---|---|
| `lostFeatures = []` | Green "no features lost" notice shown; flow still requires checkbox |
| `isDelayed = false` | Amber immediate-warning notice; checkbox copy updated accordingly |
| `isLoading = true` | Both buttons disabled; confirm shows spinner; close button disabled |
| Backdrop click | Calls `onClose` (not `onConfirm`) |
| Escape key | Calls `onClose` via `useModalFocus` |
| RTL layout | Overlay, feature list, and checkbox row all mirror via `[dir="rtl"]` rules |
| Mobile | Single-column action buttons; narrower chips in price delta row |
