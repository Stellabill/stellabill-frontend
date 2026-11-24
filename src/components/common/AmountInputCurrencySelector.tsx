import type { ChangeEventHandler } from 'react'
import type { CurrencyConfig } from './amountInputUtils'

interface AmountInputCurrencySelectorProps {
  id: string
  currency: string
  currencies: CurrencyConfig[]
  disabled: boolean
  onChange: ChangeEventHandler<HTMLSelectElement>
}

export default function AmountInputCurrencySelector({
  id,
  currency,
  currencies,
  disabled,
  onChange,
}: AmountInputCurrencySelectorProps) {
  return (
    <div className="amt-currency-selector">
      <label htmlFor={id} className="amt-sr-only">
        Currency
      </label>
      <select
        id={id}
        value={currency}
        onChange={onChange}
        disabled={disabled}
        aria-label="Select currency"
        className="amt-currency-select"
      >
        {currencies.map((item) => (
          <option key={item.code} value={item.code}>
            {item.code}
          </option>
        ))}
      </select>
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
  )
}
