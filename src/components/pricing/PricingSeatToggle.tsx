/**
 * PricingSeatToggle
 *
 * A header control that lets users switch between flat-rate and per-seat
 * pricing and adjust a seat count stepper. Toggle state is synced to the
 * URL via `?mode=flat|per-seat&seats=N` for shareable links.
 *
 * ## Accessibility (WCAG 2.1 AA)
 * - The mode toggle is a `role="radiogroup"` with `role="radio"` children so
 *   arrow-key navigation works out of the box.
 * - The stepper is a `<input type="number">` with visible label and
 *   `aria-live` announcement of the updated total.
 * - All interactive targets meet the 44 × 44 px minimum touch target.
 * - `prefers-reduced-motion`: transition skipped when set.
 *
 * ## URL persistence
 * Reads from and writes to `?mode=flat|per-seat&seats=N`. Components that
 * consume the toggle should read from the same URL params so deep links work.
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import styles from './PricingSeatToggle.module.css'

export type PricingMode = 'flat' | 'per-seat'

export interface PricingSeatToggleProps {
  /** Called whenever mode or seat count changes. */
  onChange: (mode: PricingMode, seats: number) => void
}

const MIN_SEATS = 1
const MAX_SEATS = 10_000
const DEFAULT_SEATS = 5

/** Read initial state from URL search params. */
function readFromUrl(): { mode: PricingMode; seats: number } {
  if (typeof window === 'undefined') return { mode: 'flat', seats: DEFAULT_SEATS }
  const params = new URLSearchParams(window.location.search)
  const mode = params.get('mode') === 'per-seat' ? 'per-seat' : 'flat'
  const raw = parseInt(params.get('seats') ?? '', 10)
  const seats = Number.isFinite(raw) && raw >= MIN_SEATS && raw <= MAX_SEATS ? raw : DEFAULT_SEATS
  return { mode, seats }
}

/** Push updated state into the URL without a full navigation. */
function writeToUrl(mode: PricingMode, seats: number) {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  params.set('mode', mode)
  if (mode === 'per-seat') {
    params.set('seats', String(seats))
  } else {
    params.delete('seats')
  }
  const next = `${window.location.pathname}?${params.toString()}`
  window.history.replaceState(null, '', next)
}

export default function PricingSeatToggle({ onChange }: PricingSeatToggleProps) {
  const init = readFromUrl()
  const [mode, setMode] = useState<PricingMode>(init.mode)
  const [seats, setSeats] = useState<number>(init.seats)
  // Uncontrolled display value so the user can type freely then commit on blur
  const [seatInput, setSeatInput] = useState<string>(String(init.seats))
  const announcerId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  // Notify parent + sync URL whenever derived values change
  useEffect(() => {
    onChange(mode, seats)
    writeToUrl(mode, seats)
  }, [mode, seats, onChange])

  const commitSeats = useCallback(
    (raw: string) => {
      const n = parseInt(raw, 10)
      if (!Number.isFinite(n) || n < MIN_SEATS) {
        setSeats(MIN_SEATS)
        setSeatInput(String(MIN_SEATS))
      } else if (n > MAX_SEATS) {
        setSeats(MAX_SEATS)
        setSeatInput(String(MAX_SEATS))
      } else {
        setSeats(n)
        setSeatInput(String(n))
      }
    },
    []
  )

  const step = (delta: number) => {
    const next = Math.min(MAX_SEATS, Math.max(MIN_SEATS, seats + delta))
    setSeats(next)
    setSeatInput(String(next))
  }

  const handleModeKey = (e: React.KeyboardEvent, target: PricingMode) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      setMode('per-seat')
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      setMode('flat')
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      setMode(target)
    }
  }

  return (
    <div className={styles.root}>
      {/* ── Mode toggle ──────────────────────────────────────────────── */}
      <div
        role="radiogroup"
        aria-label="Pricing mode"
        className={styles.toggle}
      >
        <button
          role="radio"
          aria-checked={mode === 'flat'}
          tabIndex={mode === 'flat' ? 0 : -1}
          className={`${styles.toggleBtn} ${mode === 'flat' ? styles.toggleBtnActive : ''}`}
          onClick={() => setMode('flat')}
          onKeyDown={(e) => handleModeKey(e, 'flat')}
          type="button"
        >
          Flat rate
        </button>

        <button
          role="radio"
          aria-checked={mode === 'per-seat'}
          tabIndex={mode === 'per-seat' ? 0 : -1}
          className={`${styles.toggleBtn} ${mode === 'per-seat' ? styles.toggleBtnActive : ''}`}
          onClick={() => setMode('per-seat')}
          onKeyDown={(e) => handleModeKey(e, 'per-seat')}
          type="button"
        >
          Per seat
        </button>
      </div>

      {/* ── Seat stepper (only visible in per-seat mode) ──────────────── */}
      <div
        className={`${styles.stepperWrapper} ${mode === 'per-seat' ? styles.stepperVisible : styles.stepperHidden}`}
        aria-hidden={mode !== 'per-seat'}
      >
        <span className={styles.stepperLabel} id={`${announcerId}-lbl`}>
          Number of seats
        </span>

        <div className={styles.stepper} role="group" aria-labelledby={`${announcerId}-lbl`}>
          <button
            type="button"
            className={styles.stepBtn}
            aria-label="Remove one seat"
            onClick={() => step(-1)}
            disabled={seats <= MIN_SEATS}
            tabIndex={mode === 'per-seat' ? 0 : -1}
          >
            −
          </button>

          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            className={styles.stepInput}
            value={seatInput}
            min={MIN_SEATS}
            max={MAX_SEATS}
            aria-label="Number of seats"
            aria-describedby={`${announcerId}-lbl`}
            tabIndex={mode === 'per-seat' ? 0 : -1}
            onChange={(e) => setSeatInput(e.target.value)}
            onBlur={(e) => commitSeats(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commitSeats((e.target as HTMLInputElement).value)
                inputRef.current?.blur()
              }
            }}
          />

          <button
            type="button"
            className={styles.stepBtn}
            aria-label="Add one seat"
            onClick={() => step(1)}
            disabled={seats >= MAX_SEATS}
            tabIndex={mode === 'per-seat' ? 0 : -1}
          >
            +
          </button>
        </div>

        {/* Screen-reader live region */}
        <span
          id={announcerId}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={styles.srOnly}
        >
          {mode === 'per-seat' ? `${seats} seat${seats !== 1 ? 's' : ''} selected` : ''}
        </span>
      </div>

      {/* ── Seat definition microcopy ─────────────────────────────────── */}
      {mode === 'per-seat' && (
        <p className={styles.seatDefinition}>
          A <strong>seat</strong> is one active team member who can log in and
          manage subscriptions. Prices shown are per seat/month.
        </p>
      )}
    </div>
  )
}
