import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TransactionToast } from './TransactionToast';

describe('TransactionToast', () => {
  it('renders pending status and invokes an action', () => {
    const onAction = vi.fn();
    render(<TransactionToast toast={{ id: 'tx-1', status: 'pending', title: 'Waiting', actionText: 'Retry', onAction }} onClose={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveClass('toast-pending');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('auto-closes success only after the configured delay', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<TransactionToast toast={{ id: 'tx-2', status: 'success', title: 'Done' }} onClose={onClose} />);
    vi.advanceTimersByTime(4999);
    expect(onClose).not.toHaveBeenCalled();
    vi.advanceTimersByTime(301);
    expect(onClose).toHaveBeenCalledWith('tx-2');
    vi.useRealTimers();
  });
});
