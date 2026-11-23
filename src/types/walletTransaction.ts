export type TransactionType = 'new_subscription' | 'charge_succeeded' | 'subscription_paused' | 'subscription_resumed' | 'subscription_cancelled';

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  details: string;
  counterparty: string;
  counterpartyAddress?: string;
  timestamp: string; // ISO date string or formatted date
  amount: number; // numeric amount for range filtering
  currency?: string;
  txHash?: string;
}

export interface WalletTransactionFilterState {
  types: TransactionType[];
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  minAmount: string;
  maxAmount: string;
  counterparty: string;
}

export interface SavedFilter {
  id: string;
  name: string;
  filter: WalletTransactionFilterState;
}

export interface WalletTransactionsQuery {
  address?: string;
  cursor?: string | null;
  limit?: number;
  filters?: Partial<WalletTransactionFilterState>;
}

export interface WalletTransactionsPage {
  transactions: WalletTransaction[];
  nextCursor: string | null;
  prevCursor: string | null;
  totalCount: number;
}

export const INITIAL_FILTER_STATE: WalletTransactionFilterState = {
  types: [],
  startDate: '',
  endDate: '',
  minAmount: '',
  maxAmount: '',
  counterparty: '',
};

export const SAVED_FILTERS_STORAGE_KEY = 'stellabill.wallet.savedFilters';
