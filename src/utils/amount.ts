/**
 * Currency / amount formatting utilities.
 *
 * Stellabill amounts are USDC by default. This module is the single source of
 * truth for rounding rules, decimal precision, locale grouping, and the
 * accessible string representation surfaced by the <Amount /> component.
 */

export type RoundingMode = 'half-up' | 'half-even' | 'down' | 'up'

export type SignDisplay = 'auto' | 'always' | 'never' | 'except-zero'

export interface FormatAmountOptions {
  /** Number of fraction digits to display. Defaults to 2. */
  precision?: number
  /**
   * Minimum number of fraction digits to display. Defaults to `precision`.
   * Use a smaller value than `precision` to allow trailing zeros to drop.
   */
  minPrecision?: number
  /** Rounding strategy. Defaults to `'half-up'` (banker-friendly currency rounding). */
  rounding?: RoundingMode
  /** Use compact notation ("1.2K") for large values. Defaults to false. */
  compact?: boolean
  /** Sign-display strategy. Defaults to `'auto'` (only show `-`). */
  signDisplay?: SignDisplay
  /** BCP-47 locale tag. Defaults to `'en-US'`. */
  locale?: string
  /** Currency code label (e.g. "USDC", "USD"). Defaults to `'USDC'`. */
  currency?: string
}

export interface FormattedAmount {
  /** The numeric portion ("1,234.56"), already signed. */
  number: string
  /** The currency code ("USDC"). */
  currency: string
  /** The detected sign character ('', '+', or '-'). */
  sign: '' | '+' | '-'
  /** True when the input rounds to a strictly negative value. */
  isNegative: boolean
  /** True when the input rounds to exactly zero. */
  isZero: boolean
  /**
   * True when the input could not be interpreted as a finite number
   * (null / undefined / empty string / NaN / Infinity / non-numeric string).
   */
  isMissing: boolean
  /** Screen-reader-friendly label, e.g. "1234.56 USDC" or "Negative 1234.56 USDC". */
  ariaLabel: string
  /** Convenience full string: "<number> <currency>". */
  display: string
}

/**
 * Convert a decimal value to integer units without passing through binary
 * arithmetic. Digits beyond the requested precision are truncated.
 */
export function decimalToMinorUnits(value: number | string, precision: number): bigint {
  if (precision < 0 || !Number.isInteger(precision)) {
    throw new RangeError('precision must be a non-negative integer')
  }

  const decimal = String(value).trim()
  const match = decimal.match(/^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i)
  if (!match || (!match[2] && !match[3])) {
    throw new TypeError('Invalid decimal amount')
  }

  const exponent = Number(match[4] ?? 0)
  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 1000) {
    throw new RangeError('Decimal exponent is out of range')
  }

  const integerDigits = match[2] || '0'
  const fractionalDigits = match[3] || ''
  const digits = integerDigits + fractionalDigits
  const decimalIndex = integerDigits.length + exponent
  const wholePart =
    decimalIndex <= 0 ? '0' : digits.slice(0, decimalIndex).padEnd(decimalIndex, '0')
  const fractionPart =
    decimalIndex < 0
      ? '0'.repeat(-decimalIndex) + digits
      : digits.slice(decimalIndex)
  const units =
    BigInt(wholePart || '0') * 10n ** BigInt(precision) +
    BigInt(fractionPart.slice(0, precision).padEnd(precision, '0') || '0')

  return match[1] === '-' ? -units : units
}

