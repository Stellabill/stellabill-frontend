import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import OnboardingBusiness from "./OnboardingBusiness";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderOnboardingBusiness() {
  return render(
    <MemoryRouter initialEntries={["/onboarding/business"]}>
      <OnboardingBusiness />
    </MemoryRouter>,
  );
}

describe("OnboardingBusiness page", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    sessionStorage.clear();
  });

  it("renders the shell at step 1 with the business title", () => {
    renderOnboardingBusiness();

    expect(
      screen.getByRole("heading", { name: "Tell us about your business" }),
    ).toBeInTheDocument();

    const stepItems = screen.getAllByRole("listitem");
    expect(stepItems).toHaveLength(3);
    expect(within(stepItems[0]).getByText("Business")).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(within(stepItems[0]).getByText("1")).toBeInTheDocument();
  });

  it("stores business details without the logo and navigates to payout", async () => {
    const user = userEvent.setup();
    renderOnboardingBusiness();

    await user.type(screen.getByLabelText(/business name/i), "  Acme Inc.  ");
    await user.type(
      screen.getByLabelText(/website/i),
      "  https://acme.example  ",
    );

    const logo = new File(["logo"], "brand-logo.png", { type: "image/png" });
    await user.upload(screen.getByLabelText(/upload logo/i), logo);

    const country = screen.getByRole("combobox", { name: /country/i });
    await user.click(country);
    await user.type(country, "Germany");
    await user.click(await screen.findByRole("option", { name: /Germany/i }));

    await user.click(screen.getByRole("button", { name: /next/i }));

    const stored = JSON.parse(
      sessionStorage.getItem("onboardingBusiness") ?? "{}",
    );
    expect(stored).toEqual({
      businessName: "Acme Inc.",
      website: "https://acme.example",
      country: "DE",
    });
    expect(stored).not.toHaveProperty("logo");
    expect(mockNavigate).toHaveBeenCalledWith("/onboarding/payout");
  });
});
