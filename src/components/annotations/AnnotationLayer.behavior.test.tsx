import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import AnnotationLayer from "./AnnotationLayer";
import { Annotation, AnnotationCreate } from "./AnnotationTypes";

/**
 * Focused behaviour coverage for `AnnotationLayer` (issue #851).
 *
 * `AnnotationLayer.tsx` is the only stateful piece of the annotation feature:
 * it owns the active-pin/panel state, filters annotations by invoice, and turns
 * raw click coordinates into percentages. `AnnotationLayer.test.tsx` covers the
 * smoke paths (children render, pins render, panel opens, one happy-path
 * `onAddAnnotation` call). This suite pins the behaviour that was previously
 * unasserted:
 *
 *  * the `isAnnotatable` gate is a *silent* no-op when off, and the mode also
 *    controls the region role/aria-label and the modifier class;
 *  * the coordinate maths is exact, including the 0 %/100 % corners, and a
 *    degenerate (zero-area) rect neither throws nor emits a partial payload;
 *  * pin clicks bubble to the layer, so in annotation mode a pin click both
 *    opens the panel and creates a new annotation (documented, not accidental);
 *  * the panel's close paths (button + Escape) and the pin-to-pin transition
 *    behave as the UI contract says;
 *  * every callback the layer forwards to `AnnotationPanel` receives the
 *    *active* annotation id, not the first annotation in the list;
 *  * when the active annotation disappears from props the panel is removed
 *    rather than rendering stale content.
 */

const makeAnnotation = (overrides: Partial<Annotation> = {}): Annotation => ({
  id: "ann-1",
  type: "sticky",
  invoiceId: "inv-1",
  top: 25,
  left: 30,
  resolveState: "open",
  comments: [
    { id: "c1", author: "Alice", body: "Check this amount", createdAt: "2026-07-28" },
  ],
  createdAt: "2026-07-28",
  createdBy: "Alice",
  ...overrides,
});

interface LayerCallbacks {
  onAddAnnotation: ReturnType<typeof vi.fn>;
  onAddComment: ReturnType<typeof vi.fn>;
  onResolve: ReturnType<typeof vi.fn>;
  onReopen: ReturnType<typeof vi.fn>;
}

function renderLayer(
  annotations: Annotation[] = [],
  options: { isAnnotatable?: boolean; invoiceId?: string } = {}
): { container: HTMLElement } & LayerCallbacks {
  const callbacks: LayerCallbacks = {
    onAddAnnotation: vi.fn(),
    onAddComment: vi.fn(),
    onResolve: vi.fn(),
    onReopen: vi.fn(),
  };
  const { container } = render(
    <AnnotationLayer
      invoiceId={options.invoiceId ?? "inv-1"}
      annotations={annotations}
      isAnnotatable={options.isAnnotatable}
      {...callbacks}
    >
      <p>Invoice content</p>
    </AnnotationLayer>
  );
  return { container, ...callbacks };
}

const rect = (
  top: number,
  left: number,
  width: number,
  height: number
): DOMRect => ({
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

const contentLayer = (container: HTMLElement) =>
  container.querySelector(".annotation-layer-content") as HTMLElement;

const panel = () => document.querySelector(".annotation-panel");
const pins = () => Array.from(document.querySelectorAll(".annotation-pin"));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AnnotationLayer — annotatable gate", () => {
  it("is a silent no-op when isAnnotatable is omitted", () => {
    const { container, onAddAnnotation } = renderLayer([], {});
    const layer = contentLayer(container);

    fireEvent.click(layer, { clientX: 10, clientY: 10 });

    expect(onAddAnnotation).not.toHaveBeenCalled();
  });

  it("is a silent no-op when isAnnotatable is explicitly false", () => {
    const { container, onAddAnnotation } = renderLayer([], { isAnnotatable: false });
    const layer = contentLayer(container);

    fireEvent.click(layer, { clientX: 10, clientY: 10 });

    expect(onAddAnnotation).not.toHaveBeenCalled();
  });

  it("does not expose a region role or label when not annotatable", () => {
    const { container } = renderLayer([], { isAnnotatable: false });

    expect(screen.queryByLabelText("Invoice content with annotations")).toBeNull();
    expect(contentLayer(container)).not.toHaveClass("annotation-layer-content--annotatable");
  });

  it("exposes a labelled region and modifier class when annotatable", () => {
    const { container } = renderLayer([], { isAnnotatable: true });

    const region = screen.getByLabelText("Invoice content with annotations");
    expect(region).toHaveAttribute("role", "region");
    expect(contentLayer(container)).toHaveClass("annotation-layer-content--annotatable");
  });

  it("starts emitting annotations as soon as the mode flips on", () => {
    const callbacks = {
      onAddAnnotation: vi.fn(),
      onAddComment: vi.fn(),
      onResolve: vi.fn(),
      onReopen: vi.fn(),
    };
    const { container, rerender } = render(
      <AnnotationLayer invoiceId="inv-1" annotations={[]} {...callbacks}>
        <p>Invoice content</p>
      </AnnotationLayer>
    );

    fireEvent.click(contentLayer(container), { clientX: 5, clientY: 5 });
    expect(callbacks.onAddAnnotation).not.toHaveBeenCalled();

    vi.spyOn(contentLayer(container), "getBoundingClientRect").mockReturnValue(rect(0, 0, 100, 100));
    rerender(
      <AnnotationLayer invoiceId="inv-1" annotations={[]} isAnnotatable {...callbacks}>
        <p>Invoice content</p>
      </AnnotationLayer>
    );

    fireEvent.click(contentLayer(container), { clientX: 25, clientY: 75 });
    expect(callbacks.onAddAnnotation).toHaveBeenCalledTimes(1);
    expect(callbacks.onAddAnnotation).toHaveBeenCalledWith({
      type: "sticky",
      invoiceId: "inv-1",
      top: 75,
      left: 25,
    });
  });
});

