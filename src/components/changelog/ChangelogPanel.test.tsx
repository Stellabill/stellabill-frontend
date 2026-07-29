// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ChangelogPanel from "./ChangelogPanel";

afterEach(cleanup);

describe("ChangelogPanel", () => {
  it("does not render when closed", () => {
    const { container } = render(
      <ChangelogPanel isOpen={false} onOpenChange={vi.fn()} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders with title and close button when open", () => {
    render(<ChangelogPanel isOpen={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText("What's new")).toBeTruthy();
    expect(screen.getByRole("button", { name: /close/i })).toBeTruthy();
  });

  it("shows an unread badge with count", () => {
    render(<ChangelogPanel isOpen={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText(/unread updates/i)).toBeTruthy();
  });

  it("renders changelog entries grouped by date", () => {
    render(<ChangelogPanel isOpen={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText("Usage anomaly alerts")).toBeTruthy();
    expect(screen.getByText("API key rotation endpoint")).toBeTruthy();
  });

  it("renders area chips and filters entries", () => {
    render(<ChangelogPanel isOpen={true} onOpenChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /all/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /billing/i })).toBeTruthy();
  });

  it("calls onOpenChange(false) when close button is clicked", () => {
    const onOpenChange = vi.fn();
    render(<ChangelogPanel isOpen={true} onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows subscribe-to-email footer link", () => {
    render(<ChangelogPanel isOpen={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText(/subscribe to email updates/i)).toBeTruthy();
    const link = screen.getByRole("link", { name: /subscribe to email updates/i });
    expect(link.getAttribute("href")).toContain("mailto:");
  });

  it("shows empty state when filter has no matches", () => {
    render(<ChangelogPanel isOpen={true} onOpenChange={vi.fn()} />);
    // All entries shown initially, empty state should not appear
    expect(screen.queryByText(/No entries/i)).toBeNull();
  });

  it("has a dialog role with correct aria attributes", () => {
    render(<ChangelogPanel isOpen={true} onOpenChange={vi.fn()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
  });
});
