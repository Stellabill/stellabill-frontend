import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SubscriptionDetail from './SubscriptionDetail';
import { subscriptions } from '../api/client';
import type { Subscription } from '../types/subscription';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../api/client', () => ({
  subscriptions: {
    get: vi.fn(),
    reactivate: vi.fn(),
    downgrade: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
  },
}));

vi.mock('../components/RecentPayments', () => ({
  default: () => <div data-testid="recent-payments" />,
}));

vi.mock('../components/PlanStatusTimeline', () => ({
  default: () => <div data-testid="plan-status-timeline" />,
}));

const ACTIVE_SUB: Subscription = {
  id: 'SUB-101',
  planName: 'Pro Monthly',
  merchantName: 'CloudFlow',
  status: 'Active',
  price: 50,
  amount: 50,
  currency: 'USDC',
  interval: 'monthly',
  lastPayment: 'Jul 1, 2026',
  nextCharge: 'Aug 1, 2026',
  subscribedSince: 'Jan 1, 2026',
  billingDay: 1,
  usageBased: true,
  usage: {
    billingPeriod: 'Jul 1 - Jul 31',
    usage: '12,000 API calls',
    estimatedCharge: '50 USDC',
  },
};

const CANCELLED_SUB: Subscription = {
  ...ACTIVE_SUB,
  id: 'SUB-102',
  status: 'Cancelled',
  cancelledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
};

function renderDetail(id = 'SUB-101') {
  return render(
    <MemoryRouter initialEntries={['/subscriptions/' + id]}>
      <Routes>
        <Route path="/subscriptions/:id" element={<SubscriptionDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SubscriptionDetail actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reactivates a cancelled subscription optimistically and shows a success toast', async () => {
    vi.mocked(subscriptions.get).mockResolvedValueOnce(CANCELLED_SUB);
    let resolveReactivate!: (val: { success: boolean }) => void;
    vi.mocked(subscriptions.reactivate).mockImplementationOnce(
      () => new Promise((res) => { resolveReactivate = res; }),
    );

    renderDetail('SUB-102');

    const reactivateBtn = await screen.findByRole('button', {
      name: /reactivate this subscription/i,
    });
    fireEvent.click(reactivateBtn);

    const confirmBtn = screen.getByRole('button', { name: /confirm reactivation/i });
    fireEvent.click(confirmBtn);

    // While pending: confirm button is disabled & optimistic status hides Reactivate CTA and shows Downgrade CTA
    expect(screen.getByRole('button', { name: /reactivating subscription/i })).toBeDisabled();
    expect(
      screen.getByRole('button', {
        name: /downgrade to a lower plan/i,
        hidden: true,
      }),
    ).toBeDisabled();

    await act(async () => {
      resolveReactivate({ success: true });
    });

    expect(subscriptions.reactivate).toHaveBeenCalledWith(
      'SUB-102',
      expect.objectContaining({ startDate: expect.any(String) }),
    );
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Subscription reactivated')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /downgrade to a lower plan/i,
        hidden: true,
      }),
    ).not.toBeDisabled();
  });

  it('rolls back reactivation status and shows an error toast on failure', async () => {
    vi.mocked(subscriptions.get).mockResolvedValueOnce(CANCELLED_SUB);
    let rejectReactivate!: (err: Error) => void;
    vi.mocked(subscriptions.reactivate).mockImplementationOnce(
      () => new Promise((_, rej) => { rejectReactivate = rej; }),
    );

    renderDetail('SUB-102');

    const reactivateBtn = await screen.findByRole('button', {
      name: /reactivate this subscription/i,
    });
    fireEvent.click(reactivateBtn);

    fireEvent.click(screen.getByRole('button', { name: /confirm reactivation/i }));

    // Optimistic state: active CTAs rendered
    expect(
      screen.getByRole('button', {
        name: /downgrade to a lower plan/i,
        hidden: true,
      }),
    ).toBeInTheDocument();

    await act(async () => {
      rejectReactivate(new Error('Reactivation failed on server'));
    });

    // Rolled back to cancelled: Reactivate CTA is back, Downgrade CTA is gone, error toast shown
    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: /reactivate this subscription/i,
          hidden: true,
        }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole('button', {
        name: /downgrade to a lower plan/i,
        hidden: true,
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Reactivation failed on server')).toBeInTheDocument();
  });

  it('downgrades an active subscription optimistically and shows a success toast', async () => {
    vi.mocked(subscriptions.get).mockResolvedValueOnce(ACTIVE_SUB);
    let resolveDowngrade!: (val: { success: boolean }) => void;
    vi.mocked(subscriptions.downgrade).mockImplementationOnce(
      () => new Promise((res) => { resolveDowngrade = res; }),
    );

    renderDetail('SUB-101');

    const downgradeBtn = await screen.findByRole('button', {
      name: /downgrade to a lower plan/i,
    });
    fireEvent.click(downgradeBtn);

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /^confirm downgrade$/i }));

    expect(screen.getByRole('button', { name: /processing downgrade/i })).toBeDisabled();
    expect(
      screen.getByRole('button', {
        name: /downgrade to a lower plan/i,
        hidden: true,
      }),
    ).toBeDisabled();

    await act(async () => {
      resolveDowngrade({ success: true });
    });

    expect(subscriptions.downgrade).toHaveBeenCalledWith('SUB-101', { planName: 'Basic' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Plan downgraded')).toBeInTheDocument();
  });

  it('rolls back downgrade plan changes and shows an error toast on failure', async () => {
    vi.mocked(subscriptions.get).mockResolvedValueOnce(ACTIVE_SUB);
    let rejectDowngrade!: (err: Error) => void;
    vi.mocked(subscriptions.downgrade).mockImplementationOnce(
      () => new Promise((_, rej) => { rejectDowngrade = rej; }),
    );

    renderDetail('SUB-101');

    const downgradeBtn = await screen.findByRole('button', {
      name: /downgrade to a lower plan/i,
    });
    fireEvent.click(downgradeBtn);

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /^confirm downgrade$/i }));

    await act(async () => {
      rejectDowngrade(new Error('Downgrade rejected by billing service'));
    });

    await waitFor(() => {
      expect(screen.getByText('Downgrade rejected by billing service')).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', {
        name: /downgrade to a lower plan/i,
        hidden: true,
      }),
    ).not.toBeDisabled();
  });

  it('navigates to /subscriptions/:id/usage when View full usage is clicked', async () => {
    vi.mocked(subscriptions.get).mockResolvedValueOnce(ACTIVE_SUB);
    renderDetail('SUB-101');

    const viewUsageBtn = await screen.findByRole('button', {
      name: /view full usage details/i,
    });
    fireEvent.click(viewUsageBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/subscriptions/SUB-101/usage');
  });
});
