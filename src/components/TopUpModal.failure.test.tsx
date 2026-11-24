import { fireEvent, render, screen, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TopUpModal from './TopUpModal';

/**
 * Focused regression coverage for the failure / empty-result paths of
 * `TopUpModal` (issue #839). The existing suites cover the happy path and the
 * a11y surface; this file pins the `if (!isOpen) return null;` guard, the
 * state-reset side effect, the overlay-vs-dialog close contract and the
 * validation gates that keep the review CTA disabled.
 */
describe('TopUpModal failure handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing at all while closed (the `!isOpen` guard)', () => {
    const { container } = render(<TopUpModal isOpen={false} onClose={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(container.querySelector('.topup-modal-overlay')).toBeNull();
  });

  it('re-hides the dialog when it transitions from open to closed', () => {
    const onClose = vi.fn();
    const { rerender } = render(<TopUpModal isOpen onClose={onClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    rerender(<TopUpModal isOpen={false} onClose={onClose} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('resets amount, quick-select and step back to defaults when reopened', () => {
    const onClose = vi.fn();
    const { rerender } = render(<TopUpModal isOpen onClose={onClose} />);

    // Drive the modal into the review step so there is state worth resetting.
    fireEvent.click(screen.getByRole('button', { name: /3 months/i }));
    expect(screen.getByRole('textbox', { name: /top up amount/i })).toHaveValue('30.00');
    fireEvent.click(screen.getByRole('button', { name: /review top up/i }));
    expect(screen.getByText(/balance after top-up/i)).toBeInTheDocument();

    rerender(<TopUpModal isOpen={false} onClose={onClose} />);
    rerender(<TopUpModal isOpen onClose={onClose} />);

    expect(screen.getByRole('textbox', { name: /top up amount/i })).toHaveValue('0.00');
    expect(screen.getByRole('button', { name: /review top up/i })).toBeDisabled();
    expect(screen.queryByText(/balance after top-up/i)).not.toBeInTheDocument();
  });

  it('closes when the backdrop itself is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<TopUpModal isOpen onClose={onClose} />);

    const overlay = container.querySelector('.topup-modal-overlay');
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay as HTMLElement);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when the dialog body is clicked', () => {
    const onClose = vi.fn();
    render(<TopUpModal isOpen onClose={onClose} />);

    fireEvent.click(screen.getByRole('dialog'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('keeps Review disabled and surfaces the wallet failure while over balance', () => {
    render(<TopUpModal isOpen onClose={vi.fn()} />);
    const amount = screen.getByRole('textbox', { name: /top up amount/i });

    fireEvent.change(amount, { target: { value: '200' } });
    fireEvent.blur(amount);

    expect(screen.getByText(/wallet balance is not enough/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /review top up/i })).toBeDisabled();

    // Recovering from the failure re-enables Review and clears the alert.
    fireEvent.change(amount, { target: { value: '20' } });
    expect(screen.queryByText(/wallet balance is not enough/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /review top up/i })).toBeEnabled();
  });

  it('treats a zero amount as invalid and blocks Review', () => {
    render(<TopUpModal isOpen onClose={vi.fn()} />);
    const amount = screen.getByRole('textbox', { name: /top up amount/i });

    fireEvent.change(amount, { target: { value: '0' } });
    fireEvent.blur(amount);

    expect(screen.getByText(/greater than 0/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /review top up/i })).toBeDisabled();
  });

  it('ignores non-numeric keystrokes instead of putting the form into an error state', () => {
    render(<TopUpModal isOpen onClose={vi.fn()} />);
    const amount = screen.getByRole('textbox', { name: /top up amount/i }) as HTMLInputElement;

    fireEvent.change(amount, { target: { value: 'abc' } });

    // The controlled input never adopts the rejected value.
    expect(amount).toHaveValue('0.00');
    expect(screen.getByRole('button', { name: /review top up/i })).toBeDisabled();
  });

  it('rejects input with more than 7 decimal places', () => {
    render(<TopUpModal isOpen onClose={vi.fn()} />);
    const amount = screen.getByRole('textbox', { name: /top up amount/i }) as HTMLInputElement;

    fireEvent.change(amount, { target: { value: '5.1234567' } });
    expect(amount).toHaveValue('5.1234567');

    // Attempting to add an 8th decimal place is rejected (value remains at 7 decimal places)
    fireEvent.change(amount, { target: { value: '5.12345678' } });
    expect(amount).toHaveValue('5.1234567');

    // Direct input with >7 decimals from initial value is rejected
    fireEvent.change(amount, { target: { value: '1.23456789' } });
    expect(amount).toHaveValue('5.1234567');
  });

  it('compares amounts in minor units against wallet balance', () => {
    render(
      <TopUpModal
        isOpen
        onClose={vi.fn()}
        walletBalance={50}
      />
    );
    const amount = screen.getByRole('textbox', { name: /top up amount/i });

    // Amount slightly exceeding wallet balance in fractional stroops
    fireEvent.change(amount, { target: { value: '50.0000001' } });
    expect(screen.getByText(/wallet balance is not enough/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /review top up/i })).toBeDisabled();

    // Exactly at wallet balance is allowed
    fireEvent.change(amount, { target: { value: '50.0000000' } });
    expect(screen.queryByText(/wallet balance is not enough/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /review top up/i })).toBeEnabled();
  });

  it('shows pending, then upon rejection displays error and keeps modal on review step', async () => {
    let rejectConfirm!: (err: Error) => void;
    const onConfirm = vi.fn().mockImplementation(() => {
      return new Promise<void>((_, reject) => {
        rejectConfirm = reject;
      });
    });

    render(
      <TopUpModal
        isOpen
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    const amountInput = screen.getByRole('textbox', { name: /top up amount/i });
    fireEvent.change(amountInput, { target: { value: '20' } });
    fireEvent.blur(amountInput);

    fireEvent.click(screen.getByRole('button', { name: /review top up/i }));
    const confirmBtn = screen.getByRole('button', { name: /confirm top up/i });
    fireEvent.click(confirmBtn);

    // Shows pending and disables confirm
    expect(screen.getByRole('button', { name: /confirming/i })).toBeDisabled();

    // Reject promise
    await act(async () => {
      rejectConfirm(new Error('Network transaction dropped'));
    });

    // Rejection shows error and keeps modal on review
    expect(screen.getByRole('alert')).toHaveTextContent('Network transaction dropped');
    expect(screen.getByRole('button', { name: /confirm top up/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit amount/i })).toBeInTheDocument();
    expect(screen.queryByText(/top up successful/i)).not.toBeInTheDocument();
  });
});
