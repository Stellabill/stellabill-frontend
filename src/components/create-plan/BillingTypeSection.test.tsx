import { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BillingTypeSection from './BillingTypeSection'

describe('BillingTypeSection', () => {
  it('exposes aria-checked matching usageEnabled and calls onUsageEnabledChange with toggled value on click', async () => {
    const user = userEvent.setup()
    const onUsageEnabledChange = vi.fn()
    const onTrialDaysChange = vi.fn()

    const { rerender } = render(
      <BillingTypeSection
        usageEnabled={false}
        onUsageEnabledChange={onUsageEnabledChange}
        trialDays=""
        onTrialDaysChange={onTrialDaysChange}
      />
    )

    const toggle = screen.getByRole('switch', { name: /usage-based billing/i })
    expect(toggle).toHaveAttribute('aria-checked', 'false')

    await user.click(toggle)
    expect(onUsageEnabledChange).toHaveBeenCalledWith(true)

    rerender(
      <BillingTypeSection
        usageEnabled={true}
        onUsageEnabledChange={onUsageEnabledChange}
        trialDays=""
        onTrialDaysChange={onTrialDaysChange}
      />
    )

    expect(toggle).toHaveAttribute('aria-checked', 'true')

    await user.click(toggle)
    expect(onUsageEnabledChange).toHaveBeenCalledWith(false)
  })

  it('calls onTrialDaysChange with the typed string when typing in the Trial period input', async () => {
    const user = userEvent.setup()
    const onTrialDaysChange = vi.fn()

    function ControlledWrapper() {
      const [trialDays, setTrialDays] = useState('')
      return (
        <BillingTypeSection
          usageEnabled={false}
          onUsageEnabledChange={vi.fn()}
          trialDays={trialDays}
          onTrialDaysChange={(value) => {
            setTrialDays(value)
            onTrialDaysChange(value)
          }}
        />
      )
    }

    render(<ControlledWrapper />)

    const input = screen.getByRole('spinbutton', { name: /trial period/i })
    await user.type(input, '14')

    expect(onTrialDaysChange).toHaveBeenNthCalledWith(1, '1')
    expect(onTrialDaysChange).toHaveBeenNthCalledWith(2, '14')
  })

  it('renders the Trial period input with placeholder="0" and displays trialDays', () => {
    render(
      <BillingTypeSection
        usageEnabled={false}
        onUsageEnabledChange={vi.fn()}
        trialDays="30"
        onTrialDaysChange={vi.fn()}
      />
    )

    const input = screen.getByRole('spinbutton', { name: /trial period/i })
    expect(input).toHaveAttribute('placeholder', '0')
    expect(input).toHaveValue(30)
  })

  it('toggles the focus ring style on switch focus and blur', () => {
    render(
      <BillingTypeSection
        usageEnabled={false}
        onUsageEnabledChange={vi.fn()}
        trialDays=""
        onTrialDaysChange={vi.fn()}
      />
    )

    const toggle = screen.getByRole('switch', { name: /usage-based billing/i })

    fireEvent.focus(toggle)
    expect(toggle.style.boxShadow).toBe('0 0 0 2px rgba(77,216,225,0.4)')

    fireEvent.blur(toggle)
    expect(toggle.style.boxShadow).toBe('none')
  })

  it('exposes the trial period help popover text when opened', async () => {
    const user = userEvent.setup()

    render(
      <BillingTypeSection
        usageEnabled={false}
        onUsageEnabledChange={vi.fn()}
        trialDays=""
        onTrialDaysChange={vi.fn()}
      />
    )

    const helpButton = screen.getByRole('button', { name: /help for trial period/i })
    await user.click(helpButton)

    expect(
      screen.getByText(/use 0 or leave blank for no trial/i)
    ).toBeInTheDocument()
  })
})
