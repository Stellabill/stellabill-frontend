import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from './Modal'

describe('Modal', () => {
  it('renders nothing while closed', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={vi.fn()} title="Hidden">
        <p>Content</p>
      </Modal>
    )

    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  // Regression coverage for the `Default` story in Modal.stories.tsx: every
  // slot the story passes (title, description, children, footer) must render,
  // and the modal must announce itself as a labelled, modal dialog.
  it('renders the Default story contract with title, description, body and footer', () => {
    render(
      <Modal
        isOpen={true}
        onClose={vi.fn()}
        title="Example Modal"
        description="This is a description of what this modal does."
        footer={
          <>
            <button>Cancel</button>
            <button>Confirm</button>
          </>
        }
      >
        <p>Modal content goes here.</p>
      </Modal>
    )

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title')
    expect(dialog).toHaveAttribute('aria-describedby', 'modal-description')
    expect(screen.getByText('Example Modal')).toBeInTheDocument()
    expect(screen.getByText('This is a description of what this modal does.')).toBeInTheDocument()
    expect(screen.getByText('Modal content goes here.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
  })

  it('omits the description slot and its aria wiring when no description is given', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="No description">
        <p>Body</p>
      </Modal>
    )

    const dialog = screen.getByRole('dialog')
    expect(dialog).not.toHaveAttribute('aria-describedby')
    expect(document.getElementById('modal-description')).toBeNull()
  })

  it('renders a footer only when one is provided', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={vi.fn()} title="With footer" footer={<button>Save</button>}>
        <p>Body</p>
      </Modal>
    )
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()

    rerender(
      <Modal isOpen={true} onClose={vi.fn()} title="Without footer">
        <p>Body</p>
      </Modal>
    )
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
  })

  it('applies the requested max width and defaults to md', () => {
    const { container, rerender } = render(
      <Modal isOpen={true} onClose={vi.fn()} title="Width">
        <p>Body</p>
      </Modal>
    )
    expect(container.querySelector('.max-w-md')).toBeInTheDocument()

    for (const size of ['sm', 'lg', 'xl'] as const) {
      rerender(
        <Modal isOpen={true} onClose={vi.fn()} title="Width" maxWidth={size}>
          <p>Body</p>
        </Modal>
      )
      expect(container.querySelector(`.max-w-${size}`)).toBeInTheDocument()
    }
  })

  it('closes when the close button is clicked', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Closable">
        <p>Body</p>
      </Modal>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when Escape is pressed', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Escapable">
        <p>Body</p>
      </Modal>
    )

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on a backdrop click but not on a click inside the content', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Backdrop">
        <p>Inner content</p>
      </Modal>
    )

    fireEvent.click(screen.getByText('Inner content'))
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
