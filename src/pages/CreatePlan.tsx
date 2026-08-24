import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PricingSection, { validatePricing, type PricingSectionValue } from '../components/PricingSection'
import BillingTypeSection from '../components/create-plan/BillingTypeSection'
import WizardHeader from '../components/create-plan/WizardHeader'
import ExitConfirmModal from '../components/create-plan/ExitConfirmModal'
import { useAutosave, type AutosaveEntry } from '../hooks/useAutosave'
import { useDraftManager } from '../hooks/useDraftManager'
import styles from './CreatePlan.module.css'

const AUTOSAVE_KEY = 'stellabill-create-plan'

function serialiseForm(usageEnabled: boolean, trialDays: string, pricing: PricingSectionValue): string {
  return JSON.stringify({ usageEnabled, trialDays, pricing })
}

function deserialiseForm(entry: AutosaveEntry): {
  usageEnabled: boolean
  trialDays: string
  pricing: PricingSectionValue
} | null {
  try {
    const parsed = JSON.parse(entry.data)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'usageEnabled' in parsed &&
      'trialDays' in parsed &&
      'pricing' in parsed
    ) {
      return {
        usageEnabled: Boolean(parsed.usageEnabled),
        trialDays: String(parsed.trialDays),
        pricing: {
          price: String(parsed.pricing.price ?? ''),
          interval: parsed.pricing.interval ?? '',
          priceType: parsed.pricing.priceType ?? 'currency',
        },
      }
    }
  } catch {
    // Malformed data — ignore.
  }
  return null
}

