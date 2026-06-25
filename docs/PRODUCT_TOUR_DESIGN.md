cross# Onboarding Product Tour Design Specification

**Issue:** #227 (hypothetical)
**Status:** Design & Implementation Spec

---

## 1. Overview

The **Onboarding Product Tour** is a non-blocking, guided experience for first-time merchants. It uses a spotlight and tooltip pattern to introduce key areas of the application—Dashboard, Plans, and Settings—without disrupting the user's workflow. The tour is designed to be optional, skippable, and resumable.

### Key Features

| Feature | Status | Notes |
|---|---|---|
| Non-blocking spotlight UI | ✅ Spec | Dims the background, highlighting one element at a time. |
| Contextual tooltips | ✅ Spec | Provides step-by-step guidance next to the highlighted element. |
| State persistence | ✅ Spec | Remembers completion status in `localStorage`. |
| Keyboard navigable | ✅ Spec | Fully operable via keyboard. |
| Prefers-reduced-motion support | ✅ Spec | Disables animations for users who prefer it. |
| Declarative step definition | ✅ Spec | Developers can easily add or modify tour steps. |

---

## 2. Component Architecture

The tour system is built around a React Context and several key components:

- **`ProductTourProvider`**: A context provider that wraps the entire application. It manages the tour's state (active step, visibility, registered steps) and persists the completion status to `localStorage`.
- **`useProductTour` hook**: A custom hook that provides access to the tour's context, allowing components to start, stop, or navigate the tour.
- **`<TourStep>` component**: A declarative, renderless component used to define and register a tour step from anywhere in the component tree.
- **`TourSpotlight` component**: The internal component that renders the visual spotlight overlay and the tooltip card for the active step.

### Usage Pattern

1.  **Wrap the app**:
    ```tsx
    // In App.tsx or main.tsx
    <ProductTourProvider>
      <App />
    </ProductTourProvider>
    ```

2.  **Tag target elements**: Add a `data-tour-id` attribute to any element you want to highlight.
    ```html
    <div data-tour-id="dashboard-revenue-chart">...</div>
    ```

3.  **Define steps**: Use the `<TourStep>` component within the same view as the target element.
    ```tsx
    // In Dashboard.tsx
    <TourStep
      id="step1"
      title="Revenue Overview"
      content="This chart shows your monthly recurring revenue at a glance."
      targetId="dashboard-revenue-chart"
    />
    ```

---

## 3. UI Components

### A. Spotlight Overlay

- **Function**: Dims the entire page except for a cutout around the target element.
- **Implementation**: A fixed-position SVG overlay with a path calculated using `evenodd` fill rule. The path is animated to smoothly transition between steps.
- **Interaction**: `pointer-events: none` ensures it doesn't block interaction with the underlying page (though the tooltip is the primary interaction point).

### B. Tooltip Card

- **Layout**: A floating card positioned near the highlighted element.
- **Content**:
  - **Title**: The main heading for the step.
  - **Body**: Descriptive text.
  - **Footer**: Contains navigation controls and progress.
- **Controls**:
  - **`Next` / `Finish`**: Primary button to proceed.
  - **`Back`**: Secondary button, appears from the second step onwards.
  - **`Skip`**: A subtle button to exit the tour immediately.
  - **Progress Indicator**: Text showing the current step (e.g., "2 / 5").

### C. Completion State

- **Function**: A small, celebratory toast/notification that appears briefly after the user clicks "Finish" on the final step.
- **Content**: A simple message like "🎉 Tour complete! You're all set."
- **Interaction**: Can be dismissed manually or fades out automatically.

---

## 4. Responsive Design

| Breakpoint | Layout |
|---|---|
| **Desktop (≥ 768px)** | The tooltip card is positioned intelligently (above or below the target) to avoid overlapping with the element itself. |
| **Mobile (< 768px)** | The tooltip card is typically centered at the top or bottom of the screen to maximize readability, as screen real estate is limited. The spotlight cutout scales with the target element. |

---

## 5. Accessibility

- **Focus Management**:
  - When a step is active, focus is moved to the tooltip card, specifically the "Next" button.
  - Keyboard focus is trapped within the tooltip's interactive elements (`Tab` and `Shift+Tab` cycle through buttons).
  - When the tour is dismissed, focus is restored to the element that was focused before the tour started.
- **Screen Reader Narration**:
  - The tooltip is a `role="dialog"` with `aria-labelledby` and `aria-describedby` pointing to its title and body.
  - The spotlight overlay has `aria-hidden="true"`.
  - The progress indicator is read as part of the dialog content.
- **Reduced Motion**: The `prefers-reduced-motion` media query is respected. All transitions (spotlight path, tooltip position) are disabled if the user has this preference enabled.

---

## 6. Edge Cases & Guards

- **Target Not Found**: If the element for `targetId` is not in the DOM, the step is gracefully skipped.
- **Resuming**: The tour does not currently support resuming from a specific step after being skipped. Skipping ends the tour for the session.
- **Multi-Page Steps**: The provider logic handles navigation between pages. If the next step's `path` is different, it uses React Router's `navigate` function before showing the step.

---

## 7. Test Strategy

- **Unit/Component Tests (`ProductTour.test.tsx`)**:
  - Test the `ProductTourProvider` and `useProductTour` hook for state management.
  - Simulate starting, navigating (next/back), and ending/skipping the tour.
  - Verify that `localStorage` is correctly updated upon completion.
  - Test focus management by asserting `document.activeElement`.
  - Mock and test multi-page navigation logic.
  - Test that `prefers-reduced-motion` disables animations.
  - Test coverage must be ≥ 95%.
- **Accessibility Audit**: Run `axe` during tests to catch accessibility violations in the rendered tooltip dialog.

---

This specification ensures the Onboarding Product Tour is a helpful, unobtrusive, and accessible feature for new users.