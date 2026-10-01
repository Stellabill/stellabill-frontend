import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import AboutPrepaidBalances, {
  PrepaidTimelineEvent,
} from "../AboutPrepaidBalances";

describe("AboutPrepaidBalances", () => {
  it("renders the component with default data", () => {
    render(<AboutPrepaidBalances />);
    expect(
      screen.getByRole("heading", { name: "About prepaid balances", level: 2 })
    ).toBeInTheDocument();

    // Check default timeline rendering
    expect(screen.getByText("Top up your vault")).toBeInTheDocument();

    // Check default FAQs
    expect(screen.getByText("What is a prepaid vault?")).toBeInTheDocument();
  });

  describe("PrepaidTimelineStep and PrepaidTimelineEvent coverage", () => {
    it("renders custom timeline events covering all step types", () => {
      const customTimeline: PrepaidTimelineEvent[] = [
        {
          id: "1",
          step: "top-up",
          title: "Custom Top-up",
          description: "Desc 1",
          timestamp: "Time 1",
        },
        {
          id: "2",
          step: "draw-down",
          title: "Custom Draw-down",
          description: "Desc 2",
          timestamp: "Time 2",
        },
        {
          id: "3",
          step: "low-balance",
          title: "Custom Alert",
          description: "Desc 3",
          timestamp: "Time 3",
        },
      ];
      render(<AboutPrepaidBalances timeline={customTimeline} />);

      expect(screen.getByText("Custom Top-up")).toBeInTheDocument();
      expect(screen.getByText("Custom Draw-down")).toBeInTheDocument();
      expect(screen.getByText("Custom Alert")).toBeInTheDocument();

      // Verify specific step labels rendered from STEP_META
      expect(screen.getByText("Top-up")).toBeInTheDocument();
      expect(screen.getByText("Draw-down")).toBeInTheDocument();
      expect(screen.getByText("Alert")).toBeInTheDocument();
    });

    it("handles an empty timeline array without crashing", () => {
      const { container } = render(<AboutPrepaidBalances timeline={[]} />);
      const timelineList = container.querySelector(".prepaid-timeline__list");
      expect(timelineList?.children).toHaveLength(0);
    });
  });

  describe("FaqItem coverage and state transitions", () => {
    it("toggles FAQ accordion panels", async () => {
      const user = userEvent.setup();
      render(<AboutPrepaidBalances />);

      // Initially, the first question's answer is hidden
      const trigger = screen.getByRole("button", {
        name: /What is a prepaid vault\?/i,
      });
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      // Find panel by using the text inside it, but we have to use the hidden option.
      const panel = screen.getByText(/A prepaid vault is a smart-contract balance/i).closest('.prepaid-faq__panel') as HTMLElement;
      expect(panel).not.toBeVisible();

      // Click to expand
      await user.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(panel).toBeVisible();

      // Click to collapse
      await user.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(panel).not.toBeVisible();
    });

    it("filters FAQs based on search input", async () => {
      const user = userEvent.setup();
      render(<AboutPrepaidBalances />);

      const searchInput = screen.getByRole("searchbox", {
        name: /Search FAQ/i,
      });

      // Both questions initially visible
      expect(screen.getByText("What is a prepaid vault?")).toBeInTheDocument();
      expect(screen.getByText("How do I top up?")).toBeInTheDocument();

      // Type something matching only one
      await user.type(searchInput, "How do I");

      expect(screen.getByText("How do I top up?")).toBeInTheDocument();
      expect(
        screen.queryByText("What is a prepaid vault?")
      ).not.toBeInTheDocument();
    });

    it("displays an empty state when search matches no FAQs", async () => {
      const user = userEvent.setup();
      render(<AboutPrepaidBalances />);

      const searchInput = screen.getByRole("searchbox", {
        name: /Search FAQ/i,
      });
      await user.type(searchInput, "xyz123");

      expect(screen.getByRole("status")).toHaveTextContent(
        "No questions match “xyz123”."
      );
    });

    it("handles an empty FAQs array gracefully", () => {
      render(<AboutPrepaidBalances faqs={[]} />);
      expect(screen.getByRole("status")).toHaveTextContent(
        "No questions match “”."
      );
    });
  });

  describe("CTA rendering and interaction", () => {
    it("renders a link when onTopUp is not provided", () => {
      render(<AboutPrepaidBalances topUpHref="/custom-link" />);
      const link = screen.getByRole("link", { name: /top up now/i });
      expect(link).toHaveAttribute("href", "/custom-link");
    });

    it("calls onTopUp when button is clicked", async () => {
      const user = userEvent.setup();
      const onTopUpMock = vi.fn();
      render(<AboutPrepaidBalances onTopUp={onTopUpMock} />);

      const button = screen.getByRole("button", { name: /top up now/i });
      await user.click(button);

      expect(onTopUpMock).toHaveBeenCalledTimes(1);
    });
  });
});
