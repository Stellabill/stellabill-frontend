import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Capture exactly what OnboardingShell forwards to StepIndicator without
// coupling these tests to StepIndicator's rendering internals.
const { stepIndicatorSpy } = vi.hoisted(() => ({ stepIndicatorSpy: vi.fn() }));

vi.mock('../StepIndicator', () => ({
  default: (props: { currentStep: number; completedSteps: number[] }) => {
    stepIndicatorSpy(props);
    return <div data-testid="step-indicator" />;
  },
}));

import OnboardingShell from './OnboardingShell';

type ShellOverrides = Partial<{
  currentStep: number;
  completedSteps: number[];
  title: string;
  subtitle: string;
}>;

function renderShell(overrides: ShellOverrides = {}) {
  return render(
    <OnboardingShell
      currentStep={2}
      completedSteps={[1]}
      title="Set up your payout"
      subtitle="Tell us where to send your money."
      {...overrides}
    >
      <p>Step body</p>
    </OnboardingShell>
  );
}

describe('OnboardingShell', () => {
  beforeEach(() => {
    stepIndicatorSpy.mockClear();
  });

  it('renders the eyebrow, heading, and subtitle', () => {
    renderShell();

    expect(screen.getByText('Merchant onboarding')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Set up your payout' })
    ).toBeInTheDocument();
    expect(screen.getByText('Tell us where to send your money.')).toBeInTheDocument();
  });

  it('renders children inside the labelled onboarding card', () => {
    renderShell();

    const body = screen.getByText('Step body');
    const card = body.closest('section.onboarding-card');
    expect(card).not.toBeNull();
    expect(card).toHaveAttribute('aria-labelledby', 'onboarding-card-heading');
  });

  it('renders the step indicator', () => {
    renderShell();
    expect(screen.getByTestId('step-indicator')).toBeInTheDocument();
  });

  it('renders the support contact link', () => {
    renderShell();

    const link = screen.getByRole('link', { name: 'support@stellabill.com' });
    expect(link).toHaveAttribute('href', 'mailto:support@stellabill.com');
  });

  it('forwards currentStep and completedSteps to the step indicator', () => {
    renderShell({ currentStep: 3, completedSteps: [1, 2] });

    expect(stepIndicatorSpy).toHaveBeenCalledTimes(1);
    expect(stepIndicatorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ currentStep: 3, completedSteps: [1, 2] })
    );
  });

  it('forwards updated props on re-render without remounting the shell', () => {
    const { rerender } = renderShell({ currentStep: 1, completedSteps: [] });

    rerender(
      <OnboardingShell
        currentStep={2}
        completedSteps={[1]}
        title="Set up your payout"
        subtitle="Tell us where to send your money."
      >
        <p>Step body</p>
      </OnboardingShell>
    );

    expect(stepIndicatorSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ currentStep: 2, completedSteps: [1] })
    );
  });

  // Boundary inputs must remain deterministic: an empty completion set and a
  // zero/out-of-range step are forwarded verbatim, never coerced.
  it('handles an empty completedSteps array', () => {
    renderShell({ completedSteps: [] });

    expect(stepIndicatorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ completedSteps: [] })
    );
  });

  it('handles a currentStep of zero', () => {
    renderShell({ currentStep: 0 });

    expect(stepIndicatorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ currentStep: 0 })
    );
  });

  it('handles a currentStep beyond the known steps', () => {
    renderShell({ currentStep: 99 });

    expect(stepIndicatorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ currentStep: 99 })
    );
  });
});
