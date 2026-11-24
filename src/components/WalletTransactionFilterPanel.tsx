import React, { useState, useEffect, useCallback } from 'react';
import { Filter, X, RotateCcw, Bookmark, Calendar, DollarSign, User, Check, ChevronDown } from 'lucide-react';
import Tag from './Tag';
import {
  WalletTransaction,
  WalletTransactionFilterState,
  TransactionType,
  INITIAL_FILTER_STATE,
  SAVED_FILTERS_STORAGE_KEY,
  SavedFilter
} from '../types/walletTransaction';
import { filterWalletTransactions } from '../api/walletTransactions';
import React from 'react';
import { Filter, X, RotateCcw, User, Check, ChevronDown } from 'lucide-react';
import Tag from './Tag';
import { WalletTransaction } from '../types/walletTransaction';
import { TRANSACTION_TYPE_OPTIONS } from './walletTransactionFilterUtils';
import { useWalletTransactionFilters } from './useWalletTransactionFilters';
import { WalletTransactionRangeControls } from './WalletTransactionRangeControls';
import { WalletTransactionSavedFilters } from './WalletTransactionSavedFilters';
import './WalletTransactionFilterPanel.css';

export interface WalletTransactionFilterPanelProps {
  transactions: WalletTransaction[];
  onFilteredTransactionsChange?: (filtered: WalletTransaction[]) => void;
  filters?: WalletTransactionFilterState;
  onFiltersChange?: (filters: WalletTransactionFilterState) => void;
  totalCount?: number;
  storageKey?: string;
  className?: string;
}

const TRANSACTION_TYPE_OPTIONS: { type: TransactionType; label: string; color: 'blue' | 'green' | 'yellow' | 'purple' | 'red' }[] = [
  { type: 'charge_succeeded', label: 'Charge Succeeded', color: 'blue' },
  { type: 'new_subscription', label: 'New Subscription', color: 'green' },
  { type: 'subscription_paused', label: 'Paused', color: 'yellow' },
  { type: 'subscription_resumed', label: 'Resumed', color: 'purple' },
  { type: 'subscription_cancelled', label: 'Cancelled', color: 'red' },
];

const VALID_TRANSACTION_TYPES = new Set<TransactionType>(
  TRANSACTION_TYPE_OPTIONS.map((opt) => opt.type),
);

function isValidSavedFilter(item: unknown): item is SavedFilter {
  if (!item || typeof item !== 'object') return false;
  const candidate = item as Record<string, unknown>;
  if (typeof candidate.id !== 'string' || typeof candidate.name !== 'string') return false;
  if (!candidate.filter || typeof candidate.filter !== 'object') return false;
  const filter = candidate.filter as Record<string, unknown>;
  if (!Array.isArray(filter.types)) return false;
  return true;
}

function normalizeFilterState(raw: Partial<WalletTransactionFilterState>): WalletTransactionFilterState {
  const rawTypes = Array.isArray(raw.types) ? raw.types : [];
  return {
    types: rawTypes.filter((t): t is TransactionType => VALID_TRANSACTION_TYPES.has(t)),
    startDate: typeof raw.startDate === 'string' ? raw.startDate : '',
    endDate: typeof raw.endDate === 'string' ? raw.endDate : '',
    minAmount: typeof raw.minAmount === 'string' ? raw.minAmount : '',
    maxAmount: typeof raw.maxAmount === 'string' ? raw.maxAmount : '',
    counterparty: typeof raw.counterparty === 'string' ? raw.counterparty : '',
  };
}

function loadSavedFilters(storageKey = SAVED_FILTERS_STORAGE_KEY): SavedFilter[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidSavedFilter).map((item) => ({
      id: item.id,
      name: item.name,
      filter: normalizeFilterState(item.filter),
    }));
  } catch {
    return [];
  }
}

function persistSavedFilters(
  presets: SavedFilter[],
  storageKey = SAVED_FILTERS_STORAGE_KEY,
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(presets));
  } catch {
    // Ignore storage quota or unavailability errors
  }
}

