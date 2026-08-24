import { useEffect, useMemo, useRef, useState, KeyboardEvent, MouseEvent } from 'react';
import { useModalFocus } from '../hooks/useModalFocus';
import '../styles/command-palette.css';

export type CommandGroup = 'Pages' | 'Pinned' | 'Actions' | 'Recent';

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
  /** Called when a user toggles a pin on an item. */
  onTogglePin?: (itemId: string) => void;
  /** Shows the slow-load state instead of results (e.g. async sources). */
  isLoading?: boolean;
  /** Placeholder for the search input. */
  placeholder?: string;
  /** Command palette mode */
  mode?: 'global' | 'scoped';
  /** Toggle mode */
  onModeChange?: (mode: 'global' | 'scoped') => void;
  /** Name of the current scope */
  scopeName?: string | null;
}

/** Render order for result groups. */
const GROUP_ORDER: CommandGroup[] = ['Pages', 'Pinned', 'Actions', 'Recent'];

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
  onTogglePin,
  isLoading = false,
  placeholder = 'Search pages and actions…',
  mode = 'global',
  onModeChange,
  scopeName,
}: CommandPaletteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [announcement, setAnnouncement] = useState('');

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
    })).filter((group) => group.items.length > 0 || (group.name === 'Recent' && !q));
  }, [items, query]);

  // Flattened, ordered list used for keyboard traversal and activedescendant.
  const visibleItems = useMemo(() => groups.flatMap((group) => group.items), [groups]);

  // Track which group the active item belongs to for screen-reader announcements.
  const activeGroupIndex = useMemo(() => {
    const item = visibleItems[activeIndex];
    if (!item) return -1;
    return groups.findIndex((g) => g.items.some((i) => i.id === item.id));
  }, [visibleItems, activeIndex, groups]);

  const prevGroupRef = useRef(activeGroupIndex);

  useEffect(() => {
    if (activeGroupIndex !== prevGroupRef.current && activeGroupIndex >= 0) {
      const groupName = groups[activeGroupIndex]?.name;
      if (groupName) {
        setAnnouncement(`${groupName} group`);
      }
    }
    prevGroupRef.current = activeGroupIndex;
  }, [activeGroupIndex, groups]);

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
    if (event.key === 'Backspace' && query === '' && mode === 'scoped' && onModeChange) {
      onModeChange('global');
      // Let it fall through, don't prevent default so backspace still works
    }

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
          {mode === 'scoped' && scopeName ? (
            <div className="cmdk-scope-badge">
              <span className="cmdk-scope-badge__label">{scopeName}</span>
              <button
                type="button"
                className="cmdk-scope-badge__clear"
                onClick={() => onModeChange?.('global')}
                aria-label="Clear scope and search globally"
                title="Clear scope (Backspace)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          ) : (
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
          )}
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

        {/* Polite announcement for screen-reader users — result count and group jumps. */}
        <div className="cmdk-sr-only" role="status" aria-live="polite" aria-atomic="true">
          {!isLoading && resultCountText}
          {announcement && ` — ${announcement}`}
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
              {groups.map((group, groupIndex) => {
                const isFirstGroup = groupIndex === 0;
                const isRecentsEmpty =
                  group.name === 'Recent' && query === '' && group.items.length === 0;

                return (
                  <li
                    key={group.name}
                    role="group"
                    aria-labelledby={groupLabelId(group.name)}
                    className={`cmdk-group${isFirstGroup ? '' : ' cmdk-group--separator'}${group.name === 'Pinned' ? ' cmdk-group--pinned' : ''}`}
                  >
                    <p id={groupLabelId(group.name)} className="cmdk-group__label">
                      {group.name}
                    </p>
                    <ul className="cmdk-group__items">
                      {isRecentsEmpty ? (
                        <li className="cmdk-empty" role="presentation">
                          <p className="cmdk-empty__text">No recent actions yet.</p>
                          <p className="cmdk-empty__hint">Select an action to see it here.</p>
                        </li>
                      ) : (
                        group.items.map((item) => {
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
                              {item.icon && (
                                <span className="cmdk-option__icon">{item.icon}</span>
                              )}
                              <span className="cmdk-option__body">
                                <span className="cmdk-option__label">{item.label}</span>
                                {item.hint && (
                                  <span className="cmdk-option__hint">{item.hint}</span>
                                )}
                              </span>
                              <button
                                type="button"
                                className="cmdk-option__pin"
                                aria-label={`${item.group === 'Pinned' ? 'Unpin' : 'Pin'} ${item.label}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onTogglePin?.(item.id);
                                }}
                                tabIndex={0}
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                  width="14"
                                  height="14"
                                >
                                  <line x1="12" y1="17" x2="12" y2="22" />
                                  <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.89A2 2 0 0 1 15 10.76V6h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.89A2 2 0 0 0 5 15.24z" />
                                </svg>
                              </button>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </li>
                );
              })}
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
