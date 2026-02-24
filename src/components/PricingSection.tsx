import { useState, useEffect } from 'react'

export type PlanInterval = 'Monthly' | 'Yearly'

export interface PricingSectionValue {
  price: string
  interval: '' | PlanInterval
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
          <label htmlFor="pricing-price" style={labelStyle}>
            Price <span style={{ color: '#f00' }}>*</span>
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'stretch',
              background: '#192222',
              border: `1px solid ${priceError ? '#dc2626' : '#2a2a2a'}`,
              borderRadius: '8px',
              overflow: 'hidden',
              borderLeft: 'none'
            }}
          >
            <input
              id="pricing-price"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={value.price}
              onChange={handlePriceChange}
              required
              aria-required="true"
              aria-invalid={!!priceError}
              aria-describedby={priceError ? 'pricing-price-error' : undefined}
              style={{
                ...inputBaseStyle,
                border: 'none',
                flex: 1,
                minWidth: 0,
              }}
            />
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 1rem',
                color: '#e2e8f0',
                fontSize: '0.875rem',
                background: '#1a1a1a',
              }}
            >
              USDC
            </span>
          </div>
          {priceError && (
            <p id="pricing-price-error" style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.375rem' }}>
              {priceError}
            </p>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <label htmlFor="pricing-interval" style={labelStyle}>
            Billing interval <span style={{ color: '#f00' }}>*</span>
          </label>
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
