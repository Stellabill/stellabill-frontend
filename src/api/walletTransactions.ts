import { api } from './client';
import type { ApiError, ApiRequestOptions } from './client';
import {
  INITIAL_FILTER_STATE,
  type WalletTransaction,
  type WalletTransactionFilterState,
  type WalletTransactionsPage,
  type WalletTransactionsQuery,
} from '../types/walletTransaction';

export const DEFAULT_WALLET_TRANSACTIONS_LIMIT = 5;

export const WALLET_TRANSACTION_FIXTURES: WalletTransaction[] = [
  {
    id: 'tx-1',
    type: 'charge_succeeded',
    details: 'Monthly Pro Plan - Stellar Cloud Services',
    counterparty: 'GB7B...K92L (Stellar Cloud)',
    counterpartyAddress: 'GB7B7R3M7F5W7N2K8P4L6X9Q2V1B3N5M7K9L2P4Q6R8T1V3X5Z7K92L',
    timestamp: '2026-07-28T08:30:00Z',
    amount: 150,
    currency: 'XLM',
    txHash: '8f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f01',
  },
  {
    id: 'tx-2',
    type: 'new_subscription',
    details: 'Created subscription for News API Pro',
    counterparty: 'GC3X...M81P (News Corp)',
    counterpartyAddress: 'GC3X8K2M4N6P8Q1R3T5V7W9Y2B4D6F8H1J3L5N7P9R2T4V6X8Z1M81P',
    timestamp: '2026-07-27T14:15:00Z',
    amount: 45,
    currency: 'XLM',
    txHash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a02',
  },
  {
    id: 'tx-3',
    type: 'subscription_paused',
    details: 'Paused Dev Infrastructure Subscription',
    counterparty: 'GD9A...P44Q (Dev Infra Inc)',
    counterpartyAddress: 'GD9A2C4E6G8J1L3N5P7R9T2V4X6Z8B1D3F5H7J9L2N4P6R8T1V3P44Q',
    timestamp: '2026-07-20T10:00:00Z',
    amount: 200,
    currency: 'XLM',
    txHash: '2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b03',
  },
  {
    id: 'tx-4',
    type: 'charge_succeeded',
    details: 'Quarterly Enterprise Support Fee',
    counterparty: 'GB7B...K92L (Stellar Cloud)',
    counterpartyAddress: 'GB7B7R3M7F5W7N2K8P4L6X9Q2V1B3N5M7K9L2P4Q6R8T1V3X5Z7K92L',
    timestamp: '2026-07-15T16:45:00Z',
    amount: 850,
    currency: 'XLM',
    txHash: '3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c04',
  },
  {
    id: 'tx-5',
    type: 'subscription_resumed',
    details: 'Resumed Storage Vault Service',
    counterparty: 'GA5C...W19K (Vault Storage)',
    counterpartyAddress: 'GA5C1E3G5J7L9N2P4R6T8V1X3Z5B7D9F2H4J6L8N1P3R5T7V9X2W19K',
    timestamp: '2026-07-10T11:20:00Z',
    amount: 80,
    currency: 'XLM',
    txHash: '4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d05',
  },
  {
    id: 'tx-6',
    type: 'subscription_cancelled',
    details: 'Cancelled Legacy Analytics Feed',
    counterparty: 'GE1Z...L55R (Data Feeds Ltd)',
    counterpartyAddress: 'GE1Z3B5D7F9H2J4L6N8P1R3T5V7X9Z2B4D6F8H1J3L5N7P9R2T4L55R',
    timestamp: '2026-06-30T09:00:00Z',
    amount: 120,
    currency: 'XLM',
    txHash: '5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e06',
  },
  {
    id: 'tx-7',
    type: 'charge_succeeded',
    details: 'Monthly API Gateway Tier 2',
    counterparty: 'GC9F...H21M (Gateway Labs)',
    counterpartyAddress: 'GC9F2H4J6L8N1P3R5T7V9X2Z4B6D8F1H3J5L7N9P2R4T6V8X1Z3H21M',
    timestamp: '2026-06-22T18:10:00Z',
    amount: 310,
    currency: 'XLM',
    txHash: '6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f07',
  },
  {
    id: 'tx-8',
    type: 'new_subscription',
    details: 'Subscribed to Horizon Indexer Plus',
    counterparty: 'GD4M...R77T (Horizon Ops)',
    counterpartyAddress: 'GD4M6P8R1T3V5X7Z9B2D4F6H8J1L3N5P7R9T2V4X6Z8B1D3F5H7R77T',
    timestamp: '2026-06-15T12:05:00Z',
    amount: 95,
    currency: 'XLM',
    txHash: '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a08',
  },
  {
    id: 'tx-9',
    type: 'charge_succeeded',
    details: 'Monthly Pro Plan - Stellar Cloud Services',
    counterparty: 'GB7B...K92L (Stellar Cloud)',
    counterpartyAddress: 'GB7B7R3M7F5W7N2K8P4L6X9Q2V1B3N5M7K9L2P4Q6R8T1V3X5Z7K92L',
    timestamp: '2026-06-01T08:30:00Z',
    amount: 150,
    currency: 'XLM',
    txHash: '8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b09',
  },
  {
    id: 'tx-10',
    type: 'subscription_paused',
    details: 'Paused Sandbox Validator Node',
    counterparty: 'GA2W...Q88B (Validator Co)',
    counterpartyAddress: 'GA2W4Y6B8D1F3H5J7L9N2P4R6T8V1X3Z5B7D9F2H4J6L8N1P3R5Q88B',
    timestamp: '2026-05-24T15:40:00Z',
    amount: 500,
    currency: 'XLM',
    txHash: '9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c10',
  },
  {
    id: 'tx-11',
    type: 'charge_succeeded',
    details: 'Annual Compliance Audit Feed',
    counterparty: 'GE1Z...L55R (Data Feeds Ltd)',
    counterpartyAddress: 'GE1Z3B5D7F9H2J4L6N8P1R3T5V7X9Z2B4D6F8H1J3L5N7P9R2T4L55R',
    timestamp: '2026-05-12T09:15:00Z',
    amount: 1200,
    currency: 'XLM',
    txHash: '0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d11',
  },
  {
    id: 'tx-12',
    type: 'new_subscription',
    details: 'Started Soroban RPC Dedicated Endpoint',
    counterparty: 'GB7B...K92L (Stellar Cloud)',
    counterpartyAddress: 'GB7B7R3M7F5W7N2K8P4L6X9Q2V1B3N5M7K9L2P4Q6R8T1V3X5Z7K92L',
    timestamp: '2026-05-01T07:00:00Z',
    amount: 150,
    currency: 'XLM',
    txHash: '1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e12',
  },
];

