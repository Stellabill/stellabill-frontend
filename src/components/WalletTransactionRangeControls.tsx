import React from 'react';
import { Calendar, DollarSign } from 'lucide-react';

export interface WalletTransactionRangeControlsProps {
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onMinAmountChange: (value: string) => void;
  onMaxAmountChange: (value: string) => void;
}

/**
 * Date range and amount range filter controls for WalletTransactionFilterPanel.
 */
export const WalletTransactionRangeControls: React.FC<WalletTransactionRangeControlsProps> = ({
  startDate,
  endDate,
  minAmount,
  maxAmount,
  onStartDateChange,
  onEndDateChange,
  onMinAmountChange,
  onMaxAmountChange,
}) => {
  return (
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
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            aria-label="Start date"
          />
          <span className="wallet-filter-panel__range-separator" aria-hidden="true">
            to
          </span>
          <input
            id="tx-filter-end-date"
            type="date"
            className="wallet-filter-panel__input"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
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
            value={minAmount}
            onChange={(e) => onMinAmountChange(e.target.value)}
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
            value={maxAmount}
            onChange={(e) => onMaxAmountChange(e.target.value)}
            aria-label="Maximum amount"
          />
        </div>
      </div>
    </div>
  );
};
