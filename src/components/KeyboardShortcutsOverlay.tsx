import { useRef, MouseEvent } from 'react';
import { useModalFocus } from '../hooks/useModalFocus';
import { formatShortcut } from '../utils/platform';
import './KeyboardShortcutsOverlay.css';

export interface KeyboardShortcut {
  /** Unique identifier for the shortcut */
  id: string;
  /** Visual label describing the action */
  label: string;
  /** Array of key names, use 'mod' for platform-aware Cmd/Ctrl */
  keys: string[];
  /** Optional longer description */
  description?: string;
  /** Hide on mobile devices (for shortcuts that don't make sense on touch) */
  hiddenOnMobile?: boolean;
}

export interface ShortcutGroup {
  /** Group identifier */
  name: string;
  /** Display title for the group */
  title: string;
  /** Shortcuts in this group */
  shortcuts: KeyboardShortcut[];
}

interface KeyboardShortcutsOverlayProps {
  /** Controls overlay visibility */
  isOpen: boolean;
  /** Callback to close the overlay */
  onClose: () => void;
  /** Grouped keyboard shortcuts to display */
  shortcuts?: ShortcutGroup[];
}

/** Default shortcuts catalog for StellarBill */
const DEFAULT_SHORTCUTS: ShortcutGroup[] = [
  {
    name: 'navigation',
    title: 'Navigation',
    shortcuts: [
      {
        id: 'command-palette',
        label: 'Open command palette',
        keys: ['mod', 'K'],
        description: 'Quick access to pages and actions',
        hiddenOnMobile: true,
      },
      {
        id: 'go-to-subscriptions',
        label: 'Go to Subscriptions',
        keys: ['g', 's'],
        description: 'Navigate to the subscriptions page',
        hiddenOnMobile: true,
      },
      {
        id: 'close-overlay',
        label: 'Close overlay or modal',
        keys: ['Esc'],
        description: 'Dismiss the current dialog',
      },
    ],
  },
  {
    name: 'help',
    title: 'Help',
    shortcuts: [
      {
        id: 'show-shortcuts',
        label: 'Show keyboard shortcuts',
        keys: ['?'],
        description: 'Toggle this help overlay',
      },
    ],
  },
];

/**
 * Keyboard shortcuts help overlay.
 * 
 * Displays a modal with grouped keyboard shortcuts, automatically adapting
 * modifier key display for the user's platform (⌘ on Mac, Ctrl elsewhere).
 * 
 * Accessibility:
 * - Implements WAI-ARIA dialog pattern with focus trap
 * - Esc key dismisses the overlay
 * - Focus is restored to the trigger element on close
 * - Semantic <kbd> elements for shortcuts
 * - Responsive: two-column on desktop, single-column on mobile
 * - Print-friendly with dedicated print mode
 */
export default function KeyboardShortcutsOverlay({
  isOpen,
  onClose,
  shortcuts = DEFAULT_SHORTCUTS,
}: KeyboardShortcutsOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useModalFocus(containerRef, { isOpen, onClose, initialFocusRef: closeButtonRef });

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="kb-shortcuts-overlay"
      role="presentation"
      onMouseDown={handleBackdropClick}
    >
      <div
        ref={containerRef}
        className="kb-shortcuts-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-shortcuts-title"
      >
        {/* Header */}
        <div className="kb-shortcuts-header">
          <h2 id="kb-shortcuts-title" className="kb-shortcuts-title">
            Keyboard Shortcuts
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="kb-shortcuts-close"
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Shortcuts Grid */}
        <div className="kb-shortcuts-content">
          {shortcuts.map((group) => (
            <section key={group.name} className="kb-shortcuts-group">
              <h3 className="kb-shortcuts-group-title">{group.title}</h3>
              <dl className="kb-shortcuts-list">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className={`kb-shortcuts-item${shortcut.hiddenOnMobile ? ' kb-shortcuts-item--desktop-only' : ''}`}
                  >
                    <dt className="kb-shortcuts-item-label">
                      {shortcut.label}
                      {shortcut.description && (
                        <span className="kb-shortcuts-item-desc">
                          {shortcut.description}
                        </span>
                      )}
                    </dt>
                    <dd className="kb-shortcuts-item-keys">
                      {formatShortcut(shortcut.keys).map((key, index) => (
                        <kbd key={index} className="kb-shortcuts-key">
                          {key}
                        </kbd>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="kb-shortcuts-footer">
          <button
            type="button"
            className="kb-shortcuts-print-btn"
            onClick={handlePrint}
            aria-label="Print keyboard shortcuts cheatsheet"
          >
            <svg
              className="kb-shortcuts-print-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Print Cheatsheet
          </button>
          <p className="kb-shortcuts-hint">
            Press <kbd className="kb-shortcuts-key">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
