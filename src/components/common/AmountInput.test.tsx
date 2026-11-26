import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AmountInput, { SUPPORTED_CURRENCIES } from './AmountInput'
import { formatRaw, getDecimalSeparator, getGroupSeparator } from './amountInputUtils'

describe('AmountInput', () => {
  describe('rendering and initial state', () => {
    it('renders the formatted amount, currency selector, and prefix symbol', () => {
      const { container } = render(
        <AmountInput
          value={1234.5}
          currency="USD"
          onChange={() => {}}
          onCurrencyChange={() => {}}
        />,
      )

      expect(screen.getByLabelText('Amount')).toHaveValue('1,234.50')
      expect(screen.getByRole('combobox', { name: 'Select currency' })).toHaveValue('USD')
      expect(container.querySelector('.amt-symbol')).toHaveTextContent('$')
    })

    it('renders an empty input when value is null, undefined, or non-finite', () => {
      const { rerender } = render(
        <AmountInput
          value={null}
          currency="USDC"
          onChange={() => {}}
          onCurrencyChange={() => {}}
        />,
      )
      expect(screen.getByLabelText('Amount')).toHaveValue('')
      expect(screen.getByLabelText('Amount')).toHaveAttribute('placeholder', '0.00')

      rerender(
        <AmountInput
          value={undefined}
          currency="JPY"
          onChange={() => {}}
          onCurrencyChange={() => {}}
        />,
      )
      expect(screen.getByLabelText('Amount')).toHaveAttribute('placeholder', '0')

      const { unmount } = render(
        <AmountInput
          value={Number.NaN}
          currency="USDC"
          label="NaN Amount"
          onChange={() => {}}
          onCurrencyChange={() => {}}
        />,
      )
      expect(screen.getByLabelText('NaN Amount')).toHaveValue('')
      unmount()
    })

    it('hides the prefix symbol for currencies using "*" (e.g. XLM) and falls back to the first currency when unknown', () => {
      const { container } = render(
        <AmountInput
          value={10}
          currency="XLM"
          onChange={() => {}}
          onCurrencyChange={() => {}}
        />,
      )
      expect(container.querySelector('.amt-symbol')).toBeNull()
      expect(screen.getByLabelText('Amount')).toHaveValue('10.0000000')

      const { container: fallbackContainer } = render(
        <AmountInput
          value={5}
          currency="UNKNOWN"
          label="Fallback Amount"
          onChange={() => {}}
          onCurrencyChange={() => {}}
        />,
      )
      expect(fallbackContainer.querySelector('.amt-symbol')).toHaveTextContent(
        SUPPORTED_CURRENCIES[0].symbol,
      )
      expect(screen.getByLabelText('Fallback Amount')).toHaveValue('5.00')
    })

    it('applies custom id, label, required asterisk, placeholder, disabled state, and className', () => {
      const { container } = render(
        <AmountInput
          id="price-field"
          label="Invoice Total"
          required
          disabled
          placeholder="Enter amount"
          className="custom-wrapper"
          value={null}
          currency="USDC"
          onChange={() => {}}
          onCurrencyChange={() => {}}
        />,
      )

      const root = container.querySelector('.amt-input-root')
      expect(root).toHaveClass('custom-wrapper')
      expect(root).toHaveAttribute('data-disabled', 'true')
      expect(container.querySelector('.amt-input-required')).toHaveTextContent('*')

      const input = screen.getByLabelText(/Invoice Total/)
      expect(input).toHaveAttribute('id', 'price-field-input')
      expect(input).toHaveAttribute('placeholder', 'Enter amount')
      expect(input).toBeDisabled()
      expect(input).toBeRequired()

      const select = screen.getByRole('combobox', { name: 'Select currency' })
      expect(select).toHaveAttribute('id', 'price-field-currency')
      expect(select).toBeDisabled()
    })
  })

  describe('handleChange and input sanitising', () => {
    it('rejects typing letters and ignores extra fraction digits beyond cfg.fractionDigits', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(
        <AmountInput
          value={null}
          currency="USD"
          onChange={onChange}
          onCurrencyChange={() => {}}
        />,
      )

      const input = screen.getByLabelText('Amount')
      await user.type(input, 'ab12.345cd')

      expect(input).toHaveValue('12.34')
      expect(onChange).toHaveBeenLastCalledWith(12.34)
      expect(onChange).not.toHaveBeenCalledWith(12.345)
    })

    it('rejects decimal points in handleChange when fractionDigits is 0', () => {
      const onChange = vi.fn()
      render(
        <AmountInput
          value={100}
          currency="JPY"
          onChange={onChange}
          onCurrencyChange={() => {}}
        />,
      )

      const input = screen.getByLabelText('Amount')
      fireEvent.change(input, { target: { value: '100.5' } })

      expect(input).toHaveValue('100')
      expect(onChange).not.toHaveBeenCalled()
    })

    it('reports the parsed number via onChange and null when cleared or incomplete', () => {
      const onChange = vi.fn()
      render(
        <AmountInput
          value={null}
          currency="USD"
          onChange={onChange}
          onCurrencyChange={() => {}}
        />,
      )

      const input = screen.getByLabelText('Amount')

      fireEvent.change(input, { target: { value: '42.5' } })
      expect(onChange).toHaveBeenLastCalledWith(42.5)

      fireEvent.change(input, { target: { value: '-' } })
      expect(onChange).toHaveBeenLastCalledWith(null)

      fireEvent.change(input, { target: { value: '-15.25' } })
      expect(onChange).toHaveBeenLastCalledWith(-15.25)

      fireEvent.change(input, { target: { value: '' } })
      expect(onChange).toHaveBeenLastCalledWith(null)
    })

    it('sanitizes locale-formatted typing before calling onChange', () => {
      const onChange = vi.fn()
      render(
        <AmountInput
          value={null}
          currency="EUR"
          locale="de-DE"
          onChange={onChange}
          onCurrencyChange={() => {}}
        />,
      )

      fireEvent.change(screen.getByLabelText('Amount'), {
        target: { value: '1.234,56' },
      })

      expect(onChange).toHaveBeenCalledWith(1234.56)
    })
  })

  describe('handlePaste', () => {
    it('normalises, clamps, and formats pasted "1,234.5" and excess precision values', () => {
      const onChange = vi.fn()
      render(
        <AmountInput
          value={null}
          currency="USD"
          onChange={onChange}
          onCurrencyChange={() => {}}
        />,
      )

      const input = screen.getByLabelText('Amount')

      fireEvent.paste(input, {
        clipboardData: { getData: () => '1,234.5' },
      })
      expect(onChange).toHaveBeenLastCalledWith(1234.5)
      expect(input).toHaveValue('1,234.50')

      fireEvent.paste(input, {
        clipboardData: { getData: () => '$1,234.567 USDC' },
      })
      expect(onChange).toHaveBeenLastCalledWith(1234.57)
      expect(input).toHaveValue('1,234.57')
    })

    it('ignores invalid pasted text that does not resolve to a valid number', () => {
      const onChange = vi.fn()
      render(
        <AmountInput
          value={50}
          currency="USD"
          onChange={onChange}
          onCurrencyChange={() => {}}
        />,
      )

      const input = screen.getByLabelText('Amount')

      // Multiple decimal points fail pattern validation
      fireEvent.paste(input, {
        clipboardData: { getData: () => '12.34.56' },
      })
      expect(input).toHaveValue('50.00')
      expect(onChange).not.toHaveBeenCalled()

      // Non-numeric text resolves to empty / NaN after stripping
      fireEvent.paste(input, {
        clipboardData: { getData: () => 'abc ---' },
      })
      expect(input).toHaveValue('50.00')
      expect(onChange).not.toHaveBeenCalled()

      // Standalone minus sign matches regex but parseFloat is NaN
      fireEvent.paste(input, {
        clipboardData: { getData: () => '-' },
      })
      expect(input).toHaveValue('50.00')
      expect(onChange).not.toHaveBeenCalled()
    })

    it('rejects pasted decimal numbers for zero-decimal currencies', () => {
      const onChange = vi.fn()
      render(
        <AmountInput
          value={100}
          currency="JPY"
          onChange={onChange}
          onCurrencyChange={() => {}}
        />,
      )

      const input = screen.getByLabelText('Amount')
      fireEvent.paste(input, {
        clipboardData: { getData: () => '1,234.5' },
      })

      expect(input).toHaveValue('100')
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('handleBlur and focus tracking', () => {
    it('formats to the fixed number of decimals on blur and tracks focused styling', () => {
      const onChange = vi.fn()
      const { container } = render(
        <AmountInput
          value={null}
          currency="USD"
          onChange={onChange}
          onCurrencyChange={() => {}}
        />,
      )

      const input = screen.getByLabelText('Amount')
      const group = container.querySelector('.amt-input-group')

      fireEvent.focus(input)
      expect(group).toHaveClass('amt-input-group--focused')

      fireEvent.change(input, { target: { value: '1234.5' } })
      expect(input).toHaveValue('1234.5')

      fireEvent.blur(input)
      expect(group).not.toHaveClass('amt-input-group--focused')
      expect(input).toHaveValue('1,234.50')
      expect(onChange).toHaveBeenLastCalledWith(1234.5)
    })

    it('handles NaN input on blur by clearing the display and reporting null', () => {
      const onChange = vi.fn()
      render(
        <AmountInput
          value={null}
          currency="USD"
          onChange={onChange}
          onCurrencyChange={() => {}}
        />,
      )

      const input = screen.getByLabelText('Amount')

      // Empty blur is a no-op
      fireEvent.blur(input)
      expect(onChange).not.toHaveBeenCalled()

      // Incomplete negative sign or standalone dot produces NaN on blur
      fireEvent.change(input, { target: { value: '-' } })
      onChange.mockClear()

      fireEvent.blur(input)
      expect(input).toHaveValue('')
      expect(onChange).toHaveBeenCalledWith(null)
    })
  })

  describe('handleKeyDown', () => {
    it('blocks "." and "," keys when fractionDigits === 0, and allows them when fractionDigits > 0', () => {
      const { rerender } = render(
        <AmountInput
          value={12}
          currency="JPY"
          onChange={() => {}}
          onCurrencyChange={() => {}}
        />,
      )

      const input = screen.getByLabelText('Amount')
      expect(fireEvent.keyDown(input, { key: '.' })).toBe(false)
      expect(fireEvent.keyDown(input, { key: ',' })).toBe(false)
      expect(fireEvent.keyDown(input, { key: '5' })).toBe(true)

      rerender(
        <AmountInput
          value={12}
          currency="USD"
          onChange={() => {}}
          onCurrencyChange={() => {}}
        />,
      )
      expect(fireEvent.keyDown(input, { key: '.' })).toBe(true)
      expect(fireEvent.keyDown(input, { key: ',' })).toBe(true)
    })
  })

  describe('currency switching', () => {
    it('re-formats and rounds the displayed amount when changing currency', () => {
      const onChange = vi.fn()
      const onCurrencyChange = vi.fn()
      render(
        <AmountInput
          value={12.5}
          currency="USD"
          onChange={onChange}
          onCurrencyChange={onCurrencyChange}
        />,
      )

      const select = screen.getByRole('combobox', { name: 'Select currency' })
      fireEvent.change(select, { target: { value: 'JPY' } })

      expect(onCurrencyChange).toHaveBeenCalledWith('JPY')
      expect(onChange).toHaveBeenCalledWith(13)
      expect(screen.getByLabelText('Amount')).toHaveValue('13')

      fireEvent.change(select, { target: { value: 'XLM' } })
      expect(onCurrencyChange).toHaveBeenCalledWith('XLM')
      expect(onChange).toHaveBeenLastCalledWith(13)
      expect(screen.getByLabelText('Amount')).toHaveValue('13.0000000')
    })

    it('switches currency without calling onChange when display is empty or non-finite', () => {
      const onChange = vi.fn()
      const onCurrencyChange = vi.fn()
      render(
        <AmountInput
          value={null}
          currency="USD"
          onChange={onChange}
          onCurrencyChange={onCurrencyChange}
        />,
      )

      const select = screen.getByRole('combobox', { name: 'Select currency' })
      fireEvent.change(select, { target: { value: 'EUR' } })

      expect(onCurrencyChange).toHaveBeenCalledWith('EUR')
      expect(onChange).not.toHaveBeenCalled()

      // When display holds only '-', parseFloat is NaN so onChange is not called
      const input = screen.getByLabelText('Amount')
      fireEvent.change(input, { target: { value: '-' } })
      onChange.mockClear()

      fireEvent.change(select, { target: { value: 'GBP' } })
      expect(onCurrencyChange).toHaveBeenCalledWith('GBP')
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('status, min/max validation errors, and aria-describedby', () => {
    it('surfaces min/max error and warning statuses with aria-invalid and a described-by message', () => {
      const { container, rerender } = render(
        <AmountInput
          id="bound-amt"
          value={0.5}
          currency="USD"
          error="Amount must be at least $1.00 (min)"
          helperText="Enter an amount between $1.00 and $1,000.00"
          onChange={() => {}}
          onCurrencyChange={() => {}}
        />,
      )

      const input = screen.getByLabelText('Amount')
      const message = document.getElementById('bound-amt-input-msg')

      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAttribute('aria-describedby', 'bound-amt-input-msg')
      expect(message).toHaveTextContent('Amount must be at least $1.00 (min)')
      expect(message).toHaveClass('amt-input-message--error')
      expect(container.querySelector('.amt-status-icon--error')).toBeInTheDocument()

      // Status="error" without explicit error prop falls back to default error label
      rerender(
        <AmountInput
          id="bound-amt"
          value={5000}
          currency="USD"
          status="error"
          onChange={() => {}}
          onCurrencyChange={() => {}}
        />,
      )
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAttribute('aria-describedby', 'bound-amt-input-msg')
      expect(message).toHaveTextContent('Invalid amount')

      // Warning / helper message when approaching max threshold (no error)
      rerender(
        <AmountInput
          id="bound-amt"
          value={950}
          currency="USD"
          status="idle"
          helperText="Warning: approaching max limit of $1,000.00"
          onChange={() => {}}
          onCurrencyChange={() => {}}
        />,
      )
      expect(input).toHaveAttribute('aria-invalid', 'false')
      expect(input).toHaveAttribute('aria-describedby', 'bound-amt-input-msg')
      expect(message).toHaveTextContent('Warning: approaching max limit of $1,000.00')
      expect(message).not.toHaveClass('amt-input-message--error')
    })

    it('renders pending, success, and idle statuses with appropriate icons and aria-describedby', () => {
      const { container, rerender } = render(
        <AmountInput
          id="status-amt"
          value={25}
          currency="USD"
          status="pending"
          onChange={() => {}}
          onCurrencyChange={() => {}}
        />,
      )

      const input = screen.getByLabelText('Amount')
      const message = document.getElementById('status-amt-input-msg')

      expect(input).toHaveAttribute('aria-invalid', 'false')
      expect(input).toHaveAttribute('aria-describedby', 'status-amt-input-msg')
      expect(message).toHaveTextContent('Validating…')
      expect(container.querySelector('.amt-status-icon--pending')).toBeInTheDocument()

      rerender(
        <AmountInput
          id="status-amt"
          value={25}
          currency="USD"
          status="success"
          onChange={() => {}}
          onCurrencyChange={() => {}}
        />,
      )
      expect(input).toHaveAttribute('aria-describedby', 'status-amt-input-msg')
      expect(message).toHaveTextContent('Amount accepted')
      expect(container.querySelector('.amt-status-icon--success')).toBeInTheDocument()
      expect(container.querySelector('.amt-input-group')).toHaveClass('amt-input-group--success')

      rerender(
        <AmountInput
          id="status-amt"
          value={25}
          currency="USD"
          status="idle"
          onChange={() => {}}
          onCurrencyChange={() => {}}
        />,
      )
      expect(input).not.toHaveAttribute('aria-describedby')
      expect(message).toHaveTextContent('')
    })
  })

  describe('amountInputUtils edge cases', () => {
    it('handles empty, negative, integer-only, trailing decimal, and invalid locale in formatRaw and separator helpers', () => {
      expect(formatRaw('', 'en-US', 2)).toBe('')
      expect(formatRaw('-', 'en-US', 2)).toBe('-')
      expect(formatRaw('1234', 'en-US', 2)).toBe('1,234')
      expect(formatRaw('.5', 'en-US', 2)).toBe('.5')
      expect(formatRaw('-.5', 'en-US', 2)).toBe('-.5')
      expect(formatRaw('1234.', 'en-US', 2)).toBe('1,234.')
      expect(formatRaw('1234.567', 'en-US', 0)).toBe('1,234')

      // Invalid locale tag falls back gracefully
      expect(getDecimalSeparator('invalid_locale_tag_$$$')).toBe('.')
      expect(getGroupSeparator('invalid_locale_tag_$$$')).toBe(',')
      expect(formatRaw('1234.5', 'invalid_locale_tag_$$$', 2)).toBe('1234.5')
    })
  })
})
