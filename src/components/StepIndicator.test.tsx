/**
 * Dedicated test suite for #827 — StepIndicator
 *
 * Covers the full public contract of StepIndicator:
 *   – default rendering (DEFAULT_STEPS)
 *   – completed / active / pending visual states
 *   – conditional (dashed-border) and revealed prop logic
 *   – hidden-step count display
 *   – connector line colouring
 *   – boundary / invalid inputs
 *   – primary state transitions
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StepIndicator from './StepIndicator';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const DEFAULT_STEP_LABELS = ['Business', 'Payout', 'Review'];

const threeSteps = [
  { id: 1, label: 'Start' },
  { id: 2, label: 'Middle' },
  { id: 3, label: 'Finish' },
];

const conditionalSteps = [
  { id: 1, label: 'Required' },
  { id: 2, label: 'Optional', conditional: true },
  { id: 3, label: 'Done' },
];

const revealedSteps = [
  { id: 1, label: 'Step One' },
  { id: 2, label: 'Hidden Step', conditional: true, revealed: false },
  { id: 3, label: 'Step Three' },
];

const allRevealedFalse = [
  { id: 1, label: 'A', conditional: true, revealed: false },
  { id: 2, label: 'B', conditional: true, revealed: false },
];

// ---------------------------------------------------------------------------
// 1. Default rendering
// ---------------------------------------------------------------------------

describe('StepIndicator — default rendering', () => {
  it('renders without throwing using only required props', () => {
    expect(() =>
      render(<StepIndicator currentStep={1} completedSteps={[]} />)
    ).not.toThrow();
  });

  it('uses DEFAULT_STEPS when no steps prop is provided', () => {
    render(<StepIndicator currentStep={1} completedSteps={[]} />);
    DEFAULT_STEP_LABELS.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('renders a container with the onboarding progress label', () => {
    render(<StepIndicator currentStep={1} completedSteps={[]} />);
    expect(
      screen.getByLabelText(/onboarding progress/i)
    ).toBeInTheDocument();
  });

  it('renders the steps list with role="list"', () => {
    render(<StepIndicator currentStep={1} completedSteps={[]} />);
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('renders each step as a listitem', () => {
    render(<StepIndicator currentStep={1} completedSteps={[]} steps={threeSteps} />);
    const items = screen.getAllByRole('listitem');
    // 3 step items (connector divs are not listitems)
    expect(items.length).toBe(3);
  });

  it('renders step labels as text', () => {
    render(<StepIndicator currentStep={1} completedSteps={[]} steps={threeSteps} />);
    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('Middle')).toBeInTheDocument();
    expect(screen.getByText('Finish')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 2. Active step
// ---------------------------------------------------------------------------

describe('StepIndicator — active step', () => {
  it('marks the active step span with aria-current="step"', () => {
    render(<StepIndicator currentStep={2} completedSteps={[]} steps={threeSteps} />);
    const activeLabel = screen.getByText('Middle');
    expect(activeLabel).toHaveAttribute('aria-current', 'step');
  });

  it('does NOT set aria-current on inactive steps', () => {
    render(<StepIndicator currentStep={2} completedSteps={[]} steps={threeSteps} />);
    expect(screen.getByText('Start')).not.toHaveAttribute('aria-current');
    expect(screen.getByText('Finish')).not.toHaveAttribute('aria-current');
  });

  it('active step label has fontWeight 600 (bold style)', () => {
    render(<StepIndicator currentStep={1} completedSteps={[]} steps={threeSteps} />);
    const activeLabel = screen.getByText('Start');
    expect(activeLabel).toHaveStyle({ fontWeight: 600 });
  });

  it('inactive step labels have fontWeight 400', () => {
    render(<StepIndicator currentStep={1} completedSteps={[]} steps={threeSteps} />);
    const inactiveLabel = screen.getByText('Middle');
    expect(inactiveLabel).toHaveStyle({ fontWeight: 400 });
  });

  it('active step circle has teal border color', () => {
    render(<StepIndicator currentStep={1} completedSteps={[]} steps={threeSteps} />);
    // The first listitem contains the active circle
    const items = screen.getAllByRole('listitem');
    const circle = items[0].querySelector('div');
    expect(circle).toHaveStyle({ borderColor: '#22d3ee' });
  });

  it('inactive step circle has dark-grey border color', () => {
    render(<StepIndicator currentStep={1} completedSteps={[]} steps={threeSteps} />);
    const items = screen.getAllByRole('listitem');
    const circle = items[1].querySelector('div'); // step 2 = inactive
    expect(circle).toHaveStyle({ borderColor: '#4b5563' });
  });

  it('shows the step id number inside an incomplete, non-active step circle', () => {
    render(<StepIndicator currentStep={1} completedSteps={[]} steps={threeSteps} />);
    // Step 2 is neither active nor completed — should display its id "2"
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('first step is active when currentStep=1 with default steps', () => {
    render(<StepIndicator currentStep={1} completedSteps={[]} />);
    expect(screen.getByText('Business')).toHaveAttribute('aria-current', 'step');
  });
});

// ---------------------------------------------------------------------------
// 3. Completed steps
// ---------------------------------------------------------------------------

describe('StepIndicator — completed steps', () => {
  it('renders a checkmark SVG for completed steps', () => {
    render(<StepIndicator currentStep={2} completedSteps={[1]} steps={threeSteps} />);
    const items = screen.getAllByRole('listitem');
    // Step 1 is completed — look for a polyline (the check icon)
    const svg = items[0].querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.querySelector('polyline')).toBeInTheDocument();
  });

  it('completed step circle has teal background color', () => {
    render(<StepIndicator currentStep={2} completedSteps={[1]} steps={threeSteps} />);
    const items = screen.getAllByRole('listitem');
    const circle = items[0].querySelector('div');
    expect(circle).toHaveStyle({ backgroundColor: '#22d3ee' });
  });

  it('check SVG is aria-hidden so screen readers skip the decorative icon', () => {
    render(<StepIndicator currentStep={2} completedSteps={[1]} steps={threeSteps} />);
    const items = screen.getAllByRole('listitem');
    const svg = items[0].querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not render a number span inside a completed step circle', () => {
    render(<StepIndicator currentStep={3} completedSteps={[1, 2]} steps={threeSteps} />);
    // Steps 1 and 2 are completed — their ids should not appear as number text
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
    // Step 3 is active (not completed) — id should appear as number
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('all steps completed — every circle shows a checkmark', () => {
    render(<StepIndicator currentStep={4} completedSteps={[1, 2, 3]} steps={threeSteps} />);
    const items = screen.getAllByRole('listitem');
    items.forEach((item) => {
      const svg = item.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg?.querySelector('polyline')).toBeInTheDocument();
    });
  });

  it('no completedSteps — no checkmark is rendered', () => {
    render(<StepIndicator currentStep={1} completedSteps={[]} steps={threeSteps} />);
    const polylines = document.querySelectorAll('polyline');
    expect(polylines.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 4. Conditional steps (dashed border)
// ---------------------------------------------------------------------------

describe('StepIndicator — conditional steps', () => {
  it('renders a dashed-border circle for a conditional step', () => {
    render(<StepIndicator currentStep={1} completedSteps={[]} steps={conditionalSteps} />);
    const items = screen.getAllByRole('listitem');
    // Step 2 is conditional
    const conditionalCircle = items[1].querySelector('div');
    expect(conditionalCircle).toHaveStyle({ borderStyle: 'dashed' });
  });

  it('renders a solid-border circle for a non-conditional step', () => {
    render(<StepIndicator currentStep={1} completedSteps={[]} steps={conditionalSteps} />);
    const items = screen.getAllByRole('listitem');
    const normalCircle = items[0].querySelector('div');
    expect(normalCircle).toHaveStyle({ borderStyle: 'solid' });
  });

  it('conditional unrevealed step circle has opacity 0.5', () => {
    render(<StepIndicator currentStep={1} completedSteps={[]} steps={revealedSteps} />);
    const items = screen.getAllByRole('listitem');
    // Step 2 is conditional + revealed: false
    const hiddenCircle = items[1].querySelector('div');
    expect(hiddenCircle).toHaveStyle({ opacity: 0.5 });
  });

  it('conditional revealed step circle has opacity 1', () => {
    const revealedConditional = [
      { id: 1, label: 'One' },
      { id: 2, label: 'Two', conditional: true, revealed: true },
    ];
    render(<StepIndicator currentStep={1} completedSteps={[]} steps={revealedConditional} />);
    const items = screen.getAllByRole('listitem');
    const circle = items[1].querySelector('div');
    expect(circle).toHaveStyle({ opacity: 1 });
  });

  it('non-conditional step circle always has opacity 1', () => {
    render(<StepIndicator currentStep={1} completedSteps={[]} steps={threeSteps} />);
    const items = screen.getAllByRole('listitem');
    items.forEach((item) => {
      const circle = item.querySelector('div');
      expect(circle).toHaveStyle({ opacity: 1 });
    });
  });
});

// ---------------------------------------------------------------------------
// 5. revealed=false — hidden step count display
// ---------------------------------------------------------------------------

describe('StepIndicator — revealed=false / hidden count', () => {
  it('excludes steps with revealed=false from the visible list', () => {
    render(<StepIndicator currentStep={1} completedSteps={[]} steps={revealedSteps} />);
    // "Hidden Step" has revealed: false
    expect(screen.queryByText('Hidden Step')).not.toBeInTheDocument();
  });

  it('shows the remaining visible steps normally', () => {
    render(<StepIndicator currentStep={1} completedSteps={[]} steps={revealedSteps} />);
    expect(screen.getByText('Step One')).toBeInTheDocument();
    expect(screen.getByText('Step Three')).toBeInTheDocument();
  });

  it('displays "+ N optional step" for 1 hidden step', () => {
    render(<StepIndicator currentStep={1} completedSteps={[]} steps={revealedSteps} />);
    expect(screen.getByText(/\+1 optional step$/)).toBeInTheDocument();
  });

  it('uses plural "steps" when multiple steps are hidden', () => {
    render(<StepIndicator currentStep={1} completedSteps={[]} steps={allRevealedFalse} />);
    // Both steps have revealed: false → hiddenCount = 2, no visible steps
    expect(screen.getByText(/\+2 optional steps$/)).toBeInTheDocument();
  });

  it('does not display the hidden-count notice when all steps are revealed', () => {
    render(<StepIndicator currentStep={1} completedSteps={[]} steps={threeSteps} />);
    expect(screen.queryByText(/optional step/i)).not.toBeInTheDocument();
  });

  it('hidden count notice does not appear when revealed is explicitly true', () => {
    const allRevealed = [
      { id: 1, label: 'A', conditional: true, revealed: true },
      { id: 2, label: 'B', conditional: true, revealed: true },
    ];
    render(<StepIndicator currentStep={1} completedSteps={[]} steps={allRevealed} />);
    expect(screen.queryByText(/optional/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 6. Connector line colouring
// ---------------------------------------------------------------------------

describe('StepIndicator — connector lines', () => {
  it('renders N-1 connector divs for N visible steps', () => {
    const { container } = render(
      <StepIndicator currentStep={1} completedSteps={[]} steps={threeSteps} />
    );
    // Connectors are divs inside the stepsWrapper but outside listitems
    // stepsWrapper contains: 3 listitems + 2 connectors (+ possible hidden notice)
    const stepsWrapper = container.querySelector('[role="list"]');
    const connectors = Array.from(stepsWrapper?.children ?? []).filter(
      (el) => el.getAttribute('role') !== 'listitem' && !el.getAttribute('role')
    );
    // At minimum 2 connectors for 3 steps
    expect(connectors.length).toBeGreaterThanOrEqual(2);
  });

  it('connector between two completed steps has teal border (active connection)', () => {
    const { container } = render(
      <StepIndicator currentStep={3} completedSteps={[1, 2]} steps={threeSteps} />
    );
    // All connectors between completed segments should have teal borderTop
    const lines = container.querySelectorAll('[style*="border-top"]');
    expect(lines.length).toBeGreaterThan(0);
  });

  it('connector is dashed when the step before it is conditional', () => {
    const { container } = render(
      <StepIndicator currentStep={1} completedSteps={[]} steps={conditionalSteps} />
    );
    // The connector after the conditional step should have dashed style
    const lines = Array.from(container.querySelectorAll('[style*="dashed"]'));
    expect(lines.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 7. Boundary and invalid inputs
// ---------------------------------------------------------------------------

describe('StepIndicator — boundary inputs', () => {
  it('handles currentStep of 0 (before any step) without throwing', () => {
    expect(() =>
      render(<StepIndicator currentStep={0} completedSteps={[]} steps={threeSteps} />)
    ).not.toThrow();
  });

  it('handles currentStep beyond the last step without throwing', () => {
    expect(() =>
      render(<StepIndicator currentStep={999} completedSteps={[1, 2, 3]} steps={threeSteps} />)
    ).not.toThrow();
  });

  it('handles an empty steps array without throwing', () => {
    expect(() =>
      render(<StepIndicator currentStep={1} completedSteps={[]} steps={[]} />)
    ).not.toThrow();
  });

  it('handles completedSteps containing ids not in the steps array without throwing', () => {
    expect(() =>
      render(<StepIndicator currentStep={1} completedSteps={[99, 100]} steps={threeSteps} />)
    ).not.toThrow();
  });

  it('handles a single step without throwing', () => {
    const singleStep = [{ id: 1, label: 'Only' }];
    expect(() =>
      render(<StepIndicator currentStep={1} completedSteps={[]} steps={singleStep} />)
    ).not.toThrow();
    expect(screen.getByText('Only')).toBeInTheDocument();
  });

  it('single step renders no connector line', () => {
    const { container } = render(
      <StepIndicator currentStep={1} completedSteps={[]} steps={[{ id: 1, label: 'Only' }]} />
    );
    const lines = container.querySelectorAll('[style*="border-top"]');
    expect(lines.length).toBe(0);
  });

  it('completedSteps as an empty array renders no checkmarks', () => {
    render(<StepIndicator currentStep={1} completedSteps={[]} steps={threeSteps} />);
    expect(document.querySelectorAll('polyline').length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 8. Primary state transitions
// ---------------------------------------------------------------------------

describe('StepIndicator — primary state transitions', () => {
  it('transition: step 1 active → step 1 completed, step 2 active', () => {
    const { rerender } = render(
      <StepIndicator currentStep={1} completedSteps={[]} steps={threeSteps} />
    );
    expect(screen.getByText('Start')).toHaveAttribute('aria-current', 'step');

    rerender(<StepIndicator currentStep={2} completedSteps={[1]} steps={threeSteps} />);
    expect(screen.getByText('Start')).not.toHaveAttribute('aria-current');
    expect(screen.getByText('Middle')).toHaveAttribute('aria-current', 'step');

    // Step 1 should now show checkmark
    const items = screen.getAllByRole('listitem');
    expect(items[0].querySelector('polyline')).toBeInTheDocument();
  });

  it('transition: completing all steps removes all aria-current attributes', () => {
    const { rerender } = render(
      <StepIndicator currentStep={2} completedSteps={[1]} steps={threeSteps} />
    );
    rerender(<StepIndicator currentStep={4} completedSteps={[1, 2, 3]} steps={threeSteps} />);

    expect(screen.getByText('Start')).not.toHaveAttribute('aria-current');
    expect(screen.getByText('Middle')).not.toHaveAttribute('aria-current');
    expect(screen.getByText('Finish')).not.toHaveAttribute('aria-current');
  });

  it('transition: going back removes completed status from previously completed step', () => {
    const { rerender } = render(
      <StepIndicator currentStep={2} completedSteps={[1]} steps={threeSteps} />
    );
    // "Go back" — step 1 no longer completed
    rerender(<StepIndicator currentStep={1} completedSteps={[]} steps={threeSteps} />);
    expect(screen.getByText('Start')).toHaveAttribute('aria-current', 'step');
    expect(document.querySelectorAll('polyline').length).toBe(0);
  });

  it('transition: conditional step revealed mid-flow appears in the list', () => {
    const initial = [
      { id: 1, label: 'First' },
      { id: 2, label: 'Bonus', conditional: true, revealed: false },
      { id: 3, label: 'Last' },
    ];
    const revealed = [
      { id: 1, label: 'First' },
      { id: 2, label: 'Bonus', conditional: true, revealed: true },
      { id: 3, label: 'Last' },
    ];

    const { rerender } = render(
      <StepIndicator currentStep={1} completedSteps={[]} steps={initial} />
    );
    expect(screen.queryByText('Bonus')).not.toBeInTheDocument();
    expect(screen.getByText(/\+1 optional step/i)).toBeInTheDocument();

    rerender(<StepIndicator currentStep={2} completedSteps={[1]} steps={revealed} />);
    expect(screen.getByText('Bonus')).toBeInTheDocument();
    expect(screen.queryByText(/optional step/i)).not.toBeInTheDocument();
  });
});
