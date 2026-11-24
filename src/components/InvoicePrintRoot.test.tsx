import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import InvoicePrintRoot from "./InvoicePrintRoot";

describe("InvoicePrintRoot", () => {
  it("renders children", () => {
    render(
      <InvoicePrintRoot>
        <p>Invoice content</p>
      </InvoicePrintRoot>
    );
    expect(screen.getByText("Invoice content")).toBeDefined();
  });

  it("applies .invoice-print-root class", () => {
    const { container } = render(<InvoicePrintRoot><span /></InvoicePrintRoot>);
    expect(container.querySelector(".invoice-print-root")).not.toBeNull();
  });

  it("does NOT apply .invoice-print-letter for a4 (default)", () => {
    const { container } = render(<InvoicePrintRoot><span /></InvoicePrintRoot>);
    const root = container.querySelector(".invoice-print-root");
    expect(root?.classList.contains("invoice-print-letter")).toBe(false);
  });

  it("applies .invoice-print-letter for paper='letter'", () => {
    const { container } = render(
      <InvoicePrintRoot paper="letter"><span /></InvoicePrintRoot>
    );
    const root = container.querySelector(".invoice-print-root");
    expect(root?.classList.contains("invoice-print-letter")).toBe(true);
  });

  it("renders the print trigger button by default", () => {
    render(<InvoicePrintRoot><span /></InvoicePrintRoot>);
    expect(screen.getByRole("button", { name: "Print invoice", hidden: true })).toBeDefined();
  });

  it("hides the print trigger when showTrigger=false", () => {
    render(<InvoicePrintRoot showTrigger={false}><span /></InvoicePrintRoot>);
    expect(screen.queryByRole("button", { name: "Print invoice" })).toBeNull();
  });

  it("trigger button has aria-label='Print invoice'", () => {
    render(<InvoicePrintRoot><span /></InvoicePrintRoot>);
    const btn = screen.getByRole("button", { name: "Print invoice", hidden: true });
    expect(btn.getAttribute("aria-label")).toBe("Print invoice");
  });

  it("print trigger div has aria-hidden='true'", () => {
    const { container } = render(<InvoicePrintRoot><span /></InvoicePrintRoot>);
    const trigger = container.querySelector(".invoice-print-trigger");
    expect(trigger?.getAttribute("aria-hidden")).toBe("true");
  });

  it("clicking the trigger calls window.print()", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    render(<InvoicePrintRoot><span /></InvoicePrintRoot>);
    fireEvent.click(screen.getByRole("button", { name: "Print invoice", hidden: true }));
    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });

  it("calls onAfterPrint when afterprint event fires", () => {
    const cb = vi.fn();
    render(<InvoicePrintRoot onAfterPrint={cb}><span /></InvoicePrintRoot>);
    window.dispatchEvent(new Event("afterprint"));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("applies extra className when provided", () => {
    const { container } = render(
      <InvoicePrintRoot className="custom-class"><span /></InvoicePrintRoot>
    );
    const root = container.querySelector(".invoice-print-root");
    expect(root?.classList.contains("custom-class")).toBe(true);
  });

  describe("cleanup", () => {
    let addSpy: ReturnType<typeof vi.spyOn>;
    let removeSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      addSpy    = vi.spyOn(window, "addEventListener");
      removeSpy = vi.spyOn(window, "removeEventListener");
    });

    afterEach(() => {
      addSpy.mockRestore();
      removeSpy.mockRestore();
    });

    it("registers afterprint listener when onAfterPrint is provided", () => {
      const cb = vi.fn();
      render(<InvoicePrintRoot onAfterPrint={cb}><span /></InvoicePrintRoot>);
      expect(addSpy).toHaveBeenCalledWith("afterprint", cb);
    });

    it("removes afterprint listener on unmount", () => {
      const cb = vi.fn();
      const { unmount } = render(
        <InvoicePrintRoot onAfterPrint={cb}><span /></InvoicePrintRoot>
      );
      unmount();
      expect(removeSpy).toHaveBeenCalledWith("afterprint", cb);
    });
  });
});

// ---------------------------------------------------------------------------
// Wrapper class composition (paper × direction × custom className)
// ---------------------------------------------------------------------------
//
// The className string is the component's only styling contract — the print
// stylesheet keys off `.invoice-print-root`, `.invoice-print-letter` and
// `.invoice-print-rtl`. The RTL branch and the exact class ordering/whitespace
// were previously unasserted.

