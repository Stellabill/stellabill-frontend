import React, { useId, useRef, useState } from 'react'
import './AmountInput.css'

// ─── ISO 4217 currency catalogue ─────────────────────────────────────────────
// fractionDigits: the number of decimal places defined by ISO 4217.
// symbol: the conventional prefix symbol (shown in the input).
// label: plain-English name shown in the currency selector.
export interface CurrencyConfig {
  code: string
  fractionDigits: number
  symbol: string
  label: string
}

/**
 * Core supported currencies. Zero-decimal entries (JPY, KRW) have
 * `fractionDigits: 0`, which is enforced during input and formatting.
 * Add more entries here to extend the catalogue; the component picks them
 * up automatically via the `currencies` prop.
 */
export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'USDC', fractionDigits: 2, symbol: '$', label: 'USD Coin' },
  { code: 'USDT', fractionDigits: 2, symbol: '$', label: 'Tether USD' },
  { code: 'USD',  fractionDigits: 2, symbol: '$', label: 'US Dollar' },
  { code: 'EUR',  fractionDigits: 2, symbol: '€', label: 'Euro' },
  { code: 'GBP',  fractionDigits: 2, symbol: '£', label: 'British Pound' },
  { code: 'JPY',  fractionDigits: 0, symbol: '¥', label: 'Japanese Yen' },
  { code: 'KRW',  fractionDigits: 0, symbol: '₩', label: 'Korean Won' },
  { code: 'XLM',  fractionDigits: 7, symbol: '*', label: 'Stellar Lumens' },
]

// ─── Intl helpers ─────────────────────────────────────────────────────────────

/** Return the locale-appropriate decimal separator for a given locale. */
function getDecimalSeparator(locale: string): string {
  try {
    const parts = new Intl.NumberFormat(locale).formatToParts(1.1)
    return parts.find((p) => p.type === 'decimal')?.value ?? '.'
  } catch {
    return '.'
  }
}

/** Return the locale-appropriate thousands grouping separator. */
function getGroupSeparator(locale: string): string {
  try {
    const parts = new Intl.NumberFormat(locale).formatToParts(1000)
    return parts.find((p) => p.type === 'group')?.value ?? ','
  } catch {
    return ','
  }
}

/**
 * Format a raw numeric string for display, respecting:
 * - locale decimal/group separators
 * - currency fraction digits (zero-decimal currencies get no decimal part)
 * Keeps a trailing decimal separator while the user is typing.
 */
function formatRaw(raw: string, locale: string, fractionDigits: number): string {
  if (!raw || raw === '-') return raw

  const decSep = getDecimalSeparator(locale)

  // Normalise: strip everything that isn't a digit or period (our internal separator)
  const [intPart, ...rest] = raw.split('.')
  const fracPart = rest.join('')

  // Format integer part with grouping
  const intNum = intPart === '' || intPart === '-' ? intPart : parseInt(intPart, 10)
  let formattedInt: string
  try {
    formattedInt =
      intNum === '-' || intNum === ''
        ? intPart
        : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Number(intNum))
  } catch {
    formattedInt = String(intPart)
  }

  // Zero-decimal currencies: never show a decimal part
  if (fractionDigits === 0) return formattedInt

  // If user typed a decimal point, keep it and truncate to allowed digits
  if (raw.includes('.')) {
    const clampedFrac = fracPart.slice(0, fractionDigits)
    return `${formattedInt}${decSep}${clampedFrac}`
  }

  return formattedInt
}

/**
 * Strip locale grouping and convert decimal separator back to `.`
 * so we can call `parseFloat` safely.
 */
function toNumericString(display: string, locale: string): string {
  const grpSep = getGroupSeparator(locale)
  const decSep = getDecimalSeparator(locale)
  // Escape for RegExp
  const escapedGrp = grpSep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return display
    .replace(new RegExp(escapedGrp, 'g'), '')
    .replace(decSep, '.')
}

// ─── Component ───────────────────────────────────────────────────────────────

export type AmountInputStatus = 'idle' | 'pending' | 'success' | 'error'

export interface AmountInputProps {
  /** Controlled numeric value (the underlying number, not the display string). */
  value: number | null | undefined
  /** Called with the parsed number whenever the input changes. `null` means empty / invalid. */
  onChange: (value: number | null) => void
  /** Currently selected currency code (must exist in `currencies`). */
  currency: string
  /** Called when the user picks a different currency. */
  onCurrencyChange: (code: string) => void
  /**
   * Currency catalogue.  Defaults to `SUPPORTED_CURRENCIES`.
   * Pass a subset to restrict choices.
   */
  currencies?: CurrencyConfig[]
  /** BCP-47 locale used for number formatting. Defaults to `'en-US'`. */
  locale?: string
  /** Accessible label for the combined control. */
  label?: string
  /** Whether the field is required. */
  required?: boolean
  /** Error message — triggers error state. */
  error?: string
  /** Supplementary helper text shown below the input. */
  helperText?: string
  /** Visual status for async operations. */
  status?: AmountInputStatus
  /** Whether the input is disabled. */
  disabled?: boolean
  /** Placeholder override. Defaults to locale-formatted "0" with appropriate decimals. */
  placeholder?: string
  /** Optional id prefix for testability. */
  id?: string
  /** Extra class for the root wrapper. */
  className?: string
}

