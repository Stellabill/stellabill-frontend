import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ToastContainer,
  TransactionToast,
  type ToastOptions,
} from './TransactionToast';

function makeToast(overrides: Partial<ToastOptions> = {}): ToastOptions {
  return {
    id: 'toast-1',
    status: 'success',
    title: 'Payment confirmed',
    ...overrides,
  };
}

describe('TransactionToast', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders role="alert" with aria-live="assertive" for error and "polite" for other statuses', () => {
    const onClose = vi.fn();

    const { rerender } = render(
      <TransactionToast toast={makeToast({ status: 'pending' })} onClose={onClose} />,
    );
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');

    rerender(
      <TransactionToast toast={makeToast({ status: 'success' })} onClose={onClose} />,
    );
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');

    rerender(
      <TransactionToast toast={makeToast({ status: 'error' })} onClose={onClose} />,
    );
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
  });

  it('renders distinct icon classes for pending, success, and error statuses', () => {
    const onClose = vi.fn();

    const { container, rerender } = render(
      <TransactionToast toast={makeToast({ status: 'pending' })} onClose={onClose} />,
    );
    expect(container.querySelector('.toast-icon-pending')).toBeInTheDocument();
    expect(container.querySelector('.toast-icon-success')).not.toBeInTheDocument();
    expect(container.querySelector('.toast-icon-error')).not.toBeInTheDocument();

    rerender(
      <TransactionToast toast={makeToast({ status: 'success' })} onClose={onClose} />,
    );
    expect(container.querySelector('.toast-icon-success')).toBeInTheDocument();
    expect(container.querySelector('.toast-icon-pending')).not.toBeInTheDocument();
    expect(container.querySelector('.toast-icon-error')).not.toBeInTheDocument();

    rerender(
      <TransactionToast toast={makeToast({ status: 'error' })} onClose={onClose} />,
    );
    expect(container.querySelector('.toast-icon-error')).toBeInTheDocument();
    expect(container.querySelector('.toast-icon-pending')).not.toBeInTheDocument();
    expect(container.querySelector('.toast-icon-success')).not.toBeInTheDocument();
  });

  it('renders title and optional message', () => {
    const onClose = vi.fn();

    const { rerender } = render(
      <TransactionToast
        toast={makeToast({ title: 'Processing', message: 'Submitting to Stellar...' })}
        onClose={onClose}
      />,
    );
    expect(screen.getByText('Processing')).toBeInTheDocument();
    expect(screen.getByText('Submitting to Stellar...')).toBeInTheDocument();

    rerender(
      <TransactionToast
        toast={makeToast({ title: 'Done', message: undefined })}
        onClose={onClose}
      />,
    );
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.queryByText('Submitting to Stellar...')).not.toBeInTheDocument();
  });

  it('auto-closes success toasts after the timeout and calls onClose with the toast id', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();

    render(
      <TransactionToast
        toast={makeToast({ id: 'success-1', status: 'success' })}
        onClose={onClose}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(screen.getByRole('alert')).not.toHaveClass('removing');
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole('alert')).toHaveClass('removing');
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith('success-1');
  });

  it('auto-closes error toasts after the timeout and calls onClose with the toast id', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();

    render(
      <TransactionToast
        toast={makeToast({ id: 'error-1', status: 'error' })}
        onClose={onClose}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(5300);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith('error-1');
  });

  it('does not auto-close pending toasts or toasts with autoClose: false', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();

    const { rerender } = render(
      <TransactionToast
        toast={makeToast({ id: 'pending-1', status: 'pending' })}
        onClose={onClose}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(onClose).not.toHaveBeenCalled();

    rerender(
      <TransactionToast
        toast={makeToast({ id: 'no-auto-1', status: 'success', autoClose: false })}
        onClose={onClose}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(onClose).not.toHaveBeenCalled();

    rerender(
      <TransactionToast
        toast={makeToast({ id: 'no-auto-2', status: 'error', autoClose: false })}
        onClose={onClose}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('triggers removal state and calls onClose when the Close notification button is clicked', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onClose = vi.fn();

    render(
      <TransactionToast
        toast={makeToast({ id: 'manual-close-1', status: 'pending' })}
        onClose={onClose}
      />,
    );

    const closeBtn = screen.getByRole('button', { name: 'Close notification' });
    await user.click(closeBtn);

    expect(screen.getByRole('alert')).toHaveClass('removing');
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith('manual-close-1');
  });

  it('renders action button with toast-action-danger for error and toast-action-primary otherwise and calls onAction', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onAction = vi.fn();

    const { rerender } = render(
      <TransactionToast
        toast={makeToast({
          status: 'error',
          actionText: 'Retry',
          onAction,
          autoClose: false,
        })}
        onClose={onClose}
      />,
    );

    const errorActionBtn = screen.getByRole('button', { name: 'Retry' });
    expect(errorActionBtn).toHaveClass('toast-action-danger');
    expect(errorActionBtn).not.toHaveClass('toast-action-primary');

    await user.click(errorActionBtn);
    expect(onAction).toHaveBeenCalledTimes(1);

    rerender(
      <TransactionToast
        toast={makeToast({
          status: 'success',
          actionText: 'View receipt',
          onAction,
          autoClose: false,
        })}
        onClose={onClose}
      />,
    );

    const successActionBtn = screen.getByRole('button', { name: 'View receipt' });
    expect(successActionBtn).toHaveClass('toast-action-primary');
    expect(successActionBtn).not.toHaveClass('toast-action-danger');

    await user.click(successActionBtn);
    expect(onAction).toHaveBeenCalledTimes(2);
  });

  it('does not render an action button when actionText or onAction is missing', () => {
    const onClose = vi.fn();

    const { rerender } = render(
      <TransactionToast
        toast={makeToast({ actionText: 'Retry', onAction: undefined })}
        onClose={onClose}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();

    rerender(
      <TransactionToast
        toast={makeToast({ actionText: undefined, onAction: vi.fn() })}
        onClose={onClose}
      />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});

describe('ToastContainer', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders one toast per entry and forwards removeToast', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const removeToast = vi.fn();
    const toasts: ToastOptions[] = [
      makeToast({ id: 't-1', status: 'pending', title: 'First toast' }),
      makeToast({ id: 't-2', status: 'error', title: 'Second toast', autoClose: false }),
    ];

    render(<ToastContainer toasts={toasts} removeToast={removeToast} />);

    expect(screen.getAllByRole('alert')).toHaveLength(2);
    expect(screen.getByText('First toast')).toBeInTheDocument();
    expect(screen.getByText('Second toast')).toBeInTheDocument();

    const closeButtons = screen.getAllByRole('button', { name: 'Close notification' });
    await user.click(closeButtons[1]);

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(removeToast).toHaveBeenCalledTimes(1);
    expect(removeToast).toHaveBeenCalledWith('t-2');
  });
});
