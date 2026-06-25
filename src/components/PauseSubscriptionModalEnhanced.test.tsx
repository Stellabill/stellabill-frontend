import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PauseSubscriptionModalEnhanced from './PauseSubscriptionModalEnhanced';

describe('PauseSubscriptionModalEnhanced', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnConfirm.mockClear();
  });

  it('returns null when not open', () => {
    const { container } = render(
      <PauseSubscriptionModalEnhanced
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders modal when open', () => {
    render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('displays title', () => {
    render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    expect(screen.getByText('Pause subscription?')).toBeInTheDocument();
  });

  it('displays description', () => {
    render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    expect(screen.getByText(/won't be charged while paused/)).toBeInTheDocument();
  });

  it('has close button', () => {
    render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const closeBtn = screen.getByRole('button', { name: /Close modal/i });
    expect(closeBtn).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const closeBtn = screen.getByRole('button', { name: /Close modal/i });
    await user.click(closeBtn);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays two tabs', () => {
    render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    expect(screen.getByRole('button', { name: /Pause indefinitely/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pause until date/i })).toBeInTheDocument();
  });

  it('switches to scheduled pause tab', async () => {
    const user = userEvent.setup();
    render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const scheduledTab = screen.getByRole('button', { name: /Pause until date/i });
    await user.click(scheduledTab);
    
    expect(scheduledTab).toHaveAttribute('aria-selected', 'true');
  });

  it('displays simple pause checklist', () => {
    render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    expect(screen.getByText(/No charges while paused/)).toBeInTheDocument();
    expect(screen.getByText(/Resume anytime/)).toBeInTheDocument();
  });

  it('displays preset buttons in scheduled tab', async () => {
    const user = userEvent.setup();
    render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const scheduledTab = screen.getByRole('button', { name: /Pause until date/i });
    await user.click(scheduledTab);
    
    expect(screen.getByRole('button', { name: /1 week/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /1 month/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /3 months/i })).toBeInTheDocument();
  });

  it('selects 1 week preset', async () => {
    const user = userEvent.setup();
    render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const scheduledTab = screen.getByRole('button', { name: /Pause until date/i });
    await user.click(scheduledTab);
    
    const weekBtn = screen.getByRole('button', { name: /1 week/i });
    await user.click(weekBtn);
    
    expect(weekBtn).toHaveClass('active');
  });

  it('displays calendar in scheduled tab', async () => {
    const user = userEvent.setup();
    render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const scheduledTab = screen.getByRole('button', { name: /Pause until date/i });
    await user.click(scheduledTab);
    
    expect(screen.getByText(/Or select a custom date/)).toBeInTheDocument();
  });

  it('confirms simple pause without date', async () => {
    const user = userEvent.setup();
    render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const confirmBtn = screen.getByRole('button', { name: /Pause subscription/i });
    await user.click(confirmBtn);
    
    expect(mockOnConfirm).toHaveBeenCalledWith(null);
  });

  it('disables confirm button in scheduled tab without date selection', async () => {
    const user = userEvent.setup();
    render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const scheduledTab = screen.getByRole('button', { name: /Pause until date/i });
    await user.click(scheduledTab);
    
    const confirmBtn = screen.getByRole('button', { name: /Pause/i });
    expect(confirmBtn).toBeDisabled();
  });

  it('enables confirm button after date selection', async () => {
    const user = userEvent.setup();
    render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const scheduledTab = screen.getByRole('button', { name: /Pause until date/i });
    await user.click(scheduledTab);
    
    const weekBtn = screen.getByRole('button', { name: /1 week/i });
    await user.click(weekBtn);
    
    const confirmBtn = screen.getByRole('button', { name: /Pause/i });
    expect(confirmBtn).not.toBeDisabled();
  });

  it('has keep active button', () => {
    render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    expect(screen.getByRole('button', { name: /Keep active/i })).toBeInTheDocument();
  });

  it('closes when keep active is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const keepBtn = screen.getByRole('button', { name: /Keep active/i });
    await user.click(keepBtn);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows loading state during pause', () => {
    render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        isLoading={true}
      />
    );
    
    const confirmBtn = screen.getByRole('button', { name: /Pausing/i });
    expect(confirmBtn).toBeInTheDocument();
  });

  it('disables buttons during loading', () => {
    render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        isLoading={true}
      />
    );
    
    const buttons = screen.getAllByRole('button').filter(btn => 
      btn.textContent?.includes('Pause') || btn.textContent?.includes('Keep active')
    );
    
    buttons.forEach(btn => {
      expect(btn).toBeDisabled();
    });
  });

  it('displays modal with proper aria attributes', () => {
    render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'pause-modal-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'pause-modal-description');
  });

  it('displays accessibility information', () => {
    render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    expect(screen.getByText(/keyboard navigation/)).toBeInTheDocument();
  });

  it('displays preset label', async () => {
    const user = userEvent.setup();
    render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const scheduledTab = screen.getByRole('button', { name: /Pause until date/i });
    await user.click(scheduledTab);
    
    expect(screen.getByText(/Quick presets/)).toBeInTheDocument();
  });

  it('displays SVG icons', () => {
    const { container } = render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('closes on overlay click', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const overlay = container.querySelector('.pause-modal-overlay');
    if (overlay) {
      fireEvent.click(overlay, { target: overlay });
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('displays proper tab roles', () => {
    render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const tabs = screen.getAllByRole('button').filter(btn => 
      btn.getAttribute('role') === 'tab'
    );
    
    expect(tabs.length).toBeGreaterThanOrEqual(2);
  });

  it('has currently active tab indicated', () => {
    render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const activeTab = screen.getByRole('tab', { selected: true });
    expect(activeTab).toBeInTheDocument();
  });

  it('shows pause icon header', () => {
    const { container } = render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    expect(container.querySelector('.pause-icon-header')).toBeInTheDocument();
  });

  it('accepts custom subscription data', () => {
    render(
      <PauseSubscriptionModalEnhanced
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        currentNextChargeDate="May 1, 2026"
        estimatedNextCharge="100"
        currency="ETH"
        subscriptionId="sub-123"
      />
    );
    
    expect(screen.getByText('Pause subscription?')).toBeInTheDocument();
  });
});
