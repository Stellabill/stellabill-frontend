import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import RedeemGift from "./RedeemGift";

// Mock the navigation hook
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams()],
  };
});

// Mock the components
vi.mock("../components/LandingNavbar", () => ({
  default: () => <div>Landing Navbar</div>,
}));

vi.mock("../components/RedeemConfirmModal", () => ({
  default: ({ isOpen, giftDetails }: any) => 
    isOpen ? <div>Redeem Confirm Modal: {giftDetails?.planName}</div> : null,
}));

describe("RedeemGift", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <RedeemGift />
      </BrowserRouter>
    );
  };

  describe("Rendering", () => {
    it("renders the page title and subtitle", () => {
      renderComponent();

      expect(screen.getByText("Redeem Your Gift")).toBeInTheDocument();
      expect(screen.getByText(/enter the code from your gift/i)).toBeInTheDocument();
    });

    it("renders the code input field", () => {
      renderComponent();

      const input = screen.getByLabelText(/gift code/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("placeholder", "GIFT-");
    });

    it("renders the redeem button", () => {
      renderComponent();

      const button = screen.getByRole("button", { name: /redeem gift/i });
      expect(button).toBeInTheDocument();
    });

    it("renders the how it works section", () => {
      renderComponent();

      expect(screen.getByText("How it works")).toBeInTheDocument();
      expect(screen.getByText(/enter your gift code/i)).toBeInTheDocument();
      expect(screen.getByText(/review the details/i)).toBeInTheDocument();
      expect(screen.getByText(/activate your gift/i)).toBeInTheDocument();
    });

    it("renders the browse plans link", () => {
      renderComponent();

      const link = screen.getByRole("button", { name: /browse plans/i });
      expect(link).toBeInTheDocument();
    });
  });

  describe("Code Input", () => {
    it("accepts code input", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByLabelText(/gift code/i);
      await user.type(input, "GIFT-ABC123-XYZ789");

      expect(input).toHaveValue("GIFT-ABC123-XYZ789");
    });

    it("formats code input automatically", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByLabelText(/gift code/i);
      await user.type(input, "ABC123XYZ789");

      expect(input).toHaveValue("GIFT-ABC123XYZ789");
    });

    it("shows example format hint", () => {
      renderComponent();

      expect(screen.getByText(/example: gift-abc123-xyz789/i)).toBeInTheDocument();
    });
  });

  describe("Code Validation", () => {
    it("validates code format before submission", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByLabelText(/gift code/i);
      await user.type(input, "INVALID");

      const button = screen.getByRole("button", { name: /redeem gift/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid gift code/i)).toBeInTheDocument();
      });
    });

    it("disables submit button when code is empty", () => {
      renderComponent();

      const button = screen.getByRole("button", { name: /redeem gift/i });
      expect(button).toBeDisabled();
    });

    it("enables submit button when code is entered", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByLabelText(/gift code/i);
      await user.type(input, "GIFT-ABC123-XYZ789");

      const button = screen.getByRole("button", { name: /redeem gift/i });
      expect(button).not.toBeDisabled();
    });

    it("shows loading state during validation", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByLabelText(/gift code/i);
      await user.type(input, "GIFT-ABC123-XYZ789");

      const button = screen.getByRole("button", { name: /redeem gift/i });
      await user.click(button);

      expect(screen.getByText(/validating/i)).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  describe("Error Handling", () => {
    it("shows error for invalid code", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByLabelText(/gift code/i);
      await user.type(input, "GIFT-INVALI-DCODE1");

      const button = screen.getByRole("button", { name: /redeem gift/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/not recognized/i)).toBeInTheDocument();
      });
    });

    it("shows error for expired code", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByLabelText(/gift code/i);
      await user.type(input, "GIFT-EXPIRE-DCODE1");

      const button = screen.getByRole("button", { name: /redeem gift/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/expired/i)).toBeInTheDocument();
      });
    });

    it("shows error for already redeemed code", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByLabelText(/gift code/i);
      await user.type(input, "GIFT-ALREAD-YUSED1");

      const button = screen.getByRole("button", { name: /redeem gift/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/already been redeemed/i)).toBeInTheDocument();
      });
    });

    it("clears error when user types in input", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByLabelText(/gift code/i);
      await user.type(input, "INVALID");

      const button = screen.getByRole("button", { name: /redeem gift/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid gift code/i)).toBeInTheDocument();
      });

      await user.clear(input);
      await user.type(input, "GIFT-");

      expect(screen.queryByText(/please enter a valid gift code/i)).not.toBeInTheDocument();
    });
  });

  describe("Successful Validation", () => {
    it("opens confirmation modal on valid code", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByLabelText(/gift code/i);
      await user.type(input, "GIFT-VALID1-CODE12");

      const button = screen.getByRole("button", { name: /redeem gift/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/redeem confirm modal/i)).toBeInTheDocument();
      });
    });
  });

  describe("Navigation", () => {
    it("navigates to browse plans when link is clicked", async () => {
      const user = userEvent.setup();
      renderComponent();

      const link = screen.getByRole("button", { name: /browse plans/i });
      await user.click(link);

      expect(mockNavigate).toHaveBeenCalledWith("/browse-plans");
    });
  });

  describe("Accessibility", () => {
    it("has proper heading structure", () => {
      renderComponent();

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Redeem Your Gift");
    });

    it("associates error messages with input", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByLabelText(/gift code/i);
      await user.type(input, "INVALID");

      const button = screen.getByRole("button", { name: /redeem gift/i });
      await user.click(button);

      await waitFor(() => {
        expect(input).toHaveAttribute("aria-invalid", "true");
        expect(input).toHaveAttribute("aria-describedby", "code-error");
      });
    });

    it("has accessible form labels", () => {
      renderComponent();

      const input = screen.getByLabelText(/gift code/i);
      expect(input).toHaveAccessibleName();
    });

    it("supports keyboard navigation", async () => {
      const user = userEvent.setup();
      renderComponent();

      // Tab to input
      await user.tab();
      const input = screen.getByLabelText(/gift code/i);
      expect(input).toHaveFocus();

      // Type code
      await user.keyboard("GIFT-ABC123-XYZ789");

      // Tab to button
      await user.tab();
      const button = screen.getByRole("button", { name: /redeem gift/i });
      expect(button).toHaveFocus();

      // Submit with Enter
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(screen.getByText(/validating/i)).toBeInTheDocument();
      });
    });
  });

  describe("Auto-fill from URL", () => {
    it("prefills code from URL parameter", () => {
      const mockSearchParams = new URLSearchParams("?code=GIFT-URL123-PARAM1");
      
      vi.mocked(require("react-router-dom").useSearchParams).mockReturnValue([
        mockSearchParams,
        vi.fn(),
      ]);

      renderComponent();

      const input = screen.getByLabelText(/gift code/i);
      expect(input).toHaveValue("GIFT-URL123-PARAM1");
    });
  });
});
