import React from 'react';
import { Bookmark } from 'lucide-react';
import { SavedFilter } from '../types/walletTransaction';

export interface WalletTransactionSavedFiltersProps {
  isSavingFilter: boolean;
  saveFilterName: string;
  activeFilterCount: number;
  savedFilters: SavedFilter[];
  onStartSaving: () => void;
  onCancelSaving: () => void;
  onSaveFilterNameChange: (name: string) => void;
  onSaveFilterSubmit: (e: React.FormEvent) => void;
  onApplySavedFilter: (saved: SavedFilter) => void;
}

/**
 * Save filter preset form and saved presets list for WalletTransactionFilterPanel.
 */
export const WalletTransactionSavedFilters: React.FC<WalletTransactionSavedFiltersProps> = ({
  isSavingFilter,
  saveFilterName,
  activeFilterCount,
  savedFilters,
  onStartSaving,
  onCancelSaving,
  onSaveFilterNameChange,
  onSaveFilterSubmit,
  onApplySavedFilter,
}) => {
  return (
    <div className="wallet-filter-panel__bottom-bar">
      {!isSavingFilter ? (
        <button
          type="button"
          className="wallet-filter-panel__save-trigger"
          onClick={onStartSaving}
          disabled={activeFilterCount === 0}
          title={activeFilterCount === 0 ? 'Apply filters to save' : 'Save current filter preset'}
        >
          <Bookmark size={14} />
          <span>Save Current Filter Preset</span>
        </button>
      ) : (
        <form className="wallet-filter-panel__save-form" onSubmit={onSaveFilterSubmit}>
          <input
            type="text"
            placeholder="Preset name (e.g. High Value)"
            className="wallet-filter-panel__input wallet-filter-panel__save-input"
            value={saveFilterName}
            onChange={(e) => onSaveFilterNameChange(e.target.value)}
            autoFocus
            required
          />
          <button type="submit" className="wallet-filter-panel__btn-primary">
            Save
          </button>
          <button
            type="button"
            className="wallet-filter-panel__btn-secondary"
            onClick={onCancelSaving}
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
                onClick={() => onApplySavedFilter(preset)}
                aria-label={`Apply preset filter: ${preset.name}`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
