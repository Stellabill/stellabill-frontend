import { useCallback, useState } from 'react'
import type { PricingSectionValue } from '../components/PricingSection'

const STORAGE_KEY = 'plan-drafts'
const MAX_DRAFTS = 10
const DRAFT_VERSION = 1

export interface DraftData {
  usageEnabled: boolean
  trialDays: string
  pricing: PricingSectionValue
}

export interface DraftEntry {
  id: string
  savedAt: string
  version: number
  data: DraftData
}

function loadDrafts(): DraftEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as DraftEntry[]
  } catch {
    return []
  }
}

function persistDrafts(drafts: DraftEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
  } catch {
    // Storage full – silently ignore
  }
}

export function useDraftManager() {
  const [drafts, setDrafts] = useState<DraftEntry[]>(() => loadDrafts())

  const saveDraft = useCallback((data: DraftData): DraftEntry => {
    const entry: DraftEntry = {
      id: crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2),
      savedAt: new Date().toISOString(),
      version: DRAFT_VERSION,
      data,
    }
    setDrafts((prev) => {
      const next = [entry, ...prev].slice(0, MAX_DRAFTS)
      persistDrafts(next)
      return next
    })
    return entry
  }, [])

  const deleteDraft = useCallback((id: string) => {
    setDrafts((prev) => {
      const next = prev.filter((d) => d.id !== id)
      persistDrafts(next)
      return next
    })
  }, [])

  const getDraftById = useCallback(
    (id: string): DraftEntry | undefined => {
      return loadDrafts().find((d) => d.id === id)
    },
    [],
  )

  return {
    drafts,
    saveDraft,
    deleteDraft,
    getDraftById,
  }
}
