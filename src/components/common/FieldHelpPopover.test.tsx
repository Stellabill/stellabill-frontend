import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { FieldHelpPopover } from './FieldHelpPopover'

describe('FieldHelpPopover', () => {
  it('opens from the info button and exposes dialog content', async () => {
    const user = userEvent.setup()
    render(
      <FieldHelpPopover title="Trial period">
        <p>Customers are not charged until the trial ends.</p>
      </FieldHelpPopover>,
    )

    await user.click(screen.getByRole('button', { name: 'Help for Trial period' }))

    expect(screen.getByRole('dialog', { name: 'Trial period' })).toBeInTheDocument()
    expect(screen.getByText('Customers are not charged until the trial ends.')).toBeInTheDocument()
  })

  it('opens with the keyboard and traps focus while open', async () => {
    const user = userEvent.setup()
    render(
      <>
        <button type="button">Before</button>
        <FieldHelpPopover title="Billing cycle">
          <p>Choose how often customers receive invoices.</p>
        </FieldHelpPopover>
        <button type="button">After</button>
      </>,
    )

    await user.tab()
    await user.tab()
    await user.keyboard('{Enter}')

    const closeButton = await screen.findByRole('button', { name: 'Got it' })
    await waitFor(() => expect(closeButton).toHaveFocus())

    await user.tab()
    expect(closeButton).toHaveFocus()

    await user.tab({ shift: true })
    expect(closeButton).toHaveFocus()
  })

  it('dismisses on Escape and outside pointer interaction', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <FieldHelpPopover title="Tax ID">
          <p>Used for invoice tax reporting.</p>
        </FieldHelpPopover>
        <button type="button">Outside</button>
      </div>,
    )

    await user.click(screen.getByRole('button', { name: 'Help for Tax ID' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Tax ID' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Help for Tax ID' }))
    await user.click(screen.getByRole('button', { name: 'Outside' }))
    expect(screen.queryByRole('dialog', { name: 'Tax ID' })).not.toBeInTheDocument()
  })
})
