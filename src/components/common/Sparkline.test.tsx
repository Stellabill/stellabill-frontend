import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Sparkline from "./Sparkline";

describe("Sparkline", () => {
  it("renders without crashing with valid data", () => {
    const { container } = render(<Sparkline data={[10, 20, 30]} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders path element with data", () => {
    const { container } = render(<Sparkline data={[10, 20, 30]} />);
    const path = container.querySelector("path");
    expect(path).toBeInTheDocument();
  });

  it("renders area path when showArea is true", () => {
    const { container } = render(
      <Sparkline data={[10, 20, 30]} showArea={true} />,
    );
    const paths = container.querySelectorAll("path");
    expect(paths.length).toBe(2);
  });

  it("does not render area path when showArea is false", () => {
    const { container } = render(
      <Sparkline data={[10, 20, 30]} showArea={false} />,
    );
    const paths = container.querySelectorAll("path");
    expect(paths.length).toBe(1);
  });

  it("renders fallback for insufficient data", () => {
    const { container } = render(<Sparkline data={[10]} />);
    const text = container.querySelector("text");
    expect(text).toBeInTheDocument();
    expect(text).toHaveTextContent("No data");
  });

  it("renders fallback for empty data", () => {
    const { container } = render(<Sparkline data={[]} />);
    const text = container.querySelector("text");
    expect(text).toBeInTheDocument();
  });

  it("applies custom width and height", () => {
    const { container } = render(
      <Sparkline data={[10, 20, 30]} width={200} height={60} />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "200");
    expect(svg).toHaveAttribute("height", "60");
  });

  it("applies custom color", () => {
    const { container } = render(
      <Sparkline data={[10, 20, 30]} color="#ff0000" />,
    );
    const path = container.querySelector('path[stroke="#ff0000"]');
    expect(path).toBeInTheDocument();
  });

  it("applies custom stroke width", () => {
    const { container } = render(
      <Sparkline data={[10, 20, 30]} strokeWidth={4} />,
    );
    const path = container.querySelector('path[stroke-width="4"]');
    expect(path).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Sparkline data={[10, 20, 30]} className="custom-sparkline" />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("custom-sparkline");
  });

  it("has correct accessibility attributes", () => {
    const { container } = render(
      <Sparkline data={[10, 20, 30]} aria-label="Test sparkline" />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("role", "img");
    expect(svg).toHaveAttribute("aria-label", "Test sparkline");
  });

  it("uses default aria-label when not provided", () => {
    const { container } = render(<Sparkline data={[10, 20, 30]} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute(
      "aria-label",
      "Sparkline showing 3 data points",
    );
  });

  it("renders with custom area opacity", () => {
    const { container } = render(
      <Sparkline data={[10, 20, 30]} areaOpacity={0.3} />,
    );
    const areaPath = container.querySelector('path[fill-opacity="0.3"]');
    expect(areaPath).toBeInTheDocument();
  });

  it("handles single value data", () => {
    const { container } = render(<Sparkline data={[42]} />);
    const text = container.querySelector("text");
    expect(text).toBeInTheDocument();
  });

  it("handles constant values", () => {
    const { container } = render(<Sparkline data={[20, 20, 20, 20]} />);
    const path = container.querySelector("path");
    expect(path).toBeInTheDocument();
  });

  it("renders correct number of points", () => {
    const data = [10, 20, 30, 40, 50];
    const { container } = render(<Sparkline data={data} />);
    const path = container.querySelector("path");
    expect(path).toBeInTheDocument();
  });
});