export default function CreatePlan() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { getDraftById } = useDraftManager()
  const [usageEnabled, setUsageEnabled] = useState(false)
  const [trialDays, setTrialDays] = useState('')
  const [pricing, setPricing] = useState<PricingSectionValue>({ price: '', interval: '', priceType: 'currency' })
  const [errors, setErrors] = useState<{ priceError?: string; intervalError?: string }>({})
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  // Load draft if query param present
  useEffect(() => {
    const draftIdParam = searchParams.get('draftId')
    if (draftIdParam !== null) {
      const draft = getDraftById(draftIdParam)
      if (draft) {
        setUsageEnabled(draft.data.usageEnabled)
        setTrialDays(draft.data.trialDays)
        setPricing(draft.data.pricing)
        setErrors({})
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Autosave ────────────────────────────────────────────────────────────

  const currentData = serialiseForm(usageEnabled, trialDays, pricing)

  const handleSave = useCallback(
    async (data: string) => {
      localStorage.setItem(AUTOSAVE_KEY, data)
    },
    [],
  )

  const handleRestore = useCallback(
    (entry: AutosaveEntry) => {
      const restored = deserialiseForm(entry)
      if (restored) {
        setUsageEnabled(restored.usageEnabled)
        setTrialDays(restored.trialDays)
        setPricing(restored.pricing)
        setErrors({})
      }
    },
    [],
  )

  const {
    status,
    lastSavedAt,
    history,
    saveNow,
    clearHistory,
    restore,
    isOffline,
  } = useAutosave({
    storageKey: AUTOSAVE_KEY,
    delay: 2_000,
    maxHistory: 10,
    onSave: handleSave,
    onRestore: handleRestore,
  })

  useEffect(() => {
    saveNow()
  }, [currentData]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Draft persistence ───────────────────────────────────────────────────

  const { saveDraft } = useDraftManager()

  const defaultFormData = useMemo(
    () => ({ usageEnabled: false, trialDays: '', pricing: { price: '', interval: '', priceType: 'currency' as const } }),
    [],
  )

  const isDirty = useMemo(
    () =>
      usageEnabled !== defaultFormData.usageEnabled ||
      trialDays !== defaultFormData.trialDays ||
      pricing.price !== defaultFormData.pricing.price ||
      pricing.interval !== defaultFormData.pricing.interval ||
      pricing.priceType !== defaultFormData.pricing.priceType,
    [usageEnabled, trialDays, pricing, defaultFormData],
  )

  // ── Navigation ──────────────────────────────────────────────────────────

  const handleCancel = useCallback(() => {
    if (isDirty) {
      setPendingNavigation('/plans')
      setShowExitConfirm(true)
    } else {
      navigate('/plans')
    }
  }, [isDirty, navigate])

  const handleSaveDraft = useCallback(() => {
    saveDraft({ usageEnabled, trialDays, pricing })
  }, [saveDraft, usageEnabled, trialDays, pricing])

  const handleExitSaveDraft = useCallback(() => {
    saveDraft({ usageEnabled, trialDays, pricing })
    setShowExitConfirm(false)
    if (pendingNavigation) {
      navigate(pendingNavigation)
    }
  }, [saveDraft, usageEnabled, trialDays, pricing, pendingNavigation, navigate])

  const handleExitDiscard = useCallback(() => {
    setShowExitConfirm(false)
    if (pendingNavigation) {
      navigate(pendingNavigation)
    }
  }, [pendingNavigation, navigate])

  const handleKeepEditing = useCallback(() => {
    setShowExitConfirm(false)
    setPendingNavigation(null)
  }, [])

  // ── Submit ──────────────────────────────────────────────────────────────

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const nextErrors = validatePricing(pricing)
    setErrors(nextErrors)
    if (nextErrors.priceError || nextErrors.intervalError) {
      return
    }

    const payload = {
      usage_enabled: usageEnabled,
      trial_period_days: trialDays === '' ? 0 : Number(trialDays),
      price: Number(pricing.price),
      price_type: pricing.priceType,
      interval: pricing.interval,
    }
    console.log('Create plan payload:', payload)
    clearHistory()
    localStorage.removeItem(AUTOSAVE_KEY)
  }

  return (
    <div className={styles.container}>
      {isOffline && (
        <div role="alert" className="offline-banner" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          background: 'rgba(249, 115, 22, 0.1)',
          border: '1px solid rgba(249, 115, 22, 0.2)',
          borderRadius: '8px',
          color: '#f97316',
          fontSize: '0.75rem',
          fontWeight: 500,
          marginBottom: '0.75rem',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
          You are offline. Autosave is paused until your connection is restored.
        </div>
      )}

      <WizardHeader
        title="Create Plan"
        currentStep={1}
        totalSteps={3}
        isDirty={isDirty}
        onCancel={handleCancel}
        onSaveDraft={handleSaveDraft}
      />

      <form onSubmit={handleSubmit} noValidate>
        <BillingTypeSection
          usageEnabled={usageEnabled}
          onUsageEnabledChange={setUsageEnabled}
          trialDays={trialDays}
          onTrialDaysChange={setTrialDays}
        />

        <div style={{ marginBottom: '1.5rem' }}>
          <PricingSection
            value={pricing}
            onChange={setPricing}
            priceError={errors.priceError}
            intervalError={errors.intervalError}
          />
        </div>

        <div
          style={{
            display: 'flex',
            gap: '0.875rem',
            marginTop: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="submit"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.6rem',
              background: 'linear-gradient(135deg, #38bcd4 0%, #4dd8e1 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontSize: '0.925rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.88'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Create plan
          </button>

          <button
            type="button"
            onClick={handleCancel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.75rem 1.6rem',
              background: 'none',
              border: '1px solid #3a3a3a',
              borderRadius: '8px',
              color: '#e2e8f0',
              fontSize: '0.925rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#555'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#3a3a3a'
            }}
          >
            Cancel
          </button>
        </div>
      </form>

      <ExitConfirmModal
        isOpen={showExitConfirm}
        onSaveDraft={handleExitSaveDraft}
        onDiscard={handleExitDiscard}
        onKeepEditing={handleKeepEditing}
      />
    </div>
  )
}
