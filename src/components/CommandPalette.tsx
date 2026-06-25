import { useEffect, useMemo, useRef, useState, KeyboardEvent, MouseEvent } from 'react';
import { useModalFocus } from '../hooks/useModalFocus';
import '../styles/command-palette.css';

export type CommandGroup = 'Pages' | 'Actions' | 'Recent';

export interface CommandItem {
  /** Stable identifier, also used to track recent selections. */
  id: string;
  /** Visible primary label. */
  label: string;
  /** Result grouping bucket. */
  group: CommandGroup;
  /** Optional secondary description shown beneath the label. */
  hint?: string;
  /** Extra terms (synonyms, abbreviations) matched while filtering. */
  keywords?: string;
  /** Small leading glyph/icon. */
  icon?: React.ReactNode;
  /** Invoked when the item is chosen (navigate, open a modal, etc.). */
  perform: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  /** Full set of commands; the palette groups and filters them internally. */
  items: CommandItem[];
  /** Fired with the chosen item before it closes — used to record "Recent". */
  onSelect?: (item: CommandItem) => void;
  /** Shows the slow-load state instead of results (e.g. async sources). */
  isLoading?: boolean;
  /** Placeholder for the search input. */
  placeholder?: string;
}

/** Render order for result groups. */
const GROUP_ORDER: CommandGroup[] = ['Pages', 'Actions', 'Recent'];

const optionDomId = (id: string) => `cmdk-option-${id}`;
const groupLabelId = (group: CommandGroup) => `cmdk-group-${group.toLowerCase()}`;

/**
 * Global command palette implementing the WAI-ARIA combobox-with-listbox
 * pattern. Lets users jump to pages, run actions, and recall recent items.
 *
 * Accessibility:
 * - `role="combobox"` input wired to a `role="listbox"` via `aria-controls`,
 *   with `aria-activedescendant` tracking the highlighted option.
 * - Focus is trapped and restored on close via `useModalFocus`.
 * - A polite live region announces the result count for screen readers.
 */
export default function CommandPalette({
  isOpen,
  onClose,
  items,
  onSelect,
  isLoading = false,
  placeholder = 'Search pages and actions…',
}: CommandPaletteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  useModalFocus(containerRef, { isOpen, onClose, initialFocusRef: inputRef });

  // Reset transient state every time the palette is opened.
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [isOpen]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (item: CommandItem) =>
      !q ||
      item.label.toLowerCase().includes(q) ||
      (item.hint ?? '').toLowerCase().includes(q) ||
      (item.keywords ?? '').toLowerCase().includes(q);

    return GROUP_ORDER.map((name) => ({
      name,
      items: items.filter((item) => item.group === name && matches(item)),
    })).filter((group) => group.items.length > 0);
  }, [items, query]);

  // Flattened, ordered list used for keyboard traversal and activedescendant.
  const visibleItems = useMemo(() => groups.flatMap((group) => group.items), [groups]);

  // Keep the active index within bounds whenever the result set changes.
  useEffect(() => {
    setActiveIndex((index) => {
      if (visibleItems.length === 0) return 0;
      return Math.min(index, visibleItems.length - 1);
    });
  }, [visibleItems.length]);

  if (!isOpen) return null;

  const hasResults = visibleItems.length > 0;
  const activeItem = visibleItems[activeIndex];

  const select = (item: CommandItem) => {
    onSelect?.(item);
    item.perform();
    onClose();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (isLoading || !hasResults) {
      // Let Escape/Tab fall through to the focus-trap handler.
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % visibleItems.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((index) => (index - 1 + visibleItems.length) % visibleItems.length);
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(visibleItems.length - 1);
        break;
      case 'Enter':
        event.preventDefault();
        if (activeItem) select(activeItem);
        break;
      default:
        break;
    }
  };

  const listboxId = 'cmdk-listbox';
  const resultCountText = hasResults
    ? `${visibleItems.length} result${visibleItems.length === 1 ? '' : 's'} available.`
    : `No results for ${query.trim() || 'your search'}.`;

  return (
    <div
      className="cmdk-overlay"
      role="presentation"
      onMouseDown={(event: MouseEvent<HTMLDivElement>) =>
        event.target === event.currentTarget && onClose()
      }
    >
      <div
        ref={containerRef}
        className="cmdk-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="cmdk-search">
          <svg
            className="cmdk-search__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="cmdk-search__input"
            role="combobox"
            aria-expanded={hasResults}
            aria-controls={listboxId}
            aria-activedescendant={activeItem ? optionDomId(activeItem.id) : undefined}
            aria-autocomplete="list"
            aria-label="Search pages and actions"
            placeholder={placeholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="cmdk-search__kbd" aria-hidden="true">
            Esc
          </kbd>
        </div>

        {/* Polite announcement of result count for screen-reader users. */}
        <div className="cmdk-sr-only" role="status" aria-live="polite">
          {!isLoading && resultCountText}
        </div>

        <div className="cmdk-results">
          {isLoading ? (
            <div className="cmdk-state" aria-busy="true">
              <span className="cmdk-spinner" aria-hidden="true" />
              <p className="cmdk-state__text">Searching…</p>
            </div>
          ) : !hasResults ? (
            <div className="cmdk-state">
              <p className="cmdk-state__title">No results</p>
              <p className="cmdk-state__text">
                Nothing matches “{query.trim() || '…'}”. Try a different term.
              </p>
            </div>
          ) : (
            <ul id={listboxId} role="listbox" aria-label="Search results" className="cmdk-list">
              {groups.map((group) => (
                <li key={group.name} role="group" aria-labelledby={groupLabelId(group.name)}>
                  <p id={groupLabelId(group.name)} className="cmdk-group__label">
                    {group.name}
                  </p>
                  <ul className="cmdk-group__items">
                    {group.items.map((item) => {
                      const index = visibleItems.indexOf(item);
                      const isActive = index === activeIndex;
                      return (
                        <li
                          key={item.id}
                          id={optionDomId(item.id)}
                          role="option"
                          aria-selected={isActive}
                          className={`cmdk-option${isActive ? ' cmdk-option--active' : ''}`}
                          onMouseMove={() => setActiveIndex(index)}
                          onClick={() => select(item)}
                        >
                          {item.icon && <span className="cmdk-option__icon">{item.icon}</span>}
                          <span className="cmdk-option__body">
                            <span className="cmdk-option__label">{item.label}</span>
                            {item.hint && <span className="cmdk-option__hint">{item.hint}</span>}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="cmdk-footer" aria-hidden="true">
          <span className="cmdk-footer__hint">
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            to navigate
          </span>
          <span className="cmdk-footer__hint">
            <kbd>↵</kbd>
            to select
          </span>
          <span className="cmdk-footer__hint">
            <kbd>Esc</kbd>
            to close
          </span>
        </div>
      </div>
    </div>
  );
}
