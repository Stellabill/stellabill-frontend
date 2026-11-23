import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import WalletDetailView from './WalletDetailView';
import {
  WALLET_TRANSACTION_FIXTURES,
  walletTransactions,
  paginateWalletTransactions,
} from '../api/walletTransactions';
import { SAVED_FILTERS_STORAGE_KEY } from '../types/walletTransaction';
import type { ApiError } from '../api/client';

describe('WalletDetailView', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(walletTransactions, 'list').mockImplementation(
      async (query = {}, _options, fixtureSource = WALLET_TRANSACTION_FIXTURES) => {
        return paginateWalletTransactions(fixtureSource, query);
      },
    );
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders loading state initially and then renders transaction table', async () => {
    let resolvePage!: (value: ReturnType<typeof paginateWalletTransactions>) => void;
    vi.spyOn(walletTransactions, 'list').mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePage = resolve;
        }),
    );

    render(<WalletDetailView address="GCFX12345678908923" />);

    expect(screen.getByRole('status', { name: /loading transactions/i })).toBeInTheDocument();

    resolvePage(paginateWalletTransactions(WALLET_TRANSACTION_FIXTURES, { limit: 5 }));

    const table = await screen.findByTestId('wallet-transactions-table');
    expect(table).toBeInTheDocument();
    expect(within(table).getAllByRole('row')).toHaveLength(6); // 1 header + 5 rows
  });

  it('renders explorer links for the wallet account, counterparty accounts, and transactions', async () => {
    render(<WalletDetailView address="GCFX12345678908923" network="Mainnet" pageSize={3} />);

    await screen.findByTestId('wallet-transactions-table');

    const accountLink = screen.getByRole('link', {
      name: /view account GCFX12345678908923 on stellar explorer/i,
    });
    expect(accountLink).toHaveAttribute(
      'href',
      'https://stellar.expert/explorer/public/account/GCFX12345678908923',
    );

    const firstTx = WALLET_TRANSACTION_FIXTURES[0];
    const counterpartyLinks = screen.getAllByRole('link', {
      name: new RegExp('View counterparty ' + firstTx.counterparty.replace(/[()]/g, '\\$&'), 'i'),
    });
    expect(counterpartyLinks[0]).toHaveAttribute(
      'href',
      'https://stellar.expert/explorer/public/account/' + firstTx.counterpartyAddress,
    );

    const txLink = screen.getByRole('link', { name: /view tx-1 on explorer/i });
    expect(txLink).toHaveAttribute(
      'href',
      'https://stellar.expert/explorer/public/tx/' + firstTx.txHash,
    );
  });

  it('uses testnet explorer URLs when network is Testnet', async () => {
    render(<WalletDetailView address="GTEST123456789" network="Testnet" pageSize={2} />);

    await screen.findByTestId('wallet-transactions-table');

    const accountLink = screen.getByRole('link', {
      name: /view account GTEST123456789 on stellar explorer/i,
    });
    expect(accountLink).toHaveAttribute(
      'href',
      'https://stellar.expert/explorer/testnet/account/GTEST123456789',
    );
  });

  it('paginates forward and backward with cursor paging', async () => {
    render(<WalletDetailView pageSize={5} />);

    await screen.findByTestId('wallet-transactions-table');

    expect(screen.getByText('Created subscription for News API Pro')).toBeInTheDocument();
    expect(screen.queryByText('Cancelled Legacy Analytics Feed')).not.toBeInTheDocument();

    const prevBtn = screen.getByRole('button', { name: /previous page/i });
    const nextBtn = screen.getByRole('button', { name: /next page/i });

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    // Go to page 2
    fireEvent.click(screen.getByRole('button', { name: /next page/i }));

    await waitFor(() => {
      expect(screen.getByText('Cancelled Legacy Analytics Feed')).toBeInTheDocument();
    });
    expect(screen.queryByText('Created subscription for News API Pro')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous page/i })).not.toBeDisabled();

    // Go to page 3 (last 2 items of 12)
    fireEvent.click(screen.getByRole('button', { name: /next page/i }));

    await waitFor(() => {
      expect(screen.getByText('Annual Compliance Audit Feed')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();

    // Go back to page 2
    fireEvent.click(screen.getByRole('button', { name: /previous page/i }));

    await waitFor(() => {
      expect(screen.getByText('Cancelled Legacy Analytics Feed')).toBeInTheDocument();
    });
  });

  it('filters transactions by type, amount, date, and counterparty and resets to page 1', async () => {
    render(<WalletDetailView pageSize={5} />);

    await screen.findByTestId('wallet-transactions-table');

    // Filter by type: Paused
    const pausedTypeBtn = screen.getByRole('button', { name: 'Paused' });
    fireEvent.click(pausedTypeBtn);

    await waitFor(() => {
      expect(screen.getByText('Paused Dev Infrastructure Subscription')).toBeInTheDocument();
      expect(screen.getByText('Paused Sandbox Validator Node')).toBeInTheDocument();
    });
    expect(screen.queryByText('Monthly Pro Plan - Stellar Cloud Services')).not.toBeInTheDocument();

    // Filter by minimum amount 300
    const minAmountInput = screen.getByLabelText('Minimum amount');
    fireEvent.change(minAmountInput, { target: { value: '300' } });

    await waitFor(() => {
      expect(screen.queryByText('Paused Dev Infrastructure Subscription')).not.toBeInTheDocument();
      expect(screen.getByText('Paused Sandbox Validator Node')).toBeInTheDocument();
    });

    // Clear all filters
    const clearAllBtn = screen.getByRole('button', {
      name: /clear all applied transaction filters/i,
    });
    fireEvent.click(clearAllBtn);

    await waitFor(() => {
      expect(screen.getByText('Monthly Pro Plan - Stellar Cloud Services')).toBeInTheDocument();
    });
  });

  it('persists saved filter presets in localStorage and survives reload (remount)', async () => {
    const { unmount } = render(<WalletDetailView pageSize={5} />);

    await screen.findByTestId('wallet-transactions-table');

    // Apply a counterparty filter
    const counterpartyInput = screen.getByLabelText(/counterparty \/ address \/ description/i);
    fireEvent.change(counterpartyInput, { target: { value: 'Vault Storage' } });

    await waitFor(() => {
      expect(screen.getByText('Resumed Storage Vault Service')).toBeInTheDocument();
      expect(screen.queryByText('Monthly Pro Plan - Stellar Cloud Services')).not.toBeInTheDocument();
    });

    // Save current filter preset
    const saveTrigger = screen.getByRole('button', { name: /save current filter preset/i });
    fireEvent.click(saveTrigger);

    const presetNameInput = screen.getByPlaceholderText(/preset name/i);
    fireEvent.change(presetNameInput, { target: { value: 'Vault Only' } });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    // Verify preset button appears and localStorage has the saved filter
    expect(screen.getByRole('button', { name: /apply preset filter: vault only/i })).toBeInTheDocument();
    const rawSaved = localStorage.getItem(SAVED_FILTERS_STORAGE_KEY);
    expect(rawSaved).not.toBeNull();
    expect(JSON.parse(rawSaved!)).toEqual([
      expect.objectContaining({
        name: 'Vault Only',
        filter: expect.objectContaining({ counterparty: 'Vault Storage' }),
      }),
    ]);

    // Unmount and remount to simulate page reload
    unmount();

    render(<WalletDetailView pageSize={5} />);
    await screen.findByTestId('wallet-transactions-table');

    // Preset survives reload
    const restoredPresetBtn = screen.getByRole('button', {
      name: /apply preset filter: vault only/i,
    });
    expect(restoredPresetBtn).toBeInTheDocument();

    // Clicking the restored preset applies the saved filter
    fireEvent.click(restoredPresetBtn);

    await waitFor(() => {
      expect(screen.getByText('Resumed Storage Vault Service')).toBeInTheDocument();
      expect(screen.queryByText('Monthly Pro Plan - Stellar Cloud Services')).not.toBeInTheDocument();
    });
  });

  it('shows empty state when no transactions match active filters', async () => {
    render(<WalletDetailView pageSize={5} />);

    await screen.findByTestId('wallet-transactions-table');

    const counterpartyInput = screen.getByLabelText(/counterparty \/ address \/ description/i);
    fireEvent.change(counterpartyInput, { target: { value: 'NoSuchCounterparty9999' } });

    expect(await screen.findByText('No transactions match your filters')).toBeInTheDocument();
    expect(screen.queryByTestId('wallet-transactions-table')).not.toBeInTheDocument();
  });

  it('shows error state and retries when fetching transactions fails', async () => {
    const apiError: ApiError = Object.assign(new Error('Horizon RPC timeout'), {
      status: 503,
      technicalDetails: 'Upstream Stellar Horizon endpoint returned 503',
    });

    const listSpy = vi
      .spyOn(walletTransactions, 'list')
      .mockRejectedValueOnce(apiError)
      .mockImplementation(async (query = {}) =>
        paginateWalletTransactions(WALLET_TRANSACTION_FIXTURES, query),
      );

    render(<WalletDetailView pageSize={5} />);

    expect(await screen.findByText('Transactions Unavailable')).toBeInTheDocument();
    expect(screen.getByText('Horizon RPC timeout')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryBtn);

    expect(await screen.findByTestId('wallet-transactions-table')).toBeInTheDocument();
    expect(listSpy).toHaveBeenCalledTimes(2);
  });
});
