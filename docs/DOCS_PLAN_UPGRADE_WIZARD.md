# Plan Upgrade Wizard Design Specification

**Issue:** #225 (hypothetical)
**Status:** Design & Implementation Spec

---

## 1. Overview

The **Plan Upgrade Wizard** is a guided, multi-step component that allows users to change their subscription plan. It provides a clear, side-by-side comparison of features and a transparent preview of any prorated costs, reducing user friction and support queries related to billing changes.

### Key Features

| Feature | Status | Notes |
|---|---|---|
| Multi-step wizard flow | ✅ Spec | Select Plan → Review Changes → Confirm Proration |
| Side-by-side feature diff | ✅ Spec | Highlights added, removed, and changed features |
| Prorated cost preview | ✅ Spec | Calculates and displays immediate charges or credits |
| Responsive design | ✅ Spec | Adapts from desktop to mobile viewports |
| Accessibility (WCAG 2.1 AA) | ✅ Spec | Full keyboard navigation and screen reader support |
| No-change guard | ✅ Spec | Prevents users from "upgrading" to their current plan |

---

## 2. Component Architecture

The wizard is composed of several smaller, reusable components:

- **`PlanUpgradeWizard.tsx`**: The main state machine. Manages the current step (`select`, `review`, `confirm`), the selected target plan, and navigation between steps.
- **`FeatureDiffTable.tsx`**: A stateless table that accepts a `diff` array and renders a comparison between two plans. It uses accessible cues (icons and text) to denote changes.
- **`ProrationPreview.tsx`**: A stateless card that performs and displays the proration calculation based on old and new plan prices.

### Component Props (`PlanUpgradeWizard`)

```typescript
interface Plan {
  id: string;
  name:string;
  price: number;
  currency: string;
  features: Record<string, string | boolean>;
}

interface PlanUpgradeWizardProps {
  currentPlan: Plan;
  availablePlans: Plan[];
  onComplete: (newPlanId: string) => void;
}
```

---

## 3. Wizard Steps

### Step 1: Select Plan

- **Goal**: User selects a target plan to compare.
- **UI**: A grid of selectable `PlanCard` components. The user's current plan is excluded.
- **Interaction**: Clicking a card selects it. The "Review Changes" button is disabled until a selection is made.

### Step 2: Review Changes

- **Goal**: User understands the differences between their current plan and the new one.
- **UI**: The `FeatureDiffTable` is displayed, showing a row for each feature.
- **Change Indicators**:
  - **Added**: `+` icon, green color, screen reader text "Feature added".
  - **Removed**: `-` icon, red color, screen reader text "Feature removed".
  - **Changed**: `~` icon, yellow color, screen reader text "Feature changed" (e.g., "Basic" to "Advanced" API).
  - **Same**: No icon, neutral color.

### Step 3: Confirm Proration

- **Goal**: User understands the immediate financial impact of the change.
- **UI**: The `ProrationPreview` card is displayed.
- **Calculation**:
  - `credit = (oldPrice / cycleDays) * daysRemaining`
  - `charge = (newPrice / cycleDays) * daysRemaining`
  - `totalDue = charge - credit`
- **Display**: The card clearly labels the credit, the new charge for the remainder of the cycle, and the final amount due today (or credited to the account).

---

## 4. Responsive Design

| Breakpoint | Layout |
|---|---|
| **Desktop (≥ 1024px)** | Wizard is centered with a max-width. Plan selection is a multi-column grid. Feature table is fully visible. |
| **Tablet (768-1023px)** | Plan selection grid adjusts to fewer columns. Feature table may become horizontally scrollable if needed. |
| **Mobile (< 768px)** | Plan selection cards stack vertically. The feature diff table scrolls horizontally within its container to prevent page overflow. |

The wizard itself is a block-level component and will fit the container it is placed in, making it adaptable to different page layouts (e.g., full-width page or inside a modal).

---

## 5. Accessibility

- **Keyboard Navigation**:
  - All interactive elements (`PlanCard`, buttons) are focusable and can be activated with `Enter` or `Space`.
  - `Tab` order is logical, following the visual flow.
  - The `Back` button is hidden on the first step to avoid a non-functional tab stop.
- **ARIA Attributes**:
  - `role="radio"` and `aria-checked` are used on the selectable `PlanCard` components to create an accessible radio group.
  - `aria-label` is used on icons to provide text alternatives (e.g., "Feature added").
  - Table headers use `scope="col"` for proper screen reader association.
- **Color Contrast**: All text and UI elements meet WCAG 2.1 AA contrast ratios. Color is not used as the sole means of conveying information (icons and labels are also used).

---

## 6. Edge Cases & Guards

- **No Plan Selected**: The "Next" button on the first step is disabled until a plan is chosen.
- **Downgrade Path**: The proration logic correctly calculates a credit to the user's account when they move to a cheaper plan.
- **No-Change Guard**: The user's current plan is filtered out of the selection list, making it impossible to "upgrade" to the same plan.
- **Currency Formatting**: Prices are formatted using `Intl.NumberFormat` to ensure correct currency symbols and decimal placement.

---

## 7. Test Strategy

- **Unit/Component Tests (`PlanUpgradeWizard.test.tsx`)**:
  - Render each step of the wizard.
  - Simulate user interaction (clicking plans, navigating back and forth).
  - Verify that the correct feature diffs are calculated and displayed.
  - Assert that proration calculations are correct for both upgrades and downgrades.
  - Test keyboard accessibility for plan selection.
  - Confirm the `onComplete` callback is fired with the correct plan ID.
  - Test coverage must be ≥ 95%.
- **Visual Regression Tests**: (Future) Use a tool like Playwright or Storybook to capture screenshots of the wizard at different steps and breakpoints to prevent unintended visual changes.
- **Accessibility Audit**: Run `axe` during tests to automatically catch accessibility violations.

---

This specification ensures the Plan Upgrade Wizard is robust, user-friendly, and consistent with the high standards of the Stellabill application.