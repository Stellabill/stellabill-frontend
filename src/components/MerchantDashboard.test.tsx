import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it } from "vitest";
import MerchantDashboard from "./MerchantDashboard";
import type { PlanRevenueSlice } from "./Dashboard/revenueSplitUtils";

const SAMPLE_PLANS: PlanRevenueSlice[] = [
  { planId: "basic", planName: "Basic", revenue: 320, previousRevenue: 290 },
  { planId: "pro", planName: "Pro", revenue: 720, previousRevenue: 680 },
];

describe("MerchantDashboard", () => {
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
});
