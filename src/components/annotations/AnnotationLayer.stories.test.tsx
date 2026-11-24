import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import type { ReactElement } from "react";
import * as stories from "./AnnotationLayer.stories";

/**
 * Regression suite for the `Default` story (issue #850).
 *
 * `AnnotationLayer.stories.tsx` is the only executable description of the full
 * annotation workflow: the story owns a small in-memory store and wires the
 * layer's four callbacks to it. The story's **default** state is the failure
 * path worth protecting — the layer mounts with `annotatable === false`, so
 * clicking the invoice silently does nothing until the viewer opts into
 * annotation mode. Nothing asserted that, and a story edit could quietly flip
 * the default or break the callback wiring without any test noticing.
 *
 * This suite renders the story exactly as Storybook does (by invoking the
 * story's own `render` function, so the story's hooks and state machine are the
 * ones under test) and drives it end to end:
 *
 *   idle → opt in → click to annotate → open the new pin → comment →
 *   resolve → reopen → opt out
 *
 * It also pins the empty-comment path (`No comments yet. Add one below.`) and
 * that leaving annotation mode stops creating annotations.
 */

const defaultRender = stories.Default.render as unknown as () => ReactElement;

/** Render the `Default` story through a harness component so its hooks run in
 *  a real component instance, exactly like the Storybook renderer does. */
function renderDefaultStory() {
  const Harness = () => defaultRender();
  return render(<Harness />);
}

const pins = () => Array.from(document.querySelectorAll(".annotation-pin"));
const panel = () => document.querySelector(".annotation-panel");
const pinCounts = () =>
  Array.from(document.querySelectorAll(".annotation-pin-count")).map((n) => n.textContent);

const rect = (top: number, left: number, width: number, height: number): DOMRect => ({
  x: left,
  y: top,
  top,
  left,
  width,
  height,
  right: left + width,
  bottom: top + height,
  toJSON: () => ({}),
});

const contentLayer = () =>
  document.querySelector(".annotation-layer-content") as HTMLElement;

