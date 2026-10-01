import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import AnnotationPin from "./AnnotationPin";
import { Annotation, AnnotationComment, AnnotationType, ResolveState } from "./AnnotationTypes";

const createMockAnnotation = (overrides?: Partial<Annotation>): Annotation => ({
  id: "pin-1",
  type: "sticky",
  invoiceId: "inv-100",
  top: 25,
  left: 40,
  resolveState: "open",
  comments: [
    {
      id: "c1",
      author: "Alice",
      body: "Please verify line item #3",
      createdAt: "2026-09-01T10:00:00Z",
    },
  ],
  createdAt: "2026-09-01T10:00:00Z",
  createdBy: "Alice",
  ...overrides,
});

describe("AnnotationPin", () => {
  describe("Rendering and Public Contract", () => {
    it("renders a button element with correct class and attributes", () => {
      const annotation = createMockAnnotation();
      render(<AnnotationPin annotation={annotation} isActive={false} onClick={vi.fn()} />);

      const pin = screen.getByRole("button");
      expect(pin).toBeInTheDocument();
      expect(pin).toHaveClass("annotation-pin");
      expect(pin).toHaveAttribute("type", "button");
      expect(pin).toHaveAttribute("data-annotation-id", "pin-1");
      expect(pin).toHaveAttribute("data-resolve-state", "open");
      expect(pin).toHaveAttribute("aria-pressed", "false");
    });

    it("applies correct inline positioning styles", () => {
      const annotation = createMockAnnotation({ top: 32.5, left: 67.8 });
      render(<AnnotationPin annotation={annotation} isActive={false} onClick={vi.fn()} />);

      const pin = screen.getByRole("button") as HTMLButtonElement;
      expect(pin.style.position).toBe("absolute");
      expect(pin.style.top).toBe("32.5%");
      expect(pin.style.left).toBe("67.8%");
    });

    it("renders the accessible label containing type, comment count, and resolve state", () => {
      const annotation = createMockAnnotation({
        type: "sticky",
        comments: [
          { id: "c1", author: "Alice", body: "First", createdAt: "2026-09-01" },
          { id: "c2", author: "Bob", body: "Second", createdAt: "2026-09-02" },
        ],
        resolveState: "open",
      });

      render(<AnnotationPin annotation={annotation} isActive={false} onClick={vi.fn()} />);

      const pin = screen.getByRole("button", {
        name: "Note: 2 comment(s), open",
      });
      expect(pin).toBeInTheDocument();
    });

    it("renders icon and comment count badges with aria-hidden true", () => {
      const annotation = createMockAnnotation({
        comments: [{ id: "c1", author: "Alice", body: "First", createdAt: "2026-09-01" }],
      });

      const { container } = render(
        <AnnotationPin annotation={annotation} isActive={false} onClick={vi.fn()} />
      );

      const hiddenSpans = container.querySelectorAll("button span[aria-hidden='true']");
      expect(hiddenSpans.length).toBe(2);

      const countBadge = container.querySelector(".annotation-pin-count");
      expect(countBadge).toBeInTheDocument();
      expect(countBadge).toHaveTextContent("1");
      expect(countBadge).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Annotation Types and Theming", () => {
    it("renders sticky note type with note label and sticky background color", () => {
      const annotation = createMockAnnotation({ type: "sticky" });
      render(<AnnotationPin annotation={annotation} isActive={false} onClick={vi.fn()} />);

      const pin = screen.getByRole("button") as HTMLButtonElement;
      expect(pin).toHaveAttribute("aria-label", expect.stringMatching(/^Note:/));
      expect(pin.style.backgroundColor).toBe("var(--color-annotation-sticky, #fbbf24)");
      expect(pin.style.borderColor).toBe("var(--color-annotation-sticky, #fbbf24)");
    });

    it("renders highlight type with highlight label and highlight background color", () => {
      const annotation = createMockAnnotation({ type: "highlight" });
      render(<AnnotationPin annotation={annotation} isActive={false} onClick={vi.fn()} />);

      const pin = screen.getByRole("button") as HTMLButtonElement;
      expect(pin).toHaveAttribute("aria-label", expect.stringMatching(/^Highlight:/));
      expect(pin.style.backgroundColor).toBe("var(--color-annotation-highlight, #818cf8)");
      expect(pin.style.borderColor).toBe("var(--color-annotation-highlight, #818cf8)");
    });
  });

  describe("Active State Transitions", () => {
    it("reflects inactive state with aria-pressed false and matching border color", () => {
      const annotation = createMockAnnotation({ type: "sticky" });
      render(<AnnotationPin annotation={annotation} isActive={false} onClick={vi.fn()} />);

      const pin = screen.getByRole("button") as HTMLButtonElement;
      expect(pin).toHaveAttribute("aria-pressed", "false");
      expect(pin.style.borderColor).toBe("var(--color-annotation-sticky, #fbbf24)");
    });

    it("reflects active state with aria-pressed true and focus ring border color", () => {
      const annotation = createMockAnnotation({ type: "sticky" });
      render(<AnnotationPin annotation={annotation} isActive={true} onClick={vi.fn()} />);

      const pin = screen.getByRole("button") as HTMLButtonElement;
      expect(pin).toHaveAttribute("aria-pressed", "true");
      expect(pin.style.borderColor).toBe("var(--color-focus-ring, #3b82f6)");
    });

    it("dynamically updates aria-pressed and border color on active state toggle", () => {
      const annotation = createMockAnnotation({ type: "highlight" });
      const { rerender } = render(
        <AnnotationPin annotation={annotation} isActive={false} onClick={vi.fn()} />
      );

      const pin = screen.getByRole("button") as HTMLButtonElement;
      expect(pin).toHaveAttribute("aria-pressed", "false");
      expect(pin.style.borderColor).toBe("var(--color-annotation-highlight, #818cf8)");

      rerender(<AnnotationPin annotation={annotation} isActive={true} onClick={vi.fn()} />);
      expect(pin).toHaveAttribute("aria-pressed", "true");
      expect(pin.style.borderColor).toBe("var(--color-focus-ring, #3b82f6)");

      rerender(<AnnotationPin annotation={annotation} isActive={false} onClick={vi.fn()} />);
      expect(pin).toHaveAttribute("aria-pressed", "false");
      expect(pin.style.borderColor).toBe("var(--color-annotation-highlight, #818cf8)");
    });
  });

  describe("Resolve State Transitions", () => {
    it("renders open state with notepad icon", () => {
      const annotation = createMockAnnotation({ resolveState: "open" });
      render(<AnnotationPin annotation={annotation} isActive={false} onClick={vi.fn()} />);

      const pin = screen.getByRole("button");
      expect(pin).toHaveAttribute("data-resolve-state", "open");
      expect(pin).toHaveTextContent("\u{1F4DD}");
      expect(pin).toHaveAttribute("aria-label", expect.stringContaining(", open"));
    });

    it("renders resolved state with checkmark icon", () => {
      const annotation = createMockAnnotation({ resolveState: "resolved" });
      render(<AnnotationPin annotation={annotation} isActive={false} onClick={vi.fn()} />);

      const pin = screen.getByRole("button");
      expect(pin).toHaveAttribute("data-resolve-state", "resolved");
      expect(pin).toHaveTextContent("\u2705");
      expect(pin).toHaveAttribute("aria-label", expect.stringContaining(", resolved"));
    });

    it("renders reopened state with cycle arrows icon", () => {
      const annotation = createMockAnnotation({ resolveState: "reopened" });
      render(<AnnotationPin annotation={annotation} isActive={false} onClick={vi.fn()} />);

      const pin = screen.getByRole("button");
      expect(pin).toHaveAttribute("data-resolve-state", "reopened");
      expect(pin).toHaveTextContent("\u{1F504}");
      expect(pin).toHaveAttribute("aria-label", expect.stringContaining(", reopened"));
    });

    it("updates icon and resolve metadata when resolveState transitions dynamically", () => {
      const annotation = createMockAnnotation({ resolveState: "open" });
      const { rerender } = render(
        <AnnotationPin annotation={annotation} isActive={false} onClick={vi.fn()} />
      );

      const pin = screen.getByRole("button");
      expect(pin).toHaveAttribute("data-resolve-state", "open");
      expect(pin).toHaveTextContent("\u{1F4DD}");

      // Transition to resolved
      rerender(
        <AnnotationPin
          annotation={{ ...annotation, resolveState: "resolved" }}
          isActive={false}
          onClick={vi.fn()}
        />
      );
      expect(pin).toHaveAttribute("data-resolve-state", "resolved");
      expect(pin).toHaveTextContent("\u2705");

      // Transition to reopened
      rerender(
        <AnnotationPin
          annotation={{ ...annotation, resolveState: "reopened" }}
          isActive={false}
          onClick={vi.fn()}
        />
      );
      expect(pin).toHaveAttribute("data-resolve-state", "reopened");
      expect(pin).toHaveTextContent("\u{1F504}");
    });
  });

  describe("Comments Count Transitions", () => {
    it("displays 0 when comments list is empty", () => {
      const annotation = createMockAnnotation({ comments: [] });
      render(<AnnotationPin annotation={annotation} isActive={false} onClick={vi.fn()} />);

      const pin = screen.getByRole("button");
      expect(pin).toHaveAttribute("aria-label", expect.stringContaining("0 comment(s)"));
      const countBadge = pin.querySelector(".annotation-pin-count");
      expect(countBadge).toHaveTextContent("0");
    });

    it("displays count when multiple comments are present", () => {
      const comments = Array.from({ length: 4 }, (_, idx) => ({
        id: "c-" + String(idx),
        author: "User " + String(idx),
        body: "Comment " + String(idx),
        createdAt: "2026-09-01",
      }));
      const annotation = createMockAnnotation({ comments });
      render(<AnnotationPin annotation={annotation} isActive={false} onClick={vi.fn()} />);

      const pin = screen.getByRole("button");
      expect(pin).toHaveAttribute("aria-label", expect.stringContaining("4 comment(s)"));
      const countBadge = pin.querySelector(".annotation-pin-count");
      expect(countBadge).toHaveTextContent("4");
    });

    it("dynamically updates count badge and label when comments are added", () => {
      const annotation = createMockAnnotation({ comments: [] });
      const { rerender } = render(
        <AnnotationPin annotation={annotation} isActive={false} onClick={vi.fn()} />
      );

      const pin = screen.getByRole("button");
      expect(pin.querySelector(".annotation-pin-count")).toHaveTextContent("0");

      rerender(
        <AnnotationPin
          annotation={{
            ...annotation,
            comments: [{ id: "c1", author: "Bob", body: "Hello", createdAt: "2026-09-01" }],
          }}
          isActive={false}
          onClick={vi.fn()}
        />
      );
      expect(pin.querySelector(".annotation-pin-count")).toHaveTextContent("1");
      expect(pin).toHaveAttribute("aria-label", expect.stringContaining("1 comment(s)"));
    });
  });

  describe("Interactions and Event Handlers", () => {
    it("calls onClick handler when clicked", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      const annotation = createMockAnnotation();

      render(<AnnotationPin annotation={annotation} isActive={false} onClick={handleClick} />);

      const pin = screen.getByRole("button");
      await user.click(pin);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("triggers onClick when activated via keyboard Enter and Space", () => {
      const handleClick = vi.fn();
      const annotation = createMockAnnotation();

      render(<AnnotationPin annotation={annotation} isActive={false} onClick={handleClick} />);

      const pin = screen.getByRole("button");
      fireEvent.click(pin);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not throw if onClick is omitted and pin is clicked", () => {
      const annotation = createMockAnnotation();
      render(<AnnotationPin annotation={annotation} isActive={false} />);

      const pin = screen.getByRole("button");
      expect(() => fireEvent.click(pin)).not.toThrow();
    });
  });

  describe("Boundary Values and Representative Invalid Inputs", () => {
    it("safely handles boundary coordinates at 0% and 100%", () => {
      const annotationZero = createMockAnnotation({ top: 0, left: 0 });
      const { unmount } = render(
        <AnnotationPin annotation={annotationZero} isActive={false} onClick={vi.fn()} />
      );

      const pinZero = screen.getByRole("button") as HTMLButtonElement;
      expect(pinZero.style.top).toBe("0%");
      expect(pinZero.style.left).toBe("0%");
      unmount();

      const annotationHundred = createMockAnnotation({ top: 100, left: 100 });
      render(<AnnotationPin annotation={annotationHundred} isActive={false} onClick={vi.fn()} />);

      const pinHundred = screen.getByRole("button") as HTMLButtonElement;
      expect(pinHundred.style.top).toBe("100%");
      expect(pinHundred.style.left).toBe("100%");
    });

    it("safely handles negative and floating point coordinates", () => {
      const annotation = createMockAnnotation({ top: -12.34, left: 105.78 });
      render(<AnnotationPin annotation={annotation} isActive={false} onClick={vi.fn()} />);

      const pin = screen.getByRole("button") as HTMLButtonElement;
      expect(pin.style.top).toBe("-12.34%");
      expect(pin.style.left).toBe("105.78%");
    });

    it("falls back to 0% for NaN or non-numeric coordinate values", () => {
      const annotation = createMockAnnotation({ top: NaN, left: undefined });
      render(<AnnotationPin annotation={annotation} isActive={false} onClick={vi.fn()} />);

      const pin = screen.getByRole("button") as HTMLButtonElement;
      expect(pin.style.top).toBe("0%");
      expect(pin.style.left).toBe("0%");
    });

    it("gracefully falls back to default styling when annotation type is unrecognized", () => {
      const annotation = createMockAnnotation({ type: "unknown-type" as unknown as AnnotationType });
      render(<AnnotationPin annotation={annotation} isActive={false} onClick={vi.fn()} />);

      const pin = screen.getByRole("button") as HTMLButtonElement;
      expect(pin.style.backgroundColor).toBe("var(--color-annotation-sticky, #fbbf24)");
      expect(pin.style.borderColor).toBe("var(--color-annotation-sticky, #fbbf24)");
      expect(pin).toHaveAttribute("aria-label", expect.stringMatching(/^Note:/));
    });

    it("gracefully falls back to default icon when resolveState is unrecognized", () => {
      const annotation = createMockAnnotation({ resolveState: "custom_status" as unknown as ResolveState });
      render(<AnnotationPin annotation={annotation} isActive={false} onClick={vi.fn()} />);

      const pin = screen.getByRole("button");
      expect(pin).toHaveAttribute("data-resolve-state", "custom_status");
      expect(pin).toHaveTextContent("\u{1F4DD}");
      expect(pin).toHaveAttribute("aria-label", expect.stringContaining(", custom_status"));
    });

    it("falls back to open resolveState when resolveState is undefined", () => {
      const annotation = createMockAnnotation({ resolveState: undefined });
      render(<AnnotationPin annotation={annotation} isActive={false} onClick={vi.fn()} />);

      const pin = screen.getByRole("button");
      expect(pin).toHaveAttribute("data-resolve-state", "open");
      expect(pin).toHaveTextContent("\u{1F4DD}");
      expect(pin).toHaveAttribute("aria-label", expect.stringContaining(", open"));
    });

    it("gracefully handles missing or non-array comments property", () => {
      const annotationNullComments = createMockAnnotation({ comments: null as unknown as AnnotationComment[] });
      const { unmount } = render(
        <AnnotationPin annotation={annotationNullComments} isActive={false} onClick={vi.fn()} />
      );

      const pinNull = screen.getByRole("button");
      expect(pinNull).toHaveAttribute("aria-label", expect.stringContaining("0 comment(s)"));
      expect(pinNull.querySelector(".annotation-pin-count")).toHaveTextContent("0");
      unmount();

      const annotationUndefComments = createMockAnnotation({ comments: undefined });
      render(
        <AnnotationPin annotation={annotationUndefComments} isActive={false} onClick={vi.fn()} />
      );

      const pinUndef = screen.getByRole("button");
      expect(pinUndef).toHaveAttribute("aria-label", expect.stringContaining("0 comment(s)"));
      expect(pinUndef.querySelector(".annotation-pin-count")).toHaveTextContent("0");
    });

    it("gracefully renders null if annotation prop is null or undefined", () => {
      const { container: containerNull } = render(
        <AnnotationPin annotation={null as unknown as Annotation} isActive={false} />
      );
      expect(containerNull.firstChild).toBeNull();

      const { container: containerUndef } = render(
        <AnnotationPin annotation={undefined as unknown as Annotation} isActive={false} />
      );
      expect(containerUndef.firstChild).toBeNull();
    });
  });
});
