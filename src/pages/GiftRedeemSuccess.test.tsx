import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import GiftRedeemSuccess from "./GiftRedeemSuccess";

vi.mock("../components/LandingNavbar", () => ({
  default: () => <nav aria-label="Landing Navbar">Landing Navbar</nav>,
}));

interface GiftRedeemState {
  planName?: string;
  planTier?: string;
  durationMonths?: number;
  expiresOn?: string;
  gifterName?: string;
}

function renderGiftRedeemSuccess(state?: GiftRedeemState) {
  return render(
    <MemoryRouter
      initialEntries={[{ pathname: "/gift/success", state }]}
    >
      <Routes>
        <Route path="/gift/success" element={<GiftRedeemSuccess />} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        <Route path="/plans/new" element={<div>New Plan Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("GiftRedeemSuccess page", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders plan name, tier, duration, expiry, and gifter with full router state", () => {
    renderGiftRedeemSuccess({
      planName: "Stellabill Enterprise",
      planTier: "Enterprise",
      durationMonths: 6,
      expiresOn: "December 31, 2026",
      gifterName: "Ada Lovelace",
    });

    expect(screen.getByText("Stellabill Enterprise")).toBeInTheDocument();
    expect(screen.getByText("Enterprise")).toBeInTheDocument();
    expect(screen.getByText("6 months")).toBeInTheDocument();
    expect(screen.getByText("December 31, 2026")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Ada Lovelace has gifted you a subscription. Welcome to Stellabill.",
      ),
    ).toBeInTheDocument();
  });

  it("renders default plan, tier, duration, and expiry ~12 months ahead when no state is provided", () => {
    const fixedNow = new Date("2026-01-15T12:00:00.000Z").getTime();
    vi.spyOn(Date, "now").mockReturnValue(fixedNow);

    const expectedDate = new Date(
      fixedNow + 12 * 30 * 24 * 60 * 60 * 1000,
    ).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    renderGiftRedeemSuccess();

    expect(screen.getByText("Stellabill Pro")).toBeInTheDocument();
    expect(screen.getByText("Professional")).toBeInTheDocument();
    expect(screen.getByText("12 months")).toBeInTheDocument();
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });

  it("uses singular 'month' when durationMonths is 1", () => {
    renderGiftRedeemSuccess({ durationMonths: 1 });

    expect(screen.getByText("1 month")).toBeInTheDocument();
  });

  it("renders the raw string for an unparsable expiresOn date in router state", () => {
    renderGiftRedeemSuccess({
      expiresOn: "not-a-valid-date",
    });

    expect(screen.getByText("not-a-valid-date")).toBeInTheDocument();
  });

  it("falls back to the raw ISO string when formatDate encounters a formatting error", () => {
    const fixedNow = new Date("2026-01-15T12:00:00.000Z").getTime();
    vi.spyOn(Date, "now").mockReturnValue(fixedNow);
    vi.spyOn(Date.prototype, "toLocaleDateString").mockImplementation(() => {
      throw new RangeError("Invalid time value");
    });

    const expectedIso = new Date(
      fixedNow + 12 * 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    renderGiftRedeemSuccess();

    expect(screen.getByText(expectedIso)).toBeInTheDocument();
  });

  it("renders the gifter message only when gifterName is provided", () => {
    const { unmount } = renderGiftRedeemSuccess();

    expect(
      screen.getByText(
        "Your gift subscription has been activated. Welcome to Stellabill.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/has gifted you a subscription/i),
    ).not.toBeInTheDocument();

    unmount();

    renderGiftRedeemSuccess({ gifterName: "Grace Hopper" });

    expect(
      screen.getByText(
        "Grace Hopper has gifted you a subscription. Welcome to Stellabill.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Your gift subscription has been activated. Welcome to Stellabill.",
      ),
    ).not.toBeInTheDocument();
  });

  it("labels the main landmark by gift-success-title", () => {
    renderGiftRedeemSuccess();

    const main = screen.getByRole("main", { name: /gift redeemed!/i });
    expect(main).toHaveAttribute("aria-labelledby", "gift-success-title");
    expect(
      screen.getByRole("heading", { level: 1, name: /gift redeemed!/i }),
    ).toHaveAttribute("id", "gift-success-title");
  });

  it("navigates to the dashboard when clicking 'Go to dashboard'", async () => {
    const user = userEvent.setup();
    renderGiftRedeemSuccess();

    await user.click(screen.getByRole("link", { name: /go to dashboard/i }));

    expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
  });
});
