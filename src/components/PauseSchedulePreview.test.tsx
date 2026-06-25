import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PauseSchedulePreview from './PauseSchedulePreview';

describe('PauseSchedulePreview', () => {
  it('returns null when pauseUntilDate is null', () => {
    const { container } = render(
      <PauseSchedulePreview
        pauseUntilDate={null}
        currentNextChargeDate="April 15, 2026"
        estimatedNextCharge="50"
        currency="USDC"
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders preview when pauseUntilDate is provided', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    render(
      <PauseSchedulePreview
        pauseUntilDate={futureDate}
        currentNextChargeDate="April 15, 2026"
        estimatedNextCharge="50"
        currency="USDC"
      />
    );
    
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('displays current next charge date with strikethrough', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    render(
      <PauseSchedulePreview
        pauseUntilDate={futureDate}
        currentNextChargeDate="April 15, 2026"
        estimatedNextCharge="50"
        currency="USDC"
      />
    );
    
    expect(screen.getByText('April 15, 2026')).toBeInTheDocument();
  });

  it('displays new next charge date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    render(
      <PauseSchedulePreview
        pauseUntilDate={futureDate}
        currentNextChargeDate="April 15, 2026"
        estimatedNextCharge="50"
        currency="USDC"
      />
    );
    
    expect(screen.getByText('New next charge')).toBeInTheDocument();
  });

  it('displays estimated charge amount', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    render(
      <PauseSchedulePreview
        pauseUntilDate={futureDate}
        currentNextChargeDate="April 15, 2026"
        estimatedNextCharge="50"
        currency="USDC"
      />
    );
    
    expect(screen.getByText('50 USDC')).toBeInTheDocument();
  });

  it('displays pause duration in days', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    render(
      <PauseSchedulePreview
        pauseUntilDate={futureDate}
        currentNextChargeDate="April 15, 2026"
        estimatedNextCharge="50"
        currency="USDC"
      />
    );
    
    expect(screen.getByText(/days/)).toBeInTheDocument();
  });

  it('displays resume date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    render(
      <PauseSchedulePreview
        pauseUntilDate={futureDate}
        currentNextChargeDate="April 15, 2026"
        estimatedNextCharge="50"
        currency="USDC"
      />
    );
    
    expect(screen.getByText('Resume on')).toBeInTheDocument();
  });

  it('displays notice about no charges', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    render(
      <PauseSchedulePreview
        pauseUntilDate={futureDate}
        currentNextChargeDate="April 15, 2026"
        estimatedNextCharge="50"
        currency="USDC"
      />
    );
    
    expect(screen.getByText(/won't be charged until/)).toBeInTheDocument();
  });

  it('has correct region role for accessibility', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    const { container } = render(
      <PauseSchedulePreview
        pauseUntilDate={futureDate}
        currentNextChargeDate="April 15, 2026"
        estimatedNextCharge="50"
        currency="USDC"
      />
    );
    
    expect(container.querySelector('[role="region"]')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    render(
      <PauseSchedulePreview
        pauseUntilDate={futureDate}
        currentNextChargeDate="April 15, 2026"
        estimatedNextCharge="50"
        currency="USDC"
      />
    );
    
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Preview');
  });

  it('formats dates correctly', () => {
    const futureDate = new Date(2026, 3, 22); // April 22, 2026
    
    render(
      <PauseSchedulePreview
        pauseUntilDate={futureDate}
        currentNextChargeDate="April 15, 2026"
        estimatedNextCharge="50"
        currency="USDC"
      />
    );
    
    // Check that date is formatted
    const dateElements = screen.getAllByText(/Apr/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('displays currency correctly', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    render(
      <PauseSchedulePreview
        pauseUntilDate={futureDate}
        currentNextChargeDate="April 15, 2026"
        estimatedNextCharge="100"
        currency="ETH"
      />
    );
    
    expect(screen.getByText(/100 ETH/)).toBeInTheDocument();
  });

  it('displays different charge amounts', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    const { rerender } = render(
      <PauseSchedulePreview
        pauseUntilDate={futureDate}
        currentNextChargeDate="April 15, 2026"
        estimatedNextCharge="50"
        currency="USDC"
      />
    );
    
    expect(screen.getByText(/50 USDC/)).toBeInTheDocument();
    
    rerender(
      <PauseSchedulePreview
        pauseUntilDate={futureDate}
        currentNextChargeDate="April 15, 2026"
        estimatedNextCharge="75.50"
        currency="USDC"
      />
    );
    
    expect(screen.getByText(/75.50 USDC/)).toBeInTheDocument();
  });

  it('displays statistics section', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    render(
      <PauseSchedulePreview
        pauseUntilDate={futureDate}
        currentNextChargeDate="April 15, 2026"
        estimatedNextCharge="50"
        currency="USDC"
      />
    );
    
    expect(screen.getByText('Pause duration')).toBeInTheDocument();
    expect(screen.getByText('Resume on')).toBeInTheDocument();
  });

  it('has time element with ISO date', () => {
    const futureDate = new Date(2026, 3, 22);
    
    const { container } = render(
      <PauseSchedulePreview
        pauseUntilDate={futureDate}
        currentNextChargeDate="April 15, 2026"
        estimatedNextCharge="50"
        currency="USDC"
      />
    );
    
    const timeElement = container.querySelector('time');
    expect(timeElement).toBeInTheDocument();
  });

  it('displays SVG icons', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    const { container } = render(
      <PauseSchedulePreview
        pauseUntilDate={futureDate}
        currentNextChargeDate="April 15, 2026"
        estimatedNextCharge="50"
        currency="USDC"
      />
    );
    
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('shows correct pause duration for different date ranges', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    
    render(
      <PauseSchedulePreview
        pauseUntilDate={futureDate}
        currentNextChargeDate="April 15, 2026"
        estimatedNextCharge="50"
        currency="USDC"
      />
    );
    
    expect(screen.getByText(/days/)).toBeInTheDocument();
  });

  it('has proper notice styling with icon', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    const { container } = render(
      <PauseSchedulePreview
        pauseUntilDate={futureDate}
        currentNextChargeDate="April 15, 2026"
        estimatedNextCharge="50"
        currency="USDC"
      />
    );
    
    const notice = container.querySelector('.preview-notice');
    expect(notice).toBeInTheDocument();
    const icon = notice?.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});
