import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import CreatePlan from './CreatePlan'
import { plans, type ApiError } from '../api/client'

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client')>()
  return {
    ...actual,
    api: vi.fn(),
    plans: {
      ...actual.plans,
      create: vi.fn(),
    },
  }
})

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

describe('CreatePlan submit and navigation guard', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true })
  })

  afterEach(() => {
    localStorage.clear()
  })

  function renderWithRoutes() {
    return render(
      <MemoryRouter initialEntries={['/plans/create']}>
        <Routes>
          <Route path="/plans/create" element={<CreatePlan />} />
          <Route path="/plans" element={<div data-testid="plans-page">Plans Page</div>} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('submits CreatePlanPayload via plans.create, clears autosave, and navigates to /plans', async () => {
    vi.mocked(plans.create).mockResolvedValueOnce({ id: 'plan-1' })
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
      usageEnabled: true,
      trialDays: '7',
      pricing: { price: '29', interval: 'Monthly', priceType: 'currency' },
    }))

    renderWithRoutes()

    fireEvent.click(screen.getByRole('button', { name: /create plan/i }))

    await waitFor(() => {
      expect(plans.create).toHaveBeenCalledWith({
        usage_enabled: true,
        trial_period_days: 7,
        price: 29,
        price_type: 'currency',
        interval: 'Monthly',
      })
    })

    await waitFor(() => {
      expect(screen.getByTestId('plans-page')).toBeInTheDocument()
    })
    expect(localStorage.getItem(AUTOSAVE_KEY)).toBeNull()
  })

  it('shows server error banner when plans.create fails with a generic error', async () => {
    const err: ApiError = new Error('API error: Internal Server Error')
    err.kind = 'http'
    err.status = 500
    err.technicalDetails = 'Database unavailable'
    vi.mocked(plans.create).mockRejectedValueOnce(err)

    const { container } = renderWithRoutes()
    fireEvent.change(container.querySelector('#pricing-price-input')!, { target: { value: '25' } })
    fireEvent.change(container.querySelector('#pricing-interval')!, { target: { value: 'Monthly' } })
    fireEvent.click(screen.getByRole('button', { name: /create plan/i }))

    await waitFor(() => {
      expect(screen.getByText('API error: Internal Server Error')).toBeInTheDocument()
    })
    expect(screen.getByText('Database unavailable')).toBeInTheDocument()
    expect(screen.queryByTestId('plans-page')).not.toBeInTheDocument()
  })

  it('maps per-field server errors to inline field errors and clears them on edit', async () => {
    const err: ApiError = new Error('Validation failed')
    err.kind = 'http'
    err.status = 422
    err.technicalDetails = JSON.stringify({
      errors: {
        price: 'Price exceeds plan limit',
        interval: 'Interval not supported for this currency',
        trial_period_days: 'Trial period cannot exceed 90 days',
        usage_enabled: 'Usage billing is not enabled for your account',
      },
    })
    vi.mocked(plans.create).mockRejectedValueOnce(err)

    const { container } = renderWithRoutes()
    fireEvent.change(container.querySelector('#pricing-price-input')!, { target: { value: '50' } })
    fireEvent.change(container.querySelector('#pricing-interval')!, { target: { value: 'Monthly' } })
    fireEvent.change(container.querySelector('#trial-period')!, { target: { value: '120' } })
    fireEvent.click(screen.getByRole('button', { name: /create plan/i }))

    await waitFor(() => {
      expect(screen.getByText('Price exceeds plan limit')).toBeInTheDocument()
    })
    expect(screen.getByText('Interval not supported for this currency')).toBeInTheDocument()
    expect(screen.getByText('Trial period cannot exceed 90 days')).toBeInTheDocument()
    expect(screen.getByText('Usage billing is not enabled for your account')).toBeInTheDocument()

    // Editing trial days clears its inline error
    fireEvent.change(container.querySelector('#trial-period')!, { target: { value: '14' } })
    expect(screen.queryByText('Trial period cannot exceed 90 days')).not.toBeInTheDocument()
  })

  it('blocks browser unload and shows ExitConfirmModal on Cancel when form is dirty', () => {
    const { container } = renderWithRoutes()

    // Make form dirty
    fireEvent.change(container.querySelector('#trial-period')!, { target: { value: '14' } })

    // beforeunload should be prevented
    const beforeUnloadEvent = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(beforeUnloadEvent)
    expect(beforeUnloadEvent.defaultPrevented).toBe(true)

    // Clicking Cancel opens ExitConfirmModal instead of navigating immediately
    const cancelButtons = screen.getAllByRole('button', { name: /^cancel$/i })
    fireEvent.click(cancelButtons[0])
    expect(screen.queryByTestId('plans-page')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /unsaved changes/i })).toBeInTheDocument()
  })
})
