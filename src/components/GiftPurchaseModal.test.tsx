import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GiftPurchaseModal from "./GiftPurchaseModal";

describe("GiftPurchaseModal", () => {
  const mockOnClose = vi.fn();
  const mockOnPurchaseComplete = vi.fn();

  const mockPlan = {
    id: "1",
    merchant: "Stellar News",
    name: "Premium Access",
    price: 10,
    currency: "USDC",
    interval: "Monthly" as const,
    description: "Get unlimited access to premium content",
  };

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnPurchaseComplete.mockClear();
  });

  describe("Rendering", () => {
    it("does not render when isOpen is false", () => {
      render(
        <GiftPurchaseModal
          isOpen={false}
          onClose={mockOnClose}
          plan={mockPlan}
          onPurchaseComplete={mockOnPurchaseComplete}
        />
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders when isOpen is true", () => {
      render(
        <GiftPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          plan={mockPlan}
          onPurchaseComplete={mockOnPurchaseComplete}
        />
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText(/send premium access as a gift/i)).toBeInTheDocument();
    });

    it("renders step indicator", () => {
      render(
        <GiftPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          plan={mockPlan}
          onPurchaseComplete={mockOnPurchaseComplete}
        />
      );

      expect(screen.getByText("Gift Details")).toBeInTheDocument();
      expect(screen.getByText("Review")).toBeInTheDocument();
      expect(screen.getByText("Complete")).toBeInTheDocument();
    });
  });

  describe("Step 1: Details Form", () => {
    it("renders all form fields", () => {
      render(
        <GiftPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          plan={mockPlan}
          onPurchaseComplete={mockOnPurchaseComplete}
        />
      );

      expect(screen.getByLabelText(/recipient name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/recipient email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/gift duration/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/personal message/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/delivery method/i)).toBeInTheDocument();
    });

    it("validates email field", async () => {
      const user = userEvent.setup();
      render(
        <GiftPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          plan={mockPlan}
          onPurchaseComplete={mockOnPurchaseComplete}
        />
      );

      const reviewBtn = screen.getByRole("button", { name: /review gift/i });
      await user.click(reviewBtn);

      await waitFor(() => {
        expect(screen.getByText(/please enter a recipient email/i)).toBeInTheDocument();
      });
    });

    it("validates email format", async () => {
      const user = userEvent.setup();
      render(
        <GiftPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          plan={mockPlan}
          onPurchaseComplete={mockOnPurchaseComplete}
        />
      );

      const emailInput = screen.getByLabelText(/recipient email/i);
      await user.type(emailInput, "invalid-email");

      const reviewBtn = screen.getByRole("button", { name: /review gift/i });
      await user.click(reviewBtn);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
      });
    });

    it("enforces message character limit", async () => {
      const user = userEvent.setup();
      render(
        <GiftPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          plan={mockPlan}
          onPurchaseComplete={mockOnPurchaseComplete}
        />
      );

      const messageInput = screen.getByLabelText(/personal message/i);
      expect(messageInput).toHaveAttribute("maxLength", "300");

      const longMessage = "a".repeat(301);
      await user.type(messageInput, longMessage);

      // Should only accept 300 characters
      expect(messageInput).toHaveValue("a".repeat(300));
    });

    it("updates character count", async () => {
      const user = userEvent.setup();
      render(
        <GiftPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          plan={mockPlan}
          onPurchaseComplete={mockOnPurchaseComplete}
        />
      );

      const messageInput = screen.getByLabelText(/personal message/i);
      await user.type(messageInput, "Hello");

      expect(screen.getByText("5 / 300")).toBeInTheDocument();
    });

    it("allows optional fields to be empty", async () => {
      const user = userEvent.setup();
      render(
        <GiftPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          plan={mockPlan}
          onPurchaseComplete={mockOnPurchaseComplete}
        />
      );

      const emailInput = screen.getByLabelText(/recipient email/i);
      await user.type(emailInput, "recipient@example.com");

      const reviewBtn = screen.getByRole("button", { name: /review gift/i });
      await user.click(reviewBtn);

      await waitFor(() => {
        expect(screen.getByText(/gift summary/i)).toBeInTheDocument();
      });
    });
  });

  describe("Step 2: Review", () => {
    it("displays gift summary", async () => {
      const user = userEvent.setup();
      render(
        <GiftPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          plan={mockPlan}
          onPurchaseComplete={mockOnPurchaseComplete}
        />
      );

      const emailInput = screen.getByLabelText(/recipient email/i);
      await user.type(emailInput, "recipient@example.com");

      const reviewBtn = screen.getByRole("button", { name: /review gift/i });
      await user.click(reviewBtn);

      await waitFor(() => {
        expect(screen.getByText("Gift Summary")).toBeInTheDocument();
        expect(screen.getByText("Premium Access")).toBeInTheDocument();
        expect(screen.getByText("recipient@example.com")).toBeInTheDocument();
        expect(screen.getByText("12 months")).toBeInTheDocument();
        expect(screen.getByText("120 USDC")).toBeInTheDocument();
      });
    });

    it("shows personal message in review", async () => {
      const user = userEvent.setup();
      render(
        <GiftPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          plan={mockPlan}
          onPurchaseComplete={mockOnPurchaseComplete}
        />
      );

      const emailInput = screen.getByLabelText(/recipient email/i);
      await user.type(emailInput, "recipient@example.com");

      const messageInput = screen.getByLabelText(/personal message/i);
      await user.type(messageInput, "Happy holidays!");

      const reviewBtn = screen.getByRole("button", { name: /review gift/i });
      await user.click(reviewBtn);

      await waitFor(() => {
        expect(screen.getByText(/happy holidays!/i)).toBeInTheDocument();
      });
    });

    it("allows going back to edit", async () => {
      const user = userEvent.setup();
      render(
        <GiftPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          plan={mockPlan}
          onPurchaseComplete={mockOnPurchaseComplete}
        />
      );

      const emailInput = screen.getByLabelText(/recipient email/i);
      await user.type(emailInput, "recipient@example.com");

      const reviewBtn = screen.getByRole("button", { name: /review gift/i });
      await user.click(reviewBtn);

      await waitFor(() => {
        expect(screen.getByText("Gift Summary")).toBeInTheDocument();
      });

      const backBtn = screen.getByRole("button", { name: /back/i });
      await user.click(backBtn);

      await waitFor(() => {
        expect(screen.getByLabelText(/recipient email/i)).toBeInTheDocument();
      });
    });
  });

  describe("Step 3: Complete", () => {
    it("shows gift code after purchase", async () => {
      const user = userEvent.setup();
      render(
        <GiftPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          plan={mockPlan}
          onPurchaseComplete={mockOnPurchaseComplete}
        />
      );

      const emailInput = screen.getByLabelText(/recipient email/i);
      await user.type(emailInput, "recipient@example.com");

      const reviewBtn = screen.getByRole("button", { name: /review gift/i });
      await user.click(reviewBtn);

      await waitFor(() => {
        expect(screen.getByText("Gift Summary")).toBeInTheDocument();
      });

      const confirmBtn = screen.getByRole("button", { name: /confirm purchase/i });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/gift sent successfully/i)).toBeInTheDocument();
        expect(screen.getByText(/GIFT-/)).toBeInTheDocument();
      });
    });

    it("calls onPurchaseComplete callback", async () => {
      const user = userEvent.setup();
      render(
        <GiftPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          plan={mockPlan}
          onPurchaseComplete={mockOnPurchaseComplete}
        />
      );

      const emailInput = screen.getByLabelText(/recipient email/i);
      await user.type(emailInput, "recipient@example.com");

      const reviewBtn = screen.getByRole("button", { name: /review gift/i });
      await user.click(reviewBtn);

      const confirmBtn = screen.getByRole("button", { name: /confirm purchase/i });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(mockOnPurchaseComplete).toHaveBeenCalledWith(expect.stringContaining("GIFT-"));
      });
    });

    it("allows copying gift code", async () => {
      const user = userEvent.setup();
      
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });

      render(
        <GiftPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          plan={mockPlan}
          onPurchaseComplete={mockOnPurchaseComplete}
        />
      );

      const emailInput = screen.getByLabelText(/recipient email/i);
      await user.type(emailInput, "recipient@example.com");

      const reviewBtn = screen.getByRole("button", { name: /review gift/i });
      await user.click(reviewBtn);

      const confirmBtn = screen.getByRole("button", { name: /confirm purchase/i });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/GIFT-/)).toBeInTheDocument();
      });

      const copyBtn = screen.getByRole("button", { name: /copy/i });
      await user.click(copyBtn);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
        expect(screen.getByText("Copied!")).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA attributes", () => {
      render(
        <GiftPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          plan={mockPlan}
          onPurchaseComplete={mockOnPurchaseComplete}
        />
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-labelledby");
    });

    it("closes on Escape key", async () => {
      const user = userEvent.setup();
      render(
        <GiftPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          plan={mockPlan}
          onPurchaseComplete={mockOnPurchaseComplete}
        />
      );

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it("marks required fields appropriately", () => {
      render(
        <GiftPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          plan={mockPlan}
          onPurchaseComplete={mockOnPurchaseComplete}
        />
      );

      const emailInput = screen.getByLabelText(/recipient email/i);
      expect(emailInput).toBeRequired();
    });

    it("associates errors with form fields", async () => {
      const user = userEvent.setup();
      render(
        <GiftPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          plan={mockPlan}
          onPurchaseComplete={mockOnPurchaseComplete}
        />
      );

      const reviewBtn = screen.getByRole("button", { name: /review gift/i });
      await user.click(reviewBtn);

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/recipient email/i);
        expect(emailInput).toHaveAttribute("aria-invalid", "true");
        expect(emailInput).toHaveAttribute("aria-describedby");
      });
    });
  });

  describe("Loading States", () => {
    it("disables buttons during processing", async () => {
      const user = userEvent.setup();
      render(
        <GiftPurchaseModal
          isOpen={true}
          onClose={mockOnClose}
          plan={mockPlan}
          onPurchaseComplete={mockOnPurchaseComplete}
        />
      );

      const emailInput = screen.getByLabelText(/recipient email/i);
      await user.type(emailInput, "recipient@example.com");

      const reviewBtn = screen.getByRole("button", { name: /review gift/i });
      await user.click(reviewBtn);

      const confirmBtn = screen.getByRole("button", { name: /confirm purchase/i });
      await user.click(confirmBtn);

      // Should show loading state
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
      expect(confirmBtn).toBeDisabled();
    });
  });
});
