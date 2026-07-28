import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import DensityPreview from '../components/settings/DensityPreview'

describe('DensityPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    document.documentElement.removeAttribute('data-density')
  })

  it('renders three density options', () => {
    render(<DensityPreview />)

    expect(screen.getByRole('radio', { name: /compact/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /comfortable/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /spacious/i })).toBeInTheDocument()
  })

  it('defaults to comfortable density', () => {
    render(<DensityPreview />)

    const comfortableBtn = screen.getByRole('radio', { name: /comfortable/i })
    expect(comfortableBtn).toHaveAttribute('aria-checked', 'true')
  })

  it('commits density on click and persists to localStorage', () => {
    render(<DensityPreview />)

    const compactBtn = screen.getByRole('radio', { name: /compact/i })
    fireEvent.click(compactBtn)

    expect(compactBtn).toHaveAttribute('aria-checked', 'true')
    expect(localStorage.getItem('stellabill-density-preference')).toBe('compact')
  })

  it('triggers hover preview and reverts on mouse leave', () => {
    render(<DensityPreview />)

    const spaciousBtn = screen.getByRole('radio', { name: /spacious/i })
    const stage = document.querySelector('.density-preview__stage') as HTMLElement

    fireEvent.mouseEnter(spaciousBtn)
    expect(stage).toHaveAttribute('data-density', 'spacious')

    fireEvent.mouseLeave(spaciousBtn)
    expect(stage).toHaveAttribute('data-density', 'comfortable')
  })

  it('hover preview does not change the committed density', () => {
    render(<DensityPreview />)

    const compactBtn = screen.getByRole('radio', { name: /compact/i })
    const spaciousBtn = screen.getByRole('radio', { name: /spacious/i })

    fireEvent.mouseEnter(spaciousBtn)
    fireEvent.mouseLeave(spaciousBtn)

    expect(compactBtn).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('radio', { name: /comfortable/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('restores previously selected density from localStorage', () => {
    localStorage.setItem('stellabill-density-preference', 'compact')
    render(<DensityPreview />)

    expect(screen.getByRole('radio', { name: /compact/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('reset restores to comfortable default', () => {
    localStorage.setItem('stellabill-density-preference', 'spacious')
    render(<DensityPreview />)

    expect(screen.getByRole('radio', { name: /spacious/i })).toHaveAttribute('aria-checked', 'true')

    const resetBtn = screen.getByRole('button', { name: /reset to default/i })
    fireEvent.click(resetBtn)

    expect(screen.getByRole('radio', { name: /comfortable/i })).toHaveAttribute('aria-checked', 'true')
    expect(localStorage.getItem('stellabill-density-preference')).toBeNull()
  })

  it('does not show reset button when already at default', () => {
    render(<DensityPreview />)

    expect(screen.queryByRole('button', { name: /reset to default/i })).not.toBeInTheDocument()
  })

  it('has correct accessibility attributes', () => {
    render(<DensityPreview />)

    const radiogroup = screen.getByRole('radiogroup', { name: /density mode/i })
    expect(radiogroup).toBeInTheDocument()

    const radios = screen.getAllByRole('radio')
    radios.forEach((radio) => {
      expect(radio).toHaveAttribute('aria-checked')
    })
  })

  it('announces density changes via aria-live region', () => {
    render(<DensityPreview />)

    const liveRegion = document.querySelector('[aria-live="polite"]') as HTMLElement
    expect(liveRegion).toBeInTheDocument()

    const compactBtn = screen.getByRole('radio', { name: /compact/i })
    fireEvent.click(compactBtn)

    expect(liveRegion.textContent).toContain('compact')
  })

  it('keyboard navigation changes focus between segments', () => {
    render(<DensityPreview />)

    const comfortableBtn = screen.getByRole('radio', { name: /comfortable/i })
    comfortableBtn.focus()

    fireEvent.keyDown(comfortableBtn, { key: 'ArrowRight' })

    const spaciousBtn = screen.getByRole('radio', { name: /spacious/i })
    expect(spaciousBtn).toHaveFocus()
  })

  it('renders preview samples (table, form, card)', () => {
    render(<DensityPreview />)

    expect(screen.getByText('Table')).toBeInTheDocument()
    expect(screen.getByText('Form')).toBeInTheDocument()
    expect(screen.getByText('Card')).toBeInTheDocument()
  })
})
