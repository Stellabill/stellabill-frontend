# Product Tour

Stellabill uses a single, unified product tour system built around `ProductTourProvider` in `src/components/Dashboard/`.

## Architecture

Previously, three overlapping tour systems existed (`src/components/ProductTour/*`, `src/hooks/useProductTour.ts`, and `src/components/Dashboard/ProductTourProvider.tsx`). `Dashboard.tsx` mounted `ProductTour` + `TourCompletion` + `useProductTour`, while `ProductTourProvider` was unused. These have been consolidated into `ProductTourProvider`.

### Files

```
src/components/Dashboard/
├── ProductTourProvider.tsx      # Context provider, useProductTour hook, step definitions, storage & migration
├── TourSpotlight.tsx            # Spotlight overlay and tooltip dialog
├── TourStep.tsx                 # Declarative step registration helper
├── TourResumeCheckpoint.tsx     # Resume chip when a tour is paused mid-way
├── ProductTour.module.css       # Styles for spotlight, tooltip, and checkpoint chip
├── ProductTourProvider.test.tsx # Provider, checkpoint, and migration tests
├── TourStep.test.tsx            # Step registration tests
├── TourResumeCheckpoint.test.tsx# Resume chip tests
└── __tests__/TourSpotlight.test.tsx
```

### Mounting

- `src/App.tsx` wraps routes in `<ProductTourProvider>`.
- `src/pages/Dashboard.tsx` renders `<TourResumeCheckpoint />` so paused tours can be resumed.
- `src/components/Layout.tsx` triggers `resetTour()` + `startTour()` from the sidebar and command palette ("Product tour" / "Start product tour").

## State Persistence & Migration

All tour state is stored under a single versioned `localStorage` key:

- **`stellabill_tour_v1`** — JSON object:
  ```json
  {
    "version": 1,
    "completed": false,
    "dismissed": false,
    "checkpoint": null
  }
  ```

### One-Time Legacy Migration

On first load, if `stellabill_tour_v1` is absent and any legacy keys exist:
- `sb:tour-completed`
- `sb:tour-dismissed`
- `sb:tour-completed-version`
- `stellabill_tour_completed`
- `stellabill_tour_checkpoint`

`loadTourState()` migrates the user's completed, dismissed, and checkpoint state into `stellabill_tour_v1` and removes the legacy keys.

## Usage

### Using the Hook

```tsx
import { useProductTour } from '../components/Dashboard/ProductTourProvider';

function MyComponent() {
  const { startTour, resetTour, isTourActive, hasCompleted } = useProductTour();

  return (
    <button onClick={() => { resetTour(); startTour(); }}>
      Restart Tour
    </button>
  );
}
```

### Step Definitions

Default step collections (`dashboardTourSteps`, `plansTourSteps`, `settingsTourSteps`, `navigationTourSteps`) are exported from `src/components/Dashboard/ProductTourProvider.tsx`. Steps can match targets via `data-tour-id="<targetId>"` or `targetSelector` CSS selectors.

Additional steps can also be registered dynamically with `<TourStep />`:

```tsx
import { TourStep } from '../components/Dashboard/TourStep';

<TourStep
  id="custom-step"
  title="Custom Feature"
  content="Description of the feature."
  targetId="custom-feature"
/>
```

## Testing

```bash
npx vitest run src/components/Dashboard/ProductTourProvider.test.tsx src/components/Dashboard/TourStep.test.tsx src/components/Dashboard/TourResumeCheckpoint.test.tsx src/components/Dashboard/__tests__/TourSpotlight.test.tsx
```
