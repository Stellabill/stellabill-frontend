import { useEffect, useId, useMemo, useState } from 'react'
import './PhoneNumberInput.css'

interface CountryDefinition {
  iso: string
  label: string
  dialCode: string
  placeholder: string
  nationalLength: number
}

const PHONE_COUNTRIES: CountryDefinition[] = [
  { iso: 'US', label: 'United States', dialCode: '+1', placeholder: '(555) 123-4567', nationalLength: 10 },
  { iso: 'CA', label: 'Canada', dialCode: '+1', placeholder: '(604) 555-0123', nationalLength: 10 },
  { iso: 'GB', label: 'United Kingdom', dialCode: '+44', placeholder: '07700 900123', nationalLength: 10 },
  { iso: 'AU', label: 'Australia', dialCode: '+61', placeholder: '0412 345 678', nationalLength: 9 },
  { iso: 'IN', label: 'India', dialCode: '+91', placeholder: '09123 45678', nationalLength: 10 },
  { iso: 'DE', label: 'Germany', dialCode: '+49', placeholder: '0151 23456789', nationalLength: 11 },
  { iso: 'FR', label: 'France', dialCode: '+33', placeholder: '06 12 34 56 78', nationalLength: 9 },
]

const CODE_ORDERED_COUNTRIES = [...PHONE_COUNTRIES].sort(
  (a, b) => b.dialCode.length - a.dialCode.length
)

const RTL_DIGITS: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
}

function normalizeDigits(value: string) {
  return value
    .split('')
    .map((char) => RTL_DIGITS[char] ?? char)
    .join('')
    .replace(/\D/g, '')
}

function normalizeInternational(value: string) {
  const normalized = value
    .split('')
    .map((char) => RTL_DIGITS[char] ?? char)
    .join('')
    .replace(/[^+\d]/g, '')

  if (normalized.startsWith('+')) {
    return '+' + normalizeDigits(normalized.slice(1))
  }

  return normalizeDigits(normalized)
}

function findCountryForDialCode(rawValue: string) {
  if (!rawValue.startsWith('+')) {
    return null
  }

  const digits = normalizeDigits(rawValue.slice(1))
  return CODE_ORDERED_COUNTRIES.find((country) => digits.startsWith(country.dialCode.slice(1))) || null
}

function formatNationalNumber(country: CountryDefinition, digits: string) {
  const body = digits.slice(0, country.nationalLength)
  const overflow = digits.slice(country.nationalLength)

  const formatted = (() => {
    switch (country.iso) {
      case 'US':
      case 'CA': {
        const area = body.slice(0, 3)
        const prefix = body.slice(3, 6)
        const line = body.slice(6, 10)
        if (!prefix) return area
        if (!line) return `(${area}) ${prefix}`
        return `(${area}) ${prefix}-${line}`
      }
      case 'GB': {
        const part1 = body.slice(0, 4)
        const part2 = body.slice(4, 7)
        const part3 = body.slice(7, 11)
        if (!part2) return part1
        if (!part3) return `${part1} ${part2}`
        return `${part1} ${part2} ${part3}`
      }
      case 'AU': {
        const part1 = body.slice(0, 4)
        const part2 = body.slice(4, 7)
        const part3 = body.slice(7, 10)
        if (!part2) return part1
        if (!part3) return `${part1} ${part2}`
        return `${part1} ${part2} ${part3}`
      }
      case 'IN': {
        const part1 = body.slice(0, 5)
        const part2 = body.slice(5, 10)
        if (!part2) return part1
        return `${part1}-${part2}`
      }
      case 'DE': {
        const part1 = body.slice(0, 4)
        const part2 = body.slice(4, 8)
        const part3 = body.slice(8, 11)
        if (!part2) return part1
        if (!part3) return `${part1} ${part2}`
        return `${part1} ${part2} ${part3}`
      }
      case 'FR': {
        const parts = []
        for (let index = 0; index < body.length; index += 2) {
          parts.push(body.slice(index, index + 2))
        }
        return parts.join(' ')
      }
      default: {
        const parts = []
        for (let index = 0; index < body.length; index += 3) {
          parts.push(body.slice(index, index + 3))
        }
        return parts.join(' ')
      }
    }
  })()

  if (!formatted.trim()) {
    return overflow
  }

  return overflow ? `${formatted} ${overflow}` : formatted
}

export interface PhoneNumberChangePayload {
  e164: string
  nationalNumber: string
  countryIso: string
  isValid: boolean
}

interface PhoneNumberInputProps {
  label?: string
  required?: boolean
  showValidation?: boolean
  externalError?: string
  onChange?: (payload: PhoneNumberChangePayload) => void
  initialCountry?: string
}

