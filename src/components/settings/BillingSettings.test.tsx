import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BillingSettings from './BillingSettings';
import { subscriptions } from '../../api/client';

vi.mock('../../api/client', () => ({
  subscriptions: {
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    downgrade: vi.fn(),
    reactivate: vi.fn(),
  },
}));

describe('BillingSettings subscription cancellation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cancels the subscription optimistically, disables buttons while pending, and shows a success toast', async () => {
    let resolveCancel!: (val: { success: boolean }) => void;
    vi.mocked(subscriptions.cancel).mockImplementationOnce(
      () => new Promise((res) => { resolveCancel = res; }),
    );

    render(<BillingSettings subscriptionId="SUB-999" />);

    const triggerBtn = screen.getByRole('button', {
      name: /cancel subscription: cancel subscription/i,
    });
    fireEvent.click(triggerBtn);

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /^cancel subscription$/i });
    fireEvent.click(confirmBtn);

    // While pending: dialog confirm button and danger zone trigger are disabled, optimistic status is Cancelled
    expect(screen.getByRole('button', { name: /cancelling\.\.\./i })).toBeDisabled();
    expect(triggerBtn).toBeDisabled();
    expect(screen.getByText('Your subscription has been cancelled.')).toBeInTheDocument();

    await act(async () => {
      resolveCancel({ success: true });
    });

    expect(subscriptions.cancel).toHaveBeenCalledWith('SUB-999');
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    expect(screen.getAllByText('Subscription cancelled').length).toBeGreaterThanOrEqual(1);
    expect(triggerBtn).toBeDisabled();
  });

  it('rolls back optimistic cancellation status and shows an error toast when API fails', async () => {
    let rejectCancel!: (err: Error) => void;
    vi.mocked(subscriptions.cancel).mockImplementationOnce(
      () => new Promise((_, rej) => { rejectCancel = rej; }),
    );

    render(<BillingSettings subscriptionId="SUB-999" />);

    const triggerBtn = screen.getByRole('button', {
      name: /cancel subscription: cancel subscription/i,
    });
    fireEvent.click(triggerBtn);

    const confirmBtn = screen.getByRole('button', { name: /^cancel subscription$/i });
    fireEvent.click(confirmBtn);

    // Optimistic state while pending
    expect(screen.getByText('Your subscription has been cancelled.')).toBeInTheDocument();

    await act(async () => {
      rejectCancel(new Error('Unable to cancel subscription'));
    });

    // Rolled back to Active description, trigger re-enabled, error toast shown
    await waitFor(() => {
      expect(screen.getByText('Unable to cancel subscription')).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Cancel your active subscription/i),
    ).toBeInTheDocument();
    expect(triggerBtn).not.toBeDisabled();
  });
});