/**
 * Extracts a Stellar account identifier or address token from a counterparty display string.
 * E.g. "GB7B...K92L (Stellar Cloud)" -> "GB7B...K92L".
 */
export function extractCounterpartyAddress(tx: WalletTransaction): string {
  if (tx.counterpartyAddress && tx.counterpartyAddress.trim().length > 0) {
    return tx.counterpartyAddress.trim();
  }
  const raw = tx.counterparty.trim();
  const parenIdx = raw.indexOf('(');
  if (parenIdx > 0) {
    return raw.slice(0, parenIdx).trim();
  }
  return raw;
}

/**
 * Filters a list of WalletTransaction items according to WalletTransactionFilterState.
 */
export function filterWalletTransactions(
  transactions: WalletTransaction[],
  filterInput?: Partial<WalletTransactionFilterState>,
): WalletTransaction[] {
  const filters: WalletTransactionFilterState = {
    ...INITIAL_FILTER_STATE,
    ...filterInput,
    types: filterInput?.types ?? INITIAL_FILTER_STATE.types,
  };

  return transactions.filter((tx) => {
    if (filters.types.length > 0 && !filters.types.includes(tx.type)) {
      return false;
    }

    if (filters.startDate) {
      const txDate = new Date(tx.timestamp).getTime();
      const startDate = new Date(filters.startDate).getTime();
      if (!isNaN(startDate) && txDate < startDate) return false;
    }

    if (filters.endDate) {
      const txDate = new Date(tx.timestamp).getTime();
      const endDate = new Date(filters.endDate);
      endDate.setUTCHours(23, 59, 59, 999);
      if (!isNaN(endDate.getTime()) && txDate > endDate.getTime()) return false;
    }

    if (filters.minAmount !== '' && !isNaN(Number(filters.minAmount))) {
      if (tx.amount < Number(filters.minAmount)) return false;
    }

    if (filters.maxAmount !== '' && !isNaN(Number(filters.maxAmount))) {
      if (tx.amount > Number(filters.maxAmount)) return false;
    }

    if (filters.counterparty.trim() !== '') {
      const query = filters.counterparty.trim().toLowerCase();
      const matchCounterparty = tx.counterparty.toLowerCase().includes(query);
      const matchDetails = tx.details.toLowerCase().includes(query);
      const matchAddress = tx.counterpartyAddress
        ? tx.counterpartyAddress.toLowerCase().includes(query)
        : false;
      if (!matchCounterparty && !matchDetails && !matchAddress) return false;
    }

    return true;
  });
}

