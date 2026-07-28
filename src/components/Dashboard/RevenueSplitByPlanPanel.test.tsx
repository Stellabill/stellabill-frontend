import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RevenueSplitByPlanPanel from "./RevenueSplitByPlanPanel";
import type { PlanRevenueSlice } from "./revenueSplitUtils";
import {
  buildScreenReaderSummary,
  computePlanShares,
  formatDeltaPercent,
  formatSharePercent,
  resolveDeltaTone,
  revenueDeltaPercent,
} from "./revenueSplitUtils";

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

const fourPlans: PlanRevenueSlice[] = [
  { planId: "basic", planName: "Basic", revenue: 100, previousRevenue: 80 },
  { planId: "pro", planName: "Pro", revenue: 200, previousRevenue: 220 },
  { planId: "biz", planName: "Business", revenue: 50, previousRevenue: 50 },
  { planId: "ent", planName: "Enterprise", revenue: 50, previousRevenue: 0 },
];

const singlePlan: PlanRevenueSlice[] = [
  { planId: "solo", planName: "Solo", revenue: 1000, previousRevenue: 900 },
];

const manyPlans: PlanRevenueSlice[] = Array.from({ length: 10 }, (_, i) => ({
  planId: `p${i}`,
  planName: `Plan ${i + 1}`,
  revenue: 1000 - i * 80,
  previousRevenue: 900 - i * 70,
}));

describe("revenueSplitUtils", () => {
  it("computes ranked shares and deltas", () => {
    const shares = computePlanShares(fourPlans);
    expect(shares[0].planName).toBe("Pro");
    expect(shares[0].sharePercent).toBe(50);
    expect(shares.find((s) => s.planId === "ent")?.revenueDeltaPercent).toBeNull();
    expect(shares.find((s) => s.planId === "biz")?.revenueDeltaPercent).toBe(0);
  });

  it("handles empty and zero totals", () => {
    expect(computePlanShares([])).toEqual([]);
    const zero = computePlanShares([
      { planId: "a", planName: "A", revenue: 0, previousRevenue: 0 },
    ]);
    expect(zero[0].sharePercent).toBe(0);
  });

  it("formats deltas and resolves tone", () => {
    expect(formatDeltaPercent(12.5)).toBe("12.5");
    expect(formatDeltaPercent(12)).toBe("12");
    expect(formatDeltaPercent(1500)).toBe("1.5K");
    expect(formatSharePercent(50)).toBe("50");
    expect(formatSharePercent(33.3)).toBe("33.3");
    expect(resolveDeltaTone(1)).toBe("positive");
    expect(resolveDeltaTone(-1)).toBe("negative");
    expect(resolveDeltaTone(0)).toBe("neutral");
    expect(resolveDeltaTone(null)).toBe("neutral");
    expect(revenueDeltaPercent(0, 0)).toBe(0);
    expect(revenueDeltaPercent(10, 0)).toBeNull();
    expect(revenueDeltaPercent(110, 100)).toBeCloseTo(10);
  });

  it("builds a screen-reader summary", () => {
    const shares = computePlanShares(singlePlan);
    const summary = buildScreenReaderSummary(shares, 1000, "this month");
    expect(summary).toContain("Solo");
    expect(summary).toContain("100 percent");
    expect(summary).toContain("this month");
    expect(buildScreenReaderSummary([], 0, "this month")).toContain(
      "No plan revenue",
    );
  });
});

