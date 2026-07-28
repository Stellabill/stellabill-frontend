import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PricingModeInput from './PricingModeInput'

describe('PricingModeInput', () => {
  it('renders currency mode with USDC suffix and active button state', () => {
    render(
      <PricingModeInput
        label="Price"
        id="test-price"
        value="12.50"
        mode="currency"
        error={undefined}
        helperText="Enter a fixed amount."
        onChange={vi.fn()}
        onModeChange={vi.fn()}
      />
    )

    expect(screen.getByLabelText(/price/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument()
    expect(screen.getByText('USDC')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /currency/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('preserves value when the toggle switches to percent mode', () => {
    const handleChange = vi.fn()
    const handleModeChange = vi.fn()

    render(
      <PricingModeInput
        label="Price"
        id="test-price"
        value="20"
        mode="currency"
        onChange={handleChange}
        onModeChange={handleModeChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /percent/i }))
    expect(handleModeChange).toHaveBeenCalledWith('percent')
    expect(screen.getByDisplayValue('20')).toBeInTheDocument()
  })

  it('blocks invalid non-numeric characters', () => {
    const handleChange = vi.fn()
    render(
      <PricingModeInput
        label="Price"
        id="test-price"
        value=""
        mode="percent"
        onChange={handleChange}
        onModeChange={vi.fn()}
      />
    )

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abc' } })
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('displays a descriptive helper text for percent mode', () => {
    render(
      <PricingModeInput
        label="Discount"
        id="test-percent"
        value="0"
        mode="percent"
        onChange={vi.fn()}
        onModeChange={vi.fn()}
        helperText="0% keeps the plan price unchanged."
      />
    )

    expect(screen.getByText(/0% keeps the plan price unchanged/i)).toBeInTheDocument()
  })
})
