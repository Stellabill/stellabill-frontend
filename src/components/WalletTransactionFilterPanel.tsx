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
  className?: string;
}

export const WalletTransactionFilterPanel: React.FC<WalletTransactionFilterPanelProps> = ({
  transactions,
  onFilteredTransactionsChange,
  className = '',
}) => {
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
        Showing <strong>{filteredTransactions.length}</strong> of <strong>{transactions.length}</strong> transactions
        {filteredTransactions.length === 0 && (
          <span className="wallet-filter-panel__no-results-msg"> - No matching transactions found</span>
        )}
      </div>
    </section>
  );
};

export default WalletTransactionFilterPanel;
