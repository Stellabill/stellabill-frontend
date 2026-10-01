import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PauseSubscriptionModal from './PauseSubscriptionModal';

describe('PauseSubscriptionModal', () => {
    const mockOnClose = jest.fn();
    const mockOnConfirm = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

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
        expect(screen.getByText("You won't be charged until you resume. You can resume anytime.")).toBeInTheDocument();
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
});
