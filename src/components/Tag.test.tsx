import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Tag, { type TagProps } from './Tag'

describe('Tag', () => {
  it('supports the documented props and renders its default appearance', () => {
    const props: TagProps = { label: 'Active' }
    const { container } = render(<Tag {...props} />)
    const tag = screen.getByRole('status', { name: 'Tag: Active' })

    expect(tag).toHaveClass('tag', 'tag--medium', 'tag--blue')
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(container.querySelector('.tag__remove')).toBeNull()
  })

  it.each(['blue', 'green', 'yellow', 'red', 'purple', 'pink', 'orange', 'gray'] as const)(
    'uses the %s color variant', color => {
      render(<Tag label="Status" color={color} />)
      expect(screen.getByRole('status', { name: 'Tag: Status' })).toHaveClass(`tag--${color}`)
    },
  )

  it('uses the requested small size and icon size', () => {
    const { container } = render(<Tag label="Compact" size="small" removable onRemove={() => {}} />)

    expect(screen.getByRole('status', { name: 'Tag: Compact' })).toHaveClass('tag--small')
    expect(container.querySelector('.tag__remove svg')).toHaveAttribute('width', '12')
  })

  it('applies the caller class without dropping its own classes', () => {
    render(<Tag label="Custom" className="custom-tag" />)

    expect(screen.getByRole('status', { name: 'Tag: Custom' })).toHaveClass(
      'tag', 'tag--medium', 'tag--blue', 'custom-tag',
    )
  })

  it('renders a remove control and calls the callback once', () => {
    const onRemove = vi.fn()
    render(<Tag label="Saved" removable onRemove={onRemove} />)

    fireEvent.click(screen.getByRole('button', { name: 'Remove Saved tag' }))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('does not render an unusable remove control without a callback', () => {
    const { container } = render(<Tag label="Saved" removable />)

    expect(container.querySelector('.tag__remove')).toBeNull()
  })

  it('keeps remove clicks from bubbling to a containing control', () => {
    const onRemove = vi.fn()
    const onParentClick = vi.fn()
    render(
      <div onClick={onParentClick}>
        <Tag label="Saved" removable onRemove={onRemove} />
      </div>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Remove Saved tag' }))
    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(onParentClick).not.toHaveBeenCalled()
  })

  it('renders an empty label as a stable boundary case', () => {
    const { container } = render(<Tag label="" />)

    expect(container.querySelector('.tag__text')).toBeEmptyDOMElement()
    expect(screen.getByRole('status', { name: 'Tag: ' })).toBeInTheDocument()
  })

  it('does not create a remove control when removable is false', () => {
    const { container } = render(<Tag label="Locked" removable={false} onRemove={vi.fn()} />)

    expect(container.querySelector('.tag__remove')).toBeNull()
  })
})
