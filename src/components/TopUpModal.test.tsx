import { fireEvent, render, screen } from '@testing-library/react';
import TopUpModal from './TopUpModal';

describe('TopUpModal', () => {
  it('shows the choose amount step when open', () => {
    render(<TopUpModal isOpen onClose={vi.fn()} />);

    expect(screen.getByRole('heading', { name: /top up balance/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /review top up/i })).toBeDisabled();
  });

  it('allows choosing a quick select option and enables review', () => {
    render(<TopUpModal isOpen onClose={vi.fn()} />);

    const option = screen.getByRole('button', { name: /3 months/i });
    fireEvent.click(option);

    expect(screen.getByRole('textbox', { name: /top up amount/i })).toHaveValue('30.00');
    expect(screen.getByRole('button', { name: /review top up/i })).toBeEnabled();
  });

  it('displays a validation message when the amount exceeds wallet balance', () => {
    render(<TopUpModal isOpen onClose={vi.fn()} />);

    const amountInput = screen.getByRole('textbox', { name: /top up amount/i });
    fireEvent.change(amountInput, { target: { value: '200' } });
    fireEvent.blur(amountInput);

    expect(screen.getByText(/wallet balance is not enough/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /review top up/i })).toBeDisabled();
  });

  it('shows the review step after valid amount and then confirmation after confirm', () => {
    render(<TopUpModal isOpen onClose={vi.fn()} />);

    const amountInput = screen.getByRole('textbox', { name: /top up amount/i });
    fireEvent.change(amountInput, { target: { value: '20' } });
    fireEvent.blur(amountInput);

    expect(screen.getByRole('button', { name: /review top up/i })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: /review top up/i }));

    expect(screen.getByText(/balance after top-up/i)).toBeInTheDocument();
    expect(screen.getByText(/confirm top up/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /confirm top up/i }));

    expect(screen.getByText(/top up successful/i)).toBeInTheDocument();
    expect(screen.getByText(/updated to 50.00 usdc/i)).toBeInTheDocument();
  });
});
