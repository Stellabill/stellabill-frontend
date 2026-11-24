import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import FamilyPlanSettings from './FamilyPlanSettings'

async function sendInvite(email: string) {
  await userEvent.type(screen.getByPlaceholderText(/enter recipient email/i), email)
  await userEvent.click(screen.getByRole('button', { name: /send test/i }))
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('FamilyPlanSettings', () => {
  it('renders the seeded members with their active and pending counts', () => {
    render(<FamilyPlanSettings />)
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
    expect(screen.getByText('2 active')).toBeInTheDocument()
    expect(screen.getByText('2 pending')).toBeInTheDocument()
  })

  it('adds a pending member, updates the badge, and never logs the email', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    render(<FamilyPlanSettings />)

    await sendInvite('dana@example.com')

    expect(screen.getByText('dana@example.com')).toBeInTheDocument()
    expect(screen.getAllByText('Pending')).toHaveLength(3)
    expect(screen.getByText('3 pending')).toBeInTheDocument()
    expect(screen.getByText(/test invitation sent to dana@example.com/i)).toBeInTheDocument()
    expect(logSpy).not.toHaveBeenCalled()
  })

  it('rejects an existing member without adding another row', async () => {
    render(<FamilyPlanSettings />)

    await sendInvite('alice@example.com')

    expect(screen.getByText(/already a member of the family plan/i)).toBeInTheDocument()
    expect(screen.getAllByText('alice@example.com')).toHaveLength(1)
    expect(screen.getByText('2 pending')).toBeInTheDocument()
  })

  it('rejects the admin address as a duplicate', async () => {
    render(<FamilyPlanSettings />)

    await sendInvite('admin@acme.com')

    expect(screen.getByText(/already a member of the family plan/i)).toBeInTheDocument()
    expect(screen.getByText('2 pending')).toBeInTheDocument()
  })

  it('shows a validation error for a malformed email without adding a member', async () => {
    render(<FamilyPlanSettings />)

    await sendInvite('not-an-email')

    expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    expect(screen.getByText('2 pending')).toBeInTheDocument()
    expect(screen.queryByText('not-an-email')).not.toBeInTheDocument()
  })
})
