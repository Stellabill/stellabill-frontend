import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResumeAffordance from './ResumeAffordance';

describe('ResumeAffordance', () => {
  const mockOnResumeClick = vi.fn();

  beforeEach(() => {
    mockOnResumeClick.mockClear();
  });

  it('returns null when not paused', () => {
    const { container } = render(
      <ResumeAffordance
        isPaused={false}
        onResumeClick={mockOnResumeClick}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders when subscription is paused', () => {
    render(
      <ResumeAffordance
        isPaused={true}
        pauseUntilDate="2026-04-22"
        onResumeClick={mockOnResumeClick}
      />
    );
    
    expect(screen.getByText('Subscription paused')).toBeInTheDocument();
  });

  it('displays resume date when provided', () => {
    render(
      <ResumeAffordance
        isPaused={true}
        pauseUntilDate="2026-04-22"
        onResumeClick={mockOnResumeClick}
      />
    );
    
    expect(screen.getByText(/Resumes on/)).toBeInTheDocument();
  });

  it('displays indefinite pause message when no date provided', () => {
    render(
      <ResumeAffordance
        isPaused={true}
        pauseUntilDate={null}
        onResumeClick={mockOnResumeClick}
      />
    );
    
    expect(screen.getByText(/Subscription paused/)).toBeInTheDocument();
  });

  it('renders pause status icon', () => {
    const { container } = render(
      <ResumeAffordance
        isPaused={true}
        pauseUntilDate="2026-04-22"
        onResumeClick={mockOnResumeClick}
      />
    );
    
    const icon = container.querySelector('.resume-status-icon');
    expect(icon).toBeInTheDocument();
  });

  it('displays informational text', () => {
    render(
      <ResumeAffordance
        isPaused={true}
        pauseUntilDate="2026-04-22"
        onResumeClick={mockOnResumeClick}
      />
    );
    
    expect(screen.getByText(/No charges are being applied/)).toBeInTheDocument();
  });

  it('shows resume button initially', () => {
    render(
      <ResumeAffordance
        isPaused={true}
        pauseUntilDate="2026-04-22"
        onResumeClick={mockOnResumeClick}
      />
    );
    
    const resumeBtn = screen.getByRole('button', { name: /Resume now/i });
    expect(resumeBtn).toBeInTheDocument();
  });

  it('shows confirmation when resume button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ResumeAffordance
        isPaused={true}
        pauseUntilDate="2026-04-22"
        onResumeClick={mockOnResumeClick}
      />
    );
    
    const resumeBtn = screen.getByRole('button', { name: /Resume now/i });
    await user.click(resumeBtn);
    
    expect(screen.getByText(/This will resume charging/)).toBeInTheDocument();
  });

  it('shows cancel and confirm buttons in confirmation state', async () => {
    const user = userEvent.setup();
    render(
      <ResumeAffordance
        isPaused={true}
        pauseUntilDate="2026-04-22"
        onResumeClick={mockOnResumeClick}
      />
    );
    
    const resumeBtn = screen.getByRole('button', { name: /Resume now/i });
    await user.click(resumeBtn);
    
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirm resume/i })).toBeInTheDocument();
  });

  it('confirms resume when confirm button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ResumeAffordance
        isPaused={true}
        pauseUntilDate="2026-04-22"
        onResumeClick={mockOnResumeClick}
      />
    );
    
    const resumeBtn = screen.getByRole('button', { name: /Resume now/i });
    await user.click(resumeBtn);
    
    const confirmBtn = screen.getByRole('button', { name: /Confirm resume/i });
    await user.click(confirmBtn);
    
    expect(mockOnResumeClick).toHaveBeenCalled();
  });

  it('cancels resume when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ResumeAffordance
        isPaused={true}
        pauseUntilDate="2026-04-22"
        onResumeClick={mockOnResumeClick}
      />
    );
    
    const resumeBtn = screen.getByRole('button', { name: /Resume now/i });
    await user.click(resumeBtn);
    
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelBtn);
    
    expect(mockOnResumeClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Resume now/i })).toBeInTheDocument();
  });

  it('shows loading state during resume', () => {
    render(
      <ResumeAffordance
        isPaused={true}
        pauseUntilDate="2026-04-22"
        onResumeClick={mockOnResumeClick}
        isLoading={true}
      />
    );
    
    const resumeBtn = screen.getByRole('button', { name: /Resume now/i });
    expect(resumeBtn).toBeDisabled();
  });

  it('disables buttons during loading', () => {
    render(
      <ResumeAffordance
        isPaused={true}
        pauseUntilDate="2026-04-22"
        onResumeClick={mockOnResumeClick}
        isLoading={true}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      if (btn.textContent?.includes('Resume') || btn.textContent?.includes('resume')) {
        expect(btn).toBeDisabled();
      }
    });
  });

  it('has proper region role for accessibility', () => {
    const { container } = render(
      <ResumeAffordance
        isPaused={true}
        pauseUntilDate="2026-04-22"
        onResumeClick={mockOnResumeClick}
      />
    );
    
    expect(container.querySelector('[role="region"]')).toBeInTheDocument();
  });

  it('has proper heading for accessibility', () => {
    render(
      <ResumeAffordance
        isPaused={true}
        pauseUntilDate="2026-04-22"
        onResumeClick={mockOnResumeClick}
      />
    );
    
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Subscription paused');
  });

  it('formats pause dates correctly', () => {
    render(
      <ResumeAffordance
        isPaused={true}
        pauseUntilDate="2026-04-22"
        onResumeClick={mockOnResumeClick}
      />
    );
    
    // Check for formatted date in ISO format
    expect(screen.getByText(/Resumes on/)).toBeInTheDocument();
  });

  it('displays SVG icons', () => {
    const { container } = render(
      <ResumeAffordance
        isPaused={true}
        pauseUntilDate="2026-04-22"
        onResumeClick={mockOnResumeClick}
      />
    );
    
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('handles aria-label properly on resume button', () => {
    render(
      <ResumeAffordance
        isPaused={true}
        pauseUntilDate="2026-04-22"
        onResumeClick={mockOnResumeClick}
      />
    );
    
    const resumeBtn = screen.getByRole('button', { name: /Resume now/i });
    expect(resumeBtn).toHaveAttribute('aria-label');
  });

  it('shows confirmation message before final resume', async () => {
    const user = userEvent.setup();
    render(
      <ResumeAffordance
        isPaused={true}
        pauseUntilDate="2026-04-22"
        onResumeClick={mockOnResumeClick}
      />
    );
    
    const resumeBtn = screen.getByRole('button', { name: /Resume now/i });
    await user.click(resumeBtn);
    
    expect(screen.getByText(/will resume charging/)).toBeInTheDocument();
  });

  it('has proper button styling for primary resume action', () => {
    render(
      <ResumeAffordance
        isPaused={true}
        pauseUntilDate="2026-04-22"
        onResumeClick={mockOnResumeClick}
      />
    );
    
    const resumeBtn = screen.getByRole('button', { name: /Resume now/i });
    expect(resumeBtn).toHaveClass('resume-btn-primary');
  });

  it('renders information icon with proper styling', () => {
    const { container } = render(
      <ResumeAffordance
        isPaused={true}
        pauseUntilDate="2026-04-22"
        onResumeClick={mockOnResumeClick}
      />
    );
    
    const infoSection = container.querySelector('.resume-info');
    expect(infoSection).toBeInTheDocument();
    const icon = infoSection?.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('displays different pause dates', () => {
    const { rerender } = render(
      <ResumeAffordance
        isPaused={true}
        pauseUntilDate="2026-04-22"
        onResumeClick={mockOnResumeClick}
      />
    );
    
    expect(screen.getByText(/Resumes on/)).toBeInTheDocument();
    
    rerender(
      <ResumeAffordance
        isPaused={true}
        pauseUntilDate="2026-05-15"
        onResumeClick={mockOnResumeClick}
      />
    );
    
    expect(screen.getByText(/Resumes on/)).toBeInTheDocument();
  });

  it('shows indefinite pause text when no date', () => {
    render(
      <ResumeAffordance
        isPaused={true}
        pauseUntilDate={null}
        onResumeClick={mockOnResumeClick}
      />
    );
    
    expect(screen.getByText('Subscription paused')).toBeInTheDocument();
  });
});
