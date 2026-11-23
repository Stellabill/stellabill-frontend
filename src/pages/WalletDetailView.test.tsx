import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TYPE_CONFIG } from '../components/recentActivity';
import type { WalletTransaction } from '../types/walletTransaction';
import WalletDetailView from './WalletDetailView';

const transactions: WalletTransaction[] = [
  {
    id: 'tx-charge',
    type: 'charge_succeeded',
    details: 'Monthly subscription payment',
    counterparty: 'Northstar Cloud',
    timestamp: '2026-07-28T08:30:00Z',
    amount: 150,
  },
  {
    id: 'tx-new',
    type: 'new_subscription',
    details: 'Started an analytics subscription',
    counterparty: 'Dataworks',
    timestamp: '2026-07-27T14:15:00Z',
    amount: 45,
  },
  {
    id: 'tx-paused',
    type: 'subscription_paused',
    details: 'Paused infrastructure subscription',
    counterparty: 'Cloudhost',
    timestamp: '2026-07-20T10:00:00Z',
    amount: 200,
  },
  {
    id: 'tx-resumed',
    type: 'subscription_resumed',
    details: 'Resumed storage subscription',
    counterparty: 'Vault Storage',
    timestamp: '2026-07-15T16:45:00Z',
    amount: 80,
  },
  {
    id: 'tx-cancelled',
    type: 'subscription_cancelled',
    details: 'Cancelled legacy plan',
    counterparty: 'Old Plans Inc',
    timestamp: '2026-07-10T11:20:00Z',
    amount: 120,
  },
];

const getTransactionList = () => within(screen.getByRole('region', { name: 'Filtered transaction list' })).getByRole('list');

describe('WalletDetailView', () => {
  it('renders the heading and the supplied wallet address', () => {
    render(<WalletDetailView address="GTEST...1234" initialTransactions={transactions} />);

    expect(screen.getByRole('heading', { name: 'Wallet Details & History' })).toBeInTheDocument();
    expect(screen.getByText('GTEST...1234')).toBeInTheDocument();
  });

  it('renders each initial transaction with its configured type label', () => {
    render(<WalletDetailView initialTransactions={transactions} />);

    const rows = within(getTransactionList()).getAllByRole('listitem');
    expect(rows).toHaveLength(transactions.length);

    transactions.forEach((transaction) => {
      const row = rows.find((item) => item.textContent?.includes(transaction.details));
      expect(row).toBeDefined();
      expect(within(row as HTMLElement).getByText(TYPE_CONFIG[transaction.type].label)).toBeInTheDocument();
    });
  });

  it('narrows the transaction list when a type filter is applied', async () => {
    const user = userEvent.setup();
    render(<WalletDetailView initialTransactions={transactions} />);

    await user.click(screen.getByRole('button', { name: 'New Subscription' }));

    await waitFor(() => {
      const rows = within(getTransactionList()).getAllByRole('listitem');
      expect(rows).toHaveLength(1);
      expect(within(rows[0]).getByText('Started an analytics subscription')).toBeInTheDocument();
    });
    expect(screen.queryByText('Monthly subscription payment')).not.toBeInTheDocument();
  });

  it('shows the empty state when no transactions match the filter', async () => {
    const user = userEvent.setup();
    render(<WalletDetailView initialTransactions={transactions} />);

    await user.type(screen.getByPlaceholderText('Search by Stellar address or details...'), 'no matching party');

    expect(await screen.findByText(/try adjusting your filter criteria/i)).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Filtered transaction list' })).not.toBeInTheDocument();
  });

  it('uses the charge-succeeded label for an unknown transaction type', () => {
    const unknownTransaction = {
      ...transactions[0],
      id: 'tx-unknown',
      type: 'unknown_type',
    } as unknown as WalletTransaction;
    render(<WalletDetailView initialTransactions={[unknownTransaction]} />);

    const row = within(getTransactionList()).getByRole('listitem');
    expect(within(row).getByText(TYPE_CONFIG.charge_succeeded.label)).toBeInTheDocument();
  });
});
