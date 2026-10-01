import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import KPITile, { DeltaDirection } from "./KPITile";
import { Users } from "lucide-react";

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
    const { container: c1 } = render(<KPITile title="Users" value="1,000" />);
    expect(c1.querySelector("h3")).toHaveTextContent("Users");

    const { container: c2 } = render(
      <KPITile title="Revenue" value="$5,000" delta={12.5} />,
    );
    expect(c2.querySelector('[aria-label*="percent"]')).toBeInTheDocument();

    const { container: c3 } = render(
      <KPITile title="Traffic" value="5,000" sparklineData={[10, 20, 30]} />,
    );
    expect(c3.querySelector('svg[role="img"]')).toBeInTheDocument();

    const { getByText: g4 } = render(
      <KPITile title="Sales" value="$8,000" target={10000} />,
    );
    expect(g4("Goal: 10000")).toBeInTheDocument();

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

describe("DeltaDirection", () => {
  const directionCases = [
    {
      direction: "positive" as const,
      overrideDelta: -5,
      text: "+5%",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      direction: "negative" as const,
      overrideDelta: 5,
      text: "-5%",
      color: "text-rose-400",
      bg: "bg-rose-400/10",
    },
    {
      direction: "neutral" as const,
      overrideDelta: 5,
      text: "5%",
      color: "text-slate-400",
      bg: "bg-slate-400/10",
    },
  ];

  it.each(directionCases)(
    "$direction override renders $text with $color and $bg",
    ({ direction, overrideDelta, text, color, bg }) => {
      const { getByText, getByRole } = render(
        <KPITile
          title="Score"
          value="85"
          delta={overrideDelta}
          deltaDirection={direction}
        />,
      );
      expect(getByText(text)).toBeInTheDocument();
      const badge = getByRole("status");
      expect(badge).toHaveClass(color, bg);
    },
  );

  it.each([
    { delta: 1, text: "+1%", color: "text-emerald-400" },
    { delta: -1, text: "-1%", color: "text-rose-400" },
    { delta: 0, text: "0%", color: "text-slate-400" },
  ])("infers $direction styling from sign of $delta", ({ delta, text, color }) => {
    const { getByText, getByRole } = render(
      <KPITile title="Score" value="85" delta={delta} />,
    );
    expect(getByText(text)).toBeInTheDocument();
    expect(getByRole("status")).toHaveClass(color);
  });

  it("renders each valid DeltaDirection literal without crashing", () => {
    const directions: DeltaDirection[] = ["positive", "negative", "neutral"];
    for (const direction of directions) {
      const { unmount, getByRole } = render(
        <KPITile title="Score" value="85" delta={1} deltaDirection={direction} />,
      );
      expect(getByRole("status")).toBeInTheDocument();
      unmount();
    }
  });

  it("throws when direction is an unrecognized string via cast", () => {
    const bogus = "diagonal" as unknown as DeltaDirection;
    expect(() => {
      render(<KPITile title="Score" value="85" delta={5} deltaDirection={bogus} />);
    }).toThrow(/Cannot read properties of undefined/);
  });

  it("renders no badge when delta is undefined and direction is positive", () => {
    const { queryByRole, queryByText } = render(
      <KPITile title="Score" value="85" deltaDirection="positive" />,
    );
    expect(queryByRole("status")).not.toBeInTheDocument();
    expect(queryByText(/%/)).not.toBeInTheDocument();
  });

  it("pairs the direction color with a text alternative on the badge", () => {
    const { getByRole } = render(
      <KPITile title="Revenue" value="$5,000" delta={12.5} />,
    );
    const badge = getByRole("status");
    expect(badge).toHaveAttribute(
      "aria-label",
      "+12.5 percent vs previous period",
    );
    expect(badge).toHaveTextContent("+12.5%");
  });
});