/** Format integer units as an ungrouped decimal with a minimum fraction width. */
export function formatMinorUnits(
  value: bigint,
  precision: number,
  minPrecision = 0
): string {
  if (
    precision < 0 ||
    !Number.isInteger(precision) ||
    minPrecision < 0 ||
    !Number.isInteger(minPrecision) ||
    minPrecision > precision
  ) {
    throw new RangeError('precision and minPrecision must be valid non-negative integers')
  }

  const negative = value < 0n
  const magnitude = negative ? -value : value
  const scale = 10n ** BigInt(precision)
  const whole = (magnitude / scale).toString()
  const fraction = (magnitude % scale)
    .toString()
    .padStart(precision, '0')
    .replace(/0+$/u, '')
    .padEnd(minPrecision, '0')

  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`
}

const DEFAULTS = {
  precision: 2,
  rounding: 'half-up' as RoundingMode,
  compact: false,
  signDisplay: 'auto' as SignDisplay,
  locale: 'en-US',
  currency: 'USDC',
}

/**
 * Coerce arbitrary input to a finite number. Returns `null` when the value is
 * missing / not a finite number — callers render the placeholder in that case.
 */
export function coerceAmount(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed === '') return null
  // Strip trailing currency code if present, e.g. "10 USDC".
  const stripped = trimmed.replace(/[a-zA-Z\s,_]+$/u, '').trim()
  // Allow plain leading-minus and decimal point only.
  if (!/^-?\d+(\.\d+)?$/.test(stripped)) return null
  // The regex above guarantees Number() yields a finite value here.
  return Number(stripped)
}

/**
 * Render a non-negative finite number as a plain decimal string (never in
 * exponential notation). JS uses exponential form in `toString()` for very
 * small magnitudes (e.g. `(0.0000005).toString() === '5e-7'`), which breaks
 * the `${n}e${p}` shifting trick used by `roundAmount`.
 */
function toDecimalString(n: number): string {
  const s = n.toString()
  if (!/e/i.test(s)) return s
  // toFixed renders without exponential notation. 100 digits is more than
  // enough for any sensible amount precision.
  return n.toFixed(100).replace(/\.?0+$/, '')
}

/**
 * Round to a given precision using the requested mode.
 *
 * Implementation note: we shift via exponential notation (`${n}e${p}`) instead
 * of `n * 10**p` because the latter is subject to binary-float drift
 * (`1.005 * 100 === 100.49999999999999`, which would round 1.005 to 1.00 with
 * naive half-up). The exponential trick uses the runtime's shortest-round-trip
 * decimal repr and avoids the surprise.
 */
export function roundAmount(value: number, precision: number, mode: RoundingMode): number {
  if (!Number.isFinite(value)) return value
  if (precision < 0 || !Number.isInteger(precision)) {
    throw new RangeError(`precision must be a non-negative integer, got ${precision}`)
  }

  const sign = value < 0 ? -1 : 1
  const abs = Math.abs(value)
  const shifted = Number(`${toDecimalString(abs)}e${precision}`)

  let rounded: number
  switch (mode) {
    case 'half-up': {
      // Half away from zero: since `shifted` is non-negative, Math.round (which
      // is half-toward-+∞) is equivalent to half-away-from-zero here.
      rounded = Math.round(shifted)
      break
    }
    case 'half-even': {
      const floor = Math.floor(shifted)
      const frac = shifted - floor
      if (frac > 0.5) rounded = floor + 1
      else if (frac < 0.5) rounded = floor
      else rounded = floor % 2 === 0 ? floor : floor + 1
      break
    }
    case 'down': {
      rounded = Math.floor(shifted)
      break
    }
    case 'up': {
      rounded = Math.ceil(shifted)
      break
    }
  }

  return sign * Number(`${rounded}e-${precision}`)
}

const sliceSign = (formatted: string): { sign: '' | '+' | '-'; rest: string } => {
  if (formatted.startsWith('-')) return { sign: '-', rest: formatted.slice(1) }
  if (formatted.startsWith('+')) return { sign: '+', rest: formatted.slice(1) }
  return { sign: '', rest: formatted }
}

/** Format a value for display, applying rounding, grouping, sign, and locale. */
export function formatAmount(
  value: number | string | null | undefined,
  options: FormatAmountOptions = {}
): FormattedAmount {
  const precision = options.precision ?? DEFAULTS.precision
  const minPrecision = options.minPrecision ?? precision
  const rounding = options.rounding ?? DEFAULTS.rounding
  const compact = options.compact ?? DEFAULTS.compact
  const signDisplay = options.signDisplay ?? DEFAULTS.signDisplay
  const locale = options.locale ?? DEFAULTS.locale
  const currency = options.currency ?? DEFAULTS.currency

  if (precision < 0 || !Number.isInteger(precision)) {
    throw new RangeError(`precision must be a non-negative integer, got ${precision}`)
  }
  if (minPrecision < 0 || !Number.isInteger(minPrecision) || minPrecision > precision) {
    throw new RangeError(
      `minPrecision must be a non-negative integer no greater than precision (${precision}), got ${minPrecision}`
    )
  }

  const numeric = coerceAmount(value)

  if (numeric === null) {
    return {
      number: '',
      currency,
      sign: '',
      isNegative: false,
      isZero: false,
      isMissing: true,
      ariaLabel: `No ${currency} amount`,
      display: '',
    }
  }

  const rounded = roundAmount(numeric, precision, rounding)
  const isZero = rounded === 0
  const isNegative = rounded < 0

  const intlOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: minPrecision,
    maximumFractionDigits: precision,
    useGrouping: true,
  }
  if (compact) {
    intlOptions.notation = 'compact'
    intlOptions.compactDisplay = 'short'
  }
  switch (signDisplay) {
    case 'always':
      intlOptions.signDisplay = 'always'
      break
    case 'never':
      intlOptions.signDisplay = 'never'
      break
    case 'except-zero':
      intlOptions.signDisplay = 'exceptZero'
      break
    default:
      intlOptions.signDisplay = 'auto'
  }

  let formatted: string
  try {
    formatted = new Intl.NumberFormat(locale, intlOptions).format(rounded)
  } catch {
    formatted = new Intl.NumberFormat('en-US', intlOptions).format(rounded)
  }

  const { sign, rest } = sliceSign(formatted)
  // Re-attach the sign so the rendered number is signed in display order, but
  // the caller can still inspect `sign` independently.
  const number = sign + rest
  const display = `${number} ${currency}`
  const ariaLabel = isNegative
    ? `Negative ${rest} ${currency}`
    : sign === '+'
    ? `Plus ${rest} ${currency}`
    : `${rest} ${currency}`

  return {
    number,
    currency,
    sign,
    isNegative,
    isZero,
    isMissing: false,
    ariaLabel,
    display,
  }
}
