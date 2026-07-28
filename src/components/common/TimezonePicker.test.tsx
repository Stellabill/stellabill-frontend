import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TimezonePicker from './TimezonePicker'

const onChange = vi.fn()

function renderPicker(value = 'UTC') {
  return render(<TimezonePicker value={value} onChange={onChange} />)
}

describe('TimezonePicker', () => {
  beforeEach(() => {
    onChange.mockClear()
  })

  it('renders the selected timezone and opens the list on focus', async () => {
    renderPicker('America/New_York')

    const input = screen.getByRole('combobox', { name: /timezone/i })
    expect(input).toHaveValue('New York (America/New_York)')

    fireEvent.focus(input)

    expect(await screen.findByRole('listbox')).toBeInTheDocument()
    expect(screen.getByText(/Americas/i)).toBeInTheDocument()
    expect(screen.getByText(/New York/i)).toBeInTheDocument()
  })

  it('filters options by label, abbreviation, and IANA name', async () => {
    renderPicker('UTC')

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'Chicago' } })

    expect(await screen.findByRole('option', { name: /Chicago/i })).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(1)

    fireEvent.change(input, { target: { value: 'pdt' } })
    expect(await screen.findByRole('option', { name: /Los Angeles/i })).toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'Europe/Berlin' } })
    expect(await screen.findByRole('option', { name: /Berlin/i })).toBeInTheDocument()
  })

  it('announces result count for screen reader users', async () => {
    renderPicker('UTC')
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/timezones available\./i))
  })

  it('selects a timezone on click and closes the list', async () => {
    renderPicker('UTC')
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'Tokyo' } })

    const option = await screen.findByRole('option', { name: /Tokyo/i })
    fireEvent.mouseDown(option)

    expect(onChange).toHaveBeenCalledWith('Asia/Tokyo')
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
  })

  it('shows the DST caveat for a non-DST timezone and the offset preview for unusual half-hour offsets', async () => {
    renderPicker('America/Phoenix')
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    expect(screen.getByText(/does not observe daylight saving time/i)).toBeInTheDocument()
    expect(screen.getByText(/^UTC[+-]/)).toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'Kathmandu' } })
    const kathmanduOption = await screen.findByRole('option', { name: /Kathmandu/i })
    fireEvent.mouseDown(kathmanduOption)

    expect(onChange).toHaveBeenCalledWith('Asia/Kathmandu')
  })

  it('supports keyboard navigation and highlights the active option', async () => {
    renderPicker('UTC')
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.keyDown(input, { key: 'ArrowDown' })

    const selected = screen.getAllByRole('option').find((option) => option.getAttribute('aria-selected') === 'true')
    expect(selected).toBeDefined()
    expect(input).toHaveAttribute('aria-activedescendant')
  })

  it('updates the offset preview when moving through results', async () => {
    renderPicker('UTC')
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'Los' } })
    fireEvent.keyDown(input, { key: 'ArrowDown' })

    expect(screen.getByText(/^UTC[+-]/)).toBeInTheDocument()
  })
})
