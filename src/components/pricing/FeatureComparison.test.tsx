import { render, screen, fireEvent } from "@testing-library/react";
import FeatureComparison from "./FeatureComparison";

describe("FeatureComparison", () => {
  beforeEach(() => {
    render(<FeatureComparison />);
  });

  test("renders the section title", () => {
    expect(screen.getByText("Feature comparison")).toBeInTheDocument();
  });

  test("renders all three plan column headers", () => {
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Enterprise")).toBeInTheDocument();
  });

  test("renders group header labels", () => {
    expect(screen.getByText("Billing")).toBeInTheDocument();
    expect(screen.getByText("Integrations")).toBeInTheDocument();
    expect(screen.getByText("Support")).toBeInTheDocument();
    expect(screen.getByText("Enterprise")).toBeInTheDocument(); // group label
  });

  test("renders feature rows within groups", () => {
    expect(screen.getByText("Recurring billing")).toBeInTheDocument();
    expect(screen.getByText("Usage-based billing")).toBeInTheDocument();
    expect(screen.getByText("Webhooks")).toBeInTheDocument();
    expect(screen.getByText("Priority support")).toBeInTheDocument();
    expect(screen.getByText("Custom SLAs")).toBeInTheDocument();
  });

  test("renders checkmark for included features", () => {
    const includedIcons = screen.getAllByLabelText("Included");
    expect(includedIcons.length).toBeGreaterThan(0);
  });

  test("renders dash for not-included features", () => {
    const notIncludedIcons = screen.getAllByLabelText("Not included");
    expect(notIncludedIcons.length).toBeGreaterThan(0);
  });

  test("renders text value for string features", () => {
    expect(screen.getByText("Basic")).toBeInTheDocument();
  });

  test("group toggles collapse features on click", () => {
    const groupToggle = screen.getByText("Billing").closest("button");
    expect(groupToggle).toBeInTheDocument();
    expect(groupToggle).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(groupToggle!);
    expect(groupToggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(groupToggle!);
    expect(groupToggle).toHaveAttribute("aria-expanded", "true");
  });

  test("group toggle has aria-controls pointing to group element", () => {
    const groupToggle = screen.getByText("Billing").closest("button");
    const controlsId = groupToggle?.getAttribute("aria-controls");
    expect(controlsId).toBe("group-Billing");
  });

  test("each group toggle has chevron icon", () => {
    const billingToggle = screen.getByText("Billing").closest("button");
    expect(billingToggle?.querySelector("svg")).toBeInTheDocument();
  });

  test("renders table with caption for screen readers", () => {
    const caption = document.querySelector("caption");
    expect(caption).toBeInTheDocument();
    expect(caption).toHaveTextContent(
      /feature comparison/i
    );
  });

  test("first column header is 'Features'", () => {
    expect(screen.getByText("Features")).toBeInTheDocument();
  });

  test("renders mobile card stack with role list", () => {
    const cardStack = document.querySelector('[role="list"]');
    expect(cardStack).toBeInTheDocument();
    expect(cardStack).toHaveAttribute("aria-label", "Plan feature cards");
  });

  test("mobile card stack contains plan cards", () => {
    const listItems = document.querySelectorAll('[role="listitem"]');
    expect(listItems.length).toBe(3);
  });

  test("each mobile card has a plan name heading", () => {
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Enterprise")).toBeInTheDocument();
  });

  test("table has region role with accessible label", () => {
    const region = document.querySelector('[role="region"]');
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute("aria-label", "Feature comparison table");
  });

  test("column headers are marked with scope='col'", () => {
    const colHeaders = document.querySelectorAll('th[scope="col"]');
    expect(colHeaders.length).toBeGreaterThanOrEqual(4); // Features + 3 plans
  });

  test("feature names have scope='row'", () => {
    const rowHeaders = document.querySelectorAll('th[scope="row"]');
    expect(rowHeaders.length).toBeGreaterThan(0);
  });

  test("does not render empty feature rows on initial load", () => {
    const featureRows = document.querySelectorAll("tbody tr");
    expect(featureRows.length).toBeGreaterThan(0);
  });
});
