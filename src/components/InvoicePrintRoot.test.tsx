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
