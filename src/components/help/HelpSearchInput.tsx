import React from 'react';
import { Search, X } from 'lucide-react';

export interface HelpSearchInputProps {
  searchId: string;
  srStatusId: string;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  query: string;
  onQueryChange: (value: string) => void;
  onClearSearch: () => void;
}

/**
 * Search input bar with clear button for HelpSidebar.
 */
export const HelpSearchInput: React.FC<HelpSearchInputProps> = ({
  searchId,
  srStatusId,
  searchInputRef,
  query,
  onQueryChange,
  onClearSearch,
}) => {
  return (
    <div className="help-sidebar__search-wrap">
      <span className="help-sidebar__search-icon" aria-hidden="true">
        <Search size={16} />
      </span>
      <label htmlFor={searchId} className="help-sidebar__sr-only">
        Search help articles
      </label>
      <input
        ref={searchInputRef}
        id={searchId}
        type="search"
        className="help-sidebar__search-input"
        placeholder="Search billing, subscriptions, settings…"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        aria-describedby={srStatusId}
        autoComplete="off"
        spellCheck={false}
      />
      {query.trim() && (
        <button
          type="button"
          className="help-sidebar__clear-button"
          aria-label="Clear search"
          onClick={onClearSearch}
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