describe("AnnotationLayer — coordinate maths", () => {
  const clickAt = (container: HTMLElement, clientX: number, clientY: number) => {
    fireEvent.click(contentLayer(container), { clientX, clientY });
  };

  it("converts a click into percentages of the content box", () => {
    const { container, onAddAnnotation } = renderLayer([], { isAnnotatable: true });
    vi.spyOn(contentLayer(container), "getBoundingClientRect").mockReturnValue(
      rect(100, 50, 400, 200)
    );

    clickAt(container, 250, 200);

    expect(onAddAnnotation).toHaveBeenCalledWith({
      type: "sticky",
      invoiceId: "inv-1",
      top: 50,
      left: 50,
    });
  });

  it("reports the 0%/0% corner for a click on the top-left edge", () => {
    const { container, onAddAnnotation } = renderLayer([], { isAnnotatable: true });
    vi.spyOn(contentLayer(container), "getBoundingClientRect").mockReturnValue(
      rect(10, 20, 300, 90)
    );

    clickAt(container, 20, 10);

    expect(onAddAnnotation).toHaveBeenCalledWith(
      expect.objectContaining({ top: 0, left: 0 })
    );
  });

  it("reports the 100%/100% corner for a click on the bottom-right edge", () => {
    const { container, onAddAnnotation } = renderLayer([], { isAnnotatable: true });
    vi.spyOn(contentLayer(container), "getBoundingClientRect").mockReturnValue(
      rect(10, 20, 300, 90)
    );

    clickAt(container, 320, 100);

    expect(onAddAnnotation).toHaveBeenCalledWith(
      expect.objectContaining({ top: 100, left: 100 })
    );
  });

  it("keeps sub-percent precision rather than rounding", () => {
    const { container, onAddAnnotation } = renderLayer([], { isAnnotatable: true });
    vi.spyOn(contentLayer(container), "getBoundingClientRect").mockReturnValue(
      rect(0, 0, 1000, 50)
    );

    clickAt(container, 1, 1);

    expect(onAddAnnotation).toHaveBeenCalledWith(
      expect.objectContaining({ top: 2, left: 0.1 })
    );
  });

  it("still fires exactly once when the content box has zero area", () => {
    // jsdom reports a zero-area rect by default, so the percentage maths
    // divides by zero. The observable contract we pin is that the click does
    // not throw and the callback is invoked exactly once — a future clamp of
    // the degenerate case has to update this test on purpose.
    const { container, onAddAnnotation } = renderLayer([], { isAnnotatable: true });

    expect(() => clickAt(container, 0, 0)).not.toThrow();
    expect(onAddAnnotation).toHaveBeenCalledTimes(1);
    expect(onAddAnnotation.mock.calls[0][0]).toMatchObject({
      type: "sticky",
      invoiceId: "inv-1",
    });
  });

  it("always reports the pinned type and invoice id", () => {
    const { container, onAddAnnotation } = renderLayer([], {
      isAnnotatable: true,
      invoiceId: "inv-42",
    });
    vi.spyOn(contentLayer(container), "getBoundingClientRect").mockReturnValue(
      rect(0, 0, 100, 100)
    );

    clickAt(container, 50, 50);

    expect(onAddAnnotation).toHaveBeenCalledTimes(1);
    const payload = onAddAnnotation.mock.calls[0][0] as AnnotationCreate;
    expect(payload.type).toBe("sticky");
    expect(payload.invoiceId).toBe("inv-42");
  });
});

