import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CancelSubscriptionModal from '../CancelSubscriptionModal';

describe('CancelSubscriptionModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
        onOfferSelected: vi.fn(),
        balance: '50.00',
        endDate: '2023-12-31',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing when isOpen is false (empty-result path)', () => {
        const { container } = render(<CancelSubscriptionModal {...defaultProps} isOpen={false} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders SaveOfferStep initially', () => {
        render(<CancelSubscriptionModal {...defaultProps} />);
        expect(screen.getByText('Before you go...')).toBeInTheDocument();
        expect(screen.getByText(/We'd love to keep you/)).toBeInTheDocument();
    });

    it('progresses to confirmation step when "Continue to cancel" is clicked', async () => {
        const user = userEvent.setup();
        render(<CancelSubscriptionModal {...defaultProps} />);
        
        const continueBtn = screen.getByText('Continue to cancel');
        await user.click(continueBtn);

        expect(screen.getByText('Cancel subscription?')).toBeInTheDocument();
        expect(screen.getByText(/Your remaining prepaid balance \(50\.00 USDC\) can be withdrawn/)).toBeInTheDocument();
    });

    it('calls onConfirm when "Cancel subscription" is clicked', async () => {
        const user = userEvent.setup();
        render(<CancelSubscriptionModal {...defaultProps} />);
        
        // Skip offer step
        await user.click(screen.getByText('Continue to cancel'));
        
        // Confirm cancel
        await user.click(screen.getByText('Cancel subscription'));
        expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when "Keep subscription" is clicked on confirmation step', async () => {
        const user = userEvent.setup();
        render(<CancelSubscriptionModal {...defaultProps} />);
        
        // Skip offer step
        await user.click(screen.getByText('Continue to cancel'));
        
        // Keep subscription
        await user.click(screen.getByText('Keep subscription'));
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onOfferSelected and onClose when an offer is chosen', async () => {
        const user = userEvent.setup();
        render(<CancelSubscriptionModal {...defaultProps} />);
        
        // Select an offer
        const offerBtn = screen.getByText('Pause instead');
        await user.click(offerBtn);

        expect(defaultProps.onOfferSelected).toHaveBeenCalledWith('pause');
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close button is clicked', async () => {
        const user = userEvent.setup();
        render(<CancelSubscriptionModal {...defaultProps} />);
        
        const closeBtn = screen.getByLabelText('Close');
        await user.click(closeBtn);

        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('disables buttons and shows loading state when isLoading is true', async () => {
        const user = userEvent.setup();
        render(<CancelSubscriptionModal {...defaultProps} isLoading={true} />);
        
        // Skip offer step
        await user.click(screen.getByText('Continue to cancel'));
        
        const confirmBtn = screen.getByText('Cancelling...');
        expect(confirmBtn).toBeDisabled();
        
        const keepBtn = screen.getByText('Keep subscription');
        expect(keepBtn).toBeDisabled();
    });
});
