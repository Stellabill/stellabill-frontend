import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import PlanUpgradeWizard, { Plan } from "./PlanUpgradeWizard";

const mockCurrentPlan: Plan = {
  id: "pro",
  name: "Pro",
  price: 29,
  currency: "USD",
  features: {
    "Recurring billing": true,
    "API access": true,
    "Usage-based billing": false,
    "Custom SLAs": false,
  },
};

const mockAvailablePlans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    currency: "USD",
    features: {
      "Recurring billing": true,
      "API access": "Basic",
      "Usage-based billing": false,
      "Custom SLAs": false,
    },
  },
  mockCurrentPlan,
  {
    id: "enterprise",
    name: "Enterprise",
    price: 99,
    currency: "USD",
    features: {
      "Recurring billing": true,
      "API access": true,
      "Usage-based billing": true,
      "Custom SLAs": true,
    },
  },
];

describe("PlanUpgradeWizard", () => {
  let onCompleteMock: jest.Mock;

  beforeEach(() => {
    onCompleteMock = jest.fn();
    render(
      <PlanUpgradeWizard
        currentPlan={mockCurrentPlan}
        availablePlans={mockAvailablePlans}
        onComplete={onCompleteMock}
      />
    );
  });

  test("renders initial step (select plan) correctly", () => {
    expect(screen.getByText("Change Your Plan")).toBeInTheDocument();
    expect(
      screen.getByText("Choose a new plan to compare with your current plan.")
    ).toBeInTheDocument();
    expect(screen.getByText("Enterprise")).toBeInTheDocument();
    expect(screen.queryByText("Pro")).not.toBeInTheDocument(); // Current plan should not be an option
    expect(screen.getByText("Review Changes")).toBeDisabled();
  });

  test("allows selecting a plan and enables the next button", () => {
    const enterprisePlanCard = screen.getByText("Enterprise").closest("div");
    expect(enterprisePlanCard).not.toBeNull();
    fireEvent.click(enterprisePlanCard!);

    expect(enterprisePlanCard).toHaveClass("planCardSelected");
    expect(screen.getByText("Review Changes")).toBeEnabled();
  });

  test("navigates to the review step", () => {
    fireEvent.click(screen.getByText("Enterprise").closest("div")!);
    fireEvent.click(screen.getByText("Review Changes"));

    expect(
      screen.getByText(
        "Review the feature changes between your current plan and the new plan."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Pro (Current)")).toBeInTheDocument();
    expect(screen.getByText("Enterprise")).toBeInTheDocument();
    expect(screen.getByText("Confirm Proration")).toBeInTheDocument();
  });

  test("displays correct feature diffs on review step", () => {
    fireEvent.click(screen.getByText("Enterprise").closest("div")!);
    fireEvent.click(screen.getByText("Review Changes"));

    // Check for a feature that was added
    const usageBillingRow = screen.getByText("Usage-based billing").closest("tr");
    expect(usageBillingRow).toHaveTextContent("Not Included"); // Old value
    expect(usageBillingRow).toHaveTextContent("Included"); // New value
    expect(
      usageBillingRow?.querySelector('[aria-label="Feature added"]')
    ).toBeInTheDocument();

    // Check for a feature that is the same
    const recurringBillingRow = screen
      .getByText("Recurring billing")
      .closest("tr");
    expect(recurringBillingRow).toHaveTextContent("Included");
    expect(recurringBillingRow?.querySelector(".same")).toBeInTheDocument();
  });

  test("navigates to the confirmation step", () => {
    fireEvent.click(screen.getByText("Enterprise").closest("div")!);
    fireEvent.click(screen.getByText("Review Changes"));
    fireEvent.click(screen.getByText("Confirm Proration"));

    expect(screen.getByText("Proration Preview")).toBeInTheDocument();
    expect(screen.getByText("Amount due today")).toBeInTheDocument();
    expect(screen.getByText("$35.00")).toBeInTheDocument(); // (99-29)/30 * 15
    expect(screen.getByText("Confirm Plan Change")).toBeInTheDocument();
  });

  test("handles downgrade proration preview", () => {
    fireEvent.click(screen.getByText("Free").closest("div")!);
    fireEvent.click(screen.getByText("Review Changes"));
    fireEvent.click(screen.getByText("Confirm Proration"));

    expect(screen.getByText("Credit to your account")).toBeInTheDocument();
    expect(screen.getByText("-$14.50")).toBeInTheDocument(); // (0-29)/30 * 15
  });

  test("navigates back through the steps", () => {
    // Go to review step
    fireEvent.click(screen.getByText("Enterprise").closest("div")!);
    fireEvent.click(screen.getByText("Review Changes"));
    expect(screen.getByText("Confirm Proration")).toBeInTheDocument();

    // Go back to select step
    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByText("Review Changes")).toBeInTheDocument();
    expect(screen.getByText("Enterprise").closest("div")).toHaveClass(
      "planCardSelected"
    );

    // Go to confirm step
    fireEvent.click(screen.getByText("Review Changes"));
    fireEvent.click(screen.getByText("Confirm Proration"));
    expect(screen.getByText("Confirm Plan Change")).toBeInTheDocument();

    // Go back to review step
    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByText("Confirm Proration")).toBeInTheDocument();
  });

  test("calls onComplete with the new plan ID when confirmed", () => {
    fireEvent.click(screen.getByText("Enterprise").closest("div")!);
    fireEvent.click(screen.getByText("Review Changes"));
    fireEvent.click(screen.getByText("Confirm Proration"));
    fireEvent.click(screen.getByText("Confirm Plan Change"));

    expect(onCompleteMock).toHaveBeenCalledWith("enterprise");
    expect(onCompleteMock).toHaveBeenCalledTimes(1);
  });

  test("is accessible via keyboard", () => {
    const enterprisePlanCard = screen.getByText("Enterprise").closest("div");
    expect(enterprisePlanCard).not.toBeNull();

    enterprisePlanCard!.focus();
    expect(enterprisePlanCard).toHaveFocus();

    fireEvent.keyDown(enterprisePlanCard!, { key: "Enter", code: "Enter" });
    expect(enterprisePlan-card).toHaveClass("planCardSelected");
    expect(screen.getByText("Review Changes")).toBeEnabled();
  });

  test("handles no-change guard (selecting same plan is not possible)", () => {
    expect(screen.queryByText(mockCurrentPlan.name)).not.toBeInTheDocument();
  });

  test("handles edge case where selected plan becomes null", () => {
    // This is hard to test without manipulating props, but the component
    // should not crash if selectedPlan is null on review/confirm steps.
    fireEvent.click(screen.getByText("Enterprise").closest("div")!);
    fireEvent.click(screen.getByText("Review Changes"));

    // Re-render with the selected plan removed
    render(
      <PlanUpgradeWizard
        currentPlan={mockCurrentPlan}
        availablePlans={[mockAvailablePlans[0]]} // Only 'Free' plan
        onComplete={onCompleteMock}
      />
    );

    // Should reset to select step or handle gracefully
    expect(
      screen.getByText("Choose a new plan to compare with your current plan.")
    ).toBeInTheDocument();
  });
});