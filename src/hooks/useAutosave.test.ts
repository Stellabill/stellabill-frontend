import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAutosave, relativeTime } from './useAutosave'

// ── Helpers ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'test-autosave'
const DELAY = 100 // fast debounce for tests

function makeOnSave() {
  return vi.fn().mockResolvedValue(undefined)
}

function makeOnRestore() {
  return vi.fn()
}

function setupLocalStorage(key: string, value: string) {
  localStorage.setItem(key, value)
}

// ── relativeTime ────────────────────────────────────────────────────────────

describe('relativeTime', () => {
  it('returns "just now" for timestamps < 10s ago', () => {
    const iso = new Date(Date.now() - 5_000).toISOString()
    expect(relativeTime(iso)).toBe('just now')
  })

  it('returns seconds ago for timestamps < 60s ago', () => {
    const iso = new Date(Date.now() - 30_000).toISOString()
    expect(relativeTime(iso)).toBe('30s ago')
  })

  it('returns minutes ago for timestamps < 60m ago', () => {
    const iso = new Date(Date.now() - 5 * 60_000).toISOString()
    expect(relativeTime(iso)).toBe('5m ago')
  })

  it('returns hours ago for timestamps < 24h ago', () => {
    const iso = new Date(Date.now() - 3 * 3_600_000).toISOString()
    expect(relativeTime(iso)).toBe('3h ago')
  })

  it('returns a date string for timestamps > 24h ago', () => {
    const iso = new Date(Date.now() - 48 * 3_600_000).toISOString()
    const result = relativeTime(iso)
    // Should be a date string, not relative
    expect(result).not.toMatch(/ago/)
    expect(result).not.toBe('just now')
  })
})

// ── useAutosave hook ────────────────────────────────────────────────────────

