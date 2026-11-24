import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import DowngradeConfirmModal from './DowngradeConfirmModal'

const baseProps = {
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  currentPlanName: 'Pro',
  currentPlanPrice: '50 USDC / mo',
  newPlanName: 'Basic',
  newPlanPrice: '20 USDC / mo',
  lostFeatures: [{ id: 'exports', label: 'Unlimited exports' }],
}

describe('DowngradeConfirmModal', () => {
  it('renders nothing while closed', () => {
    const { container } = render(<DowngradeConfirmModal {...baseProps} isOpen={false} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders delayed changes and blocks confirmation until acknowledged', () => {
    render(
      <DowngradeConfirmModal
        {...baseProps}
        isOpen
        isDelayed
        effectiveDate="Aug 1, 2026"
      />,
    )

    expect(screen.getByText('Unlimited exports')).toBeInTheDocument()
    expect(
      screen.getByText(/Your plan will change to Basic on Aug 1, 2026/),
    ).toBeInTheDocument()
    const confirm = screen.getByRole('button', { name: /acknowledgement required/i })
    expect(confirm).toBeDisabled()
    expect(baseProps.onConfirm).not.toHaveBeenCalled()
  })

  it('confirms after acknowledgement and preserves empty-feature fallback', () => {
    const onConfirm = vi.fn()
    render(
      <DowngradeConfirmModal
        {...baseProps}
        onConfirm={onConfirm}
        isOpen
        isDelayed={false}
        lostFeatures={[]}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      'No features will be removed with this downgrade.',
    )
    expect(screen.getByText(/Your plan changes to Basic immediately/)).toBeInTheDocument()

    const confirm = screen.getByRole('button', { name: /Confirm downgrade/ })
    fireEvent.click(confirm)
    expect(onConfirm).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('checkbox'))
    expect(confirm).toBeEnabled()
    fireEvent.click(confirm)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('does not confirm or close while loading', () => {
    const onClose = vi.fn()
    const onConfirm = vi.fn()
    render(
      <DowngradeConfirmModal
        {...baseProps}
        onClose={onClose}
        onConfirm={onConfirm}
        isOpen
        isLoading
      />,
    )

    expect(screen.getByRole('button', { name: /processing downgrade/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Keep current plan' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: /processing downgrade/i }))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })
})
