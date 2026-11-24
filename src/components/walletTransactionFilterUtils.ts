import {
  SavedFilter,
  TransactionType,
  WalletTransaction,
  WalletTransactionFilterState,
} from '../types/walletTransaction';

export interface TransactionTypeOption {
  type: TransactionType;
  label: string;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
}

export const TRANSACTION_TYPE_OPTIONS: TransactionTypeOption[] = [
  { type: 'charge_succeeded', label: 'Charge Succeeded', color: 'blue' },
  { type: 'new_subscription', label: 'New Subscription', color: 'green' },
  { type: 'subscription_paused', label: 'Paused', color: 'yellow' },
  { type: 'subscription_resumed', label: 'Resumed', color: 'purple' },
  { type: 'subscription_cancelled', label: 'Cancelled', color: 'red' },
];

/**
 * Filter a list of wallet transactions according to the active filter state.
 */
export function filterTransactions(
  transactions: WalletTransaction[],
  filters: WalletTransactionFilterState
): WalletTransaction[] {
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
      // Include the entire end date day by setting to end of day
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
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
      if (!matchCounterparty && !matchDetails) return false;
    }

    return true;
  });
}

/**
 * Count the number of active filter criteria in the current filter state.
 */
export function countActiveFilters(filters: WalletTransactionFilterState): number {
  return (
    filters.types.length +
    (filters.startDate ? 1 : 0) +
    (filters.endDate ? 1 : 0) +
    (filters.minAmount ? 1 : 0) +
    (filters.maxAmount ? 1 : 0) +
    (filters.counterparty ? 1 : 0)
  );
}

/**
 * Build a SavedFilter preset object from a name and filter state.
 */
export function createSavedFilter(
  name: string,
  filter: WalletTransactionFilterState,
  id: string = Date.now().toString()
): SavedFilter {
  return {
    id,
    name: name.trim(),
    filter: { ...filter },
  };
}
