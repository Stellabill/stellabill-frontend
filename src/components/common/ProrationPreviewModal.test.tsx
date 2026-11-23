import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProrationPreviewModal } from './ProrationPreviewModal';

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  currentPlan: 'Starter Monthly',
  newPlan: 'Pro Monthly',
  effectiveDate: 'May 15, 2026',
  lineItems: [
    { label: 'Unused time on Starter Monthly', amount: 1250, type: 'credit' as const },
    { label: 'Remaining time on Pro Monthly', amount: 3000, type: 'charge' as const },
  ],
  nextInvoiceTotal: 4999,
};

describe('ProrationPreviewModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ProrationPreviewModal {...defaultProps} isOpen={false} />
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders plan details, effective date, line items, and formats cents as dollars', () => {
    render(<ProrationPreviewModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Proration Preview')).toBeInTheDocument();
    expect(screen.getByText('Starter Monthly')).toBeInTheDocument();
    expect(screen.getByText('Pro Monthly')).toBeInTheDocument();
    expect(screen.getByText('May 15, 2026')).toBeInTheDocument();

    expect(screen.getByRole('table', { name: 'Proration breakdown' })).toBeInTheDocument();
    expect(screen.getByText('Unused time on Starter Monthly')).toBeInTheDocument();
    expect(screen.getByText('-$12.50')).toBeInTheDocument();
    expect(screen.getByText('Remaining time on Pro Monthly')).toBeInTheDocument();
    expect(screen.getByText('+$30.00')).toBeInTheDocument();
    expect(screen.getByText('$49.99')).toBeInTheDocument();
  });

  it('sums credit and charge totals only from items of their respective type', () => {
    const { rerender } = render(
      <ProrationPreviewModal
        {...defaultProps}
        lineItems={[
          { label: 'Credit A', amount: 500, type: 'credit' },
          { label: 'Credit B', amount: 750, type: 'credit' },
          { label: 'Charge A', amount: 2000, type: 'charge' },
          { label: 'Charge B', amount: 1000, type: 'charge' },
        ]}
      />
    );

    // totalCharge = 3000, totalCredit = 1250 -> net = +$17.50
    expect(screen.getByText('+$17.50')).toBeInTheDocument();

    rerender(
      <ProrationPreviewModal
        {...defaultProps}
        lineItems={[
          { label: 'Credit A', amount: 2500, type: 'credit' },
          { label: 'Credit B', amount: 500, type: 'credit' },
          { label: 'Charge A', amount: 1250, type: 'charge' },
        ]}
      />
    );

    // totalCharge = 1250, totalCredit = 3000 -> net = -$17.50
    expect(screen.getByText('-$17.50')).toBeInTheDocument();
  });

  it('renders error message and hides the proration breakdown', () => {
    render(
      <ProrationPreviewModal
        {...defaultProps}
        error="Failed to calculate proration."
      />
    );

    expect(screen.getByText('Failed to calculate proration.')).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: 'Proration breakdown' })).not.toBeInTheDocument();
    expect(screen.queryByText('Calculating proration...')).not.toBeInTheDocument();
  });

  it('shows loading state, puts Confirm Change in loading state, and disables Cancel', () => {
    render(<ProrationPreviewModal {...defaultProps} loading={true} />);

    expect(screen.getByText('Calculating proration...')).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: 'Proration breakdown' })).not.toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    const confirmButton = screen.getByRole('button', { name: 'Confirm Change' });

    expect(cancelButton).toBeDisabled();
    expect(confirmButton).toBeDisabled();
    expect(confirmButton).toHaveAttribute('aria-busy', 'true');
  });

  it('calls onConfirm when Confirm Change is clicked and onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ProrationPreviewModal
        {...defaultProps}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Confirm Change' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('toggles the proration explanation when the info button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProrationPreviewModal {...defaultProps} />);

    const toggleButton = screen.getByRole('button', { name: 'Learn about proration' });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByText(/Proration calculates the unused portion of your current plan/i)
    ).not.toBeInTheDocument();

    await user.click(toggleButton);

    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(toggleButton).toHaveTextContent('Hide details');
    expect(
      screen.getByText(/Proration calculates the unused portion of your current plan/i)
    ).toBeInTheDocument();

    await user.click(toggleButton);

    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(toggleButton).toHaveTextContent('Learn about proration');
    expect(
      screen.queryByText(/Proration calculates the unused portion of your current plan/i)
    ).not.toBeInTheDocument();
  });
});
