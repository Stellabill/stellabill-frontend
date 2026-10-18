import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { ProductTourProvider, useProductTour } from "./ProductTourProvider";

const CHECKPOINT_KEY = "stellabill_tour_checkpoint";

function ContextProbe() {
  const tour = useProductTour();

  return (
    <output data-testid="checkpoint">
      {tour.checkpoint ? JSON.stringify(tour.checkpoint) : "null"}
    </output>
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
    if (raw !== undefined) localStorage.setItem(CHECKPOINT_KEY, raw);

    renderProvider();

    expect(screen.getByTestId("checkpoint")).toHaveTextContent("null");
  });

  it("ignores malformed checkpoint JSON", () => {
    localStorage.setItem(CHECKPOINT_KEY, "{not-json");

    expect(() => renderProvider()).not.toThrow();
    expect(screen.getByTestId("checkpoint")).toHaveTextContent("null");
  });

  it("ignores parsed JSON that is not a checkpoint object", () => {
    localStorage.setItem(CHECKPOINT_KEY, "null");

    expect(() => renderProvider()).not.toThrow();
    expect(screen.getByTestId("checkpoint")).toHaveTextContent("null");
  });

  it.each([
    ["a different number", 2],
    ["the current version encoded as a string", "1"],
  ])("ignores a checkpoint with %s", (_label, version) => {
    localStorage.setItem(
      CHECKPOINT_KEY,
      JSON.stringify({
        stepIndex: 0,
        stepId: "01-overview",
        title: "Dashboard overview",
        version,
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
    localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(checkpoint));

    renderProvider();

    expect(screen.getByTestId("checkpoint")).toHaveTextContent(
      JSON.stringify(checkpoint)
    );
  });
});
