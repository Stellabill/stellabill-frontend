import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WalletTransactionFilterPanel from '../WalletTransactionFilterPanel';
import { WalletTransaction } from '../../types/walletTransaction';

const mockTransactions: WalletTransaction[] = [
  {
    id: 'tx-1',
    type: 'charge_succeeded',
    details: 'Cloud Pro Plan',
    counterparty: 'GB7B...K92L (Stellar Cloud)',
    timestamp: '2026-07-28T08:30:00Z',
    amount: 150,
  },
  {
    id: 'tx-2',
    type: 'new_subscription',
    details: 'News Feed Subscription',
    counterparty: 'GC3X...M81P (News Corp)',
    timestamp: '2026-07-27T14:15:00Z',
    amount: 45,
  },
  {
    id: 'tx-3',
    type: 'subscription_paused',
    details: 'Infrastructure Dev',
    counterparty: 'GD9A...P44Q (Dev Infra)',
    timestamp: '2026-07-20T10:00:00Z',
    amount: 200,
  },
];

describe('WalletTransactionFilterPanel', () => {
  it('renders filter panel title and initial state correctly', () => {
    render(<WalletTransactionFilterPanel transactions={mockTransactions} />);

    expect(screen.getByRole('heading', { name: /filter transactions/i })).toBeInTheDocument();
    expect(screen.getByText(/showing 3 of 3 transactions/i)).toBeInTheDocument();
  });

  it('filters transactions by transaction type when type toggle button is clicked', async () => {
    const user = userEvent.setup();
    const handleFiltered = vi.fn();

    render(
      <WalletTransactionFilterPanel
        transactions={mockTransactions}
        onFilteredTransactionsChange={handleFiltered}
      />
    );

    // Click 'Charge Succeeded' type filter button
    const typeBtn = screen.getByRole('button', { name: /charge succeeded/i });
    await user.click(typeBtn);

    // Verify filter chip is displayed
    expect(screen.getByRole('status', { name: /tag: charge succeeded/i })).toBeInTheDocument();

    // Verify parent callback was called with filtered transactions (only tx-1)
    const lastCall = handleFiltered.mock.calls[handleFiltered.mock.calls.length - 1][0];
    expect(lastCall.length).toBe(1);
    expect(lastCall[0].id).toBe('tx-1');
  });

  it('filters transactions by date range', async () => {
    const handleFiltered = vi.fn();

    render(
      <WalletTransactionFilterPanel
        transactions={mockTransactions}
        onFilteredTransactionsChange={handleFiltered}
      />
    );

    const startDateInput = screen.getByLabelText(/start date/i);
    fireEvent.change(startDateInput, { target: { value: '2026-07-28' } });

    const lastCall = handleFiltered.mock.calls[handleFiltered.mock.calls.length - 1][0];
    expect(lastCall.length).toBe(1);
    expect(lastCall[0].id).toBe('tx-1');
  });

  it('filters transactions by amount range', async () => {
    const handleFiltered = vi.fn();

    render(
      <WalletTransactionFilterPanel
        transactions={mockTransactions}
        onFilteredTransactionsChange={handleFiltered}
      />
    );

    const minAmountInput = screen.getByLabelText(/minimum amount/i);
    fireEvent.change(minAmountInput, { target: { value: '100' } });

    const lastCall = handleFiltered.mock.calls[handleFiltered.mock.calls.length - 1][0];
    expect(lastCall.length).toBe(2); // tx-1 (150) and tx-3 (200)
  });

  it('filters transactions by counterparty / search input', async () => {
    const user = userEvent.setup();
    const handleFiltered = vi.fn();

    render(
      <WalletTransactionFilterPanel
        transactions={mockTransactions}
        onFilteredTransactionsChange={handleFiltered}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search by stellar address or details/i);
    await user.type(searchInput, 'News');

    const lastCall = handleFiltered.mock.calls[handleFiltered.mock.calls.length - 1][0];
    expect(lastCall.length).toBe(1);
    expect(lastCall[0].id).toBe('tx-2');
  });

  it('clears all filters when "Clear All" button is clicked', async () => {
    const user = userEvent.setup();

    render(<WalletTransactionFilterPanel transactions={mockTransactions} />);

    // Apply a type filter first
    const typeBtn = screen.getByRole('button', { name: /charge succeeded/i });
    await user.click(typeBtn);

    expect(screen.getByText(/showing 1 of 3 transactions/i)).toBeInTheDocument();

    // Click Clear All
    const clearBtn = screen.getByRole('button', { name: /clear all applied transaction filters/i });
    await user.click(clearBtn);

    expect(screen.getByText(/showing 3 of 3 transactions/i)).toBeInTheDocument();
  });

  it('allows saving and applying custom filter presets', async () => {
    const user = userEvent.setup();

    render(<WalletTransactionFilterPanel transactions={mockTransactions} />);

    // Apply a type filter
    const typeBtn = screen.getByRole('button', { name: /charge succeeded/i });
    await user.click(typeBtn);

    // Click save preset trigger
    const saveTrigger = screen.getByRole('button', { name: /save current filter preset/i });
    await user.click(saveTrigger);

    // Type preset name and submit
    const presetNameInput = screen.getByPlaceholderText(/preset name/i);
    await user.type(presetNameInput, 'My Charges');
    const saveSubmitBtn = screen.getByRole('button', { name: /^save$/i });
    await user.click(saveSubmitBtn);

    // Clear filter
    const clearBtn = screen.getByRole('button', { name: /clear all applied transaction filters/i });
    await user.click(clearBtn);

    // Apply saved preset
    const presetBtn = screen.getByRole('button', { name: /apply preset filter: my charges/i });
    await user.click(presetBtn);

    expect(screen.getByText(/showing 1 of 3 transactions/i)).toBeInTheDocument();
  });

  it('displays empty state message when no transactions match', async () => {
    const user = userEvent.setup();

    render(<WalletTransactionFilterPanel transactions={mockTransactions} />);

    const searchInput = screen.getByPlaceholderText(/search by stellar address or details/i);
    await user.type(searchInput, 'NonExistentCounterparty12345');

    expect(screen.getByText(/showing 0 of 3 transactions/i)).toBeInTheDocument();
    expect(screen.getByText(/no matching transactions found/i)).toBeInTheDocument();
  });

  it('announces count updates to live region for screen readers', async () => {
    const user = userEvent.setup();

    const { container } = render(<WalletTransactionFilterPanel transactions={mockTransactions} />);

    const searchInput = screen.getByPlaceholderText(/search by stellar address or details/i);
    await user.type(searchInput, 'News');

    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion?.textContent).toContain('Filter updated: showing 1 of 3 transactions.');
  });
});