describe('useAutosave', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('starts in idle state with no history', () => {
    const { result } = renderHook(() =>
      useAutosave({
        storageKey: STORAGE_KEY,
        delay: DELAY,
        onSave: makeOnSave(),
        onRestore: makeOnRestore(),
      }),
    )

    expect(result.current.status).toBe('idle')
    expect(result.current.history).toEqual([])
    expect(result.current.lastSavedAt).toBeNull()
  })

  it('saves after the debounce delay via scheduleSave', async () => {
    const onSave = makeOnSave()
    const { result } = renderHook(() =>
      useAutosave({
        storageKey: STORAGE_KEY,
        delay: DELAY,
        onSave,
        onRestore: makeOnRestore(),
      }),
    )

    act(() => {
      result.current.scheduleSave('my-form-data')
    })

    expect(onSave).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(DELAY)
    })

    expect(onSave).toHaveBeenCalledOnce()
    expect(onSave).toHaveBeenCalledWith('my-form-data')
    expect(result.current.status).toBe('saved')
    expect(result.current.lastSavedAt).not.toBeNull()
    expect(result.current.history).toHaveLength(1)
  })

  it('saves immediately when saveNow is called', async () => {
    const onSave = makeOnSave()
    const { result } = renderHook(() =>
      useAutosave({
        storageKey: STORAGE_KEY,
        delay: DELAY,
        onSave,
        onRestore: makeOnRestore(),
      }),
    )

    await act(async () => {
      result.current.saveNow('manual-data')
    })

    expect(onSave).toHaveBeenCalledOnce()
    expect(onSave).toHaveBeenCalledWith('manual-data')
    expect(result.current.status).toBe('saved')
    expect(result.current.lastSavedAt).not.toBeNull()
    expect(result.current.history).toHaveLength(1)
  })

  it('persists history to localStorage', async () => {
    const onSave = makeOnSave()
    const { result } = renderHook(() =>
      useAutosave({
        storageKey: STORAGE_KEY,
        delay: DELAY,
        onSave,
        onRestore: makeOnRestore(),
      }),
    )

    await act(async () => {
      result.current.saveNow('persisted-data')
    })

    const raw = localStorage.getItem(`${STORAGE_KEY}:history`)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed).toHaveLength(1)
    expect(parsed[0]).toHaveProperty('savedAt')
    expect(parsed[0]).toHaveProperty('data', 'persisted-data')
  })

  it('loads existing history from localStorage on mount', () => {
    setupLocalStorage(
      `${STORAGE_KEY}:history`,
      JSON.stringify([
        { savedAt: '2025-01-01T00:00:00Z', data: '{}', label: 'old' },
      ]),
    )

    const { result } = renderHook(() =>
      useAutosave({
        storageKey: STORAGE_KEY,
        delay: DELAY,
        onSave: makeOnSave(),
        onRestore: makeOnRestore(),
      }),
    )

    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0].savedAt).toBe('2025-01-01T00:00:00Z')
  })

  it('caps history at maxHistory', async () => {
    const onSave = makeOnSave()
    const { result } = renderHook(() =>
      useAutosave({
        storageKey: STORAGE_KEY,
        delay: DELAY,
        maxHistory: 2,
        onSave,
        onRestore: makeOnRestore(),
      }),
    )

    await act(async () => {
      result.current.saveNow('entry-1')
    })
    await act(async () => {
      result.current.saveNow('entry-2')
    })
    await act(async () => {
      result.current.saveNow('entry-3')
    })

    expect(result.current.history).toHaveLength(2)
    expect(result.current.history[0].data).toBe('entry-3')
    expect(result.current.history[1].data).toBe('entry-2')
  })

  it('clearHistory removes all entries', async () => {
    const onSave = makeOnSave()
    const { result } = renderHook(() =>
      useAutosave({
        storageKey: STORAGE_KEY,
        delay: DELAY,
        onSave,
        onRestore: makeOnRestore(),
      }),
    )

    await act(async () => {
      result.current.saveNow('data')
    })

    expect(result.current.history).toHaveLength(1)

    act(() => {
      result.current.clearHistory()
    })

    expect(result.current.history).toEqual([])
    expect(localStorage.getItem(`${STORAGE_KEY}:history`)).toBeNull()
  })

  it('restore calls onRestore with the entry', async () => {
    const onSave = makeOnSave()
    const onRestore = makeOnRestore()
    const { result } = renderHook(() =>
      useAutosave({
        storageKey: STORAGE_KEY,
        delay: DELAY,
        onSave,
        onRestore,
      }),
    )

    await act(async () => {
      result.current.saveNow('snapshot')
    })

    const entry = result.current.history[0]
    act(() => {
      result.current.restore(entry)
    })

    expect(onRestore).toHaveBeenCalledWith(entry)
  })

  it('sets error status when onSave rejects', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('fail'))
    const { result } = renderHook(() =>
      useAutosave({
        storageKey: STORAGE_KEY,
        delay: DELAY,
        onSave,
        onRestore: makeOnRestore(),
      }),
    )

    await act(async () => {
      result.current.saveNow('error-data')
    })

    expect(result.current.status).toBe('error')
  })

  it('detects offline status', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true })

    const { result } = renderHook(() =>
      useAutosave({
        storageKey: STORAGE_KEY,
        delay: DELAY,
        onSave: makeOnSave(),
        onRestore: makeOnRestore(),
      }),
    )

    expect(result.current.isOffline).toBe(true)

    // Restore
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true })
  })

  it('newest entry is first in history', async () => {
    const onSave = makeOnSave()
    const { result } = renderHook(() =>
      useAutosave({
        storageKey: STORAGE_KEY,
        delay: DELAY,
        onSave,
        onRestore: makeOnRestore(),
      }),
    )

    await act(async () => {
      result.current.saveNow('first')
    })

    vi.advanceTimersByTime(100)

    await act(async () => {
      result.current.saveNow('second')
    })

    const times = result.current.history.map((e) => new Date(e.savedAt).getTime())
    expect(times[0]).toBeGreaterThanOrEqual(times[1])
  })

  // ── Debounce coalescing rapid edits ────────────────────────────────────────

  it('debounce coalesces rapid edits: only saves the latest value once', async () => {
    const onSave = makeOnSave()
    const { result } = renderHook(() =>
      useAutosave({
        storageKey: STORAGE_KEY,
        delay: DELAY,
        onSave,
        onRestore: makeOnRestore(),
      }),
    )

    act(() => {
      result.current.scheduleSave('edit 1')
      result.current.scheduleSave('edit 2')
      result.current.scheduleSave('edit 3')
    })

    expect(onSave).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(DELAY)
    })

    expect(onSave).toHaveBeenCalledOnce()
    expect(onSave).toHaveBeenCalledWith('edit 3')
    expect(result.current.status).toBe('saved')
  })

  it('debounce coalesces rapid edits via value option', async () => {
    const onSave = makeOnSave()
    const { rerender } = renderHook(
      ({ val }) =>
        useAutosave({
          value: val,
          storageKey: STORAGE_KEY,
          delay: DELAY,
          onSave,
          onRestore: makeOnRestore(),
        }),
      { initialProps: { val: 'initial' } },
    )

    expect(onSave).not.toHaveBeenCalled()

    rerender({ val: 'edit 1' })
    rerender({ val: 'edit 2' })
    rerender({ val: 'edit 3' })

    expect(onSave).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(DELAY)
    })

    expect(onSave).toHaveBeenCalledOnce()
    expect(onSave).toHaveBeenCalledWith('edit 3')
  })

  // ── Offline queue flush ────────────────────────────────────────────────────

  it('offline queue flush: pauses saves while offline and flushes when coming back online', async () => {
    const onSave = makeOnSave()
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true })

    const { result } = renderHook(() =>
      useAutosave({
        storageKey: STORAGE_KEY,
        delay: DELAY,
        onSave,
        onRestore: makeOnRestore(),
      }),
    )

    expect(result.current.isOffline).toBe(true)

    act(() => {
      result.current.scheduleSave('offline edit')
      vi.advanceTimersByTime(DELAY * 3)
    })

    // Autosave paused while offline
    expect(onSave).not.toHaveBeenCalled()

    // Restore connection
    await act(async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true })
      window.dispatchEvent(new Event('online'))
    })

    expect(result.current.isOffline).toBe(false)
    expect(onSave).toHaveBeenCalledOnce()
    expect(onSave).toHaveBeenCalledWith('offline edit')
  })

  // ── Visibility hidden flush ────────────────────────────────────────────────

  it('visibility-hidden flush: flushes pending queued data immediately when tab is hidden', async () => {
    const onSave = makeOnSave()
    const { result } = renderHook(() =>
      useAutosave({
        storageKey: STORAGE_KEY,
        delay: DELAY,
        onSave,
        onRestore: makeOnRestore(),
      }),
    )

    act(() => {
      result.current.scheduleSave('hidden tab data')
    })

    // Timer is still pending, has not elapsed DELAY
    expect(onSave).not.toHaveBeenCalled()

    // Tab is hidden
    await act(async () => {
      Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(onSave).toHaveBeenCalledOnce()
    expect(onSave).toHaveBeenCalledWith('hidden tab data')

    // Reset document.hidden
    Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true })
  })
})
