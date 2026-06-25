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
    // Heatmap view - check for empty cells
    const aprCohortRow = screen.getByText("Apr 2024").parentElement;
    const cells = aprCohortRow?.querySelectorAll(`.${"heatmapCell"}`);
    expect(cells?.length).toBe(2); // Only M0 and M1 should be rendered as cells

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