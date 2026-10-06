import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CancelSubscriptionModal from './CancelSubscriptionModal';

describe('CancelSubscriptionModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
        onOfferSelected: vi.fn(),
        balance: '50.00',
        endDate: '2023-12-31'
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns null when isOpen is false', () => {
        const { container } = render(<CancelSubscriptionModal {...defaultProps} isOpen={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders offer step initially', () => {
        render(<CancelSubscriptionModal {...defaultProps} />);
        expect(screen.getByText('Before you go...')).toBeInTheDocument();
        expect(screen.getByText('Continue to cancel')).toBeInTheDocument();
    });

    it('calls onOfferSelected when an offer is chosen', () => {
        render(<CancelSubscriptionModal {...defaultProps} />);
        
        const pauseOfferBtn = screen.getByText('Pause instead');
        fireEvent.click(pauseOfferBtn);
        
        expect(defaultProps.onOfferSelected).toHaveBeenCalledWith('pause');
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('progresses to confirm step when skipping offers and can cancel', () => {
        render(<CancelSubscriptionModal {...defaultProps} />);
        
        const continueBtn = screen.getByText('Continue to cancel');
        fireEvent.click(continueBtn);
        
        expect(screen.getByText('Cancel subscription?')).toBeInTheDocument();
        
        const confirmBtn = screen.getByRole('button', { name: 'Cancel subscription' });
        fireEvent.click(confirmBtn);
        
        expect(defaultProps.onConfirm).toHaveBeenCalled();
    });

    it('calls onClose when close button is clicked in the confirm step', () => {
        render(<CancelSubscriptionModal {...defaultProps} />);
        
        // Skip offer step
        fireEvent.click(screen.getByText('Continue to cancel'));
        
        const keepBtn = screen.getByText('Keep subscription');
        fireEvent.click(keepBtn);
        
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('disables buttons when isLoading is true in confirm step', () => {
        render(<CancelSubscriptionModal {...defaultProps} isLoading={true} />);
        
        // Skip offer step
        fireEvent.click(screen.getByText('Continue to cancel'));
        
        const keepBtn = screen.getByText('Keep subscription');
        const confirmBtn = screen.getByRole('button', { name: 'Cancelling...' });
        
        expect(keepBtn).toBeDisabled();
        expect(confirmBtn).toBeDisabled();
    });

    it('resets step to offer when modal is reopened', () => {
        const { rerender } = render(<CancelSubscriptionModal {...defaultProps} />);
        
        // Go to confirm step
        fireEvent.click(screen.getByText('Continue to cancel'));
        expect(screen.getByText('Cancel subscription?')).toBeInTheDocument();
        
        // Close modal
        rerender(<CancelSubscriptionModal {...defaultProps} isOpen={false} />);
        
        // Reopen modal
        rerender(<CancelSubscriptionModal {...defaultProps} isOpen={true} />);
        
        // Should be back to offer step
        expect(screen.getByText('Before you go...')).toBeInTheDocument();
    });
});
