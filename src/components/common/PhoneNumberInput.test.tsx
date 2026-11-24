import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PhoneNumberInput from './PhoneNumberInput'
import type { PhoneNumberChangePayload } from './PhoneNumberInput'

function lastPayload(handleChange: ReturnType<typeof vi.fn>): PhoneNumberChangePayload {
  const calls = handleChange.mock.calls
  return calls[calls.length - 1][0] as PhoneNumberChangePayload
}

function digitsOf(value: string) {
  return value.replace(/\s/g, '')
}

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

    expect(input.value).toBe('7700 900 123')
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
    // Arabic-Indic digits for +61 412 345 678.
    fireEvent.change(input, { target: { value: '+٦١٤١٢٣٤٥٦٧٨' } })

    // The numerals are folded to ASCII before the national number is formatted.
    expect(digitsOf(input.value)).toBe('412345678')
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

  // -------------------------------------------------------------------------
  // PhoneNumberChangePayload contract
  // -------------------------------------------------------------------------

  it('reports the complete payload for a valid number', () => {
    const handleChange = vi.fn()
    render(<PhoneNumberInput onChange={handleChange} />)

    const input = screen.getByLabelText(/Local phone number/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: '4155551234' } })

    expect(lastPayload(handleChange)).toEqual({
      e164: '+14155551234',
      nationalNumber: '4155551234',
      countryIso: 'US',
      isValid: true,
    })
  })

  it('reports an incomplete payload (empty e164, isValid false) for a partial number', () => {
    const handleChange = vi.fn()
    render(<PhoneNumberInput showValidation onChange={handleChange} />)

    const input = screen.getByLabelText(/Local phone number/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: '415' } })

    expect(lastPayload(handleChange)).toEqual({
      e164: '',
      nationalNumber: '415',
      countryIso: 'US',
      isValid: false,
    })
  })

  it('defaults to an empty, invalid payload before any input', () => {
    const handleChange = vi.fn()
    render(<PhoneNumberInput onChange={handleChange} />)

    expect(lastPayload(handleChange)).toEqual({
      e164: '',
      nationalNumber: '',
      countryIso: 'US',
      isValid: false,
    })
  })

  // -------------------------------------------------------------------------
  // Invalid inputs / boundary behaviour
  // -------------------------------------------------------------------------

  it('rejects a number that is too long for the selected country', () => {
    const handleChange = vi.fn()
    render(<PhoneNumberInput onChange={handleChange} />)

    const input = screen.getByLabelText(/Local phone number/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: '41555512345' } })

    expect(screen.getByText(/too long for United States/i)).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(lastPayload(handleChange).isValid).toBe(false)
    expect(lastPayload(handleChange).e164).toBe('')
  })

  it('flags a too-short number once validation is shown', () => {
    const handleChange = vi.fn()
    render(<PhoneNumberInput showValidation onChange={handleChange} />)

    const input = screen.getByLabelText(/Local phone number/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: '415' } })

    expect(screen.getByText(/Enter a 10-digit United States phone number\./i)).toBeInTheDocument()
    expect(lastPayload(handleChange).isValid).toBe(false)
  })

  it('only requires a number after the field is touched', () => {
    render(<PhoneNumberInput required />)

    // Nothing is flagged before the field has been interacted with.
    expect(screen.queryByText(/Phone number is required\./i)).not.toBeInTheDocument()

    const input = screen.getByLabelText(/Local phone number/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: '4' } })
    fireEvent.change(input, { target: { value: '' } })

    expect(screen.getByText(/Phone number is required\./i)).toBeInTheDocument()
  })

  it('clears a locally generated error when the number becomes valid', () => {
    const handleChange = vi.fn()
    render(<PhoneNumberInput showValidation onChange={handleChange} />)

    const input = screen.getByLabelText(/Local phone number/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: '415' } })
    expect(screen.getByText(/Enter a 10-digit/i)).toBeInTheDocument()

    fireEvent.change(input, { target: { value: '4155551234' } })
    expect(screen.queryByText(/Enter a 10-digit/i)).not.toBeInTheDocument()
    expect(lastPayload(handleChange).e164).toBe('+14155551234')
    expect(lastPayload(handleChange).isValid).toBe(true)
  })

  it('recovers from an unknown country code once a local number is entered', () => {
    const handleChange = vi.fn()
    render(<PhoneNumberInput onChange={handleChange} />)

    const input = screen.getByLabelText(/Local phone number/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: '+9991234' } })
    expect(screen.getByText(/Unknown country code/i)).toBeInTheDocument()

    fireEvent.change(input, { target: { value: '4155551234' } })
    expect(screen.queryByText(/Unknown country code/i)).not.toBeInTheDocument()
    expect(lastPayload(handleChange).isValid).toBe(true)
  })

  it('lets an external error take precedence over a locally valid number', () => {
    const handleChange = vi.fn()
    render(<PhoneNumberInput externalError="This number is already in use." onChange={handleChange} />)

    const input = screen.getByLabelText(/Local phone number/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: '4155551234' } })

    expect(screen.getByText('This number is already in use.')).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(lastPayload(handleChange).isValid).toBe(false)
    expect(lastPayload(handleChange).e164).toBe('')
  })

  // -------------------------------------------------------------------------
  // State transitions
  // -------------------------------------------------------------------------

  it('reformats the same digits when the country changes', () => {
    const handleChange = vi.fn()
    const { container } = render(<PhoneNumberInput onChange={handleChange} />)

    const input = screen.getByLabelText(/Local phone number/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: '4155551234' } })

    fireEvent.change(screen.getByLabelText(/Country code/i), { target: { value: 'GB' } })

    const select = container.querySelector('select') as HTMLSelectElement
    expect(select.value).toBe('GB')
    expect(input.value).toBe('4155 551 234')
    expect(lastPayload(handleChange).countryIso).toBe('GB')
    expect(lastPayload(handleChange).e164).toBe('+444155551234')
    expect(lastPayload(handleChange).isValid).toBe(true)
  })

  it('honours the initialCountry prop', () => {
    const handleChange = vi.fn()
    render(<PhoneNumberInput initialCountry="GB" onChange={handleChange} />)

    const input = screen.getByLabelText(/Local phone number/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: '7700900123' } })

    expect(input.value).toBe('7700 900 123')
    expect(lastPayload(handleChange).countryIso).toBe('GB')
    expect(lastPayload(handleChange).e164).toBe('+447700900123')
    expect(lastPayload(handleChange).isValid).toBe(true)
  })
})