describe("KPITileProps", () => {
  it("renders with only required props", () => {
    const { getByText } = render(<KPITile title="MRR" value="$1,200" />);
    expect(getByText("MRR")).toBeInTheDocument();
    expect(getByText("$1,200")).toBeInTheDocument();
  });

  it("defaults deltaLabel to vs previous period", () => {
    const { getByText } = render(
      <KPITile title="MRR" value="$1,200" delta={3} />,
    );
    expect(getByText("vs previous period")).toBeInTheDocument();
  });

  it("defaults targetLabel to Goal", () => {
    const { getByText } = render(
      <KPITile title="MRR" value="$1,200" target={5000} />,
    );
    expect(getByText("Goal: 5000")).toBeInTheDocument();
  });

  it("accepts a numeric value prop", () => {
    const { getByText } = render(<KPITile title="Users" value={2500} />);
    expect(getByText(2500)).toBeInTheDocument();
  });

  it("accepts delta as string target and renders it verbatim", () => {
    const { getByText } = render(
      <KPITile title="Progress" value="50%" target="80%" />,
    );
    expect(getByText("Goal: 80%")).toBeInTheDocument();
  });

  it("applies className to both loading and loaded states", () => {
    const { container, rerender } = render(
      <KPITile title="MRR" value="$1,200" className="tile-wide" />,
    );
    expect(container.firstChild).toHaveClass("tile-wide");
    rerender(<KPITile title="MRR" value="$1,200" className="tile-wide" loading />);
    expect(container.firstChild).toHaveClass("tile-wide");
  });

  it("renders title with helpText inside the heading", () => {
    const { getByTitle, getByText } = render(
      <KPITile title="Churn" value="2%" helpText="Monthly churn rate" />,
    );
    expect(getByText("Churn")).toBeInTheDocument();
    expect(getByTitle("Monthly churn rate")).toBeInTheDocument();
  });

  it("does not render the help icon when helpText is omitted", () => {
    const { queryByTitle } = render(<KPITile title="Churn" value="2%" />);
    expect(queryByTitle("Monthly churn rate")).not.toBeInTheDocument();
  });
});

describe("delta formatting", () => {
  it.each([
    { delta: 1000, text: "+1.0K%" },
    { delta: -2500, text: "-2.5K%" },
    { delta: 9999999, text: "+10000.0K%" },
    { delta: 0.05, text: "+0.1%" },
    { delta: -0.04, text: "-0.0%" },
    { delta: 99.95, text: "+100.0%" },
    { delta: -1_000_000, text: "-1000.0K%" },
  ])("formats $delta as $text", ({ delta, text }) => {
    const { getByText } = render(
      <KPITile title="Revenue" value="100" delta={delta} />,
    );
    expect(getByText(text)).toBeInTheDocument();
  });

  it("renders NaN delta as neutral badge with NaN text", () => {
    const nanDelta = NaN;
    const { getByRole, getByText } = render(
      <KPITile title="Broken" value="100" delta={nanDelta} />,
    );
    expect(getByText("NaN%")).toBeInTheDocument();
    expect(getByRole("status")).toHaveClass(
      "text-slate-400",
      "bg-slate-400/10",
    );
  });

  it("renders Infinity delta as positive badge with InfinityK text", () => {
    const infiniteDelta = Infinity;
    const { getByRole, getByText } = render(
      <KPITile title="Broken" value="100" delta={infiniteDelta} />,
    );
    expect(getByText("+InfinityK%")).toBeInTheDocument();
    expect(getByRole("status")).toHaveClass("text-emerald-400");
  });

  it("renders negative Infinity delta as negative badge with InfinityK text", () => {
    const negativeInfiniteDelta = -Infinity;
    const { getByRole, getByText } = render(
      <KPITile title="Broken" value="100" delta={negativeInfiniteDelta} />,
    );
    expect(getByText("-InfinityK%")).toBeInTheDocument();
    expect(getByRole("status")).toHaveClass("text-rose-400");
  });

  it("renders a string delta cast to number as fallback rendering", () => {
    const stringDelta = "12.5" as unknown as number;
    const { getByRole, getByText } = render(
      <KPITile title="Broken" value="100" delta={stringDelta} />,
    );
    expect(getByRole("status")).toBeInTheDocument();
    expect(getByText(/12\.5/)).toBeInTheDocument();
  });

  it("renders a null delta cast to number as a neutral zero badge", () => {
    const nullDelta = null as unknown as number;
    const { getByRole, getByText } = render(
      <KPITile title="Broken" value="100" delta={nullDelta} />,
    );
    expect(getByRole("status")).toBeInTheDocument();
    expect(getByText("0%")).toBeInTheDocument();
    expect(getByRole("status")).toHaveClass(
      "text-slate-400",
      "bg-slate-400/10",
    );
  });
});

