import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TourCompletion from './TourCompletion';

describe('TourCompletion', () => {
  it('renders nothing while closed', () => {
    const onClose = vi.fn();
    const { container } = render(<TourCompletion isOpen={false} onClose={onClose} />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders the accessible completion dialog with default content while open', () => {
    render(<TourCompletion isOpen onClose={vi.fn()} />);

    const dialog = screen.getByRole('dialog', { name: "You're all set!" });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-describedby', 'completion-message');
    expect(screen.getByText("You've completed the tour. You're ready to start managing your subscriptions.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Get started' })).toBeInTheDocument();
  });

  it('preserves explicitly empty optional content instead of applying defaults', () => {
    render(<TourCompletion isOpen onClose={vi.fn()} title="" message="" actionLabel="" />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('');
    expect(screen.getByText('', { selector: 'p' })).toHaveTextContent('');
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument();
  });

  it('removes the dialog when the open state changes to closed', () => {
    const onClose = vi.fn();
    const { rerender } = render(<TourCompletion isOpen onClose={onClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    rerender(<TourCompletion isOpen={false} onClose={onClose} />);

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when the action button is clicked', () => {
    const onClose = vi.fn();
    render(<TourCompletion isOpen onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Get started' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose for Escape and overlay clicks but not card clicks', () => {
    const onClose = vi.fn();
    const { container } = render(<TourCompletion isOpen onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector('.product-tour-completion__card') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector('.product-tour-completion__overlay') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});