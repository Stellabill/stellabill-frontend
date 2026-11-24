/** Locale-appropriate decimal separator for a given locale. */
export function getDecimalSeparator(locale: string): string {
  try {
    const parts = new Intl.NumberFormat(locale).formatToParts(1.1)
    return parts.find((part) => part.type === 'decimal')?.value ?? '.'
  } catch {
    return '.'
  }
}

/** Locale-appropriate thousands grouping separator. */
export function getGroupSeparator(locale: string): string {
  try {
    const parts = new Intl.NumberFormat(locale).formatToParts(1000)
    return parts.find((part) => part.type === 'group')?.value ?? ','
  } catch {
    return ','
  }
}

/**
 * Format a raw numeric string while preserving a trailing decimal separator
 * during editing.
 */
export function formatRaw(raw: string, locale: string, fractionDigits: number): string {
  if (!raw || raw === '-') return raw

  const decSep = getDecimalSeparator(locale)
  const [intPart, ...rest] = raw.split('.')
  const fracPart = rest.join('')

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

  if (fractionDigits === 0) return formattedInt

  if (raw.includes('.')) {
    const clampedFrac = fracPart.slice(0, fractionDigits)
    return `${formattedInt}${decSep}${clampedFrac}`
  }

  return formattedInt
}

/** Remove locale grouping and normalize the decimal separator to `.`. */
export function toNumericString(display: string, locale: string): string {
  const grpSep = getGroupSeparator(locale)
  const decSep = getDecimalSeparator(locale)
  const escapedGrp = grpSep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return display
    .replace(new RegExp(escapedGrp, 'g'), '')
    .replace(decSep, '.')
}

export interface CurrencyConfig {
  code: string
  fractionDigits: number
  symbol: string
  label: string
}
