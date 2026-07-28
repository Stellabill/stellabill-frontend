import { useCallback, useEffect, useRef, useState } from 'react'

// ── Types ───────────────────────────────────────────────────────────────────

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface AutosaveEntry {
  /** ISO-8601 timestamp of when this snapshot was taken. */
  savedAt: string
  /** The serialised form data. */
  data: string
  /** Human-readable label shown in the history popover. */
  label: string
}

export interface UseAutosaveOptions {
  /** Key used for localStorage persistence. */
  storageKey: string
  /** Debounce delay in ms before the save fires. Default 2000. */
  delay?: number
  /** Maximum number of history entries to keep. Default 10. */
  maxHistory?: number
  /** Called when the save fires. Must persist `data` and return a promise. */
  onSave: (data: string) => Promise<void>
  /** Called when a history entry is selected for restore. Must return the parsed data. */
  onRestore: (entry: AutosaveEntry) => T | null
  /** Optional. If true, autosave is disabled (e.g. while tab is hidden). */
  disabled?: boolean
}

export interface UseAutosaveReturn {
  /** Current status of the autosave lifecycle. */
  status: AutosaveStatus
  /** ISO-8601 timestamp of the last successful save, or null. */
  lastSavedAt: string | null
  /** Ordered history entries (newest first). */
  history: AutosaveEntry[]
  /** Manually trigger an immediate save (bypasses debounce). */
  saveNow: () => void
  /** Clear all persisted history. */
  clearHistory: () => void
  /** Restore a specific history entry. */
  restore: (entry: AutosaveEntry) => void
  /** Whether the user is currently offline. */
  isOffline: boolean
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const MAX_HISTORY_DEFAULT = 10
const DEBOUNCE_DEFAULT = 2_000

function loadHistory(key: string, max: number): AutosaveEntry[] {
  try {
    const raw = localStorage.getItem(`${key}:history`)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return (parsed as AutosaveEntry[]).slice(0, max)
  } catch {
    return []
  }
}

function persistHistory(key: string, entries: AutosaveEntry[]) {
  try {
    localStorage.setItem(`${key}:history`, JSON.stringify(entries))
  } catch {
    // Storage full or private mode — silently ignore.
  }
}

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

// ── Hook ────────────────────────────────────────────────────────────────────

type T = unknown

export function useAutosave({
  storageKey,
  delay = DEBOUNCE_DEFAULT,
  maxHistory = MAX_HISTORY_DEFAULT,
  onSave,
  onRestore,
  disabled = false,
}: UseAutosaveOptions): UseAutosaveReturn {
  const [status, setStatus] = useState<AutosaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [history, setHistory] = useState<AutosaveEntry[]>(() =>
    loadHistory(storageKey, maxHistory),
  )
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  )

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingDataRef = useRef<string | null>(null)
  const mountedRef = useRef(true)

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Track tab visibility (pause autosave when tab is hidden)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const persist = useCallback(
    async (data: string) => {
      if (!mountedRef.current) return
      setStatus('saving')
      try {
        await onSave(data)
        const now = new Date().toISOString()
        const entry: AutosaveEntry = {
          savedAt: now,
          data,
          label: relativeTime(now),
        }
        setLastSavedAt(now)
        setHistory((prev) => {
          const next = [entry, ...prev].slice(0, maxHistory)
          persistHistory(storageKey, next)
          return next
        })
        if (mountedRef.current) setStatus('saved')
      } catch {
        if (mountedRef.current) setStatus('error')
      }
    },
    [onSave, storageKey, maxHistory],
  )

  const scheduleSave = useCallback(
    (data: string) => {
      if (disabled || isOffline) {
        pendingDataRef.current = data
        return
      }
      pendingDataRef.current = data
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        if (pendingDataRef.current && mountedRef.current) {
          void persist(pendingDataRef.current)
          pendingDataRef.current = null
        }
      }, delay)
    },
    [disabled, isOffline, delay, persist],
  )

  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (pendingDataRef.current && mountedRef.current) {
      void persist(pendingDataRef.current)
      pendingDataRef.current = null
    }
  }, [persist])

  const clearHistory = useCallback(() => {
    setHistory([])
    try {
      localStorage.removeItem(`${storageKey}:history`)
    } catch {
      // ignore
    }
  }, [storageKey])

  const restore = useCallback(
    (entry: AutosaveEntry) => {
      onRestore(entry)
    },
    [onRestore],
  )

  // Re-sync history from localStorage (e.g. if another tab wrote to it)
  useEffect(() => {
    const interval = setInterval(() => {
      setHistory(loadHistory(storageKey, maxHistory))
    }, 5_000)
    return () => clearInterval(interval)
  }, [storageKey, maxHistory])

  return {
    status,
    lastSavedAt,
    history,
    saveNow,
    clearHistory,
    restore,
    isOffline,
  }
}

export { relativeTime }
