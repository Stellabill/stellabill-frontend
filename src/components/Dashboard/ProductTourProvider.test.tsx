import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import {
  LEGACY_TOUR_KEYS,
  ProductTourProvider,
  TOUR_STORAGE_KEY,
  TOUR_STORAGE_VERSION,
  dashboardTourSteps,
  navigationTourSteps,
  plansTourSteps,
  settingsTourSteps,
  useProductTour,
} from "./ProductTourProvider";

function ContextProbe() {
  const tour = useProductTour();

  return (
    <div>
      <output data-testid="checkpoint">
        {tour.checkpoint ? JSON.stringify(tour.checkpoint) : "null"}
      </output>
      <output data-testid="completed">{String(tour.hasCompleted)}</output>
      <output data-testid="dismissed">{String(tour.hasDismissed)}</output>
      <output data-testid="total-steps">{String(tour.totalSteps)}</output>
      <button onClick={() => tour.endTour(true)}>Complete</button>
      <button onClick={() => tour.endTour(false)}>Dismiss</button>
      <button onClick={() => tour.resetTour()}>Reset</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <ProductTourProvider>
        <ContextProbe />
      </ProductTourProvider>
    </MemoryRouter>
  );
}

describe("ProductTourProvider checkpoint initialization", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it.each([
    ["absent", undefined],
    ["empty", ""],
  ])("starts without a checkpoint when storage is %s", (_label, raw) => {
    if (raw !== undefined) localStorage.setItem(TOUR_STORAGE_KEY, raw);

    renderProvider();

    expect(screen.getByTestId("checkpoint")).toHaveTextContent("null");
  });

  it("ignores malformed state JSON", () => {
    localStorage.setItem(TOUR_STORAGE_KEY, "{not-json");

    expect(() => renderProvider()).not.toThrow();
    expect(screen.getByTestId("checkpoint")).toHaveTextContent("null");
  });

  it("ignores parsed JSON that is not a state object", () => {
    localStorage.setItem(TOUR_STORAGE_KEY, "null");

    expect(() => renderProvider()).not.toThrow();
    expect(screen.getByTestId("checkpoint")).toHaveTextContent("null");
  });

  it.each([
    ["a different number", 2],
    ["the current version encoded as a string", "1"],
  ])("ignores a checkpoint with %s", (_label, version) => {
    localStorage.setItem(
      TOUR_STORAGE_KEY,
      JSON.stringify({
        version: TOUR_STORAGE_VERSION,
        completed: false,
        dismissed: false,
        checkpoint: {
          stepIndex: 0,
          stepId: "01-overview",
          title: "Dashboard overview",
          version,
        },
      })
    );

    renderProvider();

    expect(screen.getByTestId("checkpoint")).toHaveTextContent("null");
  });

  it("exposes a valid checkpoint through the context", () => {
    const checkpoint = {
      stepIndex: 0,
      stepId: "01-overview",
      title: "Dashboard overview",
      version: 1,
    };
    localStorage.setItem(
      TOUR_STORAGE_KEY,
      JSON.stringify({
        version: TOUR_STORAGE_VERSION,
        completed: false,
        dismissed: false,
        checkpoint,
      })
    );

    renderProvider();

    expect(screen.getByTestId("checkpoint")).toHaveTextContent(
      JSON.stringify(checkpoint)
    );
  });
});

describe("ProductTourProvider legacy storage migration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("migrates sb:tour-completed to the versioned key and removes legacy keys", () => {
    localStorage.setItem(LEGACY_TOUR_KEYS.sbCompleted, "true");
    localStorage.setItem(LEGACY_TOUR_KEYS.sbVersion, "1.0");

    renderProvider();

    expect(screen.getByTestId("completed")).toHaveTextContent("true");
    expect(screen.getByTestId("dismissed")).toHaveTextContent("false");
    expect(localStorage.getItem(LEGACY_TOUR_KEYS.sbCompleted)).toBeNull();
    expect(localStorage.getItem(LEGACY_TOUR_KEYS.sbVersion)).toBeNull();

    const stored = JSON.parse(localStorage.getItem(TOUR_STORAGE_KEY) || "{}");
    expect(stored).toEqual({
      version: TOUR_STORAGE_VERSION,
      completed: true,
      dismissed: false,
      checkpoint: null,
    });
  });

  it("migrates sb:tour-dismissed to the versioned key", () => {
    localStorage.setItem(LEGACY_TOUR_KEYS.sbDismissed, "true");

    renderProvider();

    expect(screen.getByTestId("completed")).toHaveTextContent("false");
    expect(screen.getByTestId("dismissed")).toHaveTextContent("true");
    expect(localStorage.getItem(LEGACY_TOUR_KEYS.sbDismissed)).toBeNull();

    const stored = JSON.parse(localStorage.getItem(TOUR_STORAGE_KEY) || "{}");
    expect(stored.dismissed).toBe(true);
  });

  it("migrates stellabill_tour_completed to the versioned key", () => {
    localStorage.setItem(LEGACY_TOUR_KEYS.providerCompleted, "true");

    renderProvider();

    expect(screen.getByTestId("completed")).toHaveTextContent("true");
    expect(localStorage.getItem(LEGACY_TOUR_KEYS.providerCompleted)).toBeNull();
  });

  it("migrates a valid legacy checkpoint when tour is not completed", () => {
    const checkpoint = {
      stepIndex: 2,
      stepId: "revenue-chart",
      title: "Track Revenue Growth",
      version: 1,
    };
    localStorage.setItem(
      LEGACY_TOUR_KEYS.providerCheckpoint,
      JSON.stringify(checkpoint)
    );

    renderProvider();

    expect(screen.getByTestId("checkpoint")).toHaveTextContent(
      JSON.stringify(checkpoint)
    );
    expect(localStorage.getItem(LEGACY_TOUR_KEYS.providerCheckpoint)).toBeNull();
  });

  it("only writes to the single versioned storage key on state transitions", () => {
    renderProvider();

    act(() => {
      screen.getByText("Complete").click();
    });

    expect(localStorage.length).toBe(1);
    expect(localStorage.getItem(TOUR_STORAGE_KEY)).not.toBeNull();
    expect(screen.getByTestId("completed")).toHaveTextContent("true");

    act(() => {
      screen.getByText("Reset").click();
    });

    expect(localStorage.length).toBe(1);
    expect(screen.getByTestId("completed")).toHaveTextContent("false");
  });
});

describe("ProductTourProvider default step definitions", () => {
  it("provides dashboard steps by default and exports all step collections", () => {
    renderProvider();

    expect(screen.getByTestId("total-steps")).toHaveTextContent(
      String(dashboardTourSteps.length)
    );
    expect(dashboardTourSteps.length).toBe(5);
    expect(plansTourSteps.length).toBe(2);
    expect(settingsTourSteps.length).toBe(2);
    expect(navigationTourSteps.length).toBe(3);
  });
});
