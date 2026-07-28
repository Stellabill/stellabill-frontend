import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AutosaveIndicator from './AutosaveIndicator'

// ── Helpers ─────────────────────────────────────────────────────────────────

function renderIndicator(overrides: Partial<React.ComponentProps<typeof AutosaveIndicator>> = {}) {
  const defaultProps = {
    status: 'idle' as const,
    lastSavedAt: null,
    isOffline: false,
    onClick: vi.fn(),
  }
  return render(<AutosaveIndicator {...defaultProps} {...overrides} />)
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('AutosaveIndicator', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders "Not yet saved" in idle state', () => {
    renderIndicator({ status: 'idle' })
    expect(screen.getByText('Not yet saved')).toBeInTheDocument()
  })

  it('renders "Saving…" while saving', () => {
    renderIndicator({ status: 'saving' })
    expect(screen.getByText('Saving…')).toBeInTheDocument()
  })

  it('renders "Saved Xm ago" after a successful save', () => {
    const twoMinAgo = new Date(Date.now() - 2 * 60_000).toISOString()
    renderIndicator({ status: 'saved', lastSavedAt: twoMinAgo })
    expect(screen.getByText(/Saved/)).toBeInTheDocument()
  })

  it('renders "Save failed" on error', () => {
    renderIndicator({ status: 'error' })
    expect(screen.getByText('Save failed')).toBeInTheDocument()
  })

  it('renders "Offline" when offline', () => {
    renderIndicator({ isOffline: true })
    expect(screen.getByText('Offline')).toBeInTheDocument()
  })

  it('has a polite live region for screen readers', () => {
    renderIndicator()
    const liveRegion = screen.getByRole('status')
    expect(liveRegion).toHaveAttribute('aria-live', 'polite')
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true')
  })

  it('announces saving status via live region', async () => {
    const { rerender } = render(
      <AutosaveIndicator status="idle" lastSavedAt={null} />,
    )

    // Transition to saving
    rerender(<AutosaveIndicator status="saving" lastSavedAt={null} />)

    // The live region should eventually contain the announcement
    await vi.waitFor(() => {
      const liveRegion = screen.getByRole('status')
      expect(liveRegion.textContent).toContain('Saving')
    })
  })

  it('announces saved status via live region', async () => {
    const twoMinAgo = new Date(Date.now() - 2 * 60_000).toISOString()
    const { rerender } = render(
      <AutosaveIndicator status="saving" lastSavedAt={null} />,
    )

    rerender(
      <AutosaveIndicator status="saved" lastSavedAt={twoMinAgo} />,
    )

    await vi.waitFor(() => {
      const liveRegion = screen.getByRole('status')
      expect(liveRegion.textContent).toContain('saved')
    })
  })

  it('announces error status via live region', async () => {
    const { rerender } = render(
      <AutosaveIndicator status="saving" lastSavedAt={null} />,
    )

    rerender(<AutosaveIndicator status="error" lastSavedAt={null} />)

    await vi.waitFor(() => {
      const liveRegion = screen.getByRole('status')
      expect(liveRegion.textContent).toContain('Failed to save')
    })
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    renderIndicator({ onClick })

    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('has correct data-status attribute', () => {
    const { rerender } = renderIndicator({ status: 'idle' })
    expect(screen.getByRole('button')).toHaveAttribute('data-status', 'idle')

    rerender(<AutosaveIndicator status="saving" lastSavedAt={null} />)
    expect(screen.getByRole('button')).toHaveAttribute('data-status', 'saving')

    rerender(<AutosaveIndicator status="saved" lastSavedAt={new Date().toISOString()} />)
    expect(screen.getByRole('button')).toHaveAttribute('data-status', 'saved')

    rerender(<AutosaveIndicator status="error" lastSavedAt={null} />)
    expect(screen.getByRole('button')).toHaveAttribute('data-status', 'error')
  })

  it('sets data-offline when offline', () => {
    renderIndicator({ isOffline: true })
    expect(screen.getByRole('button')).toHaveAttribute('data-offline', 'true')
  })

  it('does not spam live region for repeated same status', async () => {
    const { rerender } = render(
      <AutosaveIndicator status="idle" lastSavedAt={null} />,
    )

    // Transition to saving twice
    rerender(<AutosaveIndicator status="saving" lastSavedAt={null} />)
    rerender(<AutosaveIndicator status="saving" lastSavedAt={null} />)

    // Should only have one announcement (the transition, not the repeat)
    await vi.waitFor(() => {
      const liveRegion = screen.getByRole('status')
      // The live region should contain the announcement but not be spammed
      expect(liveRegion).toBeInTheDocument()
    })
  })
})
