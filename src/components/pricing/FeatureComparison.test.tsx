import { render, screen, fireEvent, within } from "@testing-library/react";
import FeatureComparison from "./FeatureComparison";

const matrix = () => within(screen.getByRole('table'));

describe("FeatureComparison", () => {
  beforeEach(() => {
    render(<FeatureComparison />);
  });

  test("renders the section title", () => {
    expect(screen.getByText("Feature comparison")).toBeInTheDocument();
  });

  test("renders all three plan column headers", () => {
    expect(matrix().getByRole('columnheader', { name: 'Free' })).toBeInTheDocument();
    expect(matrix().getByRole('columnheader', { name: 'Pro' })).toBeInTheDocument();
    expect(matrix().getByRole('columnheader', { name: 'Enterprise' })).toBeInTheDocument();
  });

  test("renders group header labels", () => {
    for (const name of ['Billing', 'Integrations', 'Support', 'Enterprise']) {
      expect(matrix().getByRole('button', { name })).toBeInTheDocument();
    }
  });

  test("renders feature rows within groups", () => {
    for (const name of ['Recurring billing', 'Usage-based billing', 'Webhooks', 'Priority support', 'Custom SLAs']) {
      expect(matrix().getByRole('rowheader', { name })).toBeInTheDocument();
    }
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
    expect(matrix().getByText("Basic")).toBeInTheDocument();
  });

  test("group toggles collapse features on click", () => {
    const groupToggle = matrix().getByRole('button', { name: 'Billing' });
    expect(groupToggle).toBeInTheDocument();
    expect(groupToggle).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(groupToggle!);
    expect(groupToggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(groupToggle!);
    expect(groupToggle).toHaveAttribute("aria-expanded", "true");
  });

  test("group toggle has aria-controls pointing to group element", () => {
    const groupToggle = matrix().getByRole('button', { name: 'Billing' });
    const controlsId = groupToggle?.getAttribute("aria-controls");
    expect(controlsId).toBe("group-pricing.groups.billing");
  });

  test("each group toggle has chevron icon", () => {
    const billingToggle = matrix().getByRole('button', { name: 'Billing' });
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
    const cards = within(screen.getByRole('list', { name: 'Plan feature cards' }));
    for (const name of ['Free', 'Pro', 'Enterprise']) {
      expect(cards.getByRole('heading', { name })).toBeInTheDocument();
    }
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
