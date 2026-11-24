import { fireEvent, render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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

  it('shows the review step after valid amount and then confirmation after confirm', async () => {
    render(<TopUpModal isOpen onClose={vi.fn()} />);

    const amountInput = screen.getByRole('textbox', { name: /top up amount/i });
    fireEvent.change(amountInput, { target: { value: '20' } });
    fireEvent.blur(amountInput);

    expect(screen.getByRole('button', { name: /review top up/i })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: /review top up/i }));

    expect(screen.getByText(/balance after top-up/i)).toBeInTheDocument();
    expect(screen.getByText(/confirm top up/i)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /confirm top up/i }));
    });

    expect(screen.getByText(/top up successful/i)).toBeInTheDocument();
    expect(screen.getByText(/updated to 50.00 usdc/i)).toBeInTheDocument();
  });

  it('renders prop-driven values for planName, planPrice, currentBalance, walletBalance, currency', () => {
    render(
      <TopUpModal
        isOpen
        onClose={vi.fn()}
        planName="Enterprise Plus"
        planPrice={25}
        currentBalance={75}
        walletBalance={300}
        currency="XLM"
      />
    );

    expect(screen.getByText(/Enterprise Plus/i)).toBeInTheDocument();
    expect(screen.getByText(/Add XLM to your prepaid balance/i)).toBeInTheDocument();
    expect(screen.getByText('75.00')).toBeInTheDocument();
    expect(screen.getByText(/300\.00 XLM/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /1 month/i })).toHaveTextContent('25.00 XLM');
    expect(screen.getByRole('button', { name: /3 months/i })).toHaveTextContent('75.00 XLM');
  });

  it('renders an ordered step indicator with aria-current="step"', () => {
    render(<TopUpModal isOpen onClose={vi.fn()} />);

    const stepList = screen.getByRole('list', { name: /top up flow steps/i });
    expect(stepList).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveAttribute('aria-current', 'step');
    expect(items[1]).not.toHaveAttribute('aria-current');
    expect(items[2]).not.toHaveAttribute('aria-current');
  });

  it('calls onConfirm with amount, shows pending state, and updates displayed balance on success', async () => {
    let resolveConfirm!: () => void;
    const onConfirm = vi.fn().mockImplementation(() => {
      return new Promise<void>((resolve) => {
        resolveConfirm = resolve;
      });
    });

    render(
      <TopUpModal
        isOpen
        onClose={vi.fn()}
        planName="Pro Plan"
        planPrice={20}
        currentBalance={40}
        walletBalance={200}
        currency="USDC"
        onConfirm={onConfirm}
      />
    );

    const amountInput = screen.getByRole('textbox', { name: /top up amount/i });
    fireEvent.change(amountInput, { target: { value: '60' } });
    fireEvent.blur(amountInput);

    fireEvent.click(screen.getByRole('button', { name: /review top up/i }));

    const confirmBtn = screen.getByRole('button', { name: /confirm top up/i });
    fireEvent.click(confirmBtn);

    // Shows pending state and disables confirm button
    expect(screen.getByRole('button', { name: /confirming/i })).toBeDisabled();

    // Resolve confirm promise
    await act(async () => {
      resolveConfirm();
    });

    expect(onConfirm).toHaveBeenCalledWith(60);
    expect(screen.getByText(/top up successful/i)).toBeInTheDocument();
    expect(screen.getByText(/updated to 100\.00 usdc/i)).toBeInTheDocument();
  });
});
