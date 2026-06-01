import React from 'react';
import StepIndicator from '../StepIndicator';
import './OnboardingShell.css';

interface OnboardingShellProps {
  currentStep: number;
  completedSteps: number[];
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function OnboardingShell({
  currentStep,
  completedSteps,
  title,
  subtitle,
  children,
}: OnboardingShellProps) {
  return (
    <div className="onboarding-shell">
      <div className="onboarding-shell-container">
        <header className="onboarding-shell-header">
          <p className="onboarding-shell-eyebrow">Merchant onboarding</p>
          <h1 className="onboarding-shell-heading">{title}</h1>
          <p className="onboarding-shell-copy">{subtitle}</p>
        </header>

        <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />

        <section className="onboarding-card" aria-labelledby="onboarding-card-heading">
          {children}
        </section>
      </div>

      <footer className="onboarding-shell-footer">
        <p>
          Need help?{' '}
          <a className="onboarding-link" href="mailto:support@stellabill.com">
            support@stellabill.com
          </a>
        </p>
      </footer>
    </div>
  );
}
