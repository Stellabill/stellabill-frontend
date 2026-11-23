import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import Checkout from './Checkout'

const mockUseWallet = vi.fn()

vi.mock('../wallet/WalletContext', () => ({
  useWallet: () => mockUseWallet(),
}))

function renderCheckout(planId: string) {
  return render(
    <MemoryRouter initialEntries={[`/checkout/${planId}`]}>
      <Routes>
        <Route path="/checkout/:planId" element={<Checkout />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Checkout', () => {
  it('renders plan not found with CSS module classes and no inline styles', () => {
    mockUseWallet.mockReturnValue({
      status: 'disconnected',
      connect: vi.fn(),
      error: null,
    })

    const { container } = renderCheckout('unknown-plan')

    expect(screen.getByRole('heading', { name: /plan not found/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to browse plans/i })).toBeInTheDocument()
    expect(container.querySelector('[class*="card"]')).toBeInTheDocument()
    expect(container.querySelectorAll('[style]')).toHaveLength(0)
  })

  it('renders checkout details with CSS module classes and no inline styles on Checkout elements', () => {
    mockUseWallet.mockReturnValue({
      status: 'connected',
      connect: vi.fn(),
      error: null,
    })

    const { container } = renderCheckout('1')

    expect(screen.getByRole('heading', { name: /confirm subscription/i })).toBeInTheDocument()
    expect(screen.getByText('Premium Access')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirm subscription/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /cancel/i })).toBeInTheDocument()

    const card = container.querySelector('[class*="card"]')
    expect(card).toBeInTheDocument()
    expect(card).not.toHaveAttribute('style')
    expect(screen.getByRole('button', { name: /confirm subscription/i })).not.toHaveAttribute('style')
    expect(screen.getByRole('link', { name: /cancel/i })).not.toHaveAttribute('style')
  })
})
