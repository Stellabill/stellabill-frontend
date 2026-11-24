import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import SortBySelect, { type SortOption } from './SortBySelect'

beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {}
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {}
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {}
  }
})

describe('SortBySelect', () => {
  it('shows the label of the option matching value in the trigger', () => {
    render(<SortBySelect value="price-low" onValueChange={vi.fn()} />)

    const trigger = screen.getByRole('combobox', { name: 'Sort by' })
    expect(trigger).toHaveTextContent('Price (low to high)')
  })

  it('opens the listbox and clicking another option calls onValueChange with that option value', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    render(<SortBySelect value="newest" onValueChange={onValueChange} />)

    const trigger = screen.getByRole('combobox', { name: 'Sort by' })
    await user.click(trigger)

    expect(screen.getByRole('listbox')).toBeInTheDocument()

    const highToLowOption = screen.getByRole('option', { name: 'Price (high to low)' })
    await user.click(highToLowOption)

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith('price-high')
  })

  it('uses ariaLabel as the trigger accessible name and sets aria-labelledby when labelId is provided', () => {
    render(
      <div>
        <span id="custom-sort-heading">Order plans</span>
        <SortBySelect
          value="newest"
          onValueChange={vi.fn()}
          ariaLabel="Custom sort order"
          labelId="custom-sort-heading"
        />
      </div>,
    )

    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveAttribute('aria-label', 'Custom sort order')
    expect(trigger).toHaveAttribute('aria-labelledby', 'custom-sort-heading')
  })

  it('uses ariaLabel as the trigger accessible name when labelId is omitted', () => {
    render(
      <SortBySelect
        value="newest"
        onValueChange={vi.fn()}
        ariaLabel="Sort subscriptions by"
      />,
    )

    const trigger = screen.getByRole('combobox', { name: 'Sort subscriptions by' })
    expect(trigger).toBeInTheDocument()
    expect(trigger).not.toHaveAttribute('aria-labelledby')
  })

  it('replaces the default SortOption[] when custom options are passed', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const customOptions: SortOption[] = [
      { value: 'alpha-asc', label: 'Alphabetical (A-Z)' },
      { value: 'alpha-desc', label: 'Alphabetical (Z-A)' },
    ]

    render(
      <SortBySelect
        value="alpha-asc"
        onValueChange={onValueChange}
        options={customOptions}
      />,
    )

    const trigger = screen.getByRole('combobox', { name: 'Sort by' })
    expect(trigger).toHaveTextContent('Alphabetical (A-Z)')

    await user.click(trigger)

    expect(screen.getByRole('option', { name: 'Alphabetical (A-Z)' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Alphabetical (Z-A)' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Newest' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Price (low to high)' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Price (high to low)' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('option', { name: 'Alphabetical (Z-A)' }))
    expect(onValueChange).toHaveBeenCalledWith('alpha-desc')
  })
})