describe("RevenueSplitByPlanPanel", () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it("renders stacked bar with legend and polite live region", () => {
    render(
      <RevenueSplitByPlanPanel plans={fourPlans} periodLabel="this month" />,
    );
    expect(screen.getByTestId("revenue-split-by-plan")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /revenue by plan/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/revenue split display mode/i),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/basic: 25 percent of revenue/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/plan color legend/i)).toBeInTheDocument();
    const live = document.querySelector('[aria-live="polite"]');
    expect(live).toHaveTextContent(/Revenue split by plan for this month/i);
  });

  it("switches to ranked list and data table", () => {
    render(<RevenueSplitByPlanPanel plans={fourPlans} />);
    fireEvent.click(screen.getByRole("button", { name: /ranked list/i }));
    expect(
      screen.getByRole("button", { name: /ranked list/i }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /data table/i }));
    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();
    expect(within(table).getByText("Enterprise")).toBeInTheDocument();
    expect(within(table).getByText("New")).toBeInTheDocument();
  });

  it("handles single-plan case as 100% share", () => {
    render(<RevenueSplitByPlanPanel plans={singlePlan} />);
    expect(
      screen.getByLabelText(/solo: 100 percent of revenue/i),
    ).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByTestId("revenue-split-by-plan")).toHaveAttribute(
      "data-effective-view",
      "stacked",
    );
  });

  it("falls back to ranked list on narrow viewports when stacked is selected", () => {
    mockMatchMedia(true);
    render(<RevenueSplitByPlanPanel plans={singlePlan} defaultView="stacked" />);
    expect(screen.getByTestId("revenue-split-by-plan")).toHaveAttribute(
      "data-effective-view",
      "ranked",
    );
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.queryByLabelText(/solo: 100 percent of revenue/i)).toBeNull();
  });

  it("handles many-plans case without crashing", () => {
    render(
      <RevenueSplitByPlanPanel plans={manyPlans} defaultView="ranked" />,
    );
    const list = screen.getByRole("list");
    expect(within(list).getByText("Plan 1")).toBeInTheDocument();
    expect(within(list).getByText("Plan 10")).toBeInTheDocument();
  });

  it("announces segment focus in the polite live region", () => {
    render(
      <RevenueSplitByPlanPanel
        plans={singlePlan}
        previousPeriodLabel="vs last month"
      />,
    );
    const segment = screen.getByLabelText(/solo: 100 percent of revenue/i);
    fireEvent.focus(segment);
    const live = document.querySelector('[aria-live="polite"]');
    expect(live).toHaveTextContent(/Solo, 100 percent, \+11\.1% vs last month/i);
  });

  it("announces new-plan and negative deltas from segment focus", () => {
    render(
      <RevenueSplitByPlanPanel
        plans={fourPlans}
        previousPeriodLabel="vs last month"
      />,
    );
    fireEvent.focus(
      screen.getByLabelText(/enterprise: 12\.5 percent of revenue/i),
    );
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent(
      /Enterprise, 12\.5 percent, new this period/i,
    );

    fireEvent.focus(screen.getByLabelText(/pro: 50 percent of revenue/i));
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent(
      /Pro, 50 percent, −9\.1% vs last month/i,
    );
  });

  it("announces ranked-list delta focus and renders zero-share segments", () => {
    const withZero: PlanRevenueSlice[] = [
      { planId: "a", planName: "Active", revenue: 100, previousRevenue: 100 },
      { planId: "z", planName: "Zero", revenue: 0, previousRevenue: 10 },
    ];
    render(
      <RevenueSplitByPlanPanel
        plans={withZero}
        defaultView="ranked"
        previousPeriodLabel="vs last month"
      />,
    );
    const chip = screen.getByLabelText("0% vs last month");
    fireEvent.focus(chip.closest("button")!);
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent(
      /Active, 100 percent/i,
    );

    fireEvent.click(screen.getByRole("button", { name: /stacked bar/i }));
    expect(
      screen.getByLabelText(/zero: 0 percent of revenue/i),
    ).toBeInTheDocument();
  });

  it("renders negative share delta in the data table", () => {
    render(<RevenueSplitByPlanPanel plans={fourPlans} defaultView="table" />);
    const table = screen.getByRole("table");
    expect(within(table).getByText("−9.1%")).toBeInTheDocument();
    expect(within(table).getByText("−12.9")).toBeInTheDocument();
  });

  it("shows empty state", () => {
    render(<RevenueSplitByPlanPanel plans={[]} periodLabel="this week" />);
    expect(
      screen.getByText(/No plan revenue to display for this week/i),
    ).toBeInTheDocument();
  });

  it("supports RTL container without layout errors", () => {
    const { container } = render(
      <div dir="rtl">
        <RevenueSplitByPlanPanel plans={fourPlans} />
      </div>,
    );
    expect(
      container.querySelector('[data-testid="revenue-split-by-plan"]'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/pro: 50 percent of revenue/i),
    ).toBeInTheDocument();
  });
});
