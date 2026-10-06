import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import WelcomeScreen, {
  type WelcomeRole,
  type WelcomeScreenProps,
} from "./WelcomeScreen";
describe("WelcomeScreen", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });
  it("supports each defined WelcomeRole", () => {
    const roles: WelcomeRole[] = ["merchant", "subscriber"];
    roles.forEach((role) => {
      const { unmount } = render(<WelcomeScreen role={role} />);
      expect(
        screen.getByRole("heading", {
          name: new RegExp(`Welcome, ${role}`, "i"),
        }),
      ).toBeInTheDocument();
      unmount();
    });
  });
  it("renders the merchant variant with its primary content", () => {
    render(<WelcomeScreen role="merchant" />);
    expect(
      screen.getByRole("heading", { name: /Welcome, merchant/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Set up your business profile, connect payouts, and publish your first plan/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Start merchant setup/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Business")).toBeInTheDocument();
    expect(screen.getByText("Payout")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
  });
  it("renders the subscriber variant with its primary content", () => {
    render(<WelcomeScreen role="subscriber" />);
    expect(
      screen.getByRole("heading", { name: /Welcome, subscriber/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Browse plans, top up your prepaid vault, and track usage/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Browse plans/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Discover")).toBeInTheDocument();
    expect(screen.getByText("Top up")).toBeInTheDocument();
    expect(screen.getByText("Track")).toBeInTheDocument();
  });
  it("shows the role chooser when role is missing", () => {
    render(<WelcomeScreen />);
    expect(
      screen.getByRole("heading", { name: /Welcome to Stellabill/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/could not detect your role/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /I am a merchant/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /I am a subscriber/i }),
    ).toBeInTheDocument();
  });
  it("treats a null role as missing role metadata", () => {
    render(<WelcomeScreen role={null} />);
    expect(
      screen.getByRole("heading", { name: /Welcome to Stellabill/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /I am a merchant/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /I am a subscriber/i }),
    ).toBeInTheDocument();
  });
  it("transitions from the chooser to the merchant variant", async () => {
    const user = userEvent.setup();
    render(<WelcomeScreen />);
    await user.click(
      screen.getByRole("button", { name: /I am a merchant/i }),
    );
    expect(
      screen.getByRole("heading", { name: /Welcome, merchant/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Start merchant setup/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /I am a subscriber/i }),
    ).not.toBeInTheDocument();
  });
  it("transitions from the chooser to the subscriber variant", async () => {
    const user = userEvent.setup();
    render(<WelcomeScreen />);
    await user.click(
      screen.getByRole("button", { name: /I am a subscriber/i }),
    );
    expect(
      screen.getByRole("heading", { name: /Welcome, subscriber/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Browse plans/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /I am a merchant/i }),
    ).not.toBeInTheDocument();
  });
  it("calls onContinue with the active merchant role", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(
      <WelcomeScreen
        role="merchant"
        onContinue={onContinue}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: /Start merchant setup/i }),
    );
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onContinue).toHaveBeenCalledWith("merchant");
  });
  it("calls onContinue with the active subscriber role", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(
      <WelcomeScreen
        role="subscriber"
        onContinue={onContinue}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: /Browse plans/i }),
    );
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onContinue).toHaveBeenCalledWith("subscriber");
  });
  it("calls onSkip and transitions to the skipped state", async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    render(
      <WelcomeScreen
        role="merchant"
        onSkip={onSkip}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: /Skip intro/i }),
    );
    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("heading", {
        name: /You're all set to explore/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/You skipped the intro/i),
    ).toBeInTheDocument();
  });
  it("returns from the skipped state to the active role", async () => {
    const user = userEvent.setup();
    render(<WelcomeScreen role="merchant" />);
    await user.click(
      screen.getByRole("button", { name: /Skip intro/i }),
    );
    expect(
      screen.getByText(/You skipped the intro/i),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /Return to intro/i }),
    );
    expect(
      screen.getByRole("heading", { name: /Welcome, merchant/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Start merchant setup/i }),
    ).toBeInTheDocument();
  });
  it("calls onSkip when skipping directly from the role chooser", async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    render(
      <WelcomeScreen
        role={null}
        onSkip={onSkip}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: /Skip intro/i }),
    );
    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("heading", {
        name: /You're all set to explore/i,
      }),
    ).toBeInTheDocument();
  });
  it("updates the displayed role when the role prop changes", () => {
    const { rerender } = render(
      <WelcomeScreen role="merchant" />,
    );
    expect(
      screen.getByRole("heading", { name: /Welcome, merchant/i }),
    ).toBeInTheDocument();
    rerender(<WelcomeScreen role="subscriber" />);
    expect(
      screen.getByRole("heading", { name: /Welcome, subscriber/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Browse plans/i }),
    ).toBeInTheDocument();
  });
  it("returns to the chooser when the role prop becomes null", () => {
    const { rerender } = render(
      <WelcomeScreen role="merchant" />,
    );
    expect(
      screen.getByRole("heading", { name: /Welcome, merchant/i }),
    ).toBeInTheDocument();
    rerender(<WelcomeScreen role={null} />);
    expect(
      screen.getByRole("heading", { name: /Welcome to Stellabill/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /I am a merchant/i }),
    ).toBeInTheDocument();
  });
  it("applies the supplied className to the section", () => {
    const { container } = render(
      <WelcomeScreen
        role="subscriber"
        className="custom-welcome"
      />,
    );
    expect(
      container.querySelector(".welcome.custom-welcome"),
    ).toBeInTheDocument();
  });
  it("exercises the WelcomeScreenProps contract with supported props", () => {
    const props: WelcomeScreenProps = {
      role: "merchant",
      onContinue: vi.fn(),
      onSkip: vi.fn(),
      className: "contract-test",
    };
    render(<WelcomeScreen {...props} />);
    expect(
      screen.getByRole("heading", { name: /Welcome, merchant/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Business"),
    ).toBeInTheDocument();
  });
  it("rejects an invalid runtime role deterministically", () => {
    const invalidRole = "admin" as unknown as WelcomeRole;
    expect(() => {
      render(<WelcomeScreen role={invalidRole} />);
    }).toThrow();
  });
  it("renders the skipped state without requiring a role", async () => {
    const user = userEvent.setup();
    render(<WelcomeScreen role={null} />);
    await user.click(
      screen.getByRole("button", { name: /Skip intro/i }),
    );
    expect(
      screen.getByRole("heading", {
        name: /You're all set to explore/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /I am a merchant/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /I am a subscriber/i }),
    ).not.toBeInTheDocument();
  });
  it("marks the active section with the selected role", () => {
    const { container } = render(
      <WelcomeScreen role="subscriber" />,
    );
    expect(
      container.querySelector('[data-role="subscriber"]'),
    ).toBeInTheDocument();
  });
});

What this gives you

This expanded suite directly addresses the issue’s requested areas:

* WelcomeRole values
* WelcomeScreenProps
* WelcomeScreen
* merchant behavior
* subscriber behavior
* missing/null role
* invalid runtime role
* role-selection transitions
* onContinue
* onSkip
* skip/return transition
* changing the role prop
* className
* data-role
* deterministic failure behavior

Paste this into WelcomeScreen.test.tsx and save it. Don’t change WelcomeScreen.tsx.

After saving, don’t commit yet. Tell me when it’s saved, and I’ll give you the next single step: running the focused test with the repository’s pnpm setup.
