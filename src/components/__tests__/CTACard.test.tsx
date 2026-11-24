import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import '@testing-library/jest-dom'
import CTACard, { CTACardVariant } from '../CTACard'

describe('CTACard', () => {
  const defaultProps = {
    title: 'Test Title',
    description: 'Test Description',
    buttonLabel: 'Test Button',
  }

  describe('CTACardVariant', () => {
    it('applies secondary variant by default', () => {
      render(<CTACard {...defaultProps} />)
      const article = screen.getByRole('article')
      expect(article).toHaveAttribute('data-variant', 'secondary')
      expect(screen.queryByText('Recommended')).not.toBeInTheDocument()
    })

    it('applies primary variant when specified', () => {
      const variant: CTACardVariant = 'primary'
      render(<CTACard {...defaultProps} variant={variant} />)
      const article = screen.getByRole('article')
      expect(article).toHaveAttribute('data-variant', 'primary')
      expect(screen.getByText('Recommended')).toBeInTheDocument()
    })
  })

  describe('Core rendering', () => {
    it('renders title, description, and button label', () => {
      render(<CTACard {...defaultProps} />)
      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Test Description')).toBeInTheDocument()
      expect(screen.getByText('Test Button')).toBeInTheDocument()
    })

    it('renders optional icons when provided', () => {
      render(
        <CTACard
          {...defaultProps}
          icon={<span data-testid="top-icon">top</span>}
          buttonLeadingIcon={<span data-testid="leading-icon">lead</span>}
        />
      )
      expect(screen.getByTestId('top-icon')).toBeInTheDocument()
      expect(screen.getByTestId('leading-icon')).toBeInTheDocument()
    })

    it('renders default trailing arrow if buttonTrailingIcon is undefined', () => {
      render(<CTACard {...defaultProps} />)
      const svg = document.querySelector('.cta-arrow')
      expect(svg).toBeInTheDocument()
    })

    it('hides trailing icon if buttonTrailingIcon is null', () => {
      render(<CTACard {...defaultProps} buttonTrailingIcon={null} />)
      const svg = document.querySelector('.cta-arrow')
      expect(svg).not.toBeInTheDocument()
    })
  })

  describe('Interactions and element types', () => {
    it('renders as a button when href is omitted', () => {
      render(<CTACard {...defaultProps} />)
      const button = screen.getByRole('button', { name: /Test Button/i })
      expect(button).toBeInTheDocument()
      expect(button.tagName).toBe('BUTTON')
    })

    it('renders as a link when href is provided', () => {
      render(<CTACard {...defaultProps} href="/test-link" />)
      const link = screen.getByRole('link', { name: /Test Button/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/test-link')
    })

    it('calls onClick when button is clicked', () => {
      const onClickMock = vi.fn()
      render(<CTACard {...defaultProps} onClick={onClickMock} />)
      const button = screen.getByRole('button', { name: /Test Button/i })
      fireEvent.click(button)
      expect(onClickMock).toHaveBeenCalledTimes(1)
    })

    it('prevents default and calls onClick when button (no href) is clicked', () => {
      const onClickMock = vi.fn()
      render(<CTACard {...defaultProps} onClick={onClickMock} />)
      const button = screen.getByRole('button', { name: /Test Button/i })
      
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true })
      Object.assign(clickEvent, { preventDefault: vi.fn() })
      
      fireEvent(button, clickEvent)
      
      expect(onClickMock).toHaveBeenCalledTimes(1)
      expect(clickEvent.preventDefault).toHaveBeenCalledTimes(1)
    })

    it('calls onClick when link is clicked and does not prevent default if href is present', () => {
      const onClickMock = vi.fn()
      render(<CTACard {...defaultProps} href="/test-link" onClick={onClickMock} />)
      const link = screen.getByRole('link', { name: /Test Button/i })
      
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true })
      Object.assign(clickEvent, { preventDefault: vi.fn() })
      
      fireEvent(link, clickEvent)
      
      expect(onClickMock).toHaveBeenCalledTimes(1)
      expect(clickEvent.preventDefault).not.toHaveBeenCalled()
    })

    it('does nothing when clicked and onClick is not provided', () => {
      render(<CTACard {...defaultProps} />)
      const button = screen.getByRole('button', { name: /Test Button/i })
      
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true })
      Object.assign(clickEvent, { preventDefault: vi.fn() })
      
      fireEvent(button, clickEvent)
      // Since no onClick provided, nothing should happen and preventDefault shouldn't be called (handled inside handleClick)
      expect(clickEvent.preventDefault).not.toHaveBeenCalled()
    })
  })
})
