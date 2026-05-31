import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TopUpModal from '../../components/TopUpModal';

describe('TopUpModal Accessibility', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
    document.body.innerHTML = '';
  });

  it('traps focus when open', async () => {
    render(
      <TopUpModal 
        isOpen={true} 
        onClose={onClose}
      />
    );

    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();

    // Wait for initial focus (Amount input)
    await waitFor(() => {
      const amountInput = screen.getByPlaceholderText('0.00');
      expect(document.activeElement).toBe(amountInput);
    });

    const closeBtn = screen.getByLabelText(/close/i);
    const modalContent = screen.getByRole('dialog');
    const focusableElements = Array.from(
      modalContent.querySelectorAll('button:not([disabled]), input:not([disabled])')
    ) as HTMLElement[];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Shift+Tab on close button should go to the final enabled control
    closeBtn.focus();
    fireEvent.keyDown(closeBtn, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(lastElement);

    // Tab from the last enabled control should cycle back to the close button
    lastElement.focus();
    fireEvent.keyDown(lastElement, { key: 'Tab' });
    expect(document.activeElement).toBe(closeBtn);
  });

  it('closes on Escape key', () => {
    render(
      <TopUpModal 
        isOpen={true} 
        onClose={onClose}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('has proper ARIA attributes', () => {
    render(
      <TopUpModal 
        isOpen={true} 
        onClose={onClose}
      />
    );

    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby', 'topup-modal-title');
    expect(modal).toHaveAttribute('aria-describedby', 'topup-modal-description');
    
    expect(screen.getByText(/top up balance/i)).toHaveAttribute('id', 'topup-modal-title');
    expect(screen.getByText(/add usdc to your prepaid balance/i)).toHaveAttribute('id', 'topup-modal-description');
  });
});
