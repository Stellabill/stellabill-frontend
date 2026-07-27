import React from 'react'

export type PricingMode = 'currency' | 'percent'

export interface PricingModeInputProps {
  label?: string
  value: string
  mode: PricingMode
  onModeChange: (mode: PricingMode) => void
  onChange: (value: string) => void
  error?: string
  helperText?: string
  id?: string
}

export function PricingModeInput({
  label = 'Amount',
  value,
  mode,
  onModeChange,
  onChange,
  error,
  helperText,
  id,
}: PricingModeInputProps) {
  const inputId = id || `pricing-mode-input-${Math.random().toString(36).slice(2, 9)}`
  const prefix = mode === 'currency' ? '$' : ''
  const suffix = mode === 'currency' ? 'USDC' : '%'

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value
    if (nextValue === '' || /^\d*\.?\d*$/.test(nextValue)) {
      onChange(nextValue)
    }
  }

  return (
    <div>
      <label htmlFor={inputId} style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>
        {label} <span style={{ color: '#f00' }}>*</span>
      </label>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ position: 'relative', background: '#192222', border: `1px solid ${error ? '#dc2626' : '#2a2a2a'}`, borderRadius: '8px', flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {prefix && (
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.95rem', pointerEvents: 'none' }}>
              {prefix}
            </span>
          )}

          <input
            id={inputId}
            type="text"
            inputMode="decimal"
            placeholder={mode === 'currency' ? '0.00' : '0'}
            value={value}
            onChange={handleInputChange}
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error || helperText ? `${inputId}-${error ? 'error' : 'hint'}` : undefined}
            style={{
              width: '100%',
              padding: prefix ? '0.75rem 4.5rem 0.75rem 2.5rem' : '0.75rem 4.5rem',
              background: 'transparent',
              border: 'none',
              color: '#e2e8f0',
              fontSize: '0.875rem',
              outline: 'none',
              minWidth: 0,
              direction: 'ltr',
            }}
          />

          <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.875rem', pointerEvents: 'none' }}>
            {suffix}
          </span>
        </div>

        <div
          role="group"
          aria-label="Price type"
          style={{ display: 'inline-flex', borderRadius: '999px', border: '1px solid #2a2a2a', background: '#161b1d', overflow: 'hidden' }}
        >
          {(['currency', 'percent'] as PricingMode[]).map((option) => {
            const isActive = mode === option
            return (
              <button
                key={option}
                type="button"
                aria-pressed={isActive}
                onClick={() => onModeChange(option)}
                style={{
                  minWidth: '96px',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: isActive ? '#4dd8e1' : 'transparent',
                  color: isActive ? '#041015' : '#e2e8f0',
                  fontWeight: 600,
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

      {(error || helperText) && (
        <p
          id={error ? `${inputId}-error` : `${inputId}-hint`}
          style={{
            color: error ? '#dc2626' : '#94a3b8',
            fontSize: '0.75rem',
            marginTop: '0.5rem',
            lineHeight: 1.4,
          }}
        >
          {error || helperText}
        </p>
      )}
    </div>
  )
}

export default PricingModeInput
