import { describe, it, expect } from 'vitest';
import {
  countActiveFilters,
  createSavedFilter,
  filterTransactions,
} from '../walletTransactionFilterUtils';
import {
  INITIAL_FILTER_STATE,
  WalletTransaction,
} from '../../types/walletTransaction';

const sampleTransactions: WalletTransaction[] = [
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

describe('walletTransactionFilterUtils', () => {
  describe('filterTransactions', () => {
    it('returns all transactions when filter state is initial', () => {
      expect(filterTransactions(sampleTransactions, INITIAL_FILTER_STATE)).toHaveLength(3);
    });

    it('filters by transaction types', () => {
      const result = filterTransactions(sampleTransactions, {
        ...INITIAL_FILTER_STATE,
        types: ['charge_succeeded', 'new_subscription'],
      });
      expect(result.map((t) => t.id)).toEqual(['tx-1', 'tx-2']);
    });

    it('filters by startDate and endDate inclusive of end day', () => {
      const result = filterTransactions(sampleTransactions, {
        ...INITIAL_FILTER_STATE,
        startDate: '2026-07-27',
        endDate: '2026-07-27',
      });
      expect(result.map((t) => t.id)).toEqual(['tx-2']);
    });

    it('filters by minAmount and maxAmount', () => {
      const result = filterTransactions(sampleTransactions, {
        ...INITIAL_FILTER_STATE,
        minAmount: '100',
        maxAmount: '160',
      });
      expect(result.map((t) => t.id)).toEqual(['tx-1']);
    });

    it('filters by counterparty or details case-insensitively', () => {
      const byDetails = filterTransactions(sampleTransactions, {
        ...INITIAL_FILTER_STATE,
        counterparty: 'cloud pro',
      });
      expect(byDetails.map((t) => t.id)).toEqual(['tx-1']);

      const byCounterparty = filterTransactions(sampleTransactions, {
        ...INITIAL_FILTER_STATE,
        counterparty: 'gc3x',
      });
      expect(byCounterparty.map((t) => t.id)).toEqual(['tx-2']);
    });
  });

  describe('countActiveFilters', () => {
    it('returns 0 for initial filter state', () => {
      expect(countActiveFilters(INITIAL_FILTER_STATE)).toBe(0);
    });

    it('counts each active type and non-empty field', () => {
      expect(
        countActiveFilters({
          types: ['charge_succeeded', 'new_subscription'],
          startDate: '2026-07-01',
          endDate: '',
          minAmount: '10',
          maxAmount: '500',
          counterparty: 'Stellar',
        })
      ).toBe(6);
    });
  });

  describe('createSavedFilter', () => {
    it('trims the name and clones the filter state', () => {
      const filter = { ...INITIAL_FILTER_STATE, minAmount: '100' };
      const saved = createSavedFilter('  High Value  ', filter, 'preset-1');
      expect(saved).toEqual({
        id: 'preset-1',
        name: 'High Value',
        filter: { ...INITIAL_FILTER_STATE, minAmount: '100' },
      });
      expect(saved.filter).not.toBe(filter);
    });
  });
});
