import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import WelcomeScreen from "./WelcomeScreen";

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

  it("renders merchant variant with distinct CTA", () => {
    render(<WelcomeScreen role="merchant" />);
    expect(
      screen.getByRole("heading", { name: /Welcome, merchant/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Start merchant setup/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Business")).toBeInTheDocument();
  });

  it("renders subscriber variant with distinct CTA", () => {
    render(<WelcomeScreen role="subscriber" />);
    expect(
      screen.getByRole("heading", { name: /Welcome, subscriber/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Browse plans/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Discover")).toBeInTheDocument();
  });

  it("handles missing role metadata with a chooser", async () => {
    const user = userEvent.setup();
    render(<WelcomeScreen role={null} />);
    expect(screen.getByText(/could not detect your role/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /I am a subscriber/i }));
    expect(
      screen.getByRole("heading", { name: /Welcome, subscriber/i }),
    ).toBeInTheDocument();
  });

  it("supports skip intro and return to intro", async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    render(<WelcomeScreen role="merchant" onSkip={onSkip} />);

    await user.click(screen.getByRole("button", { name: /Skip intro/i }));
    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/skipped the intro/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Return to intro/i }));
    expect(
      screen.getByRole("heading", { name: /Welcome, merchant/i }),
    ).toBeInTheDocument();
  });

  it("invokes onContinue with the active role", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(<WelcomeScreen role="merchant" onContinue={onContinue} />);
    await user.click(
      screen.getByRole("button", { name: /Start merchant setup/i }),
    );
    expect(onContinue).toHaveBeenCalledWith("merchant");
  });

  it("marks the section with data-role for styling hooks", () => {
    const { container } = render(<WelcomeScreen role="subscriber" />);
    expect(container.querySelector('[data-role="subscriber"]')).toBeInTheDocument();
  });
});