describe("AnnotationLayer — pins and panel transitions", () => {
  const annotations = [
    makeAnnotation({ id: "ann-1", top: 25, left: 30 }),
    makeAnnotation({
      id: "ann-2",
      type: "highlight",
      resolveState: "resolved",
      comments: [],
      createdBy: "Bob",
    }),
  ];

  it("renders one pin per annotation belonging to the invoice", () => {
    const { container } = renderLayer(
      [...annotations, makeAnnotation({ id: "ann-3", invoiceId: "inv-9" })],
      {}
    );

    expect(pins()).toHaveLength(2);
    expect(container.textContent).toContain("Invoice content");
  });

  it("keeps the panel closed until a pin is activated", () => {
    renderLayer(annotations, {});

    expect(panel()).toBeNull();
  });

  it("marks exactly one pin as active", () => {
    renderLayer(annotations, {});

    fireEvent.click(pins()[0]);
    expect(pins()[0]).toHaveAttribute("aria-pressed", "true");
    expect(pins()[1]).toHaveAttribute("aria-pressed", "false");
  });

  it("swaps the panel content when a different pin is activated", () => {
    renderLayer(annotations, {});

    fireEvent.click(pins()[0]);
    expect(panel()?.textContent).toContain("Check this amount");
    expect(panel()?.textContent).toContain("Open");

    fireEvent.click(pins()[1]);
    expect(panel()?.textContent).toContain("No comments yet. Add one below.");
    expect(panel()?.textContent).toContain("Resolved");
    expect(pins()[0]).toHaveAttribute("aria-pressed", "false");
    expect(pins()[1]).toHaveAttribute("aria-pressed", "true");
  });

  it("reflects the pinned resolve state in the pin dataset", () => {
    renderLayer(annotations, {});

    expect(pins()[0]).toHaveAttribute("data-resolve-state", "open");
    expect(pins()[1]).toHaveAttribute("data-resolve-state", "resolved");
  });

  it("closes the panel from its close button without touching callbacks", () => {
    const callbacks = renderLayer(annotations, {});
    fireEvent.click(pins()[0]);
    expect(panel()).not.toBeNull();

    fireEvent.click(screen.getByLabelText("Close annotation panel"));

    expect(panel()).toBeNull();
    expect(callbacks.onAddComment).not.toHaveBeenCalled();
    expect(callbacks.onResolve).not.toHaveBeenCalled();
    expect(callbacks.onReopen).not.toHaveBeenCalled();
  });

  it("closes the panel on Escape", () => {
    renderLayer(annotations, {});
    fireEvent.click(pins()[0]);
    expect(panel()).not.toBeNull();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(panel()).toBeNull();
  });

  it("leaves the panel open on unrelated keys", () => {
    renderLayer(annotations, {});
    fireEvent.click(pins()[0]);

    fireEvent.keyDown(document, { key: "a" });

    expect(panel()).not.toBeNull();
  });

  it("reopens the panel after it was closed", () => {
    renderLayer(annotations, {});
    fireEvent.click(pins()[0]);
    fireEvent.click(screen.getByLabelText("Close annotation panel"));
    expect(panel()).toBeNull();

    fireEvent.click(pins()[1]);

    expect(panel()).not.toBeNull();
  });

  it("drops the panel when the active annotation leaves the props", () => {
    const callbacks = {
      onAddAnnotation: vi.fn(),
      onAddComment: vi.fn(),
      onResolve: vi.fn(),
      onReopen: vi.fn(),
    };
    const { rerender } = render(
      <AnnotationLayer invoiceId="inv-1" annotations={annotations} {...callbacks}>
        <p>Invoice content</p>
      </AnnotationLayer>
    );
    fireEvent.click(pins()[0]);
    expect(panel()).not.toBeNull();

    rerender(
      <AnnotationLayer invoiceId="inv-1" annotations={[annotations[1]]} {...callbacks}>
        <p>Invoice content</p>
      </AnnotationLayer>
    );

    // `activeAnnotation` resolves to null, so `AnnotationPanel` renders nothing
    // instead of showing stale comments for a deleted annotation.
    expect(panel()).toBeNull();
  });

  it("drops the panel when the invoice id changes underneath it", () => {
    const callbacks = {
      onAddAnnotation: vi.fn(),
      onAddComment: vi.fn(),
      onResolve: vi.fn(),
      onReopen: vi.fn(),
    };
    const { rerender } = render(
      <AnnotationLayer invoiceId="inv-1" annotations={annotations} {...callbacks}>
        <p>Invoice content</p>
      </AnnotationLayer>
    );
    fireEvent.click(pins()[0]);

    rerender(
      <AnnotationLayer invoiceId="inv-2" annotations={annotations} {...callbacks}>
        <p>Invoice content</p>
      </AnnotationLayer>
    );

    expect(pins()).toHaveLength(0);
    expect(panel()).toBeNull();
  });
});

describe("AnnotationLayer — callback forwarding", () => {
  const annotations = [
    makeAnnotation({ id: "ann-1" }),
    makeAnnotation({ id: "ann-2", resolveState: "resolved", comments: [] }),
  ];

  it("forwards a new comment with the active annotation id and trimmed body", () => {
    const callbacks = renderLayer(annotations, {});
    fireEvent.click(pins()[1]);

    fireEvent.change(screen.getByPlaceholderText("Add a comment..."), {
      target: { value: "  vendor confirmed  " },
    });
    fireEvent.click(screen.getByLabelText("Submit comment"));

    expect(callbacks.onAddComment).toHaveBeenCalledTimes(1);
    expect(callbacks.onAddComment).toHaveBeenCalledWith("ann-2", "vendor confirmed");
  });

  it("does not call onAddComment for a blank submission", () => {
    const callbacks = renderLayer(annotations, {});
    fireEvent.click(pins()[0]);

    const input = screen.getByPlaceholderText("Add a comment...");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(screen.getByLabelText("Submit comment"));

    expect(callbacks.onAddComment).not.toHaveBeenCalled();
  });

  it("submits on Enter but not on Shift+Enter", () => {
    const callbacks = renderLayer(annotations, {});
    fireEvent.click(pins()[0]);

    const input = screen.getByPlaceholderText("Add a comment...");
    fireEvent.change(input, { target: { value: "first line" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect(callbacks.onAddComment).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: "Enter" });
    expect(callbacks.onAddComment).toHaveBeenCalledWith("ann-1", "first line");
  });

  it("resolves the active annotation and reopens a resolved one", () => {
    const callbacks = renderLayer(annotations, {});

    fireEvent.click(pins()[0]);
    fireEvent.click(screen.getByLabelText("Resolve annotation"));
    expect(callbacks.onResolve).toHaveBeenCalledWith("ann-1");
    expect(callbacks.onReopen).not.toHaveBeenCalled();

    fireEvent.click(pins()[1]);
    fireEvent.click(screen.getByLabelText("Reopen annotation"));
    expect(callbacks.onReopen).toHaveBeenCalledWith("ann-2");
  });

  it("treats a reopened annotation as still needing resolution", () => {
    const callbacks = renderLayer(
      [makeAnnotation({ id: "ann-3", resolveState: "reopened" })],
      {}
    );
    fireEvent.click(pins()[0]);

    expect(panel()?.textContent).toContain("Open");
    fireEvent.click(screen.getByLabelText("Resolve annotation"));
    expect(callbacks.onResolve).toHaveBeenCalledWith("ann-3");
  });

  it("bubbles a pin click into onAddAnnotation while annotating", () => {
    // Documented behaviour: `AnnotationPin` does not stop event propagation, so
    // with annotation mode on a pin click both opens the panel *and* drops a new
    // sticky note at the pin's coordinates. Pinned so the two effects stay in
    // sync if either side changes.
    const { container, onAddAnnotation } = renderLayer(annotations, { isAnnotatable: true });
    vi.spyOn(contentLayer(container), "getBoundingClientRect").mockReturnValue(
      rect(0, 0, 100, 100)
    );

    fireEvent.click(pins()[0], { clientX: 10, clientY: 20 });

    expect(onAddAnnotation).toHaveBeenCalledTimes(1);
    expect(onAddAnnotation).toHaveBeenCalledWith(
      expect.objectContaining({ type: "sticky", invoiceId: "inv-1" })
    );
    expect(panel()).not.toBeNull();
  });

  it("does not create an annotation from a pin click while not annotating", () => {
    const callbacks = renderLayer(annotations, {});

    fireEvent.click(pins()[0], { clientX: 10, clientY: 20 });

    expect(callbacks.onAddAnnotation).not.toHaveBeenCalled();
    expect(panel()).not.toBeNull();
  });
});
