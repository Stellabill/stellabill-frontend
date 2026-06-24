import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import KPITile, { DeltaDirection } from "./KPITile";
import { Users, TrendingUp } from "lucide-react";

describe("KPITile", () => {
  it("renders title and value correctly", () => {
    const { getByText } = render(<KPITile title="Total Users" value="1,000" />);
    expect(getByText("Total Users")).toBeInTheDocument();
    expect(getByText("1,000")).toBeInTheDocument();
  });

  it("renders positive delta with icon and sign", () => {
    const { getByLabelText, getByText } = render(
      <KPITile title="Revenue" value="$5,000" delta={12.5} />,
    );
    expect(getByText("$5,000")).toBeInTheDocument();
    expect(getByText("+12.5%")).toBeInTheDocument();
    expect(
      getByLabelText("+12.5 percent vs previous period"),
    ).toBeInTheDocument();
  });

  it("renders negative delta with icon and sign", () => {
    const { getByText } = render(
      <KPITile title="Expenses" value="$3,000" delta={-8.3} />,
    );
    expect(getByText("-8.3%")).toBeInTheDocument();
  });

  it("renders zero delta as neutral", () => {
    const { getByText } = render(
      <KPITile title="Balance" value="$0" delta={0} />,
    );
    expect(getByText("0%")).toBeInTheDocument();
  });

  it("renders custom delta direction override", () => {
    const { getByText } = render(
      <KPITile title="Score" value="85" delta={-5} deltaDirection="positive" />,
    );
    expect(getByText("+5%")).toBeInTheDocument();
  });

  it("renders custom delta label", () => {
    const { getByText } = render(
      <KPITile
        title="Users"
        value="100"
        delta={10}
        deltaLabel="vs last week"
      />,
    );
    expect(getByText("vs last week")).toBeInTheDocument();
  });

  it("renders sparkline when data provided", () => {
    const { container } = render(
      <KPITile
        title="Traffic"
        value="5,000"
        delta={15}
        sparklineData={[10, 20, 15, 25, 30, 28, 35]}
      />,
    );
    const svg = container.querySelector('svg[role="img"]');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-label", "Traffic trend sparkline");
  });

  it("does not render sparkline with insufficient data", () => {
    const { container } = render(
      <KPITile title="Traffic" value="5,000" delta={15} sparklineData={[10]} />,
    );
    const svg = container.querySelector('svg[role="img"]');
    expect(svg).not.toBeInTheDocument();
  });

  it("renders target/goal indicator", () => {
    const { getByText } = render(
      <KPITile title="Sales" value="$8,000" target={10000} />,
    );
    expect(getByText("Goal: 10000")).toBeInTheDocument();
  });

  it("renders custom target label", () => {
    const { getByText } = render(
      <KPITile
        title="Sales"
        value="$8,000"
        target={10000}
        targetLabel="Target"
      />,
    );
    expect(getByText("Target: 10000")).toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    const { getByTestId } = render(
      <KPITile
        title="Users"
        value="100"
        icon={<Users data-testid="user-icon" />}
      />,
    );
    expect(getByTestId("user-icon")).toBeInTheDocument();
  });

  it("renders help text tooltip icon when provided", () => {
    const { getByTitle } = render(
      <KPITile title="Users" value="100" helpText="Help info" />,
    );
    const tooltipIcon = getByTitle("Help info");
    expect(tooltipIcon).toBeInTheDocument();
  });

  it("renders loading state correctly", () => {
    const { container } = render(
      <KPITile title="Loading" value="0" loading={true} />,
    );
    expect(container.firstChild).toHaveClass("animate-pulse");
    expect(container.firstChild).toHaveAttribute("aria-busy", "true");
    expect(container.firstChild).toHaveAttribute(
      "aria-label",
      "Loading loading",
    );
  });

  it("applies custom className", () => {
    const { container } = render(
      <KPITile title="Test" value="100" className="custom-class" />,
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("formats large delta values with K suffix", () => {
    const { getByText } = render(
      <KPITile title="Big" value="100" delta={1500} />,
    );
    expect(getByText("+1.5K%")).toBeInTheDocument();
  });

  it("formats decimal delta values correctly", () => {
    const { getByText } = render(
      <KPITile title="Test" value="100" delta={12.34} />,
    );
    expect(getByText("+12.3%")).toBeInTheDocument();
  });

  it("renders without delta", () => {
    const { getByText, queryByText } = render(
      <KPITile title="Users" value="1,000" />,
    );
    expect(getByText("1,000")).toBeInTheDocument();
    expect(queryByText(/%/)).not.toBeInTheDocument();
  });

  it("renders without target", () => {
    const { getByText, queryByText } = render(
      <KPITile title="Users" value="1,000" delta={10} />,
    );
    expect(getByText("1,000")).toBeInTheDocument();
    expect(queryByText(/Goal/)).not.toBeInTheDocument();
  });

  it("renders string target value", () => {
    const { getByText } = render(
      <KPITile title="Progress" value="50%" target="100%" />,
    );
    expect(getByText("Goal: 100%")).toBeInTheDocument();
  });

  it("handles negative goal progress with negative value", () => {
    const { getByText } = render(
      <KPITile title="Budget" value="-$1,000" target={5000} />,
    );
    expect(getByText("Goal: 5000")).toBeInTheDocument();
  });

  it("handles goal exceeded scenario", () => {
    const { getByText } = render(
      <KPITile title="Sales" value="$12,000" target={10000} />,
    );
    expect(getByText("Goal: 10000")).toBeInTheDocument();
    expect(getByText("$12,000")).toBeInTheDocument();
  });

  it("rounds delta to one decimal place", () => {
    const { getByText } = render(
      <KPITile title="Test" value="100" delta={12.345} />,
    );
    expect(getByText("+12.3%")).toBeInTheDocument();
  });

  it("has accessible delta badge with aria-label", () => {
    const { getByLabelText } = render(
      <KPITile title="Revenue" value="$5,000" delta={12.5} />,
    );
    const badge = getByLabelText("+12.5 percent vs previous period");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("role", "status");
  });

  it("hides decorative icons from screen readers", () => {
    const { container } = render(
      <KPITile title="Revenue" value="$5,000" delta={12.5} />,
    );
    const trendIcon = container.querySelector('[aria-hidden="true"]');
    expect(trendIcon).toBeInTheDocument();
  });

  it("renders all five tile variants", () => {
    // Value-only
    const { container: c1 } = render(<KPITile title="Users" value="1,000" />);
    expect(c1.querySelector("h3")).toHaveTextContent("Users");

    // Value + delta
    const { container: c2 } = render(
      <KPITile title="Revenue" value="$5,000" delta={12.5} />,
    );
    expect(c2.querySelector('[aria-label*="percent"]')).toBeInTheDocument();

    // Value + sparkline
    const { container: c3 } = render(
      <KPITile title="Traffic" value="5,000" sparklineData={[10, 20, 30]} />,
    );
    expect(c3.querySelector('svg[role="img"]')).toBeInTheDocument();

    // Value + target
    const { getByText: g4 } = render(
      <KPITile title="Sales" value="$8,000" target={10000} />,
    );
    expect(g4("Goal: 10000")).toBeInTheDocument();

    // Full KPI
    const { container: c5 } = render(
      <KPITile
        title="Revenue"
        value="$5,000"
        delta={12.5}
        sparklineData={[10, 20, 30]}
        target={10000}
      />,
    );
    expect(c5.querySelector('svg[role="img"]')).toBeInTheDocument();
    expect(c5.querySelector('[aria-label*="percent"]')).toBeInTheDocument();
    expect(c5.querySelector('[aria-label*="Goal"]')).toBeInTheDocument();
  });

  it("supports custom delta direction for zero delta", () => {
    const { getByText } = render(
      <KPITile
        title="Balance"
        value="$0"
        delta={0}
        deltaDirection="positive"
      />,
    );
    expect(getByText("+0%")).toBeInTheDocument();
  });

  it("renders sparkline with correct aspect ratio", () => {
    const { container } = render(
      <KPITile
        title="Traffic"
        value="5,000"
        sparklineData={[10, 20, 15, 25, 30, 28, 35]}
      />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "240");
    expect(svg).toHaveAttribute("height", "48");
  });

  it("applies responsive classes for narrow layouts", () => {
    const { container } = render(
      <KPITile
        title="Test"
        value="100"
        delta={10}
        sparklineData={[10, 20, 30]}
        target={1000}
      />,
    );
    const flexWrap = container.querySelector(".flex-wrap");
    expect(flexWrap).toBeInTheDocument();
  });
});
