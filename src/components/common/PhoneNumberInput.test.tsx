import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PhoneNumberInput from './PhoneNumberInput'

describe('PhoneNumberInput', () => {
  it('renders a combined phone group with label and country selector', () => {
    render(<PhoneNumberInput label="Business phone" required />)

    const group = screen.getByRole('group')
    expect(group).toBeInTheDocument()
    expect(group).toHaveAttribute('aria-labelledby')

    const labelId = group.getAttribute('aria-labelledby')
    expect(labelId).toBeTruthy()
    expect(document.getElementById(labelId!)).toHaveTextContent('Business phone')

    expect(screen.getByLabelText(/Country code/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Local phone number/i)).toBeInTheDocument()
  })

  it('formats US numbers and reports a valid E.164 value', () => {
    const handleChange = vi.fn()
    render(<PhoneNumberInput onChange={handleChange} />)

    const input = screen.getByLabelText(/Local phone number/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: '4155551234' } })

    expect(input.value).toBe('(415) 555-1234')
    expect(handleChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        e164: '+14155551234',
        isValid: true,
      })
    )
  })

  it('accepts pasted international input and switches country automatically', () => {
    const handleChange = vi.fn()
    render(<PhoneNumberInput onChange={handleChange} />)

    const input = screen.getByLabelText(/Local phone number/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: '+447700900123' } })

    expect(input.value).toBe('0770 090 0123')
    expect(handleChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        e164: '+447700900123',
        isValid: true,
      })
    )
  })

  it('normalizes RTL numerals in pasted international input', () => {
    const handleChange = vi.fn()
    render(<PhoneNumberInput onChange={handleChange} />)

    const input = screen.getByLabelText(/Local phone number/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: '+٦١٠٤١٢٣٤٥٦٧٨' } })

    expect(input.value).toBe('0412 345 678')
    expect(handleChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        e164: '+61412345678',
        isValid: true,
      })
    )
  })

  it('shows an error for an unknown country code', () => {
    render(<PhoneNumberInput />)

    const input = screen.getByLabelText(/Local phone number/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: '+9991234' } })

    expect(screen.getByText(/Unknown country code \+999\./i)).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })
})
