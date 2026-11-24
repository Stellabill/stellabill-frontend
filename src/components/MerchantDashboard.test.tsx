import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it } from "vitest";
import MerchantDashboard from "./MerchantDashboard";
import type { PlanRevenueSlice } from "./Dashboard/revenueSplitUtils";
import { MOCK_PLAN_REVENUE } from "../pages/dashboard/dashboardData";

const SAMPLE_PLANS: PlanRevenueSlice[] = [
  { planId: "basic", planName: "Basic", revenue: 320, previousRevenue: 290 },
  { planId: "pro", planName: "Pro", revenue: 720, previousRevenue: 680 },
];

describe("MerchantDashboard", () => {
  it("renders the four stat labels", () => {
    render(<MerchantDashboard />);
    expect(screen.getByText("Active subscriptions")).toBeInTheDocument();
    expect(screen.getByText("Monthly recurring revenue")).toBeInTheDocument();
    expect(screen.getByText("Pending charges")).toBeInTheDocument();
    expect(screen.getByText("Available to withdraw")).toBeInTheDocument();
  });

  it("renders a Withdraw button of type button", () => {
    render(<MerchantDashboard />);
    const withdrawButton = screen.getByRole("button", { name: "Withdraw" });
    expect(withdrawButton).toBeInTheDocument();
    expect(withdrawButton).toHaveAttribute("type", "button");
  });

  it("renders an empty state when no plans are provided", () => {
    render(<MerchantDashboard />);
    expect(
      screen.getByText(/No plan revenue to display for this month/i),
    ).toBeInTheDocument();
  });

  it("renders an empty state when plans is an empty array", () => {
    render(<MerchantDashboard plans={[]} />);
    expect(
      screen.getByText(/No plan revenue to display for this month/i),
    ).toBeInTheDocument();
  });

  it("renders populated plan revenue from props", () => {
    render(<MerchantDashboard plans={SAMPLE_PLANS} />);
    expect(
      screen.queryByText(/No plan revenue to display/i),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Basic")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
  });

  it("passes every plan in MOCK_PLAN_REVENUE to the revenue split panel", () => {
    render(<MerchantDashboard plans={MOCK_PLAN_REVENUE} />);
    const panel = screen.getByTestId("revenue-split-by-plan");
    for (const plan of MOCK_PLAN_REVENUE) {
      expect(within(panel).getByText(plan.planName)).toBeInTheDocument();
    }
  });
});
