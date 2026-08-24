import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AnnotationLayer from "./AnnotationLayer";
import { Annotation } from "./AnnotationTypes";

const mockAnnotations: Annotation[] = [
  {
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
  },
  {
    id: "ann-2",
    type: "highlight",
    invoiceId: "inv-1",
    top: 50,
    left: 60,
    resolveState: "resolved",
    comments: [],
    createdAt: "2026-07-27",
    createdBy: "Bob",
  },
];

describe("AnnotationLayer", () => {
  it("renders children", () => {
    render(
      <AnnotationLayer
        invoiceId="inv-1"
        annotations={[]}
        onAddAnnotation={vi.fn()}
        onAddComment={vi.fn()}
        onResolve={vi.fn()}
        onReopen={vi.fn()}
      >
        <p>Invoice content</p>
      </AnnotationLayer>
    );
    expect(screen.getByText("Invoice content")).toBeInTheDocument();
  });

  it("renders annotation pins", () => {
    render(
      <AnnotationLayer
        invoiceId="inv-1"
        annotations={mockAnnotations}
        onAddAnnotation={vi.fn()}
        onAddComment={vi.fn()}
        onResolve={vi.fn()}
        onReopen={vi.fn()}
      >
        <p>Content</p>
      </AnnotationLayer>
    );
    const pins = document.querySelectorAll(".annotation-pin");
    expect(pins.length).toBe(2);
  });

  it("opens panel when pin is clicked", () => {
    render(
      <AnnotationLayer
        invoiceId="inv-1"
        annotations={mockAnnotations}
        onAddAnnotation={vi.fn()}
        onAddComment={vi.fn()}
        onResolve={vi.fn()}
        onReopen={vi.fn()}
      >
        <p>Content</p>
      </AnnotationLayer>
    );
    const pins = document.querySelectorAll(".annotation-pin");
    fireEvent.click(pins[0]);
    expect(screen.getByText("Check this amount")).toBeInTheDocument();
  });

  it("shows empty state when no comments", () => {
    render(
      <AnnotationLayer
        invoiceId="inv-1"
        annotations={mockAnnotations}
        onAddAnnotation={vi.fn()}
        onAddComment={vi.fn()}
        onResolve={vi.fn()}
        onReopen={vi.fn()}
      >
        <p>Content</p>
      </AnnotationLayer>
    );
    const pins = document.querySelectorAll(".annotation-pin");
    fireEvent.click(pins[1]);
    expect(screen.getByText("No comments yet. Add one below.")).toBeInTheDocument();
  });

  it("calls onAddAnnotation when annotatable area is clicked", () => {
    const onAddAnnotation = vi.fn();
    render(
      <AnnotationLayer
        invoiceId="inv-1"
        annotations={[]}
        onAddAnnotation={onAddAnnotation}
        onAddComment={vi.fn()}
        onResolve={vi.fn()}
        onReopen={vi.fn()}
        isAnnotatable={true}
      >
        <p>Content</p>
      </AnnotationLayer>
    );
    const region = screen.getByLabelText("Invoice content with annotations");
    fireEvent.click(region);
    expect(onAddAnnotation).toHaveBeenCalledWith(
      expect.objectContaining({ type: "sticky", invoiceId: "inv-1" })
    );
  });

  it("filters annotations by invoiceId", () => {
    const otherAnnotation: Annotation = {
      id: "ann-3",
      type: "sticky",
      invoiceId: "inv-2",
      top: 10,
      left: 10,
      resolveState: "open",
      comments: [],
      createdAt: "2026-07-28",
      createdBy: "Charlie",
    };
    render(
      <AnnotationLayer
        invoiceId="inv-1"
        annotations={[...mockAnnotations, otherAnnotation]}
        onAddAnnotation={vi.fn()}
        onAddComment={vi.fn()}
        onResolve={vi.fn()}
        onReopen={vi.fn()}
      >
        <p>Content</p>
      </AnnotationLayer>
    );
    const pins = document.querySelectorAll(".annotation-pin");
    expect(pins.length).toBe(2);
  });
});