describe("invalid inputs", () => {
  it("renders empty title without crashing", () => {
    const { container } = render(<KPITile title="" value="100" />);
    expect(container.querySelector("h3")).toBeInTheDocument();
  });

  it("renders empty value string without crashing", () => {
    const { container } = render(<KPITile title="Users" value="" />);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.querySelector("h3")).toHaveTextContent("Users");
  });

  it("renders empty deltaLabel without crashing", () => {
    const { getByRole } = render(
      <KPITile title="Users" value="100" delta={5} deltaLabel="" />,
    );
    expect(getByRole("status")).toBeInTheDocument();
    expect(getByRole("status")).toHaveAttribute(
      "aria-label",
      "+5 percent ",
    );
  });

  it("renders empty sparklineData without rendering a sparkline", () => {
    const { container } = render(
      <KPITile title="Traffic" value="100" sparklineData={[]} />,
    );
    expect(container.querySelector("svg[role='img']")).not.toBeInTheDocument();
  });

  it("renders empty className without crashing", () => {
    const { container } = render(<KPITile title="Users" value="100" className="" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders a huge finite delta without crashing", () => {
    const hugeDelta = 1e21;
    const { getByRole, getByText } = render(
      <KPITile title="Revenue" value="100" delta={hugeDelta} />,
    );
    expect(getByText("+1000000000000000000.0K%")).toBeInTheDocument();
    expect(getByRole("status")).toBeInTheDocument();
  });

  it("renders a delta cast from an object without crashing and shows malformed badge", () => {
    const objectDelta = { valueOf: () => 7 } as unknown as number;
    const { getByRole, getByText } = render(
      <KPITile title="Broken" value="100" delta={objectDelta} />,
    );
    expect(getByRole("status")).toBeInTheDocument();
    expect(getByText(/7/)).toBeInTheDocument();
  });

  it("throws when direction is a number cast to DeltaDirection", () => {
    const bogus = 42 as unknown as DeltaDirection;
    expect(() => {
      render(<KPITile title="Score" value="85" delta={5} deltaDirection={bogus} />);
    }).toThrow(/Cannot read properties of undefined/);
  });

  it("renders loading state even when value is malformed", () => {
    const badValue = { rogue: true } as unknown as string;
    const { container } = render(
      <KPITile title="Broken" value={badValue} loading />,
    );
    expect(container.firstChild).toHaveClass("animate-pulse");
    expect(container.firstChild).toHaveAttribute("aria-busy", "true");
  });

  it("renders string target cast from number without crashing", () => {
    const badTarget = 12345 as unknown as string;
    const { getByText } = render(
      <KPITile title="Progress" value="50%" target={badTarget} />,
    );
    expect(getByText("Goal: 12345")).toBeInTheDocument();
  });

  it("renders with sparklineData containing malformed entries without crashing", () => {
    const badData = [1, NaN, 3] as number[];
    const { container } = render(
      <KPITile title="Traffic" value="100" sparklineData={badData} />,
    );
    expect(container.querySelector("svg[role='img']")).toBeInTheDocument();
  });
});

