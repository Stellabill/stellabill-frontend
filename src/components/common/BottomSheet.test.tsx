import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import BottomSheet from "./BottomSheet";

const MOBILE_WIDTH = 375;

describe("BottomSheet", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: MOBILE_WIDTH,
    });
    window.dispatchEvent(new Event("resize"));
  });

  it("renders when open", () => {
    render(
      <BottomSheet isOpen={true} onClose={vi.fn()} title="Test Sheet">
        <p>Sheet content</p>
      </BottomSheet>
    );
    expect(screen.getByText("Test Sheet")).toBeInTheDocument();
    expect(screen.getByText("Sheet content")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <BottomSheet isOpen={false} onClose={vi.fn()} title="Test Sheet">
        <p>Sheet content</p>
      </BottomSheet>
    );
    expect(screen.queryByText("Test Sheet")).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const onClose = vi.fn();
    render(
      <BottomSheet isOpen={true} onClose={onClose} title="Test">
        <p>Content</p>
      </BottomSheet>
    );
    await userEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(
      <BottomSheet isOpen={true} onClose={onClose} title="Test">
        <p>Content</p>
      </BottomSheet>
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders with description", () => {
    render(
      <BottomSheet isOpen={true} onClose={vi.fn()} title="Test" description="A description">
        <p>Content</p>
      </BottomSheet>
    );
    expect(screen.getByText("A description")).toBeInTheDocument();
  });

  it("has accessible dialog role", () => {
    render(
      <BottomSheet isOpen={true} onClose={vi.fn()} title="Test">
        <p>Content</p>
      </BottomSheet>
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders drag handle", () => {
    render(
      <BottomSheet isOpen={true} onClose={vi.fn()}>
        <p>Content</p>
      </BottomSheet>
    );
    const handle = document.querySelector(".bottom-sheet-drag-handle");
    expect(handle).toBeInTheDocument();
  });
});
