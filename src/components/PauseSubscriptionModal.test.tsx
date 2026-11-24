import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PauseSubscriptionModal from './PauseSubscriptionModal';

describe('PauseSubscriptionModal', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnConfirm.mockClear();
  });

  describe('default mode (showSchedule = false)', () => {
    it('returns null when isOpen is false', () => {
      const { container } = render(
        <PauseSubscriptionModal
          isOpen={false}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders modal content when isOpen is true', () => {
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Pause subscription?')).toBeInTheDocument();
      expect(
        screen.getByText("You won't be charged until you resume. You can resume anytime.")
      ).toBeInTheDocument();
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    });

    it('calls onClose when overlay is clicked', () => {
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      const overlay = screen.getByRole('dialog');
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when modal content is clicked', () => {
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      const dialogContent = screen.getByText('Pause subscription?');
      fireEvent.click(dialogContent);
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('calls onClose when cancel button is clicked', () => {
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      const cancelButton = screen.getByText('Keep active');
      fireEvent.click(cancelButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm when confirm button is clicked', () => {
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      const confirmButton = screen.getByText('Pause subscription');
      fireEvent.click(confirmButton);
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('disables buttons and shows loading text when isLoading is true', () => {
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          isLoading={true}
        />
      );
      const cancelButton = screen.getByText('Keep active') as HTMLButtonElement;
      const confirmButton = screen.getByText('Pausing...') as HTMLButtonElement;

      expect(cancelButton).toBeDisabled();
      expect(confirmButton).toBeDisabled();
    });

    it('renders error alert with optional technical details', () => {
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          error={{ message: 'Failed to pause', technicalDetails: 'HTTP 500' }}
        />
      );
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to pause');
      expect(screen.getByText('Technical details')).toBeInTheDocument();
      expect(screen.getByText('HTTP 500')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('traps focus when open', async () => {
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();

      await waitFor(() => {
        const keepBtn = screen.getByRole('button', { name: /keep active/i });
        expect(document.activeElement).toBe(keepBtn);
      });

      const focusableElements = screen.getAllByRole('button');
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      firstElement.focus();
      fireEvent.keyDown(firstElement, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(lastElement);

      lastElement.focus();
      fireEvent.keyDown(lastElement, { key: 'Tab' });
      expect(document.activeElement).toBe(firstElement);
    });

    it('closes on Escape key', () => {
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('has proper ARIA attributes', () => {
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'pause-modal-title');
      expect(modal).toHaveAttribute('aria-describedby', 'pause-modal-description');

      expect(screen.getByText(/pause subscription\?/i)).toHaveAttribute('id', 'pause-modal-title');
      expect(screen.getByText(/you won't be charged until you resume/i)).toHaveAttribute(
        'id',
        'pause-modal-description'
      );
    });
  });

  describe('schedule mode (showSchedule = true)', () => {
    describe('isOpen boundary behavior', () => {
      it('returns null when isOpen is false (failure/empty-result path)', () => {
        const { container } = render(
          <PauseSubscriptionModal
            isOpen={false}
            onClose={mockOnClose}
            onConfirm={mockOnConfirm}
            showSchedule
          />
        );

        expect(container.firstChild).toBeNull();
      });

      it('renders modal when isOpen is true (normal path)', () => {
        render(
          <PauseSubscriptionModal
            isOpen={true}
            onClose={mockOnClose}
            onConfirm={mockOnConfirm}
            showSchedule
          />
        );

        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      it('handles dynamic transition from true to false gracefully (boundary input)', () => {
        const { container, rerender } = render(
          <PauseSubscriptionModal
            isOpen={true}
            onClose={mockOnClose}
            onConfirm={mockOnConfirm}
            showSchedule
          />
        );

        expect(screen.getByRole('dialog')).toBeInTheDocument();

        rerender(
          <PauseSubscriptionModal
            isOpen={false}
            onClose={mockOnClose}
            onConfirm={mockOnConfirm}
            showSchedule
          />
        );

        expect(container.firstChild).toBeNull();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      it('handles dynamic transition from false to true gracefully (boundary input)', () => {
        const { container, rerender } = render(
          <PauseSubscriptionModal
            isOpen={false}
            onClose={mockOnClose}
            onConfirm={mockOnConfirm}
            showSchedule
          />
        );

        expect(container.firstChild).toBeNull();

        rerender(
          <PauseSubscriptionModal
            isOpen={true}
            onClose={mockOnClose}
            onConfirm={mockOnConfirm}
            showSchedule
          />
        );

        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('displays title', () => {
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          showSchedule
        />
      );

      expect(screen.getByText('Pause subscription?')).toBeInTheDocument();
    });

    it('displays schedule description', () => {
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          showSchedule
        />
      );

      expect(screen.getByText(/won't be charged while paused/)).toBeInTheDocument();
    });

    it('has close button', () => {
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          showSchedule
        />
      );

      const closeBtn = screen.getByRole('button', { name: /Close/i });
      expect(closeBtn).toBeInTheDocument();
    });

    it('closes modal when close button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          showSchedule
        />
      );

      const closeBtn = screen.getByRole('button', { name: /Close/i });
      await user.click(closeBtn);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('displays two tabs', () => {
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          showSchedule
        />
      );

      expect(screen.getByRole('tab', { name: /Pause indefinitely/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Pause until date/i })).toBeInTheDocument();
    });

    it('switches to scheduled pause tab', async () => {
      const user = userEvent.setup();
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          showSchedule
        />
      );

      const scheduledTab = screen.getByRole('tab', { name: /Pause until date/i });
      await user.click(scheduledTab);

      expect(scheduledTab).toHaveAttribute('aria-selected', 'true');
    });

    it('displays simple pause checklist', () => {
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          showSchedule
        />
      );

      expect(screen.getByText(/No charges while paused/)).toBeInTheDocument();
      expect(screen.getByText(/Resume anytime/)).toBeInTheDocument();
    });

    it('displays preset buttons in scheduled tab', async () => {
      const user = userEvent.setup();
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          showSchedule
        />
      );

      const scheduledTab = screen.getByRole('tab', { name: /Pause until date/i });
      await user.click(scheduledTab);

      expect(screen.getByRole('button', { name: /1 week/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /1 month/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /3 months/i })).toBeInTheDocument();
    });

    it('selects 1 week preset and renders PauseSchedulePreview', async () => {
      const user = userEvent.setup();
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          showSchedule
          currentNextChargeDate="May 1, 2026"
          estimatedNextCharge="100"
          currency="USDC"
        />
      );

      const scheduledTab = screen.getByRole('tab', { name: /Pause until date/i });
      await user.click(scheduledTab);

      const weekBtn = screen.getByRole('button', { name: /1 week/i });
      await user.click(weekBtn);

      expect(weekBtn).toHaveClass('active');
      expect(screen.getByText(/100 USDC/)).toBeInTheDocument();
    });

    it('displays calendar in scheduled tab', async () => {
      const user = userEvent.setup();
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          showSchedule
        />
      );

      const scheduledTab = screen.getByRole('tab', { name: /Pause until date/i });
      await user.click(scheduledTab);

      expect(screen.getByText(/Or select a custom date/)).toBeInTheDocument();
    });

    it('confirms simple pause without date', async () => {
      const user = userEvent.setup();
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          showSchedule
        />
      );

      const confirmBtn = screen.getByRole('button', { name: /Pause subscription/i });
      await user.click(confirmBtn);

      expect(mockOnConfirm).toHaveBeenCalledWith(null);
    });

    it('confirms scheduled pause with selected date', async () => {
      const user = userEvent.setup();
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          showSchedule
        />
      );

      await user.click(screen.getByRole('tab', { name: /Pause until date/i }));
      await user.click(screen.getByRole('button', { name: /1 week/i }));

      const confirmBtn = screen.getByRole('button', { name: /Pause until/i });
      await user.click(confirmBtn);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm.mock.calls[0][0]).toBeInstanceOf(Date);
    });

    it('disables confirm button in scheduled tab without date selection', async () => {
      const user = userEvent.setup();
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          showSchedule
        />
      );

      const scheduledTab = screen.getByRole('tab', { name: /Pause until date/i });
      await user.click(scheduledTab);

      const confirmBtn = screen.getByRole('button', { name: /Pause/i });
      expect(confirmBtn).toBeDisabled();
    });

    it('enables confirm button after date selection', async () => {
      const user = userEvent.setup();
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          showSchedule
        />
      );

      const scheduledTab = screen.getByRole('tab', { name: /Pause until date/i });
      await user.click(scheduledTab);

      const weekBtn = screen.getByRole('button', { name: /1 week/i });
      await user.click(weekBtn);

      const confirmBtn = screen.getByRole('button', { name: /Pause/i });
      expect(confirmBtn).not.toBeDisabled();
    });

    it('has keep active button', () => {
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          showSchedule
        />
      );

      expect(screen.getByRole('button', { name: /Keep active/i })).toBeInTheDocument();
    });

    it('closes when keep active is clicked', async () => {
      const user = userEvent.setup();
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          showSchedule
        />
      );

      const keepBtn = screen.getByRole('button', { name: /Keep active/i });
      await user.click(keepBtn);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('shows loading state during pause', () => {
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          isLoading={true}
          showSchedule
        />
      );

      const confirmBtn = screen.getByRole('button', { name: /Pausing/i });
      expect(confirmBtn).toBeInTheDocument();
    });

    it('disables buttons during loading', () => {
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          isLoading={true}
          showSchedule
        />
      );

      const buttons = screen.getAllByRole('button').filter((btn) =>
        btn.textContent?.includes('Pausing') || btn.textContent?.includes('Keep active')
      );

      expect(buttons.length).toBeGreaterThanOrEqual(2);
      buttons.forEach((btn) => {
        expect(btn).toBeDisabled();
      });
    });

    it('displays modal with proper aria attributes', () => {
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          showSchedule
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'pause-modal-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'pause-modal-description');
    });

    it('displays accessibility information', () => {
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          showSchedule
        />
      );

      expect(screen.getByText(/keyboard navigation/)).toBeInTheDocument();
    });

    it('displays preset label', async () => {
      const user = userEvent.setup();
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          showSchedule
        />
      );

      const scheduledTab = screen.getByRole('tab', { name: /Pause until date/i });
      await user.click(scheduledTab);

      expect(screen.getByText(/Quick presets/)).toBeInTheDocument();
    });

    it('displays SVG icons', () => {
      const { container } = render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          showSchedule
        />
      );

      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('closes on overlay click', () => {
      const { container } = render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          showSchedule
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
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          showSchedule
        />
      );

      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThanOrEqual(2);
    });

    it('has currently active tab indicated', () => {
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          showSchedule
        />
      );

      const activeTab = screen.getByRole('tab', { selected: true });
      expect(activeTab).toBeInTheDocument();
    });

    it('shows pause icon header', () => {
      const { container } = render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          showSchedule
        />
      );

      expect(container.querySelector('.pause-icon-header')).toBeInTheDocument();
    });

    it('accepts custom subscription data', () => {
      render(
        <PauseSubscriptionModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          showSchedule
          currentNextChargeDate="May 1, 2026"
          estimatedNextCharge="100"
          currency="ETH"
          subscriptionId="sub-123"
        />
      );

      expect(screen.getByText('Pause subscription?')).toBeInTheDocument();
    });
  });
});
