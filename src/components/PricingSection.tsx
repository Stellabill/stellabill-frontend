import { useState, useEffect } from 'react'
import { PricingModeInput, type PricingMode } from './common/PricingModeInput'
import AmountInput from './common/AmountInput'
import { FieldLabelWithHelp } from './common/FieldHelpPopover'

export type PlanInterval = 'Monthly' | 'Yearly'

export interface PricingSectionValue {
  price: string
  interval: '' | PlanInterval
  priceType: PricingMode
  /** ISO 4217 currency code used when priceType === 'currency'. Defaults to 'USDC'. */
  currency?: string
}

export interface PricingSectionProps {
  value: PricingSectionValue
  onChange: (value: PricingSectionValue) => void
  priceError?: string
  intervalError?: string
}

const inputBaseStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  background: '#1a1a1a',
  border: '1px solid #2a2a2a',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '0.875rem',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#e2e8f0',
  fontSize: '0.875rem',
  fontWeight: 500,
  marginBottom: '0.5rem',
}

export function validatePricing(value: PricingSectionValue): { priceError?: string; intervalError?: string } {
  const errors: { priceError?: string; intervalError?: string } = {}
  const num = parseFloat(value.price)
  if (value.price.trim() === '') {
    errors.priceError = 'Price is required'
  } else if (Number.isNaN(num) || num < 0) {
    errors.priceError = 'Price must be a valid number ≥ 0'
  } else if (value.priceType === 'percent' && num > 100) {
    errors.priceError = 'Percent values cannot exceed 100%'
  }
  if (!value.interval) {
    errors.intervalError = 'Billing interval is required'
  }
  return errors
}

export default function PricingSection({ value, onChange, priceError, intervalError }: PricingSectionProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (v === '' || /^\d*\.?\d*$/.test(v)) {
      onChange({ ...value, price: v })
    }
  }

  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value as '' | PlanInterval
    onChange({ ...value, interval: v })
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(0, 184, 219, 0.05) 0%, rgba(0, 187, 167, 0.05) 100%)',
        border: '1px solid #2a2a2a',
        borderRadius: '12px',
        padding: '1.5rem',
      }}
    >
      <h3 style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '1rem', marginBottom: '1.25rem' }}>
        Pricing
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '1.25rem',
        }}
      >
        <div style={{ minWidth: 0 }}>
          {/* Mode toggle — always shown so users can switch between currency and percent */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
            <div
              role="group"
              aria-label="Price type"
              style={{ display: 'inline-flex', borderRadius: '999px', border: '1px solid #2a2a2a', background: '#161b1d', overflow: 'hidden' }}
            >
              {(['currency', 'percent'] as PricingMode[]).map((option) => {
                const isActive = value.priceType === option
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => onChange({ ...value, priceType: option })}
                    style={{
                      minWidth: '80px',
                      padding: '0.4rem 0.75rem',
                      border: 'none',
                      background: isActive ? '#4dd8e1' : 'transparent',
                      color: isActive ? '#041015' : '#e2e8f0',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    {option === 'currency' ? 'Currency' : 'Percent'}
                  </button>
                )
              })}
            </div>
          </div>

          {value.priceType === 'currency' ? (
            <AmountInput
              id="pricing-price"
              label="Price"
              required
              value={value.price === '' ? null : parseFloat(value.price)}
              onChange={(num) =>
                onChange({ ...value, price: num == null ? '' : String(num) })
              }
              currency={value.currency ?? 'USDC'}
              onCurrencyChange={(code) => onChange({ ...value, currency: code })}
              error={priceError}
              helperText="Enter the plan price. Use 0 for a free plan."
            />
          ) : (
            <PricingModeInput
              label="Price"
              id="pricing-price"
              value={value.price}
              mode={value.priceType}
              error={priceError}
              helperText={
                value.priceType === 'percent'
                  ? value.price === '0'
                    ? '0% keeps the plan price unchanged.'
                    : 'Enter a discount percentage between 0% and 100%.'
                  : 'Enter a fixed amount in USDC. Use 0 for a free plan.'
              }
              onChange={handlePriceChange}
              onModeChange={(priceType) => onChange({ ...value, priceType })}
            />
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <FieldLabelWithHelp
            htmlFor="pricing-interval"
            required
            helpTitle="Billing interval"
            help={<p>Choose how often the recurring plan renews and invoices subscribers.</p>}
            style={labelStyle}
          >
            Billing interval
          </FieldLabelWithHelp>
          <div style={{ position: 'relative' }}>
            <select
              id="pricing-interval"
              value={value.interval}
              onChange={handleIntervalChange}
              required
              aria-required="true"
              aria-invalid={!!intervalError}
              aria-describedby={intervalError ? 'pricing-interval-error' : undefined}
              style={{
                ...inputBaseStyle,
                appearance: 'none',
                cursor: 'pointer',
                paddingRight: '2.5rem',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23e2e8f0'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '16px',
              }}
            >
              <option value="">Select interval</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
          {intervalError && (
            <p id="pricing-interval-error" style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.375rem' }}>
              {intervalError}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
