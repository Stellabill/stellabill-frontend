import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import AboutPrepaidBalances from "./AboutPrepaidBalances";

describe("AboutPrepaidBalances", () => {
  it("renders the explainer summary and timeline steps", () => {
    render(<AboutPrepaidBalances />);
    expect(screen.getByText("About prepaid balances")).toBeInTheDocument();
    expect(screen.getByText("How prepaid balances work")).toBeInTheDocument();
    expect(screen.getByText("Top up your vault")).toBeInTheDocument();
    expect(screen.getByText("Balance draw-down")).toBeInTheDocument();
    expect(screen.getByText("Low-balance alerts")).toBeInTheDocument();
  });

  it("renders a grouped FAQ accordion with aria-expanded", async () => {
    const user = userEvent.setup();
    render(<AboutPrepaidBalances />);

    const trigger = screen.getByRole("button", {
      name: /What is a prepaid vault\?/i,
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(/smart-contract balance that holds USDC/i),
    ).toBeInTheDocument();
  });

  it("filters FAQ results via search", async () => {
    const user = userEvent.setup();
    render(<AboutPrepaidBalances />);

    await user.type(screen.getByPlaceholderText(/Search questions/i), "security");
    expect(
      screen.getByText(/Who controls the vault funds\?/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/What is a prepaid vault\?/i),
    ).not.toBeInTheDocument();
  });

  it("shows empty search state for unmatched queries", async () => {
    const user = userEvent.setup();
    render(<AboutPrepaidBalances />);
    await user.type(
      screen.getByPlaceholderText(/Search questions/i),
      "zzzz-no-match",
    );
    expect(screen.getByRole("status")).toHaveTextContent(/No questions match/i);
  });

  it("anchors a Top up now CTA at the bottom", () => {
    render(<AboutPrepaidBalances />);
    const cta = screen.getByRole("link", { name: /Top up now/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute("href", "/subscriptions");
  });

  it("supports an onTopUp button callback", async () => {
    const user = userEvent.setup();
    const onTopUp = vi.fn();
    render(<AboutPrepaidBalances onTopUp={onTopUp} />);
    await user.click(screen.getByRole("button", { name: /Top up now/i }));
    expect(onTopUp).toHaveBeenCalledTimes(1);
  });

  it("toggles FAQ closed on second click", async () => {
    const user = userEvent.setup();
    render(<AboutPrepaidBalances />);
    const trigger = screen.getByRole("button", {
      name: /How do I top up\?/i,
    });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
