# Product Tour Quickstart

## Overview

The product tour is powered by `ProductTourProvider` in `src/components/Dashboard/ProductTourProvider.tsx` and mounted at the app root in `src/App.tsx`.

## Running Tour Tests

```bash
npx vitest run src/components/Dashboard
```

## Restarting the Tour

- **In the UI**: Click **Product tour** in the sidebar, or open the Command Palette (`⌘K` / `Ctrl+K`) and run **Start product tour**.
- **In DevTools Console**:
  ```js
  localStorage.removeItem('stellabill_tour_v1');
  location.reload();
  ```

## Inspecting Tour State

```js
JSON.parse(localStorage.getItem('stellabill_tour_v1'));
```

## Adding or Editing Steps

Edit `dashboardTourSteps` (or `plansTourSteps`, `settingsTourSteps`, `navigationTourSteps`) in `src/components/Dashboard/ProductTourProvider.tsx`, or mount a `<TourStep />` component on any page.

Each step supports:
- `id`: unique step identifier
- `targetId`: matches `[data-tour-id="<targetId>"]`
- `targetSelector` (optional): fallback CSS selector (e.g. `.dashboard-header`)
- `path`: route path where the step lives (e.g. `/dashboard`)
- `title`: heading shown in the spotlight tooltip
- `content`: text or React node shown in the tooltip body
