import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  walletTransactions,
  WALLET_TRANSACTION_FIXTURES,
  filterWalletTransactions,
  paginateWalletTransactions,
  extractCounterpartyAddress,
} from './walletTransactions';
import type { ApiError } from './client';

describe('walletTransactions data source', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = vi.fn();
    vi.stubGlobal('window', {
      location: {
        search: '',
      },
    });
    vi.stubGlobal('navigator', {
      onLine: true,
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('filterWalletTransactions', () => {
    it('returns all transactions when no filters are active', () => {
      const res = filterWalletTransactions(WALLET_TRANSACTION_FIXTURES);
      expect(res).toHaveLength(WALLET_TRANSACTION_FIXTURES.length);
    });

    it('filters by transaction types', () => {
      const res = filterWalletTransactions(WALLET_TRANSACTION_FIXTURES, {
        types: ['new_subscription', 'subscription_paused'],
      });
      expect(res.every((tx) => tx.type === 'new_subscription' || tx.type === 'subscription_paused')).toBe(true);
      expect(res.length).toBeGreaterThan(0);
    });

    it('filters by startDate and endDate', () => {
      const res = filterWalletTransactions(WALLET_TRANSACTION_FIXTURES, {
        startDate: '2026-07-01',
        endDate: '2026-07-20',
      });
      expect(res.map((tx) => tx.id)).toEqual(['tx-3', 'tx-4', 'tx-5']);
    });

    it('filters by minAmount and maxAmount', () => {
      const res = filterWalletTransactions(WALLET_TRANSACTION_FIXTURES, {
        minAmount: '100',
        maxAmount: '250',
      });
      expect(res.every((tx) => tx.amount >= 100 && tx.amount <= 250)).toBe(true);
      expect(res.map((tx) => tx.id)).toEqual(['tx-1', 'tx-3', 'tx-6', 'tx-9', 'tx-12']);
    });

    it('filters by counterparty or details substring', () => {
      const res = filterWalletTransactions(WALLET_TRANSACTION_FIXTURES, {
        counterparty: 'Vault Storage',
      });
      expect(res.map((tx) => tx.id)).toEqual(['tx-5']);
    });
  });

  describe('paginateWalletTransactions', () => {
    it('returns the first page and nextCursor when more items exist', () => {
      const page1 = paginateWalletTransactions(WALLET_TRANSACTION_FIXTURES, {
        limit: 4,
      });
      expect(page1.transactions.map((tx) => tx.id)).toEqual(['tx-1', 'tx-2', 'tx-3', 'tx-4']);
      expect(page1.prevCursor).toBeNull();
      expect(page1.nextCursor).toBe('tx-5');
      expect(page1.totalCount).toBe(WALLET_TRANSACTION_FIXTURES.length);
    });

    it('navigates forward and backward using cursor tokens', () => {
      const page2 = paginateWalletTransactions(WALLET_TRANSACTION_FIXTURES, {
        cursor: 'tx-5',
        limit: 4,
      });
      expect(page2.transactions.map((tx) => tx.id)).toEqual(['tx-5', 'tx-6', 'tx-7', 'tx-8']);
      expect(page2.prevCursor).toBe('tx-1');
      expect(page2.nextCursor).toBe('tx-9');

      const page3 = paginateWalletTransactions(WALLET_TRANSACTION_FIXTURES, {
        cursor: page2.nextCursor,
        limit: 4,
      });
      expect(page3.transactions.map((tx) => tx.id)).toEqual(['tx-9', 'tx-10', 'tx-11', 'tx-12']);
      expect(page3.prevCursor).toBe('tx-5');
      expect(page3.nextCursor).toBeNull();
    });

    it('returns empty page when filters match no transactions', () => {
      const empty = paginateWalletTransactions(WALLET_TRANSACTION_FIXTURES, {
        filters: { counterparty: 'non-existent-counterparty-xyz' },
      });
      expect(empty).toEqual({
        transactions: [],
        nextCursor: null,
        prevCursor: null,
        totalCount: 0,
      });
    });
  });

  describe('extractCounterpartyAddress', () => {
    it('prefers counterpartyAddress when present', () => {
      expect(extractCounterpartyAddress(WALLET_TRANSACTION_FIXTURES[0])).toBe(
        WALLET_TRANSACTION_FIXTURES[0].counterpartyAddress,
      );
    });

    it('strips parenthetical label when counterpartyAddress is omitted', () => {
      const address = extractCounterpartyAddress({
        id: 'tx-99',
        type: 'charge_succeeded',
        details: 'Test',
        counterparty: 'GB7B...K92L (Stellar Cloud)',
        timestamp: '2026-07-28T08:30:00Z',
        amount: 50,
      });
      expect(address).toBe('GB7B...K92L');
    });
  });

  describe('walletTransactions.list()', () => {
    it('returns server data when API responds with valid JSON page', async () => {
      const serverPage = {
        transactions: [WALLET_TRANSACTION_FIXTURES[0]],
        nextCursor: 'tx-2',
        prevCursor: null,
        totalCount: 12,
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify(serverPage),
        json: async () => serverPage,
      });

      const result = await walletTransactions.list({
        address: 'GABC...1234',
        limit: 1,
        filters: { types: ['charge_succeeded'] },
      });

      expect(result).toEqual(serverPage);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/wallet/transactions?address=GABC...1234&limit=1&types=charge_succeeded',
        expect.any(Object),
      );
    });

    it('falls back to cursor-paged fixtures when backend returns 404 in dev/demo', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ details: 'Not found' }),
      });

      const result = await walletTransactions.list({ limit: 3 });
      expect(result.transactions).toHaveLength(3);
      expect(result.nextCursor).toBe('tx-4');
      expect(result.totalCount).toBe(WALLET_TRANSACTION_FIXTURES.length);
    });

    it('throws ApiError on 500 server failure', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ details: 'Horizon node unavailable' }),
      });

      await expect(walletTransactions.list()).rejects.toMatchObject({
        status: 500,
        technicalDetails: 'Horizon node unavailable',
      } satisfies Partial<ApiError>);
    });
  });
});
