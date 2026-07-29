import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import PastPeriodsDrilldown, {
  DEMO_PERIODS,
  type PastPeriod,
} from "./PastPeriodsDrilldown";

describe("PastPeriodsDrilldown", () => {
  it("renders period totals and delta chips", () => {
    render(<PastPeriodsDrilldown periods={DEMO_PERIODS} />);
    expect(screen.getByText("Past periods")).toBeInTheDocument();
    expect(screen.getByText("Mar 2026")).toBeInTheDocument();
    expect(screen.getByText("42.50 USDC")).toBeInTheDocument();
    expect(screen.getByLabelText(/\+11\.8 percent versus previous period/i)).toBeInTheDocument();
  });

  it("shows neutral chip for the first (oldest) period", () => {
    render(<PastPeriodsDrilldown periods={DEMO_PERIODS} />);
    expect(screen.getByLabelText("No prior period to compare")).toBeInTheDocument();
  });

  it("expands a row to reveal line items and announces politely", async () => {
    const user = userEvent.setup();
    render(<PastPeriodsDrilldown periods={DEMO_PERIODS} />);

    const row = screen.getByRole("button", { name: /Mar 2026/i });
    expect(row).toHaveAttribute("aria-expanded", "false");

    await user.click(row);

    expect(row).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Pro plan")).toBeInTheDocument();
    expect(screen.getByText("Usage overage")).toBeInTheDocument();

    const live = document.querySelector('[aria-live="polite"]');
    expect(live).toBeInTheDocument();
    expect(live?.textContent).toMatch(/Mar 2026/i);
    expect(live?.textContent).toMatch(/42\.50 USDC/);
    expect(live?.textContent).toMatch(/percent versus previous period/i);
  });

  it("announces first-period edge case without a comparison", async () => {
    const user = userEvent.setup();
    const single: PastPeriod[] = [DEMO_PERIODS[2]];
    render(<PastPeriodsDrilldown periods={single} />);

    await user.click(screen.getByRole("button", { name: /Jan 2026/i }));

    const live = document.querySelector('[aria-live="polite"]');
    expect(live?.textContent).toMatch(/First period/i);
  });

  it("keeps delta chips LTR for RTL documents", () => {
    render(<PastPeriodsDrilldown periods={DEMO_PERIODS} />);
    const chip = screen.getByLabelText(/\+11\.8 percent versus previous period/i);
    expect(chip).toHaveAttribute("dir", "ltr");
  });

  it("renders empty state", () => {
    render(<PastPeriodsDrilldown periods={[]} />);
    expect(screen.getByText("No past periods yet.")).toBeInTheDocument();
  });

  it("renders sparklines when data is available", () => {
    const { container } = render(<PastPeriodsDrilldown periods={DEMO_PERIODS} />);
    const sparklines = container.querySelectorAll('svg[role="img"]');
    expect(sparklines.length).toBeGreaterThan(0);
  });

  it("collapses an expanded row on second click", async () => {
    const user = userEvent.setup();
    render(<PastPeriodsDrilldown periods={DEMO_PERIODS} />);
    const row = screen.getByRole("button", { name: /Mar 2026/i });
    await user.click(row);
    expect(row).toHaveAttribute("aria-expanded", "true");
    await user.click(row);
    expect(row).toHaveAttribute("aria-expanded", "false");
  });
});
