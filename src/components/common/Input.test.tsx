import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from './Input'
import type { InputProps } from './Input'

describe('Input', () => {
  it('renders a label wired to the input and forwards input props', () => {
    render(<Input label="Email" placeholder="you@example.com" type="email" name="email" />)

    const input = screen.getByLabelText(/Email/) as HTMLInputElement
    expect(input).toHaveAttribute('placeholder', 'you@example.com')
    expect(input).toHaveAttribute('type', 'email')
    expect(input).toHaveAttribute('name', 'email')
    expect(input.id).toBeTruthy()
    expect(screen.getByText(/Email/).closest('label')).toHaveAttribute('for', input.id)
  })

  it('marks a required field with an asterisk', () => {
    const { container } = render(<Input label="Email" required />)

    // `required` drives the visual marker; it is not forwarded to the input.
    expect(container.querySelector('label span')?.textContent).toBe('*')
    expect(screen.getByLabelText(/Email/)).toHaveAccessibleName('Email*')
  })

  it('shows the error message and error styling, hiding helper text', () => {
    render(<Input label="Email" error="Invalid email address" helperText="We never share it" />)

    const input = screen.getByLabelText(/Email/) as HTMLInputElement
    expect(screen.getByText('Invalid email address')).toBeInTheDocument()
    expect(screen.queryByText('We never share it')).not.toBeInTheDocument()
    expect(input.className).toContain('border-red-500/50')
    expect(input.className).not.toContain('border-[#2a2a2a]')
  })

  it('shows helper text while there is no error', () => {
    render(<Input label="Email" helperText="We never share it" />)

    const input = screen.getByLabelText(/Email/) as HTMLInputElement
    expect(screen.getByText('We never share it')).toBeInTheDocument()
    expect(input.className).toContain('border-[#2a2a2a]')
  })

  it('renders left and right addons and pads the field on both sides', () => {
    render(
      <Input
        label="Amount"
        leftAddon={<span data-testid="left-addon">$</span>}
        rightAddon={<span data-testid="right-addon">.00</span>}
      />
    )

    const input = screen.getByLabelText(/Amount/) as HTMLInputElement
    expect(screen.getByTestId('left-addon')).toBeInTheDocument()
    expect(screen.getByTestId('right-addon')).toBeInTheDocument()
    expect(input.className).toContain('pl-10')
    expect(input.className).toContain('pr-10')
  })

  it('honours an explicit id and generates distinct ids when none is given', () => {
    const { unmount } = render(<Input label="Email" id="email-field" />)
    expect(screen.getByLabelText(/Email/)).toHaveAttribute('id', 'email-field')
    unmount()

    const { container } = render(
      <>
        <Input label="First" />
        <Input label="Second" />
      </>
    )
    const inputs = Array.from(container.querySelectorAll('input'))
    expect(inputs).toHaveLength(2)
    expect(inputs[0].id).toMatch(/^input-/)
    expect(inputs[1].id).toMatch(/^input-/)
    expect(inputs[0].id).not.toBe(inputs[1].id)
  })

  it('merges a custom className with the base styles', () => {
    render(<Input label="Email" className="my-custom-class" />)

    const input = screen.getByLabelText(/Email/) as HTMLInputElement
    expect(input.className).toContain('my-custom-class')
    expect(input.className).toContain('rounded-lg')
  })

  it('renders without a label element when no label is provided', () => {
    const { container } = render(<Input placeholder="Search" />)

    expect(container.querySelector('label')).toBeNull()
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument()
  })

  it('clears the error state when the error prop is removed', () => {
    const { rerender } = render(<Input label="Email" error="Invalid email address" />)
    expect(screen.getByText('Invalid email address')).toBeInTheDocument()

    rerender(<Input label="Email" helperText="We never share it" />)
    expect(screen.queryByText('Invalid email address')).not.toBeInTheDocument()
    expect(screen.getByText('We never share it')).toBeInTheDocument()
  })

  it('forwards a full InputProps object including handlers and disabled state', () => {
    const onChange = vi.fn()
    const props: InputProps = {
      label: 'Name',
      helperText: 'Your full name',
      leftAddon: null,
      rightAddon: null,
      disabled: true,
      onChange,
    }
    render(<Input {...props} />)

    const input = screen.getByLabelText(/Name/) as HTMLInputElement
    expect(input).toBeDisabled()
    expect(screen.getByText('Your full name')).toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'Ada' } })
    expect(onChange).toHaveBeenCalledTimes(1)
  })
})
