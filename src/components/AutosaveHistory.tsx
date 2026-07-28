import { useEffect, useRef, useState } from 'react'
import { History, X } from 'lucide-react'
import type { AutosaveEntry } from '../hooks/useAutosave'
import { relativeTime } from '../hooks/useAutosave'
import styles from './AutosaveIndicator.module.css'

// ── Types ───────────────────────────────────────────────────────────────────

interface AutosaveHistoryProps {
  /** History entries (newest first). */
  history: AutosaveEntry[]
  /** Called when the user clicks "Restore" on an entry. */
  onRestore: (entry: AutosaveEntry) => void
  /** Called when the user clears all history. */
  onClear: () => void
}

// ── Component ───────────────────────────────────────────────────────────────

export default function AutosaveHistory({
  history,
  onRestore,
  onClear,
}: AutosaveHistoryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [pendingRestore, setPendingRestore] = useState<AutosaveEntry | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen])

  // Focus trap inside popover
  useEffect(() => {
    if (!isOpen || !popoverRef.current) return
    const focusable = popoverRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled])',
    )
    if (focusable.length > 0) {
      ;(focusable[0] as HTMLElement).focus()
    }
  }, [isOpen])

  const handleRestoreClick = (entry: AutosaveEntry) => {
    setPendingRestore(entry)
  }

  const confirmRestore = () => {
    if (pendingRestore) {
      onRestore(pendingRestore)
      setPendingRestore(null)
      setIsOpen(false)
    }
  }

  const cancelRestore = () => {
    setPendingRestore(null)
  }

  return (
    <>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        className={styles.popoverAnchor}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`Autosave history (${history.length} entries)`}
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: '0.25rem',
          borderRadius: '6px',
          display: 'inline-flex',
          alignItems: 'center',
          transition: 'color 0.15s',
        }}
      >
        <History size={15} aria-hidden="true" />
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className={styles.popover}
          role="dialog"
          aria-label="Autosave history"
          tabIndex={-1}
        >
          <div className={styles.popoverHeader}>
            <span className={styles.popoverTitle}>Autosave History</span>
            {history.length > 0 && (
              <button
                type="button"
                className={styles.popoverClear}
                onClick={onClear}
                aria-label="Clear all autosave history"
              >
                Clear all
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className={styles.popoverEmpty}>
              No autosaves yet. Your work will be saved automatically as you type.
            </div>
          ) : (
            <ul className={styles.popoverList} role="list">
              {history.map((entry, idx) => (
                <li key={entry.savedAt} className={styles.popoverItem}>
                  <span className={styles.popoverItemTime}>
                    {relativeTime(entry.savedAt)}
                  </span>
                  <button
                    type="button"
                    className={styles.popoverRestore}
                    onClick={() => handleRestoreClick(entry)}
                    aria-label={`Restore autosave from ${relativeTime(entry.savedAt)}`}
                  >
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Confirm restore dialog */}
      {pendingRestore && (
        <div
          className={styles.restoreOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) cancelRestore()
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Confirm restore"
        >
          <div className={styles.restoreDialog}>
            <h3 className={styles.restoreDialogTitle}>Restore this autosave?</h3>
            <p className={styles.restoreDialogDesc}>
              This will replace your current form data with the version saved{' '}
              {relativeTime(pendingRestore.savedAt)}. Unsaved changes will be lost.
            </p>
            <div className={styles.restoreDialogActions}>
              <button
                type="button"
                className={styles.restoreDialogCancel}
                onClick={cancelRestore}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.restoreDialogConfirm}
                onClick={confirmRestore}
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
