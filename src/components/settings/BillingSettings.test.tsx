import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import BillingSettings from './BillingSettings'

describe('BillingSettings', () => {
  it('calls onSave with current billing preferences and closes edit mode on success', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(<BillingSettings onSave={onSave} />)

    await user.click(screen.getByRole('button', { name: /edit/i }))

    const invoiceEmailInput = screen.getByLabelText(/^invoice email$/i)
    await user.clear(invoiceEmailInput)
    await user.type(invoiceEmailInput, 'finance@acme.com')

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1)
    })

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceEmail: 'finance@acme.com',
        billingCycle: 'monthly',
      })
    )

    expect(await screen.findByText(/saved/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
  })

  it('disables the Save button while saving is pending', async () => {
    const user = userEvent.setup()
    let resolveSave!: () => void
    const onSave = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve
        })
    )

    render(<BillingSettings onSave={onSave} />)

    await user.click(screen.getByRole('button', { name: /edit/i }))
    const saveButton = screen.getByRole('button', { name: /save changes/i })
    await user.click(saveButton)

    expect(saveButton).toBeDisabled()

    resolveSave()

    await waitFor(() => {
      expect(screen.getByText(/saved/i)).toBeInTheDocument()
    })
  })

  it('shows an error message and keeps edit mode open when onSave fails', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockRejectedValue(new Error('Network error'))

    render(<BillingSettings onSave={onSave} />)

    await user.click(screen.getByRole('button', { name: /edit/i }))
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/network error/i)
    expect(screen.getByRole('button', { name: /save changes/i })).toBeEnabled()
  })
})
