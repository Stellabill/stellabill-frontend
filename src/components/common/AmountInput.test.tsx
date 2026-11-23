import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AmountInput from './AmountInput'

describe('AmountInput', () => {
  it('renders the formatted amount and currency selector', () => {
    render(
      <AmountInput
        value={1234.5}
        currency="USD"
        onChange={() => {}}
        onCurrencyChange={() => {}}
      />,
    )

    expect(screen.getByLabelText('Amount')).toHaveValue('1,234.50')
    expect(screen.getByRole('combobox', { name: 'Select currency' })).toHaveValue('USD')
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

  it('strips currency text and separators from pasted amounts', () => {
    const onChange = vi.fn()
    render(
      <AmountInput
        value={null}
        currency="USD"
        onChange={onChange}
        onCurrencyChange={() => {}}
      />,
    )

    fireEvent.paste(screen.getByLabelText('Amount'), {
      clipboardData: { getData: () => '$1,234.56 USDC' },
    })

    expect(onChange).toHaveBeenCalledWith(1234.56)
    expect(screen.getByLabelText('Amount')).toHaveValue('1,234.56')
  })

  it('reformats the display when a currency with fewer fraction digits is selected', () => {
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

    fireEvent.change(screen.getByRole('combobox', { name: 'Select currency' }), {
      target: { value: 'JPY' },
    })

    expect(onCurrencyChange).toHaveBeenCalledWith('JPY')
    expect(onChange).toHaveBeenCalledWith(13)
    expect(screen.getByLabelText('Amount')).toHaveValue('13')
  })

  it('blocks decimal keys for zero-decimal currencies', () => {
    render(
      <AmountInput
        value={12}
        currency="JPY"
        onChange={() => {}}
        onCurrencyChange={() => {}}
      />,
    )

    expect(fireEvent.keyDown(screen.getByLabelText('Amount'), { key: '.' })).toBe(false)
  })
})
