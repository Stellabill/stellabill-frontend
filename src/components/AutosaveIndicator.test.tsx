import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AutosaveIndicator from './AutosaveIndicator'

describe('AutosaveIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('renders default/idle state correctly', () => {
    render(<AutosaveIndicator status="idle" lastSavedAt={null} />)
    expect(screen.getByRole('button', { name: /not yet saved/i })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('')
  })

  it('renders saving state correctly', () => {
    render(<AutosaveIndicator status="saving" lastSavedAt={null} />)
    expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument()
    
    // Live region announcements have a small setTimeout delay (50ms)
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(screen.getByRole('status')).toHaveTextContent('Saving your changes.')
  })

  it('renders saved state correctly with lastSavedAt', () => {
    const lastSavedAt = new Date(Date.now() - 5000).toISOString() // 5 seconds ago
    render(<AutosaveIndicator status="saved" lastSavedAt={lastSavedAt} />)
    expect(screen.getByRole('button', { name: /saved just now/i })).toBeInTheDocument()
    
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(screen.getByRole('status')).toHaveTextContent(/All changes saved just now/i)
  })

  it('renders saved state correctly without lastSavedAt', () => {
    render(<AutosaveIndicator status="saved" lastSavedAt={null} />)
    expect(screen.getByRole('button', { name: /saved/i })).toBeInTheDocument()
    
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(screen.getByRole('status')).toHaveTextContent('All changes saved.')
  })

  it('renders error state correctly', () => {
    render(<AutosaveIndicator status="error" lastSavedAt={null} />)
    expect(screen.getByRole('button', { name: /save failed/i })).toBeInTheDocument()
    
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(screen.getByRole('status')).toHaveTextContent('Failed to save changes. Your work may not be persisted.')
  })

  it('renders offline state correctly', () => {
    render(<AutosaveIndicator status="idle" lastSavedAt={null} isOffline={true} />)
    expect(screen.getByRole('button', { name: /offline/i })).toBeInTheDocument()
    
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(screen.getByRole('status')).toHaveTextContent('You are offline. Autosave is paused.')
  })

  it('handles state transitions and updates polite live region', () => {
    const { rerender } = render(<AutosaveIndicator status="idle" lastSavedAt={null} />)
    expect(screen.getByRole('status')).toHaveTextContent('')

    rerender(<AutosaveIndicator status="saving" lastSavedAt={null} />)
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(screen.getByRole('status')).toHaveTextContent('Saving your changes.')

    const lastSavedAt = new Date().toISOString()
    rerender(<AutosaveIndicator status="saved" lastSavedAt={lastSavedAt} />)
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(screen.getByRole('status')).toHaveTextContent(/All changes saved/i)
  })

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup({ delay: null })
    render(<AutosaveIndicator status="idle" lastSavedAt={null} onClick={handleClick} />)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('gracefully handles invalid status strings as default', () => {
    // @ts-expect-error Testing invalid input
    render(<AutosaveIndicator status="unknown_status" lastSavedAt={null} />)
    expect(screen.getByRole('button', { name: /not yet saved/i })).toBeInTheDocument()
    
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(screen.getByRole('status')).toHaveTextContent('')
  })
})
