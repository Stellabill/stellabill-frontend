import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import BrowserPlan from './BrowserPlan'

function getPlanNames() {
  return screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)
}

describe('BrowserPlan', () => {
  it('lists all merchants once, following the All merchants option', () => {
    render(<BrowserPlan />)

    const options = within(screen.getByRole('combobox', { name: 'Merchant' }))
      .getAllByRole('option')
      .map((option) => option.textContent)

    expect(options).toEqual([
      'All merchants',
      'Stellar News',
      'CloudFlow',
      'DevTools AI',
      'FitTrack',
    ])
  })

  it('shows only plans belonging to the selected merchant', async () => {
    const user = userEvent.setup()
    render(<BrowserPlan />)

    await user.selectOptions(screen.getByRole('combobox', { name: 'Merchant' }), 'CloudFlow')

    expect(getPlanNames()).toEqual(['Pro Plan', 'Enterprise'])
  })

  it('filters plans by monthly and yearly billing intervals', async () => {
    const user = userEvent.setup()
    render(<BrowserPlan />)

    await user.click(screen.getByRole('button', { name: 'Monthly' }))
    expect(getPlanNames()).toEqual([
      'Starter',
      'Premium Access',
      'Pro Plan',
      'Premium Coaching',
      'Enterprise',
    ])

    await user.click(screen.getByRole('button', { name: 'Yearly' }))
    expect(getPlanNames()).toEqual(['Annual Premium'])
  })

  it('sorts plans by price or by newest creation date by default', async () => {
    const user = userEvent.setup()
    render(<BrowserPlan />)

    expect(getPlanNames()).toEqual([
      'Starter',
      'Premium Access',
      'Pro Plan',
      'Premium Coaching',
      'Enterprise',
      'Annual Premium',
    ])

    await user.click(screen.getByRole('combobox', { name: 'Sort by' }))
    await user.click(screen.getByRole('option', { name: 'Price (low to high)' }))
    expect(getPlanNames()).toEqual([
      'Premium Access',
      'Starter',
      'Pro Plan',
      'Premium Coaching',
      'Enterprise',
      'Annual Premium',
    ])

    await user.click(screen.getByRole('combobox', { name: 'Sort by' }))
    await user.click(screen.getByRole('option', { name: 'Price (high to low)' }))
    expect(getPlanNames()).toEqual([
      'Annual Premium',
      'Enterprise',
      'Premium Coaching',
      'Pro Plan',
      'Starter',
      'Premium Access',
    ])
  })

  it('shows no plans when merchant and billing interval filters do not match', async () => {
    const user = userEvent.setup()
    render(<BrowserPlan />)

    await user.selectOptions(screen.getByRole('combobox', { name: 'Merchant' }), 'FitTrack')
    await user.click(screen.getByRole('button', { name: 'Yearly' }))

    expect(screen.getByText('Showing 0 plans')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
  })
})
