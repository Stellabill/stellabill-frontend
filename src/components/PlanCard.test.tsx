import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Newspaper } from "lucide-react";
import PlanCard from "./PlanCard";

describe("PlanCard", () => {
  const mockOnSubscribe = vi.fn();
  const mockOnSendGift = vi.fn();

  const defaultProps = {
    merchant: "Stellar News",
    merchantIcon: Newspaper,
    planName: "Premium Access",
    price: "10",
    interval: "month",
    description: "Get unlimited access to premium articles and exclusive content",
    onSubscribe: mockOnSubscribe,
    onSendGift: mockOnSendGift,
  };

  beforeEach(() => {
    mockOnSubscribe.mockClear();
    mockOnSendGift.mockClear();
  });

  it("renders plan information correctly", () => {
    render(<PlanCard {...defaultProps} />);

    expect(screen.getByText("Stellar News")).toBeInTheDocument();
    expect(screen.getByText("Premium Access")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("USDC")).toBeInTheDocument();
    expect(screen.getByText(/month/)).toBeInTheDocument();
    expect(screen.getByText(/unlimited access/)).toBeInTheDocument();
  });

  it("renders subscribe button", () => {
    render(<PlanCard {...defaultProps} />);

    const subscribeBtn = screen.getByRole("button", { name: /subscribe/i });
    expect(subscribeBtn).toBeInTheDocument();
  });

  it("renders gift button when showGiftOption is true", () => {
    render(<PlanCard {...defaultProps} showGiftOption={true} />);

    const giftBtn = screen.getByRole("button", { name: /send.*gift/i });
    expect(giftBtn).toBeInTheDocument();
  });

  it("does not render gift button when showGiftOption is false", () => {
    render(<PlanCard {...defaultProps} showGiftOption={false} />);

    const giftBtn = screen.queryByRole("button", { name: /send.*gift/i });
    expect(giftBtn).not.toBeInTheDocument();
  });

  it("calls onSubscribe when subscribe button is clicked", async () => {
    const user = userEvent.setup();
    render(<PlanCard {...defaultProps} />);

    const subscribeBtn = screen.getByRole("button", { name: /subscribe/i });
    await user.click(subscribeBtn);

    expect(mockOnSubscribe).toHaveBeenCalledTimes(1);
  });

  it("calls onSendGift when gift button is clicked", async () => {
    const user = userEvent.setup();
    render(<PlanCard {...defaultProps} />);

    const giftBtn = screen.getByRole("button", { name: /send.*gift/i });
    await user.click(giftBtn);

    expect(mockOnSendGift).toHaveBeenCalledTimes(1);
  });

  it("displays usage tag when provided", () => {
    render(<PlanCard {...defaultProps} usageTag="Most Popular" />);

    expect(screen.getByText("Most Popular")).toBeInTheDocument();
  });

  it("has accessible labels for buttons", () => {
    render(<PlanCard {...defaultProps} />);

    const subscribeBtn = screen.getByRole("button", { name: /subscribe to premium access/i });
    const giftBtn = screen.getByRole("button", { name: /send premium access as a gift/i });

    expect(subscribeBtn).toHaveAccessibleName();
    expect(giftBtn).toHaveAccessibleName();
  });

  it("supports keyboard navigation", async () => {
    const user = userEvent.setup();
    render(<PlanCard {...defaultProps} />);

    const subscribeBtn = screen.getByRole("button", { name: /subscribe/i });
    const giftBtn = screen.getByRole("button", { name: /send.*gift/i });

    // Tab to first button
    await user.tab();
    expect(subscribeBtn).toHaveFocus();

    // Tab to second button
    await user.tab();
    expect(giftBtn).toHaveFocus();

    // Activate with Enter
    await user.keyboard("{Enter}");
    expect(mockOnSendGift).toHaveBeenCalledTimes(1);
  });
});