describe("InvoicePrintRoot – wrapper class composition", () => {
  const getRoot = (container: HTMLElement) =>
    container.querySelector(".invoice-print-root") as HTMLElement;

  afterEach(() => {
    document.documentElement.removeAttribute("dir");
  });

  it("emits no stray whitespace when no optional classes apply", () => {
    const { container } = render(<InvoicePrintRoot><span /></InvoicePrintRoot>);
    expect(getRoot(container).className).toBe("invoice-print-root");
  });

  it("joins paper, direction and custom classes in a stable order", () => {
    document.documentElement.setAttribute("dir", "rtl");
    const { container } = render(
      <InvoicePrintRoot paper="letter" className="custom-class"><span /></InvoicePrintRoot>
    );
    expect(getRoot(container).className).toBe(
      "invoice-print-root invoice-print-letter invoice-print-rtl custom-class"
    );
  });

  it("ignores an empty className instead of emitting a double space", () => {
    const { container } = render(<InvoicePrintRoot className=""><span /></InvoicePrintRoot>);
    expect(getRoot(container).className).toBe("invoice-print-root");
  });

  it("does not apply .invoice-print-rtl for dir='ltr'", () => {
    document.documentElement.setAttribute("dir", "ltr");
    const { container } = render(<InvoicePrintRoot><span /></InvoicePrintRoot>);
    expect(getRoot(container).classList.contains("invoice-print-rtl")).toBe(false);
  });

  it("does not apply .invoice-print-rtl when dir is absent", () => {
    document.documentElement.removeAttribute("dir");
    const { container } = render(<InvoicePrintRoot><span /></InvoicePrintRoot>);
    expect(getRoot(container).classList.contains("invoice-print-rtl")).toBe(false);
  });

  it("applies .invoice-print-rtl for dir='rtl' without losing the paper class", () => {
    document.documentElement.setAttribute("dir", "rtl");
    const { container } = render(
      <InvoicePrintRoot paper="letter"><span /></InvoicePrintRoot>
    );
    const root = getRoot(container);
    expect(root.classList.contains("invoice-print-rtl")).toBe(true);
    expect(root.classList.contains("invoice-print-letter")).toBe(true);
  });

  it("re-reads the direction on every render rather than caching it", () => {
    const { container, rerender } = render(
      <InvoicePrintRoot paper="a4"><span /></InvoicePrintRoot>
    );
    expect(getRoot(container).classList.contains("invoice-print-rtl")).toBe(false);

    document.documentElement.setAttribute("dir", "rtl");
    rerender(<InvoicePrintRoot paper="a4"><span /></InvoicePrintRoot>);

    expect(getRoot(container).classList.contains("invoice-print-rtl")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Trigger behaviour
// ---------------------------------------------------------------------------

describe("InvoicePrintRoot – trigger behaviour", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("omits the whole trigger wrapper (not just the button) when showTrigger=false", () => {
    const { container } = render(
      <InvoicePrintRoot showTrigger={false}><span /></InvoicePrintRoot>
    );
    expect(container.querySelector(".invoice-print-trigger")).toBeNull();
  });

  it("calls window.print() once per click and keeps working for repeat clicks", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    render(<InvoicePrintRoot><span /></InvoicePrintRoot>);

    const btn = screen.getByRole("button", { name: "Print invoice", hidden: true });
    fireEvent.click(btn);
    fireEvent.click(btn);

    expect(printSpy).toHaveBeenCalledTimes(2);
  });

  it("renders children after the trigger so print CSS can hide the trigger", () => {
    const { container } = render(
      <InvoicePrintRoot><p>Invoice content</p></InvoicePrintRoot>
    );
    const root = container.querySelector(".invoice-print-root") as HTMLElement;
    expect(root.firstElementChild?.classList.contains("invoice-print-trigger")).toBe(true);
    expect(root.lastElementChild?.textContent).toBe("Invoice content");
  });
});

// ---------------------------------------------------------------------------
// afterprint lifecycle
// ---------------------------------------------------------------------------

describe("InvoicePrintRoot – afterprint listener lifecycle", () => {
  let addSpy: ReturnType<typeof vi.spyOn>;
  let removeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addSpy = vi.spyOn(window, "addEventListener");
    removeSpy = vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  const afterprintRegistrations = () =>
    addSpy.mock.calls.filter(([type]) => type === "afterprint").length;

  it("does not touch the event bus when no callback is supplied", () => {
    const { unmount } = render(<InvoicePrintRoot><span /></InvoicePrintRoot>);

    expect(afterprintRegistrations()).toBe(0);

    unmount();
    expect(removeSpy.mock.calls.filter(([type]) => type === "afterprint")).toHaveLength(0);
  });

  it("fires the callback for every afterprint event (listener is not once-only)", () => {
    const cb = vi.fn();
    render(<InvoicePrintRoot onAfterPrint={cb}><span /></InvoicePrintRoot>);

    window.dispatchEvent(new Event("afterprint"));
    window.dispatchEvent(new Event("afterprint"));

    expect(cb).toHaveBeenCalledTimes(2);
  });

  it("re-registers with the new callback when the prop identity changes", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(
      <InvoicePrintRoot onAfterPrint={first}><span /></InvoicePrintRoot>
    );

    rerender(<InvoicePrintRoot onAfterPrint={second}><span /></InvoicePrintRoot>);

    expect(removeSpy).toHaveBeenCalledWith("afterprint", first);
    expect(addSpy).toHaveBeenCalledWith("afterprint", second);

    // The stale callback must not be reachable through the event bus any more.
    first.mockClear();
    window.dispatchEvent(new Event("afterprint"));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("tears the listener down when the callback prop is removed", () => {
    const cb = vi.fn();
    const { rerender } = render(
      <InvoicePrintRoot onAfterPrint={cb}><span /></InvoicePrintRoot>
    );

    rerender(<InvoicePrintRoot><span /></InvoicePrintRoot>);
    expect(removeSpy).toHaveBeenCalledWith("afterprint", cb);

    cb.mockClear();
    window.dispatchEvent(new Event("afterprint"));
    expect(cb).not.toHaveBeenCalled();
  });
});