export const WalletTransactionFilterPanel: React.FC<WalletTransactionFilterPanelProps> = ({
  transactions,
  onFilteredTransactionsChange,
  filters: controlledFilters,
  onFiltersChange,
  totalCount,
  storageKey = SAVED_FILTERS_STORAGE_KEY,
  className = '',
}) => {
  const [internalFilters, setInternalFilters] = useState<WalletTransactionFilterState>(
    controlledFilters ?? INITIAL_FILTER_STATE,
  );
  const filters = controlledFilters ?? internalFilters;

  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() =>
    loadSavedFilters(storageKey),
  );
  const [saveFilterName, setSaveFilterName] = useState('');
  const [isSavingFilter, setIsSavingFilter] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [announcement, setAnnouncement] = useState('');

  const updateFilters = useCallback(
    (
      updater:
        | WalletTransactionFilterState
        | ((prev: WalletTransactionFilterState) => WalletTransactionFilterState),
    ) => {
      const next = typeof updater === 'function' ? updater(filters) : updater;
      if (controlledFilters === undefined) {
        setInternalFilters(next);
      }
      onFiltersChange?.(next);
    },
    [controlledFilters, filters, onFiltersChange],
  );

  useEffect(() => {
    persistSavedFilters(savedFilters, storageKey);
  }, [savedFilters, storageKey]);

  // Apply filters to transactions
  const filteredTransactions = React.useMemo(() => {
    return filterWalletTransactions(transactions, filters);
  }, [transactions, filters]);

  // Calculate active filter count
  const activeFilterCount =
    filters.types.length +
    (filters.startDate ? 1 : 0) +
    (filters.endDate ? 1 : 0) +
    (filters.minAmount ? 1 : 0) +
    (filters.maxAmount ? 1 : 0) +
    (filters.counterparty ? 1 : 0);

  const resolvedTotalCount = totalCount ?? transactions.length;

  // Notify parent component and announce live region update
  useEffect(() => {
    onFilteredTransactionsChange?.(filteredTransactions);
    const countMsg =
      'Filter updated: showing ' +
      String(filteredTransactions.length) +
      ' of ' +
      String(resolvedTotalCount) +
      ' transactions.';
    setAnnouncement(countMsg);
  }, [filteredTransactions, resolvedTotalCount, onFilteredTransactionsChange]);

  const handleTypeToggle = (type: TransactionType) => {
    updateFilters((prev) => {
      const exists = prev.types.includes(type);
      return {
        ...prev,
        types: exists ? prev.types.filter((t) => t !== type) : [...prev.types, type],
      };
    });
  };

  const handleClearAll = () => {
    updateFilters(INITIAL_FILTER_STATE);
  };

  const handleRemoveChip = (key: keyof WalletTransactionFilterState | 'type', value?: string) => {
    if (key === 'type' && value) {
      updateFilters((prev) => ({
        ...prev,
        types: prev.types.filter((t) => t !== (value as TransactionType)),
      }));
    } else {
      updateFilters((prev) => ({
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
      filter: { ...filters, types: [...filters.types] },
    };
    setSavedFilters((prev) => [...prev, newSavedFilter]);
    setSaveFilterName('');
    setIsSavingFilter(false);
  };

  const handleApplySavedFilter = (saved: SavedFilter) => {
    updateFilters({ ...saved.filter, types: [...saved.filter.types] });
  };
  const {
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
  } = useWalletTransactionFilters({ transactions, onFilteredTransactionsChange });

  const handleDeleteSavedFilter = (id: string) => {
    setSavedFilters((prev) => prev.filter((item) => item.id !== id));
  };

  const panelClassName = className
    ? 'wallet-filter-panel ' + className
    : 'wallet-filter-panel';
  const chevronClassName = isPanelExpanded
    ? 'wallet-filter-panel__chevron wallet-filter-panel__chevron--expanded'
    : 'wallet-filter-panel__chevron';

  return (
    <section className={panelClassName} aria-labelledby="wallet-filter-heading">
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
            <span
              className="wallet-filter-panel__badge"
              aria-label={String(activeFilterCount) + ' active filters'}
            >
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
            <ChevronDown size={18} className={chevronClassName} />
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
                label={'From: ' + filters.startDate}
                color="blue"
                size="small"
                removable
                onRemove={() => handleRemoveChip('startDate')}
              />
            )}
            {filters.endDate && (
              <Tag
                label={'To: ' + filters.endDate}
                color="blue"
                size="small"
                removable
                onRemove={() => handleRemoveChip('endDate')}
              />
            )}
            {(filters.minAmount || filters.maxAmount) && (
              <Tag
                label={
                  'Amount: ' +
                  (filters.minAmount || '0') +
                  ' - ' +
                  (filters.maxAmount || '∞') +
                  ' XLM'
                }
                color="green"
                size="small"
                removable
                onRemove={() => {
                  updateFilters((prev) => ({
                    ...prev,
                    minAmount: '',
                    maxAmount: '',
                  }));
                }}
              />
            )}
            {filters.counterparty && (
              <Tag
                label={'Party: ' + filters.counterparty}
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
                const typeBtnClass = isSelected
                  ? 'wallet-filter-panel__type-btn wallet-filter-panel__type-btn--selected'
                  : 'wallet-filter-panel__type-btn';
                return (
                  <button
                    key={type}
                    type="button"
                    className={typeBtnClass}
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
                  onChange={(e) => updateFilters((prev) => ({ ...prev, startDate: e.target.value }))}
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
                  onChange={(e) => updateFilters((prev) => ({ ...prev, endDate: e.target.value }))}
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
                  onChange={(e) => updateFilters((prev) => ({ ...prev, minAmount: e.target.value }))}
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
                  onChange={(e) => updateFilters((prev) => ({ ...prev, maxAmount: e.target.value }))}
                  aria-label="Maximum amount"
                />
              </div>
            </div>
          </div>
          <WalletTransactionRangeControls
            startDate={filters.startDate}
            endDate={filters.endDate}
            minAmount={filters.minAmount}
            maxAmount={filters.maxAmount}
            onStartDateChange={(startDate) => setFilters((prev) => ({ ...prev, startDate }))}
            onEndDateChange={(endDate) => setFilters((prev) => ({ ...prev, endDate }))}
            onMinAmountChange={(minAmount) => setFilters((prev) => ({ ...prev, minAmount }))}
            onMaxAmountChange={(maxAmount) => setFilters((prev) => ({ ...prev, maxAmount }))}
          />

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
                onChange={(e) => updateFilters((prev) => ({ ...prev, counterparty: e.target.value }))}
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
                    <div key={preset.id} className="wallet-filter-panel__preset-item">
                      <button
                        type="button"
                        className="wallet-filter-panel__preset-btn"
                        onClick={() => handleApplySavedFilter(preset)}
                        aria-label={'Apply preset filter: ' + preset.name}
                      >
                        {preset.name}
                      </button>
                      <button
                        type="button"
                        className="wallet-filter-panel__preset-remove"
                        onClick={() => handleDeleteSavedFilter(preset.id)}
                        aria-label={'Delete preset filter: ' + preset.name}
                        title={'Delete preset ' + preset.name}
                      >
                        <X size={12} aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <WalletTransactionSavedFilters
            isSavingFilter={isSavingFilter}
            saveFilterName={saveFilterName}
            activeFilterCount={activeFilterCount}
            savedFilters={savedFilters}
            onStartSaving={() => setIsSavingFilter(true)}
            onCancelSaving={() => setIsSavingFilter(false)}
            onSaveFilterNameChange={setSaveFilterName}
            onSaveFilterSubmit={handleSaveFilterSubmit}
            onApplySavedFilter={handleApplySavedFilter}
          />
        </div>
      )}

      {/* Summary Footer */}
      <div className="wallet-filter-panel__summary" aria-live="polite">
        Showing <strong>{filteredTransactions.length}</strong> of <strong>{resolvedTotalCount}</strong> transactions
        {filteredTransactions.length === 0 && (
          <span className="wallet-filter-panel__no-results-msg"> - No matching transactions found</span>
        )}
      </div>
    </section>
  );
};

export default WalletTransactionFilterPanel;