/**
 * Applies cursor-based pagination over a filtered transaction list.
 * Cursor is the transaction `id` of the first item on the requested page.
 */
export function paginateWalletTransactions(
  transactions: WalletTransaction[],
  query: Pick<WalletTransactionsQuery, 'cursor' | 'limit' | 'filters'> = {},
): WalletTransactionsPage {
  const filtered = filterWalletTransactions(transactions, query.filters);
  const limit = query.limit && query.limit > 0 ? query.limit : DEFAULT_WALLET_TRANSACTIONS_LIMIT;
  const totalCount = filtered.length;

  if (totalCount === 0) {
    return {
      transactions: [],
      nextCursor: null,
      prevCursor: null,
      totalCount: 0,
    };
  }

  let startIndex = 0;
  if (query.cursor) {
    const foundIndex = filtered.findIndex((tx) => tx.id === query.cursor);
    if (foundIndex >= 0) {
      startIndex = foundIndex;
    }
  }

  const pageItems = filtered.slice(startIndex, startIndex + limit);
  const nextIndex = startIndex + limit;
  const nextCursor = nextIndex < totalCount ? filtered[nextIndex].id : null;
  const prevIndex = startIndex - limit;
  const prevCursor =
    startIndex > 0 ? filtered[Math.max(0, prevIndex)].id : null;

  return {
    transactions: pageItems,
    nextCursor,
    prevCursor,
    totalCount,
  };
}

function buildQueryParams(query: WalletTransactionsQuery): string {
  const params = new URLSearchParams();
  if (query.address) params.set('address', query.address);
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.limit) params.set('limit', String(query.limit));

  const filters = query.filters;
  if (filters) {
    if (filters.types && filters.types.length > 0) {
      params.set('types', filters.types.join(','));
    }
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.minAmount) params.set('minAmount', filters.minAmount);
    if (filters.maxAmount) params.set('maxAmount', filters.maxAmount);
    if (filters.counterparty && filters.counterparty.trim()) {
      params.set('counterparty', filters.counterparty.trim());
    }
  }

  const qs = params.toString();
  return qs ? '?' + qs : '';
}

export const walletTransactions = {
  list: async (
    query: WalletTransactionsQuery = {},
    options?: ApiRequestOptions,
    fixtureSource: WalletTransaction[] = WALLET_TRANSACTION_FIXTURES,
  ): Promise<WalletTransactionsPage> => {
    if (typeof window !== 'undefined' && window.location.search.includes('simulate_offline')) {
      const error: ApiError = new Error('No internet connection');
      error.isOffline = true;
      throw error;
    }

    if (typeof window !== 'undefined' && window.location.search.includes('simulate_error')) {
      const error: ApiError = new Error('Internal Server Error');
      error.status = 500;
      error.technicalDetails = 'Unable to query Stellar Horizon transaction history.';
      throw error;
    }

    if (import.meta.env.VITE_USE_FIXTURES) {
      return paginateWalletTransactions(fixtureSource, query);
    }

    try {
      const qs = buildQueryParams(query);
      const response = await api<WalletTransactionsPage>(
        '/wallet/transactions' + qs,
        options,
      );
      if (response && Array.isArray(response.transactions)) {
        return response;
      }
      return paginateWalletTransactions(fixtureSource, query);
    } catch (err) {
      const apiErr = err as ApiError;
      // Propagate aborts, explicit simulated errors, or when fetch is mocked in tests and throws an intentional API error
      if (
        options?.signal?.aborted ||
        apiErr?.name === 'AbortError' ||
        apiErr?.isOffline ||
        apiErr?.isTimeout ||
        typeof apiErr?.status === 'number'
      ) {
        // When running against Vite dev server without a backend on port 8080, `/api/wallet/transactions`
        // returns a proxy 500 with non-JSON body ('No additional details provided by server.'), 404, or HTML 200.
        // Fall back to fixtures in those cases so `npm run dev` works seamlessly out-of-the-box.
        const isDevMissingBackend =
          apiErr.status === 404 ||
          (apiErr.status === 200 && apiErr.message === 'Unexpected response format') ||
          (apiErr.status === 500 &&
            apiErr.technicalDetails === 'No additional details provided by server.');
        if (!isDevMissingBackend) {
          throw apiErr;
        }
      } else if (apiErr && !apiErr.isNetworkError) {
        throw apiErr;
      }

      return paginateWalletTransactions(fixtureSource, query);
    }
  },
};