/**
 * AmountInput — multi-currency amount entry control.
 *
 * ## Features
 * - Combined currency selector (ISO 4217) + numeric input with prefix symbol
 * - Locale-aware grouping and decimal separators via `Intl.NumberFormat`
 * - ISO 4217 fraction digits enforced per currency (e.g. JPY → 0, XLM → 7)
 * - Zero-decimal currencies disable the decimal key
 * - Paste handling: strips currency symbols, group separators, whitespace
 * - Visual states: idle, pending, success, error (with accessible messages)
 * - WCAG 2.1 AA: `role="group"`, associated labels, `aria-describedby` for
 *   errors/hints, `aria-live` for status, `aria-invalid` on error
 * - `prefers-reduced-motion` safe (no transitions when reduced motion is set)
 * - Fully responsive — stacks on narrow viewports
 *
 * ## Retry-After parsing convention (Retry-After header)
 * When an API returns 429 with a `Retry-After` header, parse it via
 * `parseRetryAfter()` from `ErrorState.tsx` and surface the `<ErrorState
 * type="rate-limited" />` component instead of this input.
 *
 * ## Usage
 * ```tsx
 * const [amount, setAmount] = useState<number | null>(null)
 * const [currency, setCurrency] = useState('USDC')
 *
 * <AmountInput
 *   value={amount}
 *   onChange={setAmount}
 *   currency={currency}
 *   onCurrencyChange={setCurrency}
 *   label="Price"
 *   required
 * />
 * ```
 */
