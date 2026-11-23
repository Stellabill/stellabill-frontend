import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { subscriptions } from '../api/client';
import type { Subscription } from '../types/subscription';
import SubscriptionDetail from './SubscriptionDetail';

const { useCommandScopeMock } = vi.hoisted(() => ({
  useCommandScopeMock: vi.fn(),
}));

vi.mock('../api/client', () => ({
  subscriptions: {
    get: vi.fn(),
    payments: vi.fn(),
    reactivate: vi.fn(),
  },
}));

vi.mock('../hooks/useCommandScope', () => ({
  useCommandScope: useCommandScopeMock,
}));

vi.mock('../hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}));

vi.mock('../components/RecentPayments', () => ({
  default: ({ subscriptionId }: { subscriptionId?: string }) => (
    <div data-testid="recent-payments">{subscriptionId}</div>
  ),
}));

vi.mock('../components/UsageThisPeriod', () => ({
  default: ({ onViewFullUsage }: { onViewFullUsage?: () => void }) => (
    <button type="button" onClick={onViewFullUsage}>
      View full usage details
    </button>
  ),
}));

vi.mock('../components/Dunning/PaymentFailedBanner', () => ({ default: () => null }));
vi.mock('../components/PlanStatusTimeline', () => ({ default: () => null }));
vi.mock('../components/ScheduleChangePreview', () => ({ default: () => null }));
vi.mock('../components/common/ProrationPreviewModal', () => ({ default: () => null }));

vi.mock('../components/ReactivationModal', () => ({
  default: ({
    isOpen,
    isLoading,
    onConfirm,
  }: {
    isOpen: boolean;
    isLoading?: boolean;
    onConfirm: (date: Date) => void;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label="Reactivate subscription">
        <button type="button" onClick={() => onConfirm(new Date('2026-11-24T00:00:00.000Z'))}>
          {isLoading ? 'Reactivating...' : 'Confirm Reactivation'}
        </button>
      </div>
    ) : null,
}));

vi.mock('../components/DowngradeConfirmModal', () => ({
  default: ({
    isOpen,
    isLoading,
    onConfirm,
  }: {
    isOpen: boolean;
    isLoading?: boolean;
    onConfirm: () => void;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label="Downgrade subscription">
        <button type="button" onClick={onConfirm}>
          {isLoading ? 'Downgrading...' : 'Confirm Downgrade'}
        </button>
      </div>
    ) : null,
}));

const activeSubscription: Subscription = {
  id: 'sub-42',
  planName: 'Developer Pro',
  merchantName: 'Stellabill',
  status: 'Active',
  price: 50,
  currency: 'USDC',
  interval: 'monthly',
  lastPayment: '2026-10-01',
  nextCharge: '2026-12-01',
  subscribedSince: '2025-01-01',
};

const cancelledSubscription: Subscription = {
  ...activeSubscription,
  status: 'Cancelled',
  cancelledAt: '2026-11-10T00:00:00.000Z',
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function renderPage(id = 'sub-42') {
  return render(
    <MemoryRouter initialEntries={['/subscriptions/' + id]}>
      <Routes>
        <Route path="/subscriptions/:id" element={<SubscriptionDetail />} />
        <Route path="/subscriptions/:id/usage" element={<h1>Full usage destination</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

function setSubscriptionResponse(subscription: Subscription = activeSubscription) {
  vi.mocked(subscriptions.get).mockResolvedValue(subscription);
}

describe('SubscriptionDetail', () => {
  beforeEach(() => {
    vi.mocked(subscriptions.get).mockReset();
    vi.mocked(subscriptions.reactivate).mockReset();
    vi.mocked(subscriptions.payments).mockReset().mockResolvedValue({ payments: [] });
    useCommandScopeMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('shows the loading skeleton before rendering a known subscription', async () => {
    const request = deferred<Subscription>();
    vi.mocked(subscriptions.get).mockReturnValue(request.promise);

    renderPage();

    expect(screen.getByRole('status', { name: 'Loading subscription' })).toBeInTheDocument();

    await act(async () => {
      request.resolve(activeSubscription);
      await request.promise;
    });

    expect(await screen.findByRole('heading', { name: 'Subscription sub-42' })).toBeInTheDocument();
    expect(screen.getByTestId('recent-payments')).toHaveTextContent('sub-42');
  });

  it('renders the not-found view when the API returns 404', async () => {
    const error = Object.assign(new Error('Not found'), { status: 404 });
    vi.mocked(subscriptions.get).mockRejectedValue(error);

    renderPage('missing-sub');

    expect(await screen.findByRole('heading', { name: 'Subscription not found' })).toBeInTheDocument();
    expect(screen.getByText(/missing-sub/)).toBeInTheDocument();
  });

  it('shows a load error and refetches the subscription when retried', async () => {
    const user = userEvent.setup();
    vi.mocked(subscriptions.get)
      .mockRejectedValueOnce(new Error('Service unavailable'))
      .mockResolvedValueOnce(activeSubscription);

    renderPage();

    expect(await screen.findByText('Service unavailable')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(await screen.findByRole('heading', { name: 'Subscription sub-42' })).toBeInTheDocument();
    expect(subscriptions.get).toHaveBeenCalledTimes(2);
    expect(subscriptions.get).toHaveBeenNthCalledWith(2, 'sub-42');
  });

  it('registers scoped actions for an active subscription', async () => {
    setSubscriptionResponse();
    renderPage();

    await screen.findByRole('heading', { name: 'Subscription sub-42' });
    await waitFor(() => {
      expect(
        useCommandScopeMock.mock.calls.some(([name]) => name === 'Subscription sub-42'),
      ).toBe(true);
    });

    const latestScope = useCommandScopeMock.mock.calls
      .filter(([name]) => name === 'Subscription sub-42')
      .at(-1);
    const actionIds = latestScope?.[1].map((item) => item.id);

    expect(actionIds).toEqual(
      expect.arrayContaining(['downgrade-sub', 'preview-proration', 'view-usage', 'back-to-subs']),
    );
    expect(screen.getByRole('button', { name: 'Downgrade to a lower plan' })).toBeInTheDocument();
  });

  it('shows reactivation for a cancelled subscription within the window', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-23T12:00:00.000Z'));
    setSubscriptionResponse(cancelledSubscription);

    renderPage();
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByRole('button', { name: 'Reactivate this subscription' })).toBeInTheDocument();
    expect(
      useCommandScopeMock.mock.calls.some(
        ([name, items]) =>
          name === 'Subscription sub-42' && items.some((item) => item.id === 'reactivate-sub'),
      ),
    ).toBe(true);
  });

  it('keeps the reactivation modal open while confirming, then closes it', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-23T12:00:00.000Z'));
    setSubscriptionResponse(cancelledSubscription);
    const request = deferred<{ id: string; status: 'Active' }>();
    vi.mocked(subscriptions.reactivate).mockReturnValue(request.promise);

    renderPage();
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Reactivate this subscription' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Reactivation' }));

    expect(screen.getByRole('button', { name: 'Reactivating...' })).toBeInTheDocument();
    expect(subscriptions.reactivate).toHaveBeenCalledWith('sub-42', {
      startDate: expect.any(String),
    });

    await act(async () => {
      request.resolve({ id: 'sub-42', status: 'Active' });
      await request.promise;
    });

    expect(screen.queryByRole('dialog', { name: 'Reactivate subscription' })).not.toBeInTheDocument();
    // The subscription is active again, so the reactivate CTA disappears.
    expect(
      screen.queryByRole('button', { name: 'Reactivate this subscription' }),
    ).not.toBeInTheDocument();
  });

  it('surfaces a reactivation API error and keeps the modal open', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-23T12:00:00.000Z'));
    setSubscriptionResponse(cancelledSubscription);
    const error = Object.assign(new Error('API error: Internal Server Error'), {
      status: 500,
      technicalDetails: 'billing service unavailable',
    });
    vi.mocked(subscriptions.reactivate).mockRejectedValue(error);

    renderPage();
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Reactivate this subscription' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm Reactivation' }));
    });

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Reactivation failed: API error: Internal Server Error');
    expect(alert).toHaveTextContent('billing service unavailable');
    expect(screen.getByRole('dialog', { name: 'Reactivate subscription' })).toBeInTheDocument();
  });

  it('sets downgrade loading while confirming and clears it when complete', async () => {
    vi.useFakeTimers();
    setSubscriptionResponse();

    renderPage();
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Downgrade to a lower plan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Downgrade' }));

    expect(screen.getByRole('button', { name: 'Downgrading...' })).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });

    expect(screen.queryByRole('dialog', { name: 'Downgrade subscription' })).not.toBeInTheDocument();
  });

  it('navigates to the full usage route from the usage action', async () => {
    const user = userEvent.setup();
    setSubscriptionResponse({
      ...activeSubscription,
      usageBased: true,
      usage: {
        billingPeriod: 'November 2026',
        usage: '3,000 API calls',
        estimatedCharge: '1.50 USDC',
      },
    });

    renderPage();
    await screen.findByRole('heading', { name: 'Subscription sub-42' });
    await user.click(screen.getByRole('button', { name: 'View full usage details' }));

    expect(await screen.findByRole('heading', { name: 'Full usage destination' })).toBeInTheDocument();
  });
});
