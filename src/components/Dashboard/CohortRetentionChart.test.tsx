import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import CohortRetentionChart from "./CohortRetentionChart";

const mockData = [
  {
    cohortMonth: "Jan 2024",
    totalUsers: 100,
    retention: [100, 80, 60.5, 50, 40, 30, 25, 20, 15, 10, 5, 2],
  },
  {
    cohortMonth: "Feb 2024",
    totalUsers: 120,
    retention: [100, 85, 70, 60, 50, 40, 35, 30, 25, 20, 15],
  },
  {
    cohortMonth: "Mar 2024", // Sparse cohort
    totalUsers: 80,
    retention: [100, 75, null, 55],
  },
  {
    cohortMonth: "Apr 2024", // Recent, partial cohort
    totalUsers: 150,
    retention: [100, 90],
  },
];

describe("CohortRetentionChart", () => {
  test("renders the heatmap view by default", () => {
    render(<CohortRetentionChart data={mockData} />);
    expect(
      screen.getByText("Subscriber Retention by Cohort")
    ).toBeInTheDocument();
    expect(screen.getByText("View as Table")).toBeInTheDocument();
    // Check for a cell's aria-label
    expect(
      screen.getByLabelText("Jan 2024, Month 1: 80.0% retention")
    ).toBeInTheDocument();
  });

  test("switches to the table view when toggle is clicked", () => {
    render(<CohortRetentionChart data={mockData} />);
    const toggleButton = screen.getByText("View as Table");
    fireEvent.click(toggleButton);

    expect(screen.getByText("View as Heatmap")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("85.0%")).toBeInTheDocument(); // From Feb cohort, month 1
  });

  test("switches back to heatmap view", () => {
    render(<CohortRetentionChart data={mockData} />);
    fireEvent.click(screen.getByText("View as Table"));
    fireEvent.click(screen.getByText("View as Heatmap"));

    expect(screen.getByText("View as Table")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  test("shows tooltip on hover in heatmap view", () => {
    render(<CohortRetentionChart data={mockData} />);
    const cell = screen.getByLabelText("Feb 2024, Month 1: 85.0% retention");
    fireEvent.mouseEnter(cell);

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent("Feb 2024");
    expect(tooltip).toHaveTextContent("Month 1: 85.0%");
    expect(tooltip).toHaveTextContent("(102 / 120 users)"); // 120 * 0.85 = 102

    fireEvent.mouseLeave(cell);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  test("shows tooltip on focus in heatmap view", () => {
    render(<CohortRetentionChart data={mockData} />);
    const cell = screen.getByLabelText("Jan 2024, Month 2: 60.5% retention");
    fireEvent.focus(cell);

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent("Month 2: 60.5%");

    fireEvent.blur(cell);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  test("handles sparse data correctly in both views", () => {
    render(<CohortRetentionChart data={mockData} />);
    // Heatmap view
    const sparseCell = screen.getByLabelText("Mar 2024, Month 2: No data");
    expect(sparseCell).toBeInTheDocument();
    expect(sparseCell).toHaveStyle("background-color: #f1f5f9");

    // Switch to table view
    fireEvent.click(screen.getByText("View as Table"));
    const tableRow = screen.getByText("Mar 2024").closest("tr");
    expect(tableRow).toHaveTextContent("100.0%");
    expect(tableRow).toHaveTextContent("75.0%");
    expect(tableRow).toHaveTextContent("–"); // The sparse cell
    expect(tableRow).toHaveTextContent("55.0%");
  });

  test("handles recent, partial cohorts correctly", () => {
    render(<CohortRetentionChart data={mockData} />);
    // Heatmap view - verify cells by aria-label (CSS Modules hashes class names in tests)
    expect(
      screen.getByLabelText("Apr 2024, Month 0: 100.0% retention")
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Apr 2024, Month 1: 90.0% retention")
    ).toBeInTheDocument();

    // Table view
    fireEvent.click(screen.getByText("View as Table"));
    const tableRow = screen.getByText("Apr 2024").closest("tr");
    const tds = tableRow?.querySelectorAll("td");
    expect(tds?.[0].textContent).toBe("100.0%");
    expect(tds?.[1].textContent).toBe("90.0%");
    expect(tds?.[2].textContent).toBe("–");
  });

  test("renders legend in heatmap view", () => {
    render(<CohortRetentionChart data={mockData} />);
    expect(screen.getByText("Less")).toBeInTheDocument();
    expect(screen.getByText("More")).toBeInTheDocument();
  });

  test("does not render legend in table view", () => {
    render(<CohortRetentionChart data={mockData} />);
    fireEvent.click(screen.getByText("View as Table"));
    expect(screen.queryByText("Less")).not.toBeInTheDocument();
    expect(screen.queryByText("More")).not.toBeInTheDocument();
  });
});

/**
 * Regression coverage for the tooltip failure paths in
 * CohortRetentionChart.renderTooltip (src/components/Dashboard/CohortRetentionChart.tsx:76-81):
 *
 *   if (!hoveredCell || !containerRef.current) return null;
 *   const percentage = cohort.retention[monthIndex];
 *   if (percentage === null) return null;
 *
 * The null-percentage early return had no coverage: the existing "handles
 * sparse data" test asserts the cell's background colour and its table
 * rendering, but never hovers the cell, so nothing verified that hovering a
 * "No data" cell is suppressed.
 */
describe("CohortRetentionChart tooltip failure handling", () => {
  // "Mar 2024" has retention [100, 75, null, 55]; month 2 is an explicit null.
  const nullCellLabel = "Mar 2024, Month 2: No data";

  test("does not render a tooltip when hovering a cell with null retention", () => {
    render(<CohortRetentionChart data={mockData} />);
    const nullCell = screen.getByLabelText(nullCellLabel);
    expect(nullCell).toBeInTheDocument();

    fireEvent.mouseEnter(nullCell);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  test("does not render a tooltip when focusing a cell with null retention", () => {
    render(<CohortRetentionChart data={mockData} />);
    const nullCell = screen.getByLabelText(nullCellLabel);

    fireEvent.focus(nullCell);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  test("a null-retention cell is still focusable and hoverable", () => {
    // Guards against "fixing" the failure path by removing the cell's handlers,
    // which would break keyboard and pointer parity with populated cells.
    render(<CohortRetentionChart data={mockData} />);
    const nullCell = screen.getByLabelText(nullCellLabel);

    expect(nullCell).toHaveAttribute("tabindex", "0");
    expect(nullCell.tagName).toBe("DIV");
  });

  test("dismisses an open tooltip when moving onto a null-retention cell", () => {
    // The populated cell opens a tooltip, then the null cell must close it.
    // This is the transition that would regress if renderTooltip rendered
    // unconditionally for a stale hoveredCell.
    render(<CohortRetentionChart data={mockData} />);

    const populatedCell = screen.getByLabelText(
      "Mar 2024, Month 1: 75.0% retention"
    );
    fireEvent.mouseEnter(populatedCell);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByLabelText(nullCellLabel));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  test("renders no tooltip for months beyond a cohort's retention length", () => {
    // "Apr 2024" only has 2 months. Months 2-11 render as empty cells that
    // carry no interaction handlers, so no tooltip can be produced for them.
    const partialData = [
      { cohortMonth: "Apr 2024", totalUsers: 150, retention: [100, 90] },
    ];
    render(<CohortRetentionChart data={partialData} />);

    // The heatmap is padded out to 12 months; the padded cells expose no
    // accessible label, so hovering them must not produce a tooltip.
    const labelledCells = screen.getAllByLabelText(/retention|No data/);
    expect(labelledCells).toHaveLength(2);

    fireEvent.mouseEnter(labelledCells[0]);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.mouseLeave(labelledCells[0]);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  test("treats 0% retention as data, not as an empty value", () => {
    // Boundary: 0 is falsy. A truthiness check in place of the `=== null`
    // comparison would suppress this tooltip, so this pins the distinction.
    const zeroData = [
      { cohortMonth: "Jan 2024", totalUsers: 200, retention: [0, 50] },
    ];
    render(<CohortRetentionChart data={zeroData} />);

    const zeroCell = screen.getByLabelText("Jan 2024, Month 0: 0.0% retention");
    fireEvent.mouseEnter(zeroCell);

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent("Month 0: 0.0%");
    expect(tooltip).toHaveTextContent("(0 / 200 users)");
  });

  test("rounds retained users to the nearest whole number", () => {
    // Boundary for the retainedUsers computation at line 83.
    const roundingData = [
      { cohortMonth: "Jan 2024", totalUsers: 3, retention: [50] },
    ];
    render(<CohortRetentionChart data={roundingData} />);

    fireEvent.mouseEnter(
      screen.getByLabelText("Jan 2024, Month 0: 50.0% retention")
    );

    // 3 * 0.5 = 1.5, which Math.round sends to 2.
    expect(screen.getByRole("tooltip")).toHaveTextContent("(2 / 3 users)");
  });

  test("renders a tooltip for 100% retention", () => {
    const fullData = [
      { cohortMonth: "Jan 2024", totalUsers: 64, retention: [100] },
    ];
    render(<CohortRetentionChart data={fullData} />);

    fireEvent.mouseEnter(
      screen.getByLabelText("Jan 2024, Month 0: 100.0% retention")
    );

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("Month 0: 100.0%");
    expect(tooltip).toHaveTextContent("(64 / 64 users)");
  });
});