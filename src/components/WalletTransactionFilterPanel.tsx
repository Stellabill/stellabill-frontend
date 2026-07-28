import React, { useState, useEffect } from 'react';
import { Filter, X, RotateCcw, Bookmark, Calendar, DollarSign, User, Check, ChevronDown } from 'lucide-react';
import Tag from './Tag';
import {
  WalletTransaction,
  WalletTransactionFilterState,
  TransactionType,
  INITIAL_FILTER_STATE,
  SavedFilter
} from '../types/walletTransaction';
import './WalletTransactionFilterPanel.css';

export interface WalletTransactionFilterPanelProps {
  transactions: WalletTransaction[];
  onFilteredTransactionsChange?: (filtered: WalletTransaction[]) => void;
  className?: string;
}

const TRANSACTION_TYPE_OPTIONS: { type: TransactionType; label: string; color: 'blue' | 'green' | 'yellow' | 'purple' | 'red' }[] = [
  { type: 'charge_succeeded', label: 'Charge Succeeded', color: 'blue' },
  { type: 'new_subscription', label: 'New Subscription', color: 'green' },
  { type: 'subscription_paused', label: 'Paused', color: 'yellow' },
  { type: 'subscription_resumed', label: 'Resumed', color: 'purple' },
  { type: 'subscription_cancelled', label: 'Cancelled', color: 'red' },
];

export const WalletTransactionFilterPanel: React.FC<WalletTransactionFilterPanelProps> = ({
  transactions,
  onFilteredTransactionsChange,
  className = '',
}) => {
  const [filters, setFilters] = useState<WalletTransactionFilterState>(INITIAL_FILTER_STATE);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [isSavingFilter, setIsSavingFilter] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [announcement, setAnnouncement] = useState('');

  // Apply filters to transactions
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter((tx) => {
      // Type filter
      if (filters.types.length > 0 && !filters.types.includes(tx.type)) {
        return false;
      }

      // Date range filter
      if (filters.startDate) {
        const txDate = new Date(tx.timestamp).getTime();
        const startDate = new Date(filters.startDate).getTime();
        if (!isNaN(startDate) && txDate < startDate) return false;
      }
      if (filters.endDate) {
        const txDate = new Date(tx.timestamp).getTime();
        // include the entire end date day by setting to end of day
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (!isNaN(endDate.getTime()) && txDate > endDate.getTime()) return false;
      }

      // Amount range filter
      if (filters.minAmount !== '' && !isNaN(Number(filters.minAmount))) {
        if (tx.amount < Number(filters.minAmount)) return false;
      }
      if (filters.maxAmount !== '' && !isNaN(Number(filters.maxAmount))) {
        if (tx.amount > Number(filters.maxAmount)) return false;
      }

      // Counterparty filter
      if (filters.counterparty.trim() !== '') {
        const query = filters.counterparty.trim().toLowerCase();
        const matchCounterparty = tx.counterparty.toLowerCase().includes(query);
        const matchDetails = tx.details.toLowerCase().includes(query);
        if (!matchCounterparty && !matchDetails) return false;
      }

      return true;
    });
  }, [transactions, filters]);

  // Calculate active filter count
  const activeFilterCount =
    filters.types.length +
    (filters.startDate ? 1 : 0) +
    (filters.endDate ? 1 : 0) +
    (filters.minAmount ? 1 : 0) +
    (filters.maxAmount ? 1 : 0) +
    (filters.counterparty ? 1 : 0);

  // Notify parent component and announce live region update
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

    const newSavedFilter: SavedFilter = {
      id: Date.now().toString(),
      name: saveFilterName.trim(),
      filter: { ...filters },
    };
    setSavedFilters((prev) => [...prev, newSavedFilter]);
    setSaveFilterName('');
    setIsSavingFilter(false);
  };

  const handleApplySavedFilter = (saved: SavedFilter) => {
    setFilters(saved.filter);
  };

  return (
    <section className={`wallet-filter-panel ${className}`} aria-labelledby="wallet-filter-heading">
      {/* Live Region for Screen Readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Filter Header & Toggle */}
      <div className="wallet-filter-panel__header">
        <div className="wallet-filter-panel__title-group">
          <Filter className="wallet-filter-panel__icon" size={18} aria-hidden="true" />
          <h3 id="wallet-filter-heading" className="wallet-filter-panel__title">
            Filter Transactions
          </h3>
          {activeFilterCount > 0 && (
            <span className="wallet-filter-panel__badge" aria-label={`${activeFilterCount} active filters`}>
              {activeFilterCount}
            </span>
          )}
        </div>

        <div className="wallet-filter-panel__actions">
          {activeFilterCount > 0 && (
            <button
              type="button"
              className="wallet-filter-panel__clear-btn"
              onClick={handleClearAll}
              aria-label="Clear all applied transaction filters"
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>Clear All</span>
            </button>
          )}

          <button
            type="button"
            className="wallet-filter-panel__toggle-btn"
            onClick={() => setIsPanelExpanded((prev) => !prev)}
            aria-expanded={isPanelExpanded}
            aria-controls="wallet-filter-controls"
            aria-label={isPanelExpanded ? 'Collapse filter panel' : 'Expand filter panel'}
          >
            <ChevronDown
              size={18}
              className={`wallet-filter-panel__chevron ${isPanelExpanded ? 'wallet-filter-panel__chevron--expanded' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Applied Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="wallet-filter-panel__chips-container" aria-label="Applied filters">
          <span className="wallet-filter-panel__chips-label">Applied:</span>
          <div className="wallet-filter-panel__chips-list">
            {filters.types.map((type) => {
              const opt = TRANSACTION_TYPE_OPTIONS.find((t) => t.type === type);
              return (
                <Tag
                  key={type}
                  label={opt?.label || type}
                  color={opt?.color || 'blue'}
                  size="small"
                  removable
                  onRemove={() => handleRemoveChip('type', type)}
                />
              );
            })}
            {filters.startDate && (
              <Tag
                label={`From: ${filters.startDate}`}
                color="blue"
                size="small"
                removable
                onRemove={() => handleRemoveChip('startDate')}
              />
            )}
            {filters.endDate && (
              <Tag
                label={`To: ${filters.endDate}`}
                color="blue"
                size="small"
                removable
                onRemove={() => handleRemoveChip('endDate')}
              />
            )}
            {(filters.minAmount || filters.maxAmount) && (
              <Tag
                label={`Amount: ${filters.minAmount || '0'} - ${filters.maxAmount || '∞'} XLM`}
                color="green"
                size="small"
                removable
                onRemove={() => {
                  handleRemoveChip('minAmount');
                  handleRemoveChip('maxAmount');
                }}
              />
            )}
            {filters.counterparty && (
              <Tag
                label={`Party: ${filters.counterparty}`}
                color="purple"
                size="small"
                removable
                onRemove={() => handleRemoveChip('counterparty')}
              />
            )}
          </div>
        </div>
      )}

      {/* Collapsible Filter Controls */}
      {isPanelExpanded && (
        <div id="wallet-filter-controls" className="wallet-filter-panel__controls">
          {/* Transaction Type Group */}
          <div className="wallet-filter-panel__group">
            <label className="wallet-filter-panel__group-label">Transaction Type</label>
            <div className="wallet-filter-panel__type-options" role="group" aria-label="Filter by transaction type">
              {TRANSACTION_TYPE_OPTIONS.map(({ type, label }) => {
                const isSelected = filters.types.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    className={`wallet-filter-panel__type-btn ${isSelected ? 'wallet-filter-panel__type-btn--selected' : ''}`}
                    onClick={() => handleTypeToggle(type)}
                    aria-pressed={isSelected}
                  >
                    {isSelected && <Check size={14} className="wallet-filter-panel__type-check" />}
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range & Amount Range Grid */}
          <div className="wallet-filter-panel__grid">
            {/* Date Range */}
            <div className="wallet-filter-panel__group">
              <label className="wallet-filter-panel__group-label" htmlFor="tx-filter-start-date">
                <Calendar size={14} className="wallet-filter-panel__inline-icon" aria-hidden="true" />
                Date Range
              </label>
              <div className="wallet-filter-panel__range-inputs">
                <input
                  id="tx-filter-start-date"
                  type="date"
                  className="wallet-filter-panel__input"
                  value={filters.startDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                  aria-label="Start date"
                />
                <span className="wallet-filter-panel__range-separator" aria-hidden="true">
                  to
                </span>
                <input
                  id="tx-filter-end-date"
                  type="date"
                  className="wallet-filter-panel__input"
                  value={filters.endDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                  aria-label="End date"
                />
              </div>
            </div>

            {/* Amount Range */}
            <div className="wallet-filter-panel__group">
              <label className="wallet-filter-panel__group-label" htmlFor="tx-filter-min-amount">
                <DollarSign size={14} className="wallet-filter-panel__inline-icon" aria-hidden="true" />
                Amount Range (XLM)
              </label>
              <div className="wallet-filter-panel__range-inputs">
                <input
                  id="tx-filter-min-amount"
                  type="number"
                  placeholder="Min"
                  min="0"
                  step="any"
                  className="wallet-filter-panel__input"
                  value={filters.minAmount}
                  onChange={(e) => setFilters((prev) => ({ ...prev, minAmount: e.target.value }))}
                  aria-label="Minimum amount"
                />
                <span className="wallet-filter-panel__range-separator" aria-hidden="true">
                  to
                </span>
                <input
                  id="tx-filter-max-amount"
                  type="number"
                  placeholder="Max"
                  min="0"
                  step="any"
                  className="wallet-filter-panel__input"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters((prev) => ({ ...prev, maxAmount: e.target.value }))}
                  aria-label="Maximum amount"
                />
              </div>
            </div>
          </div>

          {/* Counterparty / Address Filter */}
          <div className="wallet-filter-panel__group">
            <label className="wallet-filter-panel__group-label" htmlFor="tx-filter-counterparty">
              <User size={14} className="wallet-filter-panel__inline-icon" aria-hidden="true" />
              Counterparty / Address / Description
            </label>
            <div className="wallet-filter-panel__input-wrapper">
              <input
                id="tx-filter-counterparty"
                type="text"
                placeholder="Search by Stellar address or details..."
                className="wallet-filter-panel__input wallet-filter-panel__input--full"
                value={filters.counterparty}
                onChange={(e) => setFilters((prev) => ({ ...prev, counterparty: e.target.value }))}
              />
              {filters.counterparty && (
                <button
                  type="button"
                  className="wallet-filter-panel__input-clear"
                  onClick={() => handleRemoveChip('counterparty')}
                  aria-label="Clear counterparty search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Bottom Actions Bar: Save Filter & Saved Filter List */}
          <div className="wallet-filter-panel__bottom-bar">
            {!isSavingFilter ? (
              <button
                type="button"
                className="wallet-filter-panel__save-trigger"
                onClick={() => setIsSavingFilter(true)}
                disabled={activeFilterCount === 0}
                title={activeFilterCount === 0 ? 'Apply filters to save' : 'Save current filter preset'}
              >
                <Bookmark size={14} />
                <span>Save Current Filter Preset</span>
              </button>
            ) : (
              <form className="wallet-filter-panel__save-form" onSubmit={handleSaveFilterSubmit}>
                <input
                  type="text"
                  placeholder="Preset name (e.g. High Value)"
                  className="wallet-filter-panel__input wallet-filter-panel__save-input"
                  value={saveFilterName}
                  onChange={(e) => setSaveFilterName(e.target.value)}
                  autoFocus
                  required
                />
                <button type="submit" className="wallet-filter-panel__btn-primary">
                  Save
                </button>
                <button
                  type="button"
                  className="wallet-filter-panel__btn-secondary"
                  onClick={() => setIsSavingFilter(false)}
                >
                  Cancel
                </button>
              </form>
            )}

            {savedFilters.length > 0 && (
              <div className="wallet-filter-panel__saved-presets">
                <span className="wallet-filter-panel__presets-label">Presets:</span>
                <div className="wallet-filter-panel__presets-list">
                  {savedFilters.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className="wallet-filter-panel__preset-btn"
                      onClick={() => handleApplySavedFilter(preset)}
                      aria-label={`Apply preset filter: ${preset.name}`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Footer */}
      <div className="wallet-filter-panel__summary" aria-live="polite">
        Showing <strong>{filteredTransactions.length}</strong> of <strong>{transactions.length}</strong> transactions
        {filteredTransactions.length === 0 && (
          <span className="wallet-filter-panel__no-results-msg"> - No matching transactions found</span>
        )}
      </div>
    </section>
  );
};

export default WalletTransactionFilterPanel;
