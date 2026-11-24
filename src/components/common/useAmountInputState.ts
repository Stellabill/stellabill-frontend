import type {
  ChangeEvent,
  ClipboardEvent,
  KeyboardEvent,
} from 'react'
import { useState } from 'react'
import {
  formatRaw,
  getDecimalSeparator,
  toNumericString,
} from './amountInputUtils'
import type { CurrencyConfig } from './amountInputUtils'

interface UseAmountInputStateOptions {
  value: number | null | undefined
  onChange: (value: number | null) => void
  onCurrencyChange: (code: string) => void
  currencies: CurrencyConfig[]
  locale: string
  currencyConfig: CurrencyConfig
}

export function useAmountInputState({
  value,
  onChange,
  onCurrencyChange,
  currencies,
  locale,
  currencyConfig,
}: UseAmountInputStateOptions) {
  const [display, setDisplay] = useState<string>(() => {
    if (value == null || !Number.isFinite(value)) return ''
    return formatRaw(value.toFixed(currencyConfig.fractionDigits), locale, currencyConfig.fractionDigits)
  })
  const [focused, setFocused] = useState(false)

  const handleCurrencyChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const newCode = event.target.value
    const newConfig = currencies.find((item) => item.code === newCode) ?? currencies[0]
    onCurrencyChange(newCode)

    if (display !== '') {
      const num = parseFloat(toNumericString(display, locale))
      if (Number.isFinite(num)) {
        setDisplay(formatRaw(num.toFixed(newConfig.fractionDigits), locale, newConfig.fractionDigits))
        onChange(parseFloat(num.toFixed(newConfig.fractionDigits)))
      }
    }
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value
    const numeric = toNumericString(raw, locale)
    const pattern = currencyConfig.fractionDigits === 0 ? /^-?\d*$/ : /^-?\d*\.?\d*$/
    if (raw !== '' && !pattern.test(numeric)) return

    if (numeric.includes('.')) {
      const fracPart = numeric.split('.')[1] ?? ''
      if (fracPart.length > currencyConfig.fractionDigits) return
    }

    setDisplay(raw)
    const parsed = raw === '' ? null : parseFloat(numeric)
    onChange(Number.isFinite(parsed) ? parsed : null)
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text')
    const cleaned = pasted
      .replace(/[a-zA-Z$€£¥₩*\s]/g, '')
      .replace(/[^\d.,-]/g, '')

    const normalized = toNumericString(cleaned, locale)
    const pattern = currencyConfig.fractionDigits === 0 ? /^-?\d*$/ : /^-?\d*\.?\d*$/
    if (!pattern.test(normalized)) return

    const parsed = parseFloat(normalized)
    if (!Number.isFinite(parsed)) return

    const clamped = parseFloat(parsed.toFixed(currencyConfig.fractionDigits))
    const formatted = formatRaw(
      clamped.toFixed(currencyConfig.fractionDigits),
      locale,
      currencyConfig.fractionDigits,
    )
    setDisplay(formatted)
    onChange(clamped)
  }

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

    const clamped = parseFloat(parsed.toFixed(currencyConfig.fractionDigits))
    setDisplay(formatRaw(clamped.toFixed(currencyConfig.fractionDigits), locale, currencyConfig.fractionDigits))
    onChange(clamped)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const decSep = getDecimalSeparator(locale)
    if (
      currencyConfig.fractionDigits === 0 &&
      (event.key === '.' || event.key === decSep || event.key === ',')
    ) {
      event.preventDefault()
    }
  }

  const defaultPlaceholder =
    currencyConfig.fractionDigits === 0
      ? '0'
      : `0${getDecimalSeparator(locale)}${'0'.repeat(currencyConfig.fractionDigits)}`

  return {
    display,
    focused,
    defaultPlaceholder,
    handleCurrencyChange,
    handleChange,
    handlePaste,
    handleBlur,
    handleFocus: () => setFocused(true),
    handleKeyDown,
  }
}
