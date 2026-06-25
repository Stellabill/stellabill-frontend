import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CancelSubscriptionModal from '../../components/CancelSubscriptionModal';

describe('CancelSubscriptionModal Accessibility', () => {
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
    onConfirm.mockClear();
    document.body.innerHTML = '';
  });

  it('traps focus when open', async () => {
    render(
      <CancelSubscriptionModal 
        isOpen={true} 
        onClose={onClose} 
        onConfirm={onConfirm}
        balance="50"
        endDate="2024-12-31"
      />
    );

    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();

    // Wait for initial focus (First offer action button)
    await waitFor(() => {
      const pauseBtn = screen.getByRole('button', { name: /pause instead: pause subscription/i });
      expect(document.activeElement).toBe(pauseBtn);
    });

    const focusableElements = screen.getAllByRole('button');
    const firstElement = focusableElements[0]; // Close button
    const lastElement = focusableElements[focusableElements.length - 1]; // Cancel subscription button

    // Shift+Tab on first element should go to last element
    firstElement.focus();
    fireEvent.keyDown(firstElement, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(lastElement);

    // Tab on last element should go to first element
    lastElement.focus();
    fireEvent.keyDown(lastElement, { key: 'Tab' });
    expect(document.activeElement).toBe(firstElement);
  });

  it('closes on Escape key', () => {
    render(
      <CancelSubscriptionModal 
        isOpen={true} 
        onClose={onClose} 
        onConfirm={onConfirm}
        balance="50"
        endDate="2024-12-31"
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('has proper ARIA attributes', () => {
    render(
      <CancelSubscriptionModal 
        isOpen={true} 
        onClose={onClose} 
        onConfirm={onConfirm}
        balance="50"
        endDate="2024-12-31"
      />
    );

    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby', 'cancel-modal-title');
    expect(modal).toHaveAttribute('aria-describedby', 'cancel-modal-description');
    
    expect(screen.getByText(/before you go/i)).toHaveAttribute('id', 'cancel-modal-title');
    expect(screen.getByText(/we'd love to keep you/i)).toHaveAttribute('id', 'cancel-modal-description');
  });
});
