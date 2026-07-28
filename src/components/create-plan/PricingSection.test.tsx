import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { validatePricing } from './PricingSection'
import PricingSection from './PricingSection'

describe('PricingSection validation', () => {
  it('rejects percent values above 100%', () => {
    const errors = validatePricing({ price: '125', interval: 'Monthly', priceType: 'percent' })

    expect(errors.priceError).toBe('Percent values cannot exceed 100%')
  })

  it('allows 0% as a valid percent value', () => {
    const errors = validatePricing({ price: '0', interval: 'Monthly', priceType: 'percent' })

    expect(errors.priceError).toBeUndefined()
  })

  it('requires pricing interval', () => {
    const errors = validatePricing({ price: '10', interval: '', priceType: 'currency' })

    expect(errors.intervalError).toBe('Billing interval is required')
  })
})

describe('PricingSection render', () => {
  it('renders the price input with currency and switches to percent without clearing the value', () => {
    const onChange = vi.fn()
    render(
      <PricingSection
        value={{ price: '50', interval: 'Monthly', priceType: 'currency' }}
        onChange={onChange}
        priceError={undefined}
        intervalError={undefined}
      />
    )

    expect(screen.getByRole('textbox', { name: /price/i })).toHaveValue('50')

    fireEvent.click(screen.getByRole('button', { name: /percent/i }))
    expect(onChange).toHaveBeenCalledWith({ price: '50', interval: 'Monthly', priceType: 'percent' })
  })
})
