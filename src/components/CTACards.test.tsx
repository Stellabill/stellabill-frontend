import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CTACards from './CTACards'

describe('CTACards', () => {
  it('renders a labelled section with all four cards', () => {
    render(<CTACards />)
    const section = screen.getByTestId('cta-cards')
    expect(section.tagName.toLowerCase()).toBe('section')
    expect(section).toHaveAttribute('aria-labelledby', 'cta-cards-heading')
    expect(screen.getAllByRole('article')).toHaveLength(4)
  })

  it('renders a visually-hidden heading for the section', () => {
    render(<CTACards />)
    expect(
      screen.getByRole('heading', { level: 2, name: /ways to get started/i })
    ).toBeInTheDocument()
  })

  it('promotes "Become a Merchant" as the only primary card', () => {
    const { container } = render(<CTACards />)
    const primaryCards = container.querySelectorAll('.cta-card[data-variant="primary"]')
    expect(primaryCards).toHaveLength(1)
    expect(primaryCards[0]).toHaveTextContent(/become a merchant/i)
    expect(primaryCards[0]).toHaveTextContent(/recommended/i)
  })

  it('places the primary card first so it is reached first in tab order', () => {
    const { container } = render(<CTACards />)
    const cards = container.querySelectorAll('.cta-card')
    expect(cards[0]).toHaveAttribute('data-variant', 'primary')
    expect(cards[0]).toHaveTextContent(/become a merchant/i)
  })

  it('renders the expected secondary cards with their destinations', () => {
    render(<CTACards />)
    expect(screen.getByRole('link', { name: /see pricing plans: view pricing/i })).toHaveAttribute(
      'href',
      '#pricing'
    )
    expect(screen.getByRole('link', { name: /browse docs: read documentation/i })).toHaveAttribute(
      'href',
      '#docs'
    )
    expect(screen.getByRole('link', { name: /get in touch: contact sales/i })).toHaveAttribute(
      'href',
      '#contact'
    )
  })

  it('routes the primary CTA to /dashboard', () => {
    render(<CTACards />)
    expect(
      screen.getByRole('link', { name: /get started: become a merchant/i })
    ).toHaveAttribute('href', '/dashboard')
  })

  it('applies the correct responsive grid container class', () => {
    const { container } = render(<CTACards />)
    const grid = container.querySelector('.cta-cards-grid')
    expect(grid).toBeInTheDocument()
  })
})
