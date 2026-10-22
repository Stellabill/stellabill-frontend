import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CreatePlan from './CreatePlan'

const AUTOSAVE_KEY = 'stellabill-create-plan'

describe('CreatePlan autosave integration', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('renders AutosaveIndicator and AutosaveHistory in the header', () => {
    render(
      <MemoryRouter initialEntries={['/plans/create']}>
        <CreatePlan />
      </MemoryRouter>,
    )

    // AutosaveIndicator starts at idle -> "Not yet saved"
    expect(screen.getByRole('button', { name: /not yet saved/i })).toBeInTheDocument()

    // AutosaveHistory button is present
    expect(screen.getByRole('button', { name: /autosave history/i })).toBeInTheDocument()
  })

  it('restores the latest autosaved snapshot on mount when no draftId is given', () => {
    const savedSnapshot = {
      usageEnabled: true,
      trialDays: '14',
      pricing: {
        price: '49',
        interval: 'Monthly',
        priceType: 'currency',
      },
    }
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(savedSnapshot))

    const { container } = render(
      <MemoryRouter initialEntries={['/plans/create']}>
        <CreatePlan />
      </MemoryRouter>,
    )

    // Price should be restored to 49 (formatted as 49.00 by AmountInput)
    const priceInput = container.querySelector('#pricing-price-input') as HTMLInputElement
    expect(priceInput).not.toBeNull()
    expect(priceInput.value).toBe('49.00')

    // Trial days should be restored to 14
    const trialInput = container.querySelector('#trial-period') as HTMLInputElement
    expect(trialInput).not.toBeNull()
    expect(trialInput.value).toBe('14')

    // Usage-based billing should be restored to checked
    const toggle = container.querySelector('#usage-based-toggle') as HTMLButtonElement
    expect(toggle.getAttribute('aria-checked')).toBe('true')
  })

  it('editing the price persists after delay ms and the indicator shows "saved"', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/plans/create']}>
        <CreatePlan />
      </MemoryRouter>,
    )

    const priceInput = container.querySelector('#pricing-price-input') as HTMLInputElement
    fireEvent.change(priceInput, { target: { value: '99' } })

    // Before delay, not saved yet
    expect(localStorage.getItem(AUTOSAVE_KEY)).toBeNull()

    // Advance by debounce delay (2000ms)
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    // Saved to localStorage
    const savedRaw = localStorage.getItem(AUTOSAVE_KEY)
    expect(savedRaw).not.toBeNull()
    const parsed = JSON.parse(savedRaw!)
    expect(parsed.pricing.price).toBe('99')

    // Indicator updates to saved
    expect(screen.getByRole('button', { name: /saved/i })).toBeInTheDocument()
  })

  it('reloading /plans/create restores the last autosaved form', async () => {
    const { container, unmount } = render(
      <MemoryRouter initialEntries={['/plans/create']}>
        <CreatePlan />
      </MemoryRouter>,
    )

    const priceInput = container.querySelector('#pricing-price-input') as HTMLInputElement
    fireEvent.change(priceInput, { target: { value: '150' } })

    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    // Simulate page reload: unmount and remount
    unmount()

    const { container: reloadedContainer } = render(
      <MemoryRouter initialEntries={['/plans/create']}>
        <CreatePlan />
      </MemoryRouter>,
    )

    const reloadedPriceInput = reloadedContainer.querySelector('#pricing-price-input') as HTMLInputElement
    expect(reloadedPriceInput.value).toBe('150.00')
  })

  it('offline banner appears when offline and edits are saved when online event fires', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true })

    const { container } = render(
      <MemoryRouter initialEntries={['/plans/create']}>
        <CreatePlan />
      </MemoryRouter>,
    )

    expect(
      screen.getByText(/you are offline\. autosave is paused until your connection is restored/i),
    ).toBeInTheDocument()

    // Edit price while offline
    const priceInput = container.querySelector('#pricing-price-input') as HTMLInputElement
    fireEvent.change(priceInput, { target: { value: '75' } })

    await act(async () => {
      vi.advanceTimersByTime(2500)
    })

    // Should not be saved while offline
    expect(localStorage.getItem(AUTOSAVE_KEY)).toBeNull()

    // Connection restored
    await act(async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true })
      window.dispatchEvent(new Event('online'))
    })

    // Flushed and saved upon returning online
    const saved = localStorage.getItem(AUTOSAVE_KEY)
    expect(saved).not.toBeNull()
    expect(JSON.parse(saved!).pricing.price).toBe('75')
  })
})
