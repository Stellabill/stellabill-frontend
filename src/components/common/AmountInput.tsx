import { useId, useRef } from 'react'
import AmountInputCurrencySelector from './AmountInputCurrencySelector'
import AmountInputField from './AmountInputField'
import type { CurrencyConfig } from './amountInputUtils'
import { useAmountInputState } from './useAmountInputState'
import './AmountInput.css'

// ─── ISO 4217 currency catalogue ─────────────────────────────────────────────
export type { CurrencyConfig } from './amountInputUtils'

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

  const {
    display,
    focused,
    defaultPlaceholder,
    handleCurrencyChange,
    handleChange,
    handlePaste,
    handleBlur,
    handleFocus,
    handleKeyDown,
  } = useAmountInputState({
    value,
    onChange,
    onCurrencyChange,
    currencies,
    locale,
    currencyConfig: cfg,
  })
  const inputRef = useRef<HTMLInputElement>(null)

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
        <AmountInputCurrencySelector
          id={selectId}
          currency={currency}
          currencies={currencies}
          disabled={disabled}
          onChange={handleCurrencyChange}
        />

        {/* Divider */}
        <div className="amt-divider" aria-hidden="true" />

        <AmountInputField
          symbol={cfg.symbol}
          inputRef={inputRef}
          id={inputId}
          display={display}
          placeholder={placeholder ?? defaultPlaceholder}
          disabled={disabled}
          required={required}
          hasError={hasError}
          messageText={messageText}
          status={status}
          onChange={handleChange}
          onPaste={handlePaste}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
        />
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
