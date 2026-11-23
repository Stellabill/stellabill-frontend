import type { ComponentProps } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProrationPreviewModal } from './ProrationPreviewModal';
import styles from './ProrationPreviewModal.module.css';

const lineItems = [
  { label: 'Unused time on Starter plan', amount: 1200, type: 'credit' as const },
  { label: 'Pro plan for remaining cycle', amount: 2500, type: 'charge' as const },
];

function renderModal(
  overrides: Partial<ComponentProps<typeof ProrationPreviewModal>> = {}
) {
  const props: ComponentProps<typeof ProrationPreviewModal> = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    currentPlan: 'Starter',
    newPlan: 'Pro',
    effectiveDate: 'Dec 1, 2026',
    lineItems,
    nextInvoiceTotal: 4500,
    ...overrides,
  };

  return { ...render(<ProrationPreviewModal {...props} />), props };
}

describe('ProrationPreviewModal', () => {
  it('renders nothing while closed', () => {
    const { container } = renderModal({ isOpen: false });

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the plan summary and proration breakdown', () => {
    renderModal();

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Proration Preview')).toBeInTheDocument();
    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText(/Effective date:/)).toBeInTheDocument();
    expect(screen.getByText('Dec 1, 2026')).toBeInTheDocument();

    const table = screen.getByRole('table', { name: 'Proration breakdown' });
    expect(table).toBeInTheDocument();
    expect(screen.getByText('Unused time on Starter plan')).toBeInTheDocument();
    expect(screen.getByText('Pro plan for remaining cycle')).toBeInTheDocument();
    expect(screen.getByText('-$12.00')).toBeInTheDocument();
    expect(screen.getByText('+$25.00')).toBeInTheDocument();
    expect(screen.getByText('+$13.00')).toBeInTheDocument();
    expect(screen.getByText('$45.00')).toBeInTheDocument();
  });

  it('invokes the confirm and cancel callbacks', () => {
    const { props } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Change' }));
    expect(props.onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('renders the loading state and hides the breakdown', () => {
    const { container } = renderModal({ loading: true });

    expect(screen.getByText('Calculating proration...')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(container.querySelector('.' + styles.spinner)).toBeInTheDocument();
    expect(container.querySelector('.' + styles.loadingState)).toBeInTheDocument();
  });

  it('renders the error state and hides the loading and breakdown content', () => {
    const { container } = renderModal({ error: 'Proration could not be calculated.' });

    const alert = screen.getByText('Proration could not be calculated.');
    expect(alert).toHaveClass(styles.errorAlert);
    expect(screen.queryByText('Calculating proration...')).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(container.querySelector('.' + styles.loadingState)).not.toBeInTheDocument();
  });

  it('toggles the proration details panel', () => {
    const { container } = renderModal();

    const toggle = screen.getByRole('button', { name: 'Learn about proration' });
    expect(toggle).toHaveClass(styles.infoToggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);

    expect(screen.getByRole('button', { name: 'Hide details' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(
      screen.getByText(/Proration calculates the unused portion/)
    ).toBeInTheDocument();
    expect(container.querySelector('.' + styles.infoPanel)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hide details' }));

    expect(screen.getByRole('button', { name: 'Learn about proration' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(container.querySelector('.' + styles.infoPanel)).not.toBeInTheDocument();
  });

  it('applies the CSS module classes that replaced inline styles', () => {
    const { container } = renderModal();

    const currentPlanLabel = screen.getByText('Current Plan');
    expect(currentPlanLabel).toHaveClass(styles.planCardLabel);
    expect(currentPlanLabel.parentElement).toHaveClass(styles.planCard);

    const newPlanLabel = screen.getByText('New Plan');
    expect(newPlanLabel).toHaveClass(styles.planCardLabelNew);
    expect(newPlanLabel.parentElement).toHaveClass(styles.planCardNew);

    expect(screen.getByRole('table')).toHaveClass(styles.lineItemsTable);
    expect(container.querySelector('.' + styles.tableHeaderRow)).toBeInTheDocument();
    expect(container.querySelectorAll('.' + styles.lineItemRow)).toHaveLength(
      lineItems.length
    );

    const creditAmount = screen.getByText('-$12.00');
    expect(creditAmount).toHaveClass(styles.lineItemAmountCell);
    expect(creditAmount).toHaveClass(styles.lineItemAmountCredit);

    const chargeAmount = screen.getByText('+$25.00');
    expect(chargeAmount).toHaveClass(styles.lineItemAmountCell);
    expect(chargeAmount).toHaveClass(styles.lineItemAmountCharge);

    expect(container.querySelector('.' + styles.summaryRow)).toBeInTheDocument();
    expect(container.querySelector('.' + styles.nextInvoiceRow)).toBeInTheDocument();
    expect(container.querySelector('.' + styles.infoSection)).toBeInTheDocument();
  });

  it('keeps decorative icons hidden from assistive technology', () => {
    const { container } = renderModal();

    const icons = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThanOrEqual(2);
  });

  it('does not render static inline styles (CSS module regression guard)', () => {
    const { container } = renderModal();

    expect(container.querySelectorAll('[style]')).toHaveLength(0);
  });

  it('does not render static inline styles in loading and error states', () => {
    const loading = renderModal({ loading: true });
    expect(loading.container.querySelectorAll('[style]')).toHaveLength(0);
    loading.unmount();

    const error = renderModal({ error: 'Something went wrong' });
    expect(error.container.querySelectorAll('[style]')).toHaveLength(0);
  });
});
