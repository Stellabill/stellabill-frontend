import { useRef, MouseEvent, useState, useEffect, useCallback } from 'react';
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
export const DEFAULT_SHORTCUTS: ShortcutGroup[] = [
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

const RESERVED_CHORDS = [
  'mod+t', 'mod+n', 'mod+w', 'mod+q', 'mod+r', 'mod+l', 'mod+p',
  'alt+f4', 'mod+shift+t', 'mod+shift+w', 'mod+shift+n'
];

/**
 * Normalizes a key array into a string for easy comparison.
 */
const normalizeChord = (keys: string[]) => keys.map(k => k.toLowerCase()).join('+');

/**
 * Keyboard shortcuts help overlay and customization editor.
 * 
 * Design System Pattern: Keyboard Shortcuts Editor
 * - Provides per-scope groupings of keyboard shortcuts.
 * - Allows recording chords live by listening to keydown events.
 * - Detects conflicts with OS/Browser reserved chords and other custom shortcuts in real-time.
 * - Supports resetting individual shortcuts to their default values.
 * - Handles screen readers efficiently with aria-live regions for conflict announcements.
 * 
 * Accessibility (WCAG 2.1 AA):
 * - Focus is trapped within the dialog while active.
 * - Uses correct roles (dialog, button, alert) and aria attributes (aria-invalid, aria-live).
 * - High contrast visual indicators for error states and recording states.
 */
export default function KeyboardShortcutsOverlay({
  isOpen,
  onClose,
  shortcuts = DEFAULT_SHORTCUTS,
}: KeyboardShortcutsOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [customShortcuts, setCustomShortcuts] = useState<Record<string, string[]>>({});
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [currentKeys, setCurrentKeys] = useState<string[]>([]);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  useModalFocus(containerRef, { isOpen, onClose, initialFocusRef: closeButtonRef });

  const getKeys = useCallback((shortcut: KeyboardShortcut) => {
    if (recordingId === shortcut.id && currentKeys.length > 0) return currentKeys;
    return customShortcuts[shortcut.id] || shortcut.keys;
  }, [recordingId, currentKeys, customShortcuts]);

  const checkConflict = useCallback((keys: string[], currentId: string) => {
    const normalized = normalizeChord(keys);
    
    if (RESERVED_CHORDS.includes(normalized)) {
      return 'This is a reserved browser/OS shortcut.';
    }

    for (const group of shortcuts) {
      for (const sc of group.shortcuts) {
        if (sc.id === currentId) continue;
        const scKeys = customShortcuts[sc.id] || sc.keys;
        if (normalizeChord(scKeys) === normalized) {
          return `Conflicts with "${sc.label}"`;
        }
      }
    }
    return null;
  }, [customShortcuts, shortcuts]);

  useEffect(() => {
    if (!recordingId) {
      setCurrentKeys([]);
      setConflictMessage(null);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setRecordingId(null);
        return;
      }

      const keys: string[] = [];
      if (e.ctrlKey || e.metaKey) keys.push('mod');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');

      const keyLower = e.key.toLowerCase();
      if (['control', 'meta', 'alt', 'shift'].includes(keyLower)) {
        setCurrentKeys([...keys]);
        return;
      }

      if (e.key === ' ') {
        keys.push('Space');
      } else {
        keys.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
      }

      const conflict = checkConflict(keys, recordingId);
      if (conflict) {
        setConflictMessage(conflict);
        setCurrentKeys(keys);
        // Do not auto-save on conflict, just show it
        return;
      }

      setCustomShortcuts(prev => ({ ...prev, [recordingId]: keys }));
      setRecordingId(null);
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [recordingId, checkConflict]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const startRecording = (id: string) => {
    setRecordingId(id);
    setCurrentKeys([]);
    setConflictMessage(null);
  };

  const resetShortcut = (id: string) => {
    setCustomShortcuts(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    if (recordingId === id) {
      setRecordingId(null);
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

        <div className="kb-shortcuts-content">
          {shortcuts.map((group) => (
            <section key={group.name} className="kb-shortcuts-group">
              <h3 className="kb-shortcuts-group-title">{group.title}</h3>
              <dl className="kb-shortcuts-list">
                {group.shortcuts.map((shortcut) => {
                  const keys = getKeys(shortcut);
                  const isRecording = recordingId === shortcut.id;
                  const isCustom = !!customShortcuts[shortcut.id];
                  const conflict = isRecording ? conflictMessage : checkConflict(keys, shortcut.id);
                  const hasConflict = !!conflict;
                  
                  return (
                    <div
                      key={shortcut.id}
                      className={`kb-shortcuts-item${shortcut.hiddenOnMobile ? ' kb-shortcuts-item--desktop-only' : ''} ${hasConflict ? 'kb-shortcuts-item--error' : ''}`}
                    >
                      <dt className="kb-shortcuts-item-label">
                        {shortcut.label}
                        {shortcut.description && (
                          <span className="kb-shortcuts-item-desc">
                            {shortcut.description}
                          </span>
                        )}
                        {hasConflict && (
                          <span className="kb-shortcuts-item-error-msg" role="alert" aria-live="assertive">
                            {conflict}
                          </span>
                        )}
                      </dt>
                      <dd className="kb-shortcuts-item-actions">
                        <button
                          type="button"
                          className={`kb-shortcuts-record-btn ${isRecording ? 'is-recording' : ''}`}
                          onClick={() => isRecording ? setRecordingId(null) : startRecording(shortcut.id)}
                          aria-label={isRecording ? `Stop recording for ${shortcut.label}` : `Edit shortcut for ${shortcut.label}`}
                          aria-invalid={hasConflict}
                          aria-describedby={hasConflict ? `conflict-${shortcut.id}` : undefined}
                        >
                          <span className="kb-shortcuts-keys">
                            {keys.length > 0 ? formatShortcut(keys).map((key, index) => (
                              <kbd key={index} className="kb-shortcuts-key">
                                {key}
                              </kbd>
                            )) : <span className="kb-shortcuts-key-placeholder">Press keys...</span>}
                          </span>
                          <span className="kb-shortcuts-edit-icon" aria-hidden="true">✎</span>
                        </button>
                        
                        {isCustom && !isRecording && (
                          <button
                            type="button"
                            className="kb-shortcuts-reset-btn"
                            onClick={() => resetShortcut(shortcut.id)}
                            aria-label={`Reset ${shortcut.label} shortcut to default`}
                            title="Reset to default"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                              <path d="M3 3v5h5" />
                            </svg>
                          </button>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          ))}
        </div>

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
