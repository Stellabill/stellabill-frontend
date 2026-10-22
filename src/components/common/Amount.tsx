import { ElementType, ReactNode } from 'react'
import { formatAmount, FormatAmountOptions } from '../../utils/amount'

export interface AmountProps extends FormatAmountOptions {
  /** The numeric input. `null` / `undefined` / `NaN` / non-numeric strings render as the placeholder. */
  value: number | string | null | undefined
  /** Show the trailing currency code (e.g. " USDC"). Defaults to true. */
  showCode?: boolean
  /** Placeholder rendered when the value is missing. Defaults to `—`. */
  placeholder?: ReactNode
  /** Override the screen-reader label entirely. */
  ariaLabel?: string
  /** Override the host element. Defaults to 'span'. */
  as?: ElementType
  /** Optional className applied to the root element. */
  className?: string
  /** Optional className applied to the number portion. */
  numberClassName?: string
  /** Optional className applied to the currency code portion. */
  codeClassName?: string
  /** Forwarded to the root element. */
  ['data-testid']: string
}

/**
 * Standardized currency amount display.
 *
 * Renders a number + currency code (USDC by default) with consistent
 * rounding, locale grouping, and a screen-reader-friendly accessible name.
 *
 * @example
 * <Amount value={1234.5} />              // "1,234.50 USDC"
 * <Amount value="0.005" precision={2} /> // "0.01 USDC" (half-up)
 * <Amount value={null} />                 // "—" (with aria-label "No USDC amount")
 */
export default function Amount({
  value,
  precision,
  minPrecision,
  rounding,
  compact,
  signDisplay,
  locale,
  currency,
  showCode = true,
  placeholder = '—',
  ariaLabel,
  as,
  className,
  numberClassName,
  codeClassName,
  ...rest
}: AmountProps) {
  const Tag = (as ?? 'span') as ElementType
  const testId = rest['data-testid']

  const formatted = formatAmount(value, {
    precision,
    minPrecision,
    rounding,
    compact,
    signDisplay,
    locale,
    currency,
  })

  const finalAriaLabel = ariaLabel ?? formatted.ariaLabel

  if (formatted.isMissing) {
    return (
      <Tag
        className={className}
        aria-label={finalAriaLabel}
        data-testid={testId}
        data-amount-missing="true"
      >
        {placeholder}
      </Tag>
    )
  }

  return (
    <Tag
      className={className}
      aria-label={finalAriaLabel}
      data-testid={testId}
      data-amount-sign={formatted.sign || 'positive'}
      data-amount-zero={formatted.isZero ? 'true' : undefined}
    >
      <span className={numberClassName} aria-hidden="true">
        {formatted.number}
      </span>
      {showCode && (
        <>
          {' '}
          <span className={codeClassName} aria-hidden="true">
            {formatted.currency}
          </span>
        </>
      )}
    </Tag>
  )
}
