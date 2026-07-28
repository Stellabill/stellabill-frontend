import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AutosaveHistory from './AutosaveHistory'
import type { AutosaveEntry } from '../hooks/useAutosave'

// ── Helpers ─────────────────────────────────────────────────────────────────

const makeEntry = (minutesAgo: number): AutosaveEntry => ({
  savedAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
  data: JSON.stringify({ usageEnabled: true, trialDays: '7', pricing: { price: '9.99', interval: 'Monthly', priceType: 'currency' } }),
  label: `${minutesAgo}m ago`,
})

function renderHistory(overrides: Partial<React.ComponentProps<typeof AutosaveHistory>> = {}) {
  const defaultProps = {
    history: [],
    onRestore: vi.fn(),
    onClear: vi.fn(),
  }
  return render(<AutosaveHistory {...defaultProps} {...overrides} />)
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('AutosaveHistory', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the history trigger button', () => {
    renderHistory()
    expect(screen.getByRole('button', { name: /autosave history/i })).toBeInTheDocument()
  })

  it('shows entry count in aria-label', () => {
    renderHistory({ history: [makeEntry(5), makeEntry(10)] })
    expect(screen.getByRole('button', { name: /2 entries/ })).toBeInTheDocument()
  })

  it('opens the popover on click', async () => {
    const user = userEvent.setup()
    renderHistory({ history: [makeEntry(5)] })

    await user.click(screen.getByRole('button', { name: /autosave history/i }))

    expect(screen.getByRole('dialog', { name: 'Autosave history' })).toBeInTheDocument()
  })

  it('shows "No autosaves yet" when history is empty', async () => {
    const user = userEvent.setup()
    renderHistory({ history: [] })

    await user.click(screen.getByRole('button', { name: /autosave history/i }))

    expect(screen.getByText(/No autosaves yet/)).toBeInTheDocument()
  })

  it('renders a Restore button per history entry', async () => {
    const user = userEvent.setup()
    const history = [makeEntry(2), makeEntry(15)]
    renderHistory({ history })

    await user.click(screen.getByRole('button', { name: /autosave history/i }))

    const restoreButtons = screen.getAllByRole('button', { name: /restore/i })
    expect(restoreButtons).toHaveLength(2)
  })

  it('shows confirm dialog when Restore is clicked', async () => {
    const user = userEvent.setup()
    const history = [makeEntry(5)]
    renderHistory({ history })

    await user.click(screen.getByRole('button', { name: /autosave history/i }))
    await user.click(screen.getAllByRole('button', { name: /restore/i })[0])

    expect(screen.getByRole('dialog', { name: 'Confirm restore' })).toBeInTheDocument()
    expect(screen.getByText(/This will replace your current form data/)).toBeInTheDocument()
  })

  it('calls onRestore when confirm is clicked', async () => {
    const user = userEvent.setup()
    const onRestore = vi.fn()
    const entry = makeEntry(5)
    renderHistory({ history: [entry], onRestore })

    await user.click(screen.getByRole('button', { name: /autosave history/i }))
    await user.click(screen.getAllByRole('button', { name: /restore/i })[0])
    await user.click(screen.getByRole('button', { name: /^Restore$/ }))

    expect(onRestore).toHaveBeenCalledWith(entry)
  })

  it('dismisses confirm dialog on Cancel', async () => {
    const user = userEvent.setup()
    const onRestore = vi.fn()
    renderHistory({ history: [makeEntry(5)], onRestore })

    await user.click(screen.getByRole('button', { name: /autosave history/i }))
    await user.click(screen.getAllByRole('button', { name: /restore/i })[0])
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog', { name: 'Confirm restore' })).not.toBeInTheDocument()
    expect(onRestore).not.toHaveBeenCalled()
  })

  it('calls onClear when "Clear all" is clicked', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    renderHistory({ history: [makeEntry(5)], onClear })

    await user.click(screen.getByRole('button', { name: /autosave history/i }))
    await user.click(screen.getByRole('button', { name: /clear all/i }))

    expect(onClear).toHaveBeenCalledOnce()
  })

  it('does not show "Clear all" when history is empty', async () => {
    const user = userEvent.setup()
    renderHistory({ history: [] })

    await user.click(screen.getByRole('button', { name: /autosave history/i }))

    expect(screen.queryByRole('button', { name: /clear all/i })).not.toBeInTheDocument()
  })

  it('closes popover on Escape', async () => {
    const user = userEvent.setup()
    renderHistory({ history: [makeEntry(5)] })

    await user.click(screen.getByRole('button', { name: /autosave history/i }))
    expect(screen.getByRole('dialog', { name: 'Autosave history' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Autosave history' })).not.toBeInTheDocument()
  })

  it('closes popover on outside click', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <AutosaveHistory history={[makeEntry(5)]} onRestore={vi.fn()} onClear={vi.fn()} />
        <button type="button" data-testid="outside">outside</button>
      </div>,
    )

    await user.click(screen.getByRole('button', { name: /autosave history/i }))
    expect(screen.getByRole('dialog', { name: 'Autosave history' })).toBeInTheDocument()

    await user.click(screen.getByTestId('outside'))
    expect(screen.queryByRole('dialog', { name: 'Autosave history' })).not.toBeInTheDocument()
  })

  it('restores focus to trigger after Escape', async () => {
    const user = userEvent.setup()
    renderHistory({ history: [makeEntry(5)] })

    const trigger = screen.getByRole('button', { name: /autosave history/i })
    await user.click(trigger)
    await user.keyboard('{Escape}')

    expect(trigger).toHaveFocus()
  })
})
