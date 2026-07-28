import { useEffect, useRef, useState } from 'react'
import { Check, Clock, AlertCircle, WifiOff, Loader2 } from 'lucide-react'
import type { AutosaveStatus } from '../hooks/useAutosave'
import styles from './AutosaveIndicator.module.css'

// ── Types ───────────────────────────────────────────────────────────────────

interface AutosaveIndicatorProps {
  /** Current autosave status. */
  status: AutosaveStatus
  /** ISO-8601 timestamp of the last successful save, or null. */
  lastSavedAt: string | null
  /** Whether the user is offline. */
  isOffline?: boolean
  /** Click handler for the indicator (opens history popover). */
  onClick?: () => void
}

// ── Relative time ───────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(iso).toLocaleDateString()
}

// ── Live region text ────────────────────────────────────────────────────────

function statusAnnouncement(status: AutosaveStatus, lastSavedAt: string | null, isOffline: boolean): string {
  if (isOffline) return 'You are offline. Autosave is paused.'
  switch (status) {
    case 'saving':
      return 'Saving your changes.'
    case 'saved':
      return lastSavedAt
        ? `All changes saved ${relativeTime(lastSavedAt)}.`
        : 'All changes saved.'
    case 'error':
      return 'Failed to save changes. Your work may not be persisted.'
    default:
      return ''
  }
}

// ── Component ───────────────────────────────────────────────────────────────

export default function AutosaveIndicator({
  status,
  lastSavedAt,
  isOffline = false,
  onClick,
}: AutosaveIndicatorProps) {
  const [announce, setAnnounce] = useState('')
  const prevStatusRef = useRef<AutosaveStatus>(status)
  const liveRegionRef = useRef<HTMLDivElement>(null)

  // Announce status changes via live region (polite, debounced to avoid spam)
  useEffect(() => {
    if (status !== prevStatusRef.current) {
      prevStatusRef.current = status
      const text = statusAnnouncement(status, lastSavedAt, isOffline)
      if (text) {
        // Small delay so the live region picks up the change even if the text
        // is the same as a previous announcement (e.g. two saves in a row).
        const t = setTimeout(() => setAnnounce(text), 50)
        return () => clearTimeout(t)
      }
    }
  }, [status, lastSavedAt, isOffline])

  const icon = isOffline ? (
    <WifiOff size={13} aria-hidden="true" />
  ) : status === 'saving' ? (
    <Loader2 size={13} className={styles.spinner} aria-hidden="true" />
  ) : status === 'saved' ? (
    <Check size={13} aria-hidden="true" />
  ) : status === 'error' ? (
    <AlertCircle size={13} aria-hidden="true" />
  ) : (
    <Clock size={13} aria-hidden="true" />
  )

  const label = isOffline
    ? 'Offline'
    : status === 'saving'
      ? 'Saving…'
      : status === 'saved' && lastSavedAt
        ? `Saved ${relativeTime(lastSavedAt)}`
        : status === 'error'
          ? 'Save failed'
          : 'Not yet saved'

  return (
    <>
      {/* Polite live region for screen readers — updates only on state transitions. */}
      <div
        ref={liveRegionRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
        }}
      >
        {announce}
      </div>

      <button
        type="button"
        className={styles.indicator}
        data-status={isOffline ? 'offline' : status}
        data-offline={isOffline}
        onClick={onClick}
        aria-label={label}
        aria-haspopup={onClick ? 'dialog' : undefined}
      >
        {icon}
        <span>{label}</span>
      </button>
    </>
  )
}

export { relativeTime }