/** Give the fake jsdom layout a real box so click coordinates are meaningful. */
function stubLayout(width = 600, height = 300) {
  vi.spyOn(contentLayer(), "getBoundingClientRect").mockReturnValue(
    rect(0, 0, width, height)
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AnnotationLayer Default story — initial state", () => {
  it("renders the invoice content and both seeded pins", () => {
    renderDefaultStory();

    expect(screen.getByText("Invoice INV-001")).toBeInTheDocument();
    expect(screen.getByText("Total: $1,234.56")).toBeInTheDocument();
    expect(screen.getByText("Status: Paid")).toBeInTheDocument();
    expect(pins()).toHaveLength(2);
    expect(pinCounts()).toEqual(["1", "1"]);
  });

  it("starts with the panel closed and no annotatable region", () => {
    renderDefaultStory();

    expect(panel()).toBeNull();
    expect(screen.getByRole("button", { name: "Add annotation" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Invoice content with annotations")).toBeNull();
  });

  it("seeds one open and one resolved annotation", () => {
    renderDefaultStory();

    expect(pins()[0]).toHaveAttribute("data-resolve-state", "open");
    expect(pins()[1]).toHaveAttribute("data-resolve-state", "resolved");
  });
});

describe("AnnotationLayer Default story — the default no-op path", () => {
  it("does not create an annotation when the content is clicked before opting in", () => {
    renderDefaultStory();

    // Two clicks, still two pins: the story's default state is deliberately
    // inert so the user has to press "Add annotation" first.
    fireEvent.click(contentLayer(), { clientX: 100, clientY: 100 });
    fireEvent.click(contentLayer(), { clientX: 300, clientY: 200 });

    expect(pins()).toHaveLength(2);
    expect(panel()).toBeNull();
  });

  it("still opens an existing pin's panel while inert", () => {
    renderDefaultStory();

    fireEvent.click(pins()[0]);

    expect(panel()).not.toBeNull();
    expect(panel()?.textContent).toContain("This total seems high. Can we verify?");
  });
});

describe("AnnotationLayer Default story — opt in and annotate", () => {
  it("exposes the annotatable region once the toggle is pressed", () => {
    renderDefaultStory();

    fireEvent.click(screen.getByRole("button", { name: "Add annotation" }));

    expect(screen.getByRole("button", { name: "Done annotating" })).toBeInTheDocument();
    expect(screen.getByLabelText("Invoice content with annotations")).toBeInTheDocument();
    expect(contentLayer()).toHaveClass("annotation-layer-content--annotatable");
  });

  it("adds a new empty annotation at the clicked percentage", () => {
    renderDefaultStory();
    fireEvent.click(screen.getByRole("button", { name: "Add annotation" }));
    stubLayout(600, 300);

    fireEvent.click(contentLayer(), { clientX: 150, clientY: 75 });

    expect(pins()).toHaveLength(3);
    expect(pinCounts()).toEqual(["1", "1", "0"]);
    // Newest annotation starts open with no comments and is attributed to "You".
    expect(pins()[2]).toHaveAttribute("data-resolve-state", "open");
    expect(pins()[2]).toHaveStyle({ top: "25%", left: "25%" });
  });

  it("shows the empty-comment path for a freshly created annotation", () => {
    renderDefaultStory();
    fireEvent.click(screen.getByRole("button", { name: "Add annotation" }));
    stubLayout();
    fireEvent.click(contentLayer(), { clientX: 10, clientY: 10 });

    fireEvent.click(pins()[2]);

    expect(panel()).not.toBeNull();
    expect(screen.getByText("No comments yet. Add one below.")).toBeInTheDocument();
    expect(panel()?.textContent).toContain("Open");
  });

  it("stops creating annotations when the toggle is pressed again", () => {
    renderDefaultStory();
    const toggle = screen.getByRole("button", { name: "Add annotation" });
    fireEvent.click(toggle);
    stubLayout();
    fireEvent.click(contentLayer(), { clientX: 10, clientY: 10 });
    expect(pins()).toHaveLength(3);

    fireEvent.click(screen.getByRole("button", { name: "Done annotating" }));
    fireEvent.click(contentLayer(), { clientX: 200, clientY: 200 });

    expect(pins()).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Add annotation" })).toBeInTheDocument();
  });

  it("creates a second annotation when a pin is clicked while annotating", () => {
    // Regression guard for event bubbling: `AnnotationPin` does not stop
    // propagation, so clicking an existing pin during annotation mode both
    // opens that pin's panel and drops a new annotation underneath it.
    renderDefaultStory();
    fireEvent.click(screen.getByRole("button", { name: "Add annotation" }));
    stubLayout();

    fireEvent.click(pins()[0], { clientX: 30, clientY: 30 });

    expect(pins()).toHaveLength(3);
    expect(pinCounts()).toEqual(["1", "1", "0"]);
    expect(panel()).not.toBeNull();
  });

  it("does not create an annotation from a pin click once annotation mode is off", () => {
    renderDefaultStory();

    fireEvent.click(pins()[0], { clientX: 30, clientY: 30 });

    expect(pins()).toHaveLength(2);
    expect(panel()).not.toBeNull();
  });
});

describe("AnnotationLayer Default story — comment lifecycle on the new annotation", () => {
  function annotateOnce() {
    renderDefaultStory();
    fireEvent.click(screen.getByRole("button", { name: "Add annotation" }));
    stubLayout();
    fireEvent.click(contentLayer(), { clientX: 60, clientY: 30 });
    // Leave annotation mode before touching the new pin: a pin click bubbles to
    // the layer, which would otherwise drop a *second* annotation (covered by
    // its own regression test below).
    fireEvent.click(screen.getByRole("button", { name: "Done annotating" }));
    fireEvent.click(pins()[2]);
  }

  it("starts the new annotation with the empty-comment path", () => {
    annotateOnce();

    expect(pins()).toHaveLength(3);
    expect(pinCounts()).toEqual(["1", "1", "0"]);
    expect(panel()).not.toBeNull();
    expect(screen.getByText("No comments yet. Add one below.")).toBeInTheDocument();
  });

  it("writes the comment into the story store and updates the pin badge", () => {
    annotateOnce();

    fireEvent.change(screen.getByPlaceholderText("Add a comment..."), {
      target: { value: "Please confirm the tax line" },
    });
    fireEvent.click(screen.getByLabelText("Submit comment"));

    expect(panel()?.textContent).toContain("Please confirm the tax line");
    expect(panel()?.textContent).toContain("You");
    expect(screen.queryByText("No comments yet. Add one below.")).toBeNull();
    expect(pinCounts()).toEqual(["1", "1", "1"]);
  });

  it("keeps the submit button disabled while the draft is blank", () => {
    annotateOnce();

    const submit = screen.getByLabelText("Submit comment");
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("Add a comment..."), {
      target: { value: "   " },
    });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("Add a comment..."), {
      target: { value: "ok" },
    });
    expect(submit).not.toBeDisabled();
  });

  it("clears the draft after a successful submit", () => {
    annotateOnce();
    const input = screen.getByPlaceholderText("Add a comment...") as HTMLTextAreaElement;

    fireEvent.change(input, { target: { value: "done" } });
    fireEvent.click(screen.getByLabelText("Submit comment"));

    expect(input.value).toBe("");
  });

  it("resolves the new annotation and then reopens it", () => {
    annotateOnce();

    fireEvent.click(screen.getByLabelText("Resolve annotation"));
    expect(panel()?.textContent).toContain("Resolved");
    expect(pins()[2]).toHaveAttribute("data-resolve-state", "resolved");

    fireEvent.click(screen.getByLabelText("Reopen annotation"));
    // The story maps reopen to `reopened`, which the panel renders as "Open".
    expect(panel()?.textContent).toContain("Open");
    expect(pins()[2]).toHaveAttribute("data-resolve-state", "reopened");
  });

  it("closes the panel and keeps the annotation in the store", () => {
    annotateOnce();

    fireEvent.click(screen.getByLabelText("Close annotation panel"));

    expect(panel()).toBeNull();
    expect(pins()).toHaveLength(3);

    fireEvent.click(pins()[2]);
    expect(panel()).not.toBeNull();
  });

  it("does not leak a comment onto a different annotation", () => {
    annotateOnce();

    fireEvent.change(screen.getByPlaceholderText("Add a comment..."), {
      target: { value: "for the new pin only" },
    });
    fireEvent.click(screen.getByLabelText("Submit comment"));

    fireEvent.click(pins()[0]);

    expect(panel()?.textContent).toContain("This total seems high. Can we verify?");
    expect(panel()?.textContent).not.toContain("for the new pin only");
    expect(pinCounts()).toEqual(["1", "1", "1"]);
  });
});

describe("AnnotationLayer Default story — seeded annotation interaction", () => {
  it("adds a comment to the seeded annotation and bumps only its badge", () => {
    renderDefaultStory();
    fireEvent.click(pins()[0]);

    fireEvent.change(screen.getByPlaceholderText("Add a comment..."), {
      target: { value: "verified" },
    });
    fireEvent.click(screen.getByLabelText("Submit comment"));

    expect(pinCounts()).toEqual(["2", "1"]);
    expect(panel()?.textContent).toContain("verified");
  });

  it("keeps each seeded annotation's comments attached to its own pin", () => {
    renderDefaultStory();
    fireEvent.click(pins()[0]);
    fireEvent.click(screen.getByLabelText("Resolve annotation"));

    expect(pins()[0]).toHaveAttribute("data-resolve-state", "resolved");

    fireEvent.click(pins()[1]);
    expect(panel()?.textContent).toContain("Checked with vendor. Correct.");
    expect(panel()?.textContent).not.toContain("This total seems high. Can we verify?");
  });
});
