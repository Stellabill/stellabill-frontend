import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CTACard from './CTACard'

const baseProps = {
  icon: <svg data-testid="card-icon" aria-hidden="true" />,
  title: 'Become a Merchant',
  description: 'Start accepting recurring payments.',
  buttonLabel: 'Get started',
}

describe('CTACard — rendering', () => {
  it('renders title, description, and icon', () => {
    render(<CTACard {...baseProps} />)
    expect(screen.getByRole('heading', { name: /become a merchant/i })).toBeInTheDocument()
    expect(screen.getByText(/start accepting recurring payments/i)).toBeInTheDocument()
    expect(screen.getByTestId('card-icon')).toBeInTheDocument()
  })

  it('uses an <a> tag when href is provided and disambiguates the accessible name', () => {
    render(<CTACard {...baseProps} href="/dashboard" />)
    const cta = screen.getByRole('link', { name: /get started: become a merchant/i })
    expect(cta).toHaveAttribute('href', '/dashboard')
  })

  it('uses a <button type="button"> when no href is provided', () => {
    render(<CTACard {...baseProps} onClick={() => {}} />)
    const cta = screen.getByRole('button', { name: /get started: become a merchant/i })
    expect(cta).toHaveAttribute('type', 'button')
  })

  it('does NOT nest a button inside the link (valid HTML)', () => {
    const { container } = render(<CTACard {...baseProps} href="/dashboard" />)
    const link = container.querySelector('a')
    expect(link).not.toBeNull()
    expect(link!.querySelector('button')).toBeNull()
  })

  it('renders inside an <article> for landmark structure', () => {
    const { container } = render(<CTACard {...baseProps} href="/dashboard" />)
    const article = container.querySelector('article.cta-card')
    expect(article).not.toBeNull()
  })

  it('does not render the "Recommended" badge by default (secondary variant)', () => {
    render(<CTACard {...baseProps} href="/dashboard" />)
    expect(screen.queryByText(/recommended/i)).toBeNull()
  })

  it('renders the "Recommended" badge when variant="primary"', () => {
    render(<CTACard {...baseProps} href="/dashboard" variant="primary" />)
    expect(screen.getByText(/recommended/i)).toBeInTheDocument()
  })

  it('exposes data-variant attribute reflecting the variant prop', () => {
    const { container, rerender } = render(<CTACard {...baseProps} href="/x" variant="primary" />)
    expect(container.querySelector('.cta-card')).toHaveAttribute('data-variant', 'primary')
    rerender(<CTACard {...baseProps} href="/x" variant="secondary" />)
    expect(container.querySelector('.cta-card')).toHaveAttribute('data-variant', 'secondary')
  })

  it('renders correctly without an icon when no icon is provided', () => {
    const propsWithoutIcon = { ...baseProps, icon: undefined }
    const { container } = render(<CTACard {...propsWithoutIcon} />)
    expect(container.querySelector('.cta-icon-circle')).toBeNull()
  })

  it('renders an optional button leading icon when buttonLeadingIcon is provided', () => {
    render(<CTACard {...baseProps} buttonLeadingIcon={<span data-testid="leading-btn-icon">⚡</span>} />)
    expect(screen.getByTestId('leading-btn-icon')).toBeInTheDocument()
  })

  it('renders an optional button trailing icon when buttonTrailingIcon is provided', () => {
    render(<CTACard {...baseProps} buttonTrailingIcon={<span data-testid="trailing-btn-icon">➜</span>} />)
    expect(screen.getByTestId('trailing-btn-icon')).toBeInTheDocument()
  })
})

describe('CTACard — interaction', () => {
  it('fires onClick when the link CTA is clicked', () => {
    const onClick = vi.fn()
    render(<CTACard {...baseProps} href="/dashboard" onClick={onClick} />)
    fireEvent.click(screen.getByRole('link', { name: /get started/i }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('fires onClick when the button CTA is clicked', () => {
    const onClick = vi.fn()
    render(<CTACard {...baseProps} onClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: /get started/i }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not fire onClick if not provided (no error)', () => {
    render(<CTACard {...baseProps} href="/dashboard" />)
    expect(() =>
      fireEvent.click(screen.getByRole('link', { name: /get started/i }))
    ).not.toThrow()
  })

  it('prevents default navigation when used as button (no href + onClick)', () => {
    const onClick = vi.fn()
    render(<CTACard {...baseProps} onClick={onClick} />)
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    const button = screen.getByRole('button', { name: /get started/i })
    button.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does NOT prevent default navigation on link clicks (so the browser navigates)', () => {
    const onClick = vi.fn()
    render(<CTACard {...baseProps} href="/dashboard" onClick={onClick} />)
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    const link = screen.getByRole('link', { name: /get started/i })
    link.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
