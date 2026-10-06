// Tests for PrepaidBalance component and DollarIcon
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PrepaidBalanceCard, { DollarIcon } from "../components/PrepaidBalance";

describe("DollarIcon", () => {
  it("renders an SVG with default size and color", () => {
    render(<DollarIcon />);
    const svg = screen.getByRole("img", { hidden: true }) as SVGSVGElement;
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "20");
    expect(svg).toHaveAttribute("height", "20");
    // color is applied to path stroke attribute – verify one of the paths
    const paths = svg.querySelectorAll("path");
    expect(paths.length).toBeGreaterThan(0);
    paths.forEach((p) => {
      expect(p).toHaveAttribute("stroke", "#00D3F2");
    });
  });

  it("applies custom size and color props", () => {
    render(<DollarIcon size={30} color="black" />);
    const svg = screen.getByRole("img", { hidden: true }) as SVGSVGElement;
    expect(svg).toHaveAttribute("width", "30");
    expect(svg).toHaveAttribute("height", "30");
    const paths = svg.querySelectorAll("path");
    paths.forEach((p) => {
      expect(p).toHaveAttribute("stroke", "black");
    });
  });
});

describe("PrepaidBalanceCard", () => {
  const onTopUp = vi.fn();

  const renderCard = (props: Partial<React.ComponentProps<typeof PrepaidBalanceCard>> = {}) => {
    const defaults = {
      balance: 30,
      maxBalance: 30,
      paymentAmount: 10,
      onTopUp,
    } as const;
    // @ts-ignore – we intentionally allow partial overrides for testing edge cases
    return render(<PrepaidBalanceCard {...defaults} {...props} />);
  };

  it("displays the formatted balance", () => {
    renderCard({ balance: 1234.5 });
    const amount = screen.getByTestId("prepaid-balance-amount");
    expect(amount).toBeInTheDocument();
    // The Amount component renders the numeric value – we assert the text contains the number
    expect(amount.textContent).toContain("1,235"); // rounded to 0 precision by default
  });

  it("shows correct payment count", () => {
    renderCard({ balance: 45, paymentAmount: 10 });
    const coverage = screen.getByText(/payments/i);
    expect(coverage).toBeInTheDocument();
    expect(coverage).toHaveTextContent("4"); // Math.floor(45/10) = 4
  });

  it("handles zero paymentAmount gracefully", () => {
    renderCard({ paymentAmount: 0 });
    const coverage = screen.getByText(/payments/i);
    expect(coverage).toHaveTextContent("0");
  });

  it("caps progress fill at 100% when balance exceeds maxBalance", () => {
    renderCard({ balance: 150, maxBalance: 100 });
    const fill = screen.getByRole("progressbar").parentElement?.querySelector(".prepaid-card__progress-fill") as HTMLDivElement;
    expect(fill).toBeInTheDocument();
    expect(fill.style.width).toBe("100%");
  });

  it("provides an accessible aria-label for the progress bar", () => {
    renderCard({ balance: 25, maxBalance: 50 });
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "25");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "50");
    expect(bar).toHaveAttribute("aria-label", expect.stringContaining("Balance: 25"));
  });

  it("calls onTopUp when the button is clicked", async () => {
    renderCard();
    const button = screen.getByRole("button", { name: /top up balance/i });
    await userEvent.click(button);
    expect(onTopUp).toHaveBeenCalledTimes(1);
  });

  it("renders deterministic output for invalid (NaN) balance", () => {
    // @ts-ignore – force an invalid numeric input
    renderCard({ balance: NaN as any });
    const amount = screen.getByTestId("prepaid-balance-amount");
    // Amount component will display an empty string for NaN after formatAmount returns missing
    expect(amount.textContent).toBe("");
  });
});