describe("prop change transitions", () => {
  it("transitions delta from positive to negative and updates badge", () => {
    const { getByText, getByRole, rerender } = render(
      <KPITile title="Revenue" value="100" delta={12.5} />,
    );
    expect(getByText("+12.5%")).toBeInTheDocument();
    expect(getByRole("status")).toHaveClass("text-emerald-400");

    rerender(<KPITile title="Revenue" value="100" delta={-8.3} />);
    expect(getByText("-8.3%")).toBeInTheDocument();
    expect(getByRole("status")).toHaveClass("text-rose-400");
  });

  it("transitions delta from defined to undefined and removes badge and label", () => {
    const { queryByRole, queryByText, getByText, rerender } = render(
      <KPITile title="Revenue" value="100" delta={12.5} />,
    );
    expect(queryByRole("status")).toBeInTheDocument();
    expect(queryByText("vs previous period")).toBeInTheDocument();

    rerender(<KPITile title="Revenue" value="100" />);
    expect(queryByRole("status")).not.toBeInTheDocument();
    expect(queryByText("vs previous period")).not.toBeInTheDocument();
    expect(getByText("100")).toBeInTheDocument();
  });

  it("transitions deltaDirection override across all values and back to undefined", () => {
    const { getByRole, rerender } = render(
      <KPITile title="Score" value="85" delta={5} deltaDirection="positive" />,
    );
    expect(getByRole("status")).toHaveClass("text-emerald-400");

    rerender(
      <KPITile title="Score" value="85" delta={5} deltaDirection="negative" />,
    );
    expect(getByRole("status")).toHaveClass("text-rose-400");

    rerender(
      <KPITile title="Score" value="85" delta={5} deltaDirection="neutral" />,
    );
    expect(getByRole("status")).toHaveClass("text-slate-400");

    rerender(<KPITile title="Score" value="85" delta={5} />);
    expect(getByRole("status")).toHaveClass("text-emerald-400");
  });

  it("transitions from loading to loaded and back", () => {
    const { container, getByText, rerender } = render(
      <KPITile title="MRR" value="$1,200" loading />,
    );
    expect(container.firstChild).toHaveClass("animate-pulse");

    rerender(<KPITile title="MRR" value="$1,200" />);
    expect(getByText("$1,200")).toBeInTheDocument();
    expect(container.firstChild).not.toHaveClass("animate-pulse");

    rerender(<KPITile title="MRR" value="$1,200" loading />);
    expect(container.firstChild).toHaveClass("animate-pulse");
  });

  it("transitions title and value updates on rerender", () => {
    const { getByText, queryByText, rerender } = render(
      <KPITile title="Users" value="1,000" />,
    );
    expect(getByText("Users")).toBeInTheDocument();
    expect(getByText("1,000")).toBeInTheDocument();

    rerender(<KPITile title="Active Users" value="1,500" />);
    expect(getByText("Active Users")).toBeInTheDocument();
    expect(getByText("1,500")).toBeInTheDocument();
    expect(queryByText("Users")).not.toBeInTheDocument();
  });

  it("transitions sparklineData from valid to short and removes sparkline", () => {
    const { container, rerender } = render(
      <KPITile
        title="Traffic"
        value="100"
        sparklineData={[10, 20, 30, 40]}
      />,
    );
    expect(container.querySelector("svg[role='img']")).toBeInTheDocument();

    rerender(<KPITile title="Traffic" value="100" sparklineData={[10]} />);
    expect(container.querySelector("svg[role='img']")).not.toBeInTheDocument();
  });

  it("transitions delta sign through zero", () => {
    const { getByText, getByRole, rerender } = render(
      <KPITile title="Balance" value="$0" delta={5} />,
    );
    expect(getByText("+5%")).toBeInTheDocument();

    rerender(<KPITile title="Balance" value="$0" delta={0} />);
    expect(getByText("0%")).toBeInTheDocument();
    expect(getByRole("status")).toHaveClass("text-slate-400");

    rerender(<KPITile title="Balance" value="$0" delta={-5} />);
    expect(getByText("-5%")).toBeInTheDocument();
    expect(getByRole("status")).toHaveClass("text-rose-400");
  });
});

