import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ExitConfirmModal from './ExitConfirmModal'

function renderExitConfirmModal(overrides: Partial<React.ComponentProps<typeof ExitConfirmModal>> = {}) {
  const props = {
    isOpen: true,
    onSaveDraft: vi.fn(),
    onDiscard: vi.fn(),
    onKeepEditing: vi.fn(),
    ...overrides,
  }
  return { ...render(<ExitConfirmModal {...props} />), props }
}

describe('ExitConfirmModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = renderExitConfirmModal({ isOpen: false })

    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders title, description, and keep-editing, discard, and save-draft buttons when open', () => {
    renderExitConfirmModal({ isOpen: true })

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /unsaved changes/i })).toBeInTheDocument()
    expect(
      screen.getByText('You have unsaved changes. Do you want to save a draft before leaving?')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /keep editing/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save draft/i })).toBeInTheDocument()
  })

  it('calls onKeepEditing once when Keep Editing is clicked', async () => {
    const user = userEvent.setup()
    const { props } = renderExitConfirmModal()

    await user.click(screen.getByRole('button', { name: /keep editing/i }))

    expect(props.onKeepEditing).toHaveBeenCalledTimes(1)
    expect(props.onDiscard).not.toHaveBeenCalled()
    expect(props.onSaveDraft).not.toHaveBeenCalled()
  })

  it('calls onDiscard once when Discard is clicked', async () => {
    const user = userEvent.setup()
    const { props } = renderExitConfirmModal()

    await user.click(screen.getByRole('button', { name: /discard/i }))

    expect(props.onDiscard).toHaveBeenCalledTimes(1)
    expect(props.onKeepEditing).not.toHaveBeenCalled()
    expect(props.onSaveDraft).not.toHaveBeenCalled()
  })

  it('calls onSaveDraft once when Save Draft is clicked', async () => {
    const user = userEvent.setup()
    const { props } = renderExitConfirmModal()

    await user.click(screen.getByRole('button', { name: /save draft/i }))

    expect(props.onSaveDraft).toHaveBeenCalledTimes(1)
    expect(props.onKeepEditing).not.toHaveBeenCalled()
    expect(props.onDiscard).not.toHaveBeenCalled()
  })

  it('routes Escape key press to onKeepEditing', async () => {
    const user = userEvent.setup()
    const { props } = renderExitConfirmModal()

    await user.keyboard('{Escape}')

    expect(props.onKeepEditing).toHaveBeenCalledTimes(1)
    expect(props.onDiscard).not.toHaveBeenCalled()
    expect(props.onSaveDraft).not.toHaveBeenCalled()
  })

  it('routes backdrop click and close button click to onKeepEditing', async () => {
    const user = userEvent.setup()
    const { props } = renderExitConfirmModal()

    await user.click(screen.getByRole('dialog'))
    expect(props.onKeepEditing).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(props.onKeepEditing).toHaveBeenCalledTimes(2)
  })
})
