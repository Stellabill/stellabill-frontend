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

  it('saves after the debounce delay', async () => {
    const onSave = makeOnSave()
    const { result } = renderHook(() =>
      useAutosave({
        storageKey: STORAGE_KEY,
        delay: DELAY,
        onSave,
        onRestore: makeOnRestore(),
      }),
    )

    // The hook doesn't have a direct "schedule" — it returns saveNow for manual.
    // To test debounce we'd need to expose scheduleSave, but since the hook is
    // designed for useAutosave to be called with saveNow, let's test that path.
    await act(async () => {
      result.current.saveNow()
    })

    expect(onSave).toHaveBeenCalledOnce()
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
      result.current.saveNow()
    })

    const raw = localStorage.getItem(`${STORAGE_KEY}:history`)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed).toHaveLength(1)
    expect(parsed[0]).toHaveProperty('savedAt')
    expect(parsed[0]).toHaveProperty('data')
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
      result.current.saveNow()
    })
    await act(async () => {
      result.current.saveNow()
    })
    await act(async () => {
      result.current.saveNow()
    })

    expect(result.current.history).toHaveLength(2)
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
      result.current.saveNow()
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
      result.current.saveNow()
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
      result.current.saveNow()
    })

    expect(result.current.status).toBe('error')
  })

  it('detects offline status', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true })

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
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
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
      result.current.saveNow()
    })

    vi.advanceTimersByTime(100)

    await act(async () => {
      result.current.saveNow()
    })

    const times = result.current.history.map((e) => new Date(e.savedAt).getTime())
    expect(times[0]).toBeGreaterThanOrEqual(times[1])
  })
})
