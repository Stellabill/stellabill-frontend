import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import WizardHeader from "./WizardHeader";

function renderHeader(overrides = {}) {
  const props = {
    title: "Create Plan",
    currentStep: 1,
    totalSteps: 3,
    isDirty: false,
    onCancel: vi.fn(),
    onSaveDraft: vi.fn(),
    ...overrides,
  };
  return { ...render(<WizardHeader {...props} />), props };
}

describe("WizardHeader", () => {
  it("renders the title", () => {
    renderHeader({ title: "My Plan" });
    expect(screen.getByRole("heading", { name: "My Plan" })).toBeInTheDocument();
  });

  it("shows the step indicator with currentStep and totalSteps", () => {
    renderHeader({ currentStep: 2, totalSteps: 4 });
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
  });

  it("calls onCancel when the Cancel button is clicked", async () => {
    const user = userEvent.setup();
    const { props } = renderHeader();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onSaveDraft when the Save Draft button is clicked", async () => {
    const user = userEvent.setup();
    const { props } = renderHeader();
    await user.click(screen.getByRole("button", { name: /save draft/i }));
    expect(props.onSaveDraft).toHaveBeenCalledTimes(1);
  });

  it("Save Draft button is enabled regardless of isDirty", () => {
    renderHeader({ isDirty: false });
    expect(screen.getByRole("button", { name: /save draft/i })).not.toBeDisabled();

    renderHeader({ isDirty: true });
    expect(screen.getAllByRole("button", { name: /save draft/i })[1]).not.toBeDisabled();
  });

  it("renders children inside the header", () => {
    render(
      <WizardHeader
        title="T"
        currentStep={1}
        totalSteps={2}
        isDirty={false}
        onCancel={vi.fn()}
        onSaveDraft={vi.fn()}
      >
        <span>extra content</span>
      </WizardHeader>
    );
    expect(screen.getByText("extra content")).toBeInTheDocument();
  });
});
