import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import FeatureDiffTable from "./FeatureDiffTable";

const sampleDiffs = [
  {
    name: "SSO & SAML",
    oldValue: false,
    newValue: true,
    change: "added" as const,
  },
  {
    name: "Legacy API",
    oldValue: true,
    newValue: false,
    change: "removed" as const,
  },
  {
    name: "Team Seats",
    oldValue: "5 seats",
    newValue: "25 seats",
    change: "changed" as const,
  },
  {
    name: "Support",
    oldValue: "24/7 Email",
    newValue: "24/7 Email",
    change: "same" as const,
  },
];

describe("FeatureDiffTable", () => {
  it("renders column headers for Feature, oldPlanName, Change, and newPlanName", () => {
    render(
      <FeatureDiffTable
        diffs={sampleDiffs}
        oldPlanName="Starter"
        newPlanName="Enterprise"
      />,
    );

    const table = screen.getByRole("table", {
      name: "Feature comparison between Starter and Enterprise plans.",
    });

    expect(
      within(table).getByRole("columnheader", { name: "Feature" }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: "Starter (Current)" }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: "Change" }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: "Enterprise" }),
    ).toBeInTheDocument();
  });

  it("renders change indicators for added, removed, changed, and same rows", () => {
    render(
      <FeatureDiffTable
        diffs={sampleDiffs}
        oldPlanName="Starter"
        newPlanName="Enterprise"
      />,
    );

    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(4);

    expect(within(rows[0]).getByLabelText("Feature added")).toBeInTheDocument();
    expect(
      within(rows[1]).getByLabelText("Feature removed"),
    ).toBeInTheDocument();
    expect(
      within(rows[2]).getByLabelText("Feature changed"),
    ).toBeInTheDocument();
    expect(within(rows[3]).getByText("-")).toBeInTheDocument();
  });

  it("renders boolean values as Included/Not Included and string values as text", () => {
    render(
      <FeatureDiffTable
        diffs={sampleDiffs}
        oldPlanName="Starter"
        newPlanName="Enterprise"
      />,
    );

    const rows = screen.getAllByRole("row").slice(1);

    // Added row: false -> true
    const addedCells = within(rows[0]).getAllByRole("cell");
    expect(addedCells[0]).toHaveTextContent("SSO & SAML");
    expect(
      within(addedCells[1]).getByLabelText("Not Included"),
    ).toBeInTheDocument();
    expect(within(addedCells[3]).getByLabelText("Included")).toBeInTheDocument();

    // Removed row: true -> false
    const removedCells = within(rows[1]).getAllByRole("cell");
    expect(removedCells[0]).toHaveTextContent("Legacy API");
    expect(
      within(removedCells[1]).getByLabelText("Included"),
    ).toBeInTheDocument();
    expect(
      within(removedCells[3]).getByLabelText("Not Included"),
    ).toBeInTheDocument();

    // Changed row: string -> string
    const changedCells = within(rows[2]).getAllByRole("cell");
    expect(changedCells[0]).toHaveTextContent("Team Seats");
    expect(changedCells[1]).toHaveTextContent("5 seats");
    expect(changedCells[3]).toHaveTextContent("25 seats");

    // Same row: string -> string
    const sameCells = within(rows[3]).getAllByRole("cell");
    expect(sameCells[0]).toHaveTextContent("Support");
    expect(sameCells[1]).toHaveTextContent("24/7 Email");
    expect(sameCells[3]).toHaveTextContent("24/7 Email");
  });

  it("renders an empty table body when diffs is empty", () => {
    render(
      <FeatureDiffTable
        diffs={[]}
        oldPlanName="Free"
        newPlanName="Pro"
      />,
    );

    expect(screen.getAllByRole("row")).toHaveLength(1);
  });
});