export function AmountInput({
  value,
  onChange,
  currency,
  onCurrencyChange,
  currencies = SUPPORTED_CURRENCIES,
  locale = 'en-US',
  label = 'Amount',
  required = false,
  error,
  helperText,
  status = 'idle',
  disabled = false,
  placeholder,
  id,
  className = '',
}: AmountInputProps) {
  const uid = useId()
  const inputId = id ? `${id}-input` : `${uid}-input`
  const selectId = id ? `${id}-currency` : `${uid}-currency`
  const messageId = `${inputId}-msg`

  const cfg = currencies.find((c) => c.code === currency) ?? currencies[0]

  // Internal "display" string — what the user actually sees in the <input>
  const [display, setDisplay] = useState<string>(() => {
    if (value == null || !Number.isFinite(value)) return ''
    return formatRaw(value.toFixed(cfg.fractionDigits), locale, cfg.fractionDigits)
  })

  // Track whether the input is focused to avoid reformatting mid-edit
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Currency change: reformat existing value with new fraction digits ──────
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value
    const newCfg = currencies.find((c) => c.code === newCode) ?? currencies[0]
    onCurrencyChange(newCode)

    // Re-normalise display value for the new currency's fraction digits
    if (display !== '') {
      const num = parseFloat(toNumericString(display, locale))
      if (Number.isFinite(num)) {
        setDisplay(formatRaw(num.toFixed(newCfg.fractionDigits), locale, newCfg.fractionDigits))
        onChange(parseFloat(num.toFixed(newCfg.fractionDigits)))
      }
    }
  }

  // ── Typing ────────────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value

    // Normalise: convert locale decimal sep → '.' and strip group separators
    const numeric = toNumericString(raw, locale)

    // Allow only digits, a single '.', and leading '-' pattern
    // Zero-decimal: no decimal point at all
    const pattern = cfg.fractionDigits === 0 ? /^-?\d*$/ : /^-?\d*\.?\d*$/
    if (raw !== '' && !pattern.test(numeric)) return

    // Clamp decimal digits
    if (numeric.includes('.')) {
      const fracPart = numeric.split('.')[1] ?? ''
      if (fracPart.length > cfg.fractionDigits) return
    }

    setDisplay(raw)

    const parsed = raw === '' ? null : parseFloat(numeric)
    onChange(Number.isFinite(parsed) ? parsed : null)
  }

  // ── Paste: strip symbols and re-parse ─────────────────────────────────────
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text')
    // Remove currency codes, symbols, whitespace; keep digits and separators
    const cleaned = pasted
      .replace(/[a-zA-Z$€£¥₩*\s]/g, '')           // currency symbols / letters
      .replace(/[^\d.,\-]/g, '')                    // everything else except digits/separators/minus

    const normalised = toNumericString(cleaned, locale)
    const pattern = cfg.fractionDigits === 0 ? /^-?\d*$/ : /^-?\d*\.?\d*$/
    if (!pattern.test(normalised)) return

    const parsed = parseFloat(normalised)
    if (!Number.isFinite(parsed)) return

    const clamped = parseFloat(parsed.toFixed(cfg.fractionDigits))
    const formatted = formatRaw(clamped.toFixed(cfg.fractionDigits), locale, cfg.fractionDigits)
    setDisplay(formatted)
    onChange(clamped)
  }

  // ── Blur: reformat with locale grouping ───────────────────────────────────
  const handleBlur = () => {
    setFocused(false)
    if (display === '') return
    const numeric = toNumericString(display, locale)
    const parsed = parseFloat(numeric)
    if (!Number.isFinite(parsed)) {
      setDisplay('')
      onChange(null)
      return
    }
    const clamped = parseFloat(parsed.toFixed(cfg.fractionDigits))
    setDisplay(formatRaw(clamped.toFixed(cfg.fractionDigits), locale, cfg.fractionDigits))
    onChange(clamped)
  }

  // ── Keyboard: block decimal key for zero-decimal currencies ──────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const decSep = getDecimalSeparator(locale)
    if (cfg.fractionDigits === 0 && (e.key === '.' || e.key === decSep || e.key === ',')) {
      e.preventDefault()
    }
  }

  // ── Placeholder ───────────────────────────────────────────────────────────
  const defaultPlaceholder =
    cfg.fractionDigits === 0
      ? '0'
      : `0${getDecimalSeparator(locale)}${'0'.repeat(cfg.fractionDigits)}`

  // ── Status helpers ────────────────────────────────────────────────────────
  const hasError = !!error || status === 'error'
  const messageText = error || helperText
  const statusLabel: Record<AmountInputStatus, string> = {
    idle: '',
    pending: 'Validating…',
    success: 'Amount accepted',
    error: error ?? 'Invalid amount',
  }

  return (
    <div
      className={`amt-input-root ${className}`.trim()}
      data-status={status}
      data-disabled={disabled ? 'true' : undefined}
    >
      {/* Label */}
      <label htmlFor={inputId} className="amt-input-label">
        {label}
        {required && (
          <span className="amt-input-required" aria-hidden="true">
            {' '}*
          </span>
        )}
      </label>

      {/* Group: currency selector + numeric input */}
      <div
        role="group"
        aria-labelledby={undefined /* label is on the inner input */}
        className={[
          'amt-input-group',
          hasError ? 'amt-input-group--error' : '',
          status === 'success' ? 'amt-input-group--success' : '',
          focused ? 'amt-input-group--focused' : '',
          disabled ? 'amt-input-group--disabled' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Currency selector */}
        <div className="amt-currency-selector">
          <label htmlFor={selectId} className="amt-sr-only">
            Currency
          </label>
          <select
            id={selectId}
            value={currency}
            onChange={handleCurrencyChange}
            disabled={disabled}
            aria-label="Select currency"
            className="amt-currency-select"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
          {/* Chevron icon */}
          <svg
            className="amt-currency-chevron"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* Divider */}
        <div className="amt-divider" aria-hidden="true" />

        {/* Symbol prefix */}
        {cfg.symbol && cfg.symbol !== '*' && (
          <span className="amt-symbol" aria-hidden="true">
            {cfg.symbol}
          </span>
        )}

        {/* Numeric input */}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={display}
          placeholder={placeholder ?? defaultPlaceholder}
          disabled={disabled}
          required={required}
          aria-required={required}
          aria-invalid={hasError}
          aria-describedby={messageText || status !== 'idle' ? messageId : undefined}
          className="amt-input-field"
          onChange={handleChange}
          onPaste={handlePaste}
          onBlur={handleBlur}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          dir="ltr"
        />

        {/* Status indicator (right side) */}
        {status === 'pending' && (
          <span className="amt-status-icon amt-status-icon--pending" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          </span>
        )}
        {status === 'success' && (
          <span className="amt-status-icon amt-status-icon--success" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
        {hasError && (
          <span className="amt-status-icon amt-status-icon--error" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </span>
        )}
      </div>

      {/* Accessible message (error, helper, or live status) */}
      <span
        id={messageId}
        className={`amt-input-message ${hasError ? 'amt-input-message--error' : ''}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {/* Priority: error > helper > status label */}
        {hasError
          ? (error ?? statusLabel.error)
          : messageText
          ? messageText
          : statusLabel[status]}
      </span>
    </div>
  )
}

export default AmountInput
