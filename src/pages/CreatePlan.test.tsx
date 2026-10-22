import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import CreatePlan from './CreatePlan'

const AUTOSAVE_KEY = 'stellabill-create-plan'
const DRAFTS_KEY = 'plan-drafts'

/** Stand-in for /plans that exposes the router state passed on navigation. */
function PlansStub() {
  const location = useLocation()
  const state = location.state as { toast?: string } | null
  return (
    <div>
      <h1>Plans page</h1>
      {state?.toast && <div role="status">{state.toast}</div>}
    </div>
  )
}

function renderCreatePlan(initialPath = '/plans/create') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/plans/create" element={<CreatePlan />} />
        <Route path="/plans" element={<PlansStub />} />
      </Routes>
    </MemoryRouter>,
  )
}

function fillValidForm() {
  const priceInput = document.getElementById('pricing-price-input') as HTMLInputElement
  const intervalSelect = document.getElementById('pricing-interval') as HTMLSelectElement
  fireEvent.change(priceInput, { target: { value: '25' } })
  fireEvent.change(intervalSelect, { target: { value: 'Monthly' } })
  return { priceInput, intervalSelect }
}

function submitButton() {
  return screen.getByRole('button', { name: /create plan|creating plan/i })
}

function jsonResponse(status: number, body: unknown, statusText = ''): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: async () => body,
  } as unknown as Response
}

function planCalls(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.filter(([url]) => String(url) === '/api/plans')
}

describe('CreatePlan submit', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    localStorage.clear()
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('POSTs the payload once to /api/plans and navigates to /plans with a success toast', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 'plan_1' }))
    renderCreatePlan()

    fillValidForm()
    fireEvent.click(submitButton())

    expect(await screen.findByRole('heading', { name: 'Plans page' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Plan created successfully.')

    const calls = planCalls(fetchMock)
    expect(calls).toHaveLength(1)
    const [, init] = calls[0]
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({
      usage_enabled: false,
      trial_period_days: 0,
      price: 25,
      price_type: 'currency',
      interval: 'Monthly',
    })
    expect(localStorage.getItem(AUTOSAVE_KEY)).toBeNull()
  })

  it('keeps entered values and shows an inline error with technical details on a 400', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, { details: 'interval: unsupported value' }, 'Bad Request'),
    )
    renderCreatePlan()

    const { priceInput, intervalSelect } = fillValidForm()
    fireEvent.click(submitButton())

    expect(await screen.findByText("Couldn't create plan")).toBeInTheDocument()

    // Still on the form, values preserved, button usable again.
    expect(screen.queryByRole('heading', { name: 'Plans page' })).not.toBeInTheDocument()
    expect(priceInput.value).toBe('25')
    expect(intervalSelect.value).toBe('Monthly')
    expect(submitButton()).not.toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: /technical details/i }))
    expect(screen.getByText('interval: unsupported value')).toBeInTheDocument()
    expect(planCalls(fetchMock)).toHaveLength(1)
  })

  it('ignores re-submits while a request is pending', async () => {
    let resolveRequest: (res: Response) => void = () => {}
    fetchMock.mockImplementation(
      () => new Promise<Response>((resolve) => { resolveRequest = resolve }),
    )
    renderCreatePlan()

    fillValidForm()
    const button = submitButton()
    const form = button.closest('form') as HTMLFormElement

    fireEvent.click(button)
    // Submitting the form directly bypasses the disabled button and
    // exercises the synchronous in-flight guard.
    fireEvent.submit(form)
    fireEvent.submit(form)

    await waitFor(() => expect(submitButton()).toBeDisabled())
    expect(submitButton()).toHaveTextContent(/creating plan/i)
    fireEvent.click(submitButton())

    expect(planCalls(fetchMock)).toHaveLength(1)

    resolveRequest(jsonResponse(201, { id: 'plan_1' }))
    expect(await screen.findByRole('heading', { name: 'Plans page' })).toBeInTheDocument()
    expect(planCalls(fetchMock)).toHaveLength(1)
  })

  it('makes no request when validation fails', async () => {
    renderCreatePlan()

    fireEvent.click(submitButton())

    expect(await screen.findByText('Price is required')).toBeInTheDocument()
    expect(screen.getByText('Billing interval is required')).toBeInTheDocument()
    expect(planCalls(fetchMock)).toHaveLength(0)
  })

  it('removes the active draft after a successful submit', async () => {
    localStorage.setItem(
      DRAFTS_KEY,
      JSON.stringify([
        {
          id: 'draft-1',
          savedAt: new Date().toISOString(),
          version: 1,
          data: {
            usageEnabled: false,
            trialDays: '',
            pricing: { price: '25', interval: 'Monthly', priceType: 'currency' },
          },
        },
        {
          id: 'draft-2',
          savedAt: new Date().toISOString(),
          version: 1,
          data: {
            usageEnabled: true,
            trialDays: '7',
            pricing: { price: '5', interval: 'Yearly', priceType: 'currency' },
          },
        },
      ]),
    )
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 'plan_1' }))
    renderCreatePlan('/plans/create?draftId=draft-1')

    fireEvent.click(submitButton())

    expect(await screen.findByRole('heading', { name: 'Plans page' })).toBeInTheDocument()
    const remaining = JSON.parse(localStorage.getItem(DRAFTS_KEY) ?? '[]') as { id: string }[]
    expect(remaining.map((d) => d.id)).toEqual(['draft-2'])
  })
})
