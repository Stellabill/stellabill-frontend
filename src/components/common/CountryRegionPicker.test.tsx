import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CountryRegionPicker from './CountryRegionPicker'

const onChange = vi.fn()

function renderPicker(value = 'US') {
  return render(<CountryRegionPicker value={value} onChange={onChange} />)
}

describe('CountryRegionPicker', () => {
  beforeEach(() => {
    onChange.mockClear()
    window.localStorage.clear()
  })

  it('renders the selected country and opens the list on focus', async () => {
    renderPicker('CA')

    const combobox = screen.getByRole('combobox', { name: /country/i })
    expect(combobox).toHaveValue('Canada')

    fireEvent.focus(combobox)

    expect(await screen.findByRole('listbox')).toBeInTheDocument()
    expect(screen.getByText(/Americas/i)).toBeInTheDocument()
    expect(screen.getByText(/Canada/i)).toBeInTheDocument()
  })

  it('filters options by label and ISO code', async () => {
    renderPicker('US')
    const combobox = screen.getByRole('combobox')
    fireEvent.focus(combobox)
    fireEvent.change(combobox, { target: { value: 'Japan' } })

    expect(await screen.findByRole('option', { name: /Japan/i })).toBeInTheDocument()
    expect(screen.getAllByRole('option').length).toBeGreaterThan(0)

    fireEvent.change(combobox, { target: { value: 'GB' } })
    expect(await screen.findByRole('option', { name: /United Kingdom/i })).toBeInTheDocument()
  })

  it('announces result count for screen reader users', async () => {
    renderPicker('US')
    const combobox = screen.getByRole('combobox')
    fireEvent.focus(combobox)

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/countries available\./i))
  })

  it('selects a country on click and closes the list', async () => {
    renderPicker('US')
    const combobox = screen.getByRole('combobox')
    fireEvent.focus(combobox)
    fireEvent.change(combobox, { target: { value: 'Germany' } })

    const option = await screen.findByRole('option', { name: /Germany/i })
    fireEvent.mouseDown(option)

    expect(onChange).toHaveBeenCalledWith('DE')
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
  })

  it('supports keyboard navigation and highlights the active option', async () => {
    renderPicker('US')
    const combobox = screen.getByRole('combobox')
    fireEvent.focus(combobox)
    fireEvent.keyDown(combobox, { key: 'ArrowDown' })

    const activeOption = screen.getAllByRole('option').find((option) => option.getAttribute('aria-selected') === 'true')
    expect(activeOption).toBeDefined()
    expect(combobox).toHaveAttribute('aria-activedescendant')
  })

  it('shows recent pinned countries when available', async () => {
    window.localStorage.setItem('country-region-picker-recent', JSON.stringify(['GB', 'CA']))

    renderPicker('US')
    const combobox = screen.getByRole('combobox')
    fireEvent.focus(combobox)

    expect(await screen.findByText(/Recent/i)).toBeInTheDocument()
    expect(screen.getByText(/United Kingdom/i)).toBeInTheDocument()
    expect(screen.getByText(/Canada/i)).toBeInTheDocument()
  })
})
