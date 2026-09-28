import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PhoneNumberInput from './PhoneNumberInput'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInput() {
  return screen.getByLabelText(/Local phone number/i) as HTMLInputElement
}

function getCountrySelect() {
  return screen.getByLabelText(/Country code/i) as HTMLSelectElement
}

// ---------------------------------------------------------------------------
// Existing suite – preserved public contract
// ---------------------------------------------------------------------------

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

    const input = getInput()
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

    const input = getInput()
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

    const input = getInput()
    fireEvent.change(input, { target: { value: '+٦١٠٤١٢٣٤٥٦٧٨' } })

    expect(input.value).toBe('0412 345 67 8')
    expect(handleChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        e164: '',
        isValid: false,
        nationalNumber: '0412345678',
        countryIso: 'AU',
      })
    )
  })

  it('shows an error for an unknown country code', () => {
    render(<PhoneNumberInput />)

    const input = getInput()
    fireEvent.change(input, { target: { value: '+9991234' } })

    expect(screen.getByText(/Unknown country code \+999\./i)).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  // -------------------------------------------------------------------------
  // Regression #886 – Default story failure / empty-result paths
  // -------------------------------------------------------------------------

  describe('Default story – failure and empty-result paths', () => {
    it('does NOT show an error when the field is untouched and empty (Default story initial state)', () => {
      // The Default story renders with required=true but no showValidation.
      // On first render with no interaction the field must be silent.
      render(<PhoneNumberInput label="Business phone number" required />)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(getInput()).toHaveAttribute('aria-invalid', 'false')
    })

    it('emits isValid:false and empty e164 when the field is untouched (Default story initial onChange)', () => {
      const handleChange = vi.fn()
      render(<PhoneNumberInput label="Business phone number" required onChange={handleChange} />)

      expect(handleChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          e164: '',
          isValid: false,
          nationalNumber: '',
          countryIso: 'US',
        })
      )
    })

    it('shows required-field error after user touches and clears the input', () => {
      render(<PhoneNumberInput label="Business phone number" required />)

      const input = getInput()
      // Type something then clear it to simulate a touched-but-empty state.
      fireEvent.change(input, { target: { value: '4' } })
      fireEvent.change(input, { target: { value: '' } })

      expect(screen.getByText(/Phone number is required\./i)).toBeInTheDocument()
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('shows required-field error when showValidation is true and field is empty', () => {
      render(<PhoneNumberInput label="Business phone number" required showValidation />)

      expect(screen.getByText(/Phone number is required\./i)).toBeInTheDocument()
      expect(getInput()).toHaveAttribute('aria-invalid', 'true')
    })

    it('does NOT show required-field error when not required and field is empty', () => {
      render(<PhoneNumberInput label="Business phone number" showValidation />)

      expect(screen.queryByText(/Phone number is required\./i)).not.toBeInTheDocument()
      expect(getInput()).toHaveAttribute('aria-invalid', 'false')
    })

    it('displays an externalError immediately, overriding internal state (WithInvalidNumber story path)', () => {
      render(
        <PhoneNumberInput
          label="Business phone number"
          required
          showValidation
          externalError="Enter a 10-digit United States phone number."
        />
      )

      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent('Enter a 10-digit United States phone number.')
      expect(getInput()).toHaveAttribute('aria-invalid', 'true')
    })

    it('emits isValid:false and empty e164 when externalError is set', () => {
      const handleChange = vi.fn()
      render(
        <PhoneNumberInput
          required
          externalError="Enter a 10-digit United States phone number."
          onChange={handleChange}
        />
      )

      expect(handleChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          e164: '',
          isValid: false,
        })
      )
    })
  })

  // -------------------------------------------------------------------------
  // Regression #886 – neighbouring normal path (Default story success path)
  // -------------------------------------------------------------------------

  describe('Default story – normal path', () => {
    it('accepts a valid US number, shows E.164 helper text, and reports isValid:true', () => {
      const handleChange = vi.fn()
      render(<PhoneNumberInput label="Business phone number" required onChange={handleChange} />)

      const input = getInput()
      fireEvent.change(input, { target: { value: '5551234567' } })

      expect(input.value).toBe('(555) 123-4567')
      expect(screen.getByText('E.164: +15551234567')).toBeInTheDocument()
      expect(handleChange).toHaveBeenLastCalledWith({
        e164: '+15551234567',
        nationalNumber: '5551234567',
        countryIso: 'US',
        isValid: true,
      })
    })

    it('shows no error while typing a valid number with required=true and no showValidation', () => {
      render(<PhoneNumberInput label="Business phone number" required />)

      const input = getInput()
      fireEvent.change(input, { target: { value: '5551234567' } })

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(input).toHaveAttribute('aria-invalid', 'false')
    })

    it('switches country via the select and validates against the new country length', () => {
      const handleChange = vi.fn()
      render(<PhoneNumberInput onChange={handleChange} />)

      const select = getCountrySelect()
      fireEvent.change(select, { target: { value: 'AU' } })

      const input = getInput()
      // AU national length = 9
      fireEvent.change(input, { target: { value: '412345678' } })

      expect(handleChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          e164: '+61412345678',
          countryIso: 'AU',
          isValid: true,
        })
      )
    })
  })

  // -------------------------------------------------------------------------
  // Regression #886 – boundary inputs
  // -------------------------------------------------------------------------

  describe('Boundary inputs', () => {
    it('shows a "too long" error when digits exceed the national length', () => {
      render(<PhoneNumberInput />)

      const input = getInput()
      // 11 digits for US (max 10)
      fireEvent.change(input, { target: { value: '55512345678' } })

      expect(screen.getByText(/Phone number is too long for United States\./i)).toBeInTheDocument()
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('shows a "too short" error when fewer digits are entered and the field is touched', () => {
      render(<PhoneNumberInput />)

      const input = getInput()
      fireEvent.change(input, { target: { value: '555123' } }) // 6 of 10 digits

      expect(screen.getByText(/Enter a 10-digit United States phone number\./i)).toBeInTheDocument()
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('shows a "too short" error with showValidation even without touching the field', () => {
      render(<PhoneNumberInput showValidation />)

      const input = getInput()
      fireEvent.change(input, { target: { value: '415' } })

      expect(screen.getByText(/Enter a 10-digit United States phone number\./i)).toBeInTheDocument()
    })

    it('accepts exactly the minimum valid US number (10 digits)', () => {
      const handleChange = vi.fn()
      render(<PhoneNumberInput onChange={handleChange} />)

      const input = getInput()
      fireEvent.change(input, { target: { value: '2025550101' } })

      expect(handleChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          e164: '+12025550101',
          isValid: true,
        })
      )
      expect(input).toHaveAttribute('aria-invalid', 'false')
    })

    it('treats a leading "+" with no recognised code as unknown dial code', () => {
      render(<PhoneNumberInput />)

      const input = getInput()
      fireEvent.change(input, { target: { value: '+' } })

      // Only a bare "+" – the regexp extracts no digits so code is stored as "+"
      expect(screen.getByText(/Unknown country code \+\./i)).toBeInTheDocument()
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('clears the unknown-code error when the user switches country via the select', () => {
      render(<PhoneNumberInput />)

      const input = getInput()
      fireEvent.change(input, { target: { value: '+9991234' } })
      expect(screen.getByText(/Unknown country code/i)).toBeInTheDocument()

      const select = getCountrySelect()
      fireEvent.change(select, { target: { value: 'GB' } })

      expect(screen.queryByText(/Unknown country code/i)).not.toBeInTheDocument()
    })

    it('propagates the correct countryIso after an international paste', () => {
      const handleChange = vi.fn()
      render(<PhoneNumberInput onChange={handleChange} />)

      const input = getInput()
      fireEvent.change(input, { target: { value: '+33612345678' } }) // France

      expect(handleChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          countryIso: 'FR',
          e164: '+33612345678',
          isValid: true,
        })
      )
    })

    it('does not call onChange with isValid:true when digits are fewer than national length', () => {
      const handleChange = vi.fn()
      render(<PhoneNumberInput onChange={handleChange} />)

      const input = getInput()
      fireEvent.change(input, { target: { value: '415' } })

      const lastCall = handleChange.mock.calls.at(-1)?.[0]
      expect(lastCall?.isValid).toBe(false)
      expect(lastCall?.e164).toBe('')
    })
  })
})
