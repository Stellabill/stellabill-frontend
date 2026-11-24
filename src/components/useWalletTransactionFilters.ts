import React, { useState, useEffect, useMemo } from 'react';
import {
  INITIAL_FILTER_STATE,
  SavedFilter,
  TransactionType,
  WalletTransaction,
  WalletTransactionFilterState,
} from '../types/walletTransaction';
import {
  countActiveFilters,
  createSavedFilter,
  filterTransactions,
} from './walletTransactionFilterUtils';

export interface UseWalletTransactionFiltersOptions {
  transactions: WalletTransaction[];
  onFilteredTransactionsChange?: (filtered: WalletTransaction[]) => void;
}

/**
 * Custom hook managing filter state, saved presets, panel expansion, and screen-reader announcements
 * for WalletTransactionFilterPanel.
 */
export function useWalletTransactionFilters({
  transactions,
  onFilteredTransactionsChange,
}: UseWalletTransactionFiltersOptions) {
  const [filters, setFilters] = useState<WalletTransactionFilterState>(INITIAL_FILTER_STATE);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [isSavingFilter, setIsSavingFilter] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [announcement, setAnnouncement] = useState('');

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, filters),
    [transactions, filters]
  );

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  useEffect(() => {
    onFilteredTransactionsChange?.(filteredTransactions);
    const countMsg = `Filter updated: showing ${filteredTransactions.length} of ${transactions.length} transactions.`;
    setAnnouncement(countMsg);
  }, [filteredTransactions, transactions.length, onFilteredTransactionsChange]);

  const handleTypeToggle = (type: TransactionType) => {
    setFilters((prev) => {
      const exists = prev.types.includes(type);
      return {
        ...prev,
        types: exists ? prev.types.filter((t) => t !== type) : [...prev.types, type],
      };
    });
  };

  const handleClearAll = () => {
    setFilters(INITIAL_FILTER_STATE);
  };

  const handleRemoveChip = (key: keyof WalletTransactionFilterState | 'type', value?: string) => {
    if (key === 'type' && value) {
      setFilters((prev) => ({
        ...prev,
        types: prev.types.filter((t) => t !== (value as TransactionType)),
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        [key]: key === 'types' ? [] : '',
      }));
    }
  };

  const handleSaveFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveFilterName.trim()) return;

    const newSavedFilter = createSavedFilter(saveFilterName, filters);
    setSavedFilters((prev) => [...prev, newSavedFilter]);
    setSaveFilterName('');
    setIsSavingFilter(false);
  };

  const handleApplySavedFilter = (saved: SavedFilter) => {
    setFilters(saved.filter);
  };

  return {
    filters,
    setFilters,
    savedFilters,
    saveFilterName,
    setSaveFilterName,
    isSavingFilter,
    setIsSavingFilter,
    isPanelExpanded,
    setIsPanelExpanded,
    announcement,
    filteredTransactions,
    activeFilterCount,
    handleTypeToggle,
    handleClearAll,
    handleRemoveChip,
    handleSaveFilterSubmit,
    handleApplySavedFilter,
  };
}