export default function PhoneNumberInput({
  label = 'Phone number',
  required = false,
  showValidation = false,
  externalError,
  onChange,
  initialCountry = 'US',
}: PhoneNumberInputProps) {
  const [selectedCountryIso, setSelectedCountryIso] = useState(initialCountry)
  const [nationalDigits, setNationalDigits] = useState('')
  const [rawInput, setRawInput] = useState('')
  const [unknownDialCode, setUnknownDialCode] = useState('')
  const [touched, setTouched] = useState(false)

  const labelId = useId()
  const countrySelectId = useId()
  const numberInputId = useId()
  const helperId = useId()
  const errorId = useId()

  const selectedCountry = useMemo(
    () => PHONE_COUNTRIES.find((country) => country.iso === selectedCountryIso) ?? PHONE_COUNTRIES[0],
    [selectedCountryIso]
  )

  const formattedValue = unknownDialCode ? rawInput : formatNationalNumber(selectedCountry, nationalDigits)

  const internationalNumber = `${selectedCountry.dialCode}${nationalDigits}`

  const currentError = useMemo(() => {
    if (externalError) return externalError
    if (unknownDialCode) {
      return `Unknown country code ${unknownDialCode}.`
    }

    if (!nationalDigits) {
      if (required && (showValidation || touched)) {
        return 'Phone number is required.'
      }
      return ''
    }

    if (nationalDigits.length > selectedCountry.nationalLength) {
      return `Phone number is too long for ${selectedCountry.label}.`
    }

    if (showValidation || touched) {
      if (nationalDigits.length < selectedCountry.nationalLength) {
        return `Enter a ${selectedCountry.nationalLength}-digit ${selectedCountry.label} phone number.`
      }
    }

    return ''
  }, [externalError, unknownDialCode, nationalDigits, required, showValidation, touched, selectedCountry])

  const isValid = !currentError && nationalDigits.length === selectedCountry.nationalLength && !unknownDialCode

  useEffect(() => {
    onChange?.({
      e164: isValid ? internationalNumber : '',
      nationalNumber: nationalDigits,
      countryIso: selectedCountry.iso,
      isValid,
    })
  }, [isValid, internationalNumber, nationalDigits, selectedCountry.iso, onChange])

  const handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountryIso(event.target.value)
    setUnknownDialCode('')
    if (rawInput.startsWith('+')) {
      setRawInput('')
    }
  }

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setTouched(true)

    if (value.trim().startsWith('+')) {
      const normalized = normalizeInternational(value)
      const matchedCountry = findCountryForDialCode(normalized)
      if (matchedCountry) {
        const digits = normalizeDigits(normalized.slice(matchedCountry.dialCode.length))
        setSelectedCountryIso(matchedCountry.iso)
        setUnknownDialCode('')
        setRawInput('')
        setNationalDigits(digits)
        return
      }

      const match = value.match(/^\+(\d{1,3})/)
      setUnknownDialCode(match ? `+${match[1]}` : '+')
      setRawInput(value)
      setNationalDigits('')
      return
    }

    setUnknownDialCode('')
    setRawInput('')
    setNationalDigits(normalizeDigits(value))
  }

  const helperText = currentError
    ? currentError
    : nationalDigits
    ? `E.164: ${internationalNumber}`
    : `Enter your local number to preview E.164 format.`

  return (
    <div className="phone-field">
      <div className="phone-label-row">
        <span id={labelId} className="phone-label">
          {label}
          {required && <span aria-hidden="true">*</span>}
        </span>
      </div>

      <div className="phone-split" role="group" aria-labelledby={labelId} aria-describedby={currentError ? errorId : helperId}>
        <div className="phone-code-wrapper">
          <label htmlFor={countrySelectId} className="phone-sr-only">
            Country code
          </label>
          <select
            id={countrySelectId}
            className={`phone-select ${currentError ? 'phone-input-error' : ''}`}
            value={selectedCountry.iso}
            onChange={handleCountryChange}
            aria-describedby={currentError ? errorId : helperId}
            aria-required={required}
            aria-invalid={!!currentError}
          >
            {PHONE_COUNTRIES.map((country) => (
              <option key={country.iso} value={country.iso}>
                {country.dialCode} {country.iso}
              </option>
            ))}
          </select>
        </div>

        <div className="phone-number-wrapper">
          <label htmlFor={numberInputId} className="phone-sr-only">
            Local phone number
          </label>
          <input
            id={numberInputId}
            type="text"
            inputMode="tel"
            className={`phone-input ${currentError ? 'phone-input-error' : ''}`}
            value={formattedValue}
            onChange={handleNumberChange}
            placeholder={selectedCountry.placeholder}
            aria-describedby={currentError ? errorId : helperId}
            aria-invalid={!!currentError}
            aria-required={required}
            autoComplete="tel"
          />
        </div>
      </div>

      <p id={currentError ? errorId : helperId} className={currentError ? 'phone-error' : 'phone-helper'} role={currentError ? 'alert' : 'status'} aria-live="polite">
        {helperText}
      </p>
    </div>
  )
}
