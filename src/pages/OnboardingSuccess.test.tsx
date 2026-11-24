import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import OnboardingSuccess from "./OnboardingSuccess";

// The navbar owns wallet state; this suite only exercises the success page.
vi.mock("../components/LandingNavbar", () => ({
  default: () => <nav aria-label="Landing navigation" />,
}));

function renderOnboardingSuccess() {
  return render(
    <MemoryRouter initialEntries={["/onboarding-success"]}>
      <Routes>
        <Route path="/onboarding-success" element={<OnboardingSuccess />} />
        <Route path="/plans/new" element={<h1>Create plan page</h1>} />
        <Route path="/dashboard" element={<h1>Dashboard page</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("OnboardingSuccess page", () => {
  it("labels the main landmark with the success heading", () => {
    renderOnboardingSuccess();

    const main = screen.getByRole("main", { name: "You're all set!" });
    const heading = screen.getByRole("heading", {
      level: 1,
      name: "You're all set!",
    });

    expect(main).toHaveAttribute("aria-labelledby", "success-title");
    expect(heading).toHaveAttribute("id", "success-title");
  });

  it("renders the descriptive subtitle", () => {
    renderOnboardingSuccess();

    expect(
      screen.getByText(
        "Your merchant account is ready. Create a pricing plan or explore the dashboard to start accepting subscriptions.",
      ),
    ).toBeInTheDocument();
  });

  it("links to plan creation and navigates when clicked", async () => {
    const user = userEvent.setup();
    renderOnboardingSuccess();
    const createPlanLink = screen.getByRole("link", { name: "Create plan" });

    expect(createPlanLink).toHaveAttribute("href", "/plans/new");

    await user.click(createPlanLink);

    expect(
      screen.getByRole("heading", { name: "Create plan page" }),
    ).toBeInTheDocument();
  });

  it("links to the dashboard and navigates when clicked", async () => {
    const user = userEvent.setup();
    renderOnboardingSuccess();
    const dashboardLink = screen.getByRole("link", { name: "Go to dashboard" });

    expect(dashboardLink).toHaveAttribute("href", "/dashboard");

    await user.click(dashboardLink);

    expect(
      screen.getByRole("heading", { name: "Dashboard page" }),
    ).toBeInTheDocument();
  });

  it("hides all decorative SVGs from assistive technology", () => {
    renderOnboardingSuccess();
    const main = screen.getByRole("main");
    const decorativeSvgs = main.querySelectorAll("svg");

    expect(decorativeSvgs).toHaveLength(3);
    decorativeSvgs.forEach((svg) => {
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });
  });
});
