import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PastPeriods } from "./past-periods";

describe("PastPeriods", () => {
  it("renders a section labelled by the Past Periods heading", () => {
    const { container } = render(<PastPeriods />);

    const section = container.querySelector("section");
    expect(section).not.toBeNull();
    expect(section).toHaveAttribute("aria-labelledby", "past-periods-title");

    const heading = screen.getByRole("heading", {
      level: 2,
      name: "Past Periods",
    });
    expect(heading).toBeInTheDocument();
    expect(section).toContainElement(heading);
  });

  it("exposes the export button as Export past periods with a decorative icon", async () => {
    const user = userEvent.setup();
    render(<PastPeriods />);

    const exportButton = screen.getByRole("button", {
      name: "Export past periods",
    });
    expect(exportButton).toBeInTheDocument();
    expect(exportButton).toHaveAttribute("type", "button");

    const icon = exportButton.querySelector("svg");
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute("aria-hidden", "true");

    await user.click(exportButton);
    expect(exportButton).toHaveFocus();
  });

  it("renders a table with aria-describedby and expected header cells and rows", () => {
    render(<PastPeriods />);

    const table = screen.getByRole("table");
    expect(table).toHaveAttribute("aria-describedby", "past-periods-caption");

    const headers = within(table).getAllByRole("columnheader");
    expect(headers.map((header) => header.textContent)).toEqual([
      "Period",
      "Usage",
      "Amount",
      "Status",
    ]);

    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(7);

    const firstDataRowCells = within(rows[1]).getAllByRole("cell");
    expect(firstDataRowCells[0]).toHaveTextContent("Feb 1 - Feb 28, 2026");
    expect(firstDataRowCells[1]).toHaveTextContent("45,230 API calls");
    expect(firstDataRowCells[2]).toHaveTextContent("22.62 USDC");
    expect(firstDataRowCells[3]).toHaveTextContent("Charged");
  });

  it("renders status badges with role status and polite live region semantics", () => {
    render(<PastPeriods />);

    const badges = screen.getAllByRole("status");
    expect(badges).toHaveLength(6);

    for (const badge of badges) {
      expect(badge).toHaveAttribute("aria-live", "polite");
      expect(badge).toHaveAttribute("aria-atomic", "true");
      expect(badge).toHaveTextContent("Charged");
    }
  });

  it("exposes the back control as Back to subscription", async () => {
    const user = userEvent.setup();
    render(<PastPeriods />);

    const backButton = screen.getByRole("button", {
      name: "Back to subscription",
    });
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveAttribute("type", "button");

    await user.click(backButton);
    expect(backButton).toHaveFocus();
  });
});
