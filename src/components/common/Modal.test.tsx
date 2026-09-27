import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Modal from './Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <span>Modal Content</span>,
  };

  it('returns null when isOpen is false (failure/empty path)', () => {
    const { container } = render(
      <Modal {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('renders the modal when isOpen is true', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('renders with description when provided', () => {
    render(
      <Modal {...defaultProps} description="A description" />
    );
    expect(screen.getByText('A description')).toBeInTheDocument();
  });

  it('does not render description element when description is omitted', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.queryByText('A description')).not.toBeInTheDocument();
  });

  it('renders footer when provided', () => {
    render(
      <Modal {...defaultProps} footer={<button>Footer Action</button>} />
    );
    expect(screen.getByText('Footer Action')).toBeInTheDocument();
  });

  it('does not render footer when omitted', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.queryByText('Footer Action')).not.toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the overlay background is clicked', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when the modal content is clicked', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Modal Content'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('applies maxWidth class based on prop value', () => {
    const { rerender, container } = render(
      <Modal {...defaultProps} maxWidth="sm" />
    );
    expect(container.querySelector('[class*="max-w-sm"]')).toBeInTheDocument();

    rerender(<Modal {...defaultProps} maxWidth="lg" />);
    expect(container.querySelector('[class*="max-w-lg"]')).toBeInTheDocument();
  });

  it('defaults maxWidth to md', () => {
    const { container } = render(<Modal {...defaultProps} />);
    expect(container.querySelector('[class*="max-w-md"]')).toBeInTheDocument();
  });

  it('has accessible dialog role and aria attributes', () => {
    render(<Modal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
  });

  it('has aria-describedby when description is provided', () => {
    render(
      <Modal {...defaultProps} description="Test desc" />
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-describedby', 'modal-description');
  });

  it('does not have aria-describedby when description is omitted', () => {
    render(<Modal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toHaveAttribute('aria-describedby');
  });

  it('renders title with correct id for aria-labelledby', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByText('Test Modal')).toHaveAttribute('id', 'modal-title');
  });

  it('renders children inside the modal body', () => {
    render(
      <Modal {...defaultProps}>
        <span data-testid="child-element">Child</span>
      </Modal>
    );
    expect(screen.getByTestId('child-element')).toBeInTheDocument();
  });

  it('is deterministic: returns null consistently when isOpen is false', () => {
    const { container } = render(
      <Modal {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
    const { container: container2 } = render(
      <Modal {...defaultProps} isOpen={false} />
    );
    expect(container2.firstChild).toBeNull();
  });
});