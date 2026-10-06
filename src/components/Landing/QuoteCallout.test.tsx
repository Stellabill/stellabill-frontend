import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import QuoteCallout from './QuoteCallout'

describe('QuoteCallout', () => {
  it('renders without throwing', () => {
    expect(() => render(<QuoteCallout />)).not.toThrow()
  })

  it('exposes a labelled landmark region', () => {
    render(<QuoteCallout />)
    const region = screen.getByRole('region', { name: /tagline/i })
    expect(region).toBeInTheDocument()
  })

  it('renders a blockquote inside the section', () => {
    const { container } = render(<QuoteCallout />)
    const section = container.querySelector('section')
    expect(section).not.toBeNull()
    const blockquote = section!.querySelector('blockquote')
    expect(blockquote).not.toBeNull()
  })

  it('renders the full quote text', () => {
    render(<QuoteCallout />)
    // The rendered output is: "infrastructure-grade billing for Web3 SaaS"
    expect(
      screen.getByText(/infrastructure-grade/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/for Web3 SaaS/i)
    ).toBeInTheDocument()
  })

  it('highlights the word "billing" in a dedicated span', () => {
    const { container } = render(<QuoteCallout />)
    const billingSpan = container.querySelector('p span')
    expect(billingSpan).not.toBeNull()
    expect(billingSpan).toHaveTextContent('billing')
  })

  it('contains the billing span inside the quote paragraph', () => {
    const { container } = render(<QuoteCallout />)
    const para = container.querySelector('blockquote p')
    expect(para).not.toBeNull()
    const span = para!.querySelector('span')
    expect(span).not.toBeNull()
    expect(span).toHaveTextContent('billing')
  })

  it('produces a stable DOM structure across repeated renders', () => {
    const { unmount, container: first } = render(<QuoteCallout />)
    const firstHTML = first.innerHTML
    unmount()
    const { container: second } = render(<QuoteCallout />)
    expect(second.innerHTML).toBe(firstHTML)
  })

  it('section carries aria-label="Tagline"', () => {
    const { container } = render(<QuoteCallout />)
    const section = container.querySelector('section')
    expect(section).toHaveAttribute('aria-label', 'Tagline')
  })
})
