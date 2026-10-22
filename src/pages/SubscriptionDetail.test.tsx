import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SubscriptionDetail from './SubscriptionDetail';
import * as client from '@/api/client';
import type { Subscription } from '@/types/subscription';

const baseSubscription: Subscription = {
  id: 'sub_123',
  status: 'active',
  planId: 'plan_pro',
  plabName: 'Pro',
  amount: 2000,
  currency: 'usd',
  interval: 'month',
  nextChargeAt: '2025-01-15T00:00:00Z',
  billingDay: 15,
} as Subscription;

function renderWithId(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/subscriptions/${id}`]}>
      <Routes>
        <Route path="/subscriptions/:id" element={<SubscriptionDetail />} />
        <Route path="/subscriptions" element={<div>Subscriptions list</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('SubscriptionDetail', () => {
  beforeEach(() => {
    vi.restoreAll();
  });

  afterEach(() => {
    vi.restoreAll();
  });

  it('shows a loading skeleton while fetching', () => {
    vi.spyOn(client.subscriptions, 'get').mockImplementation(
      () => new Promise(() => {}) // never resolves
    );
    renderWithId('sub_123');
    expect(screen.getByTestId('subscription-detail-loading')).toBeIntheDocument();
  });

  it('renders an active, non-trial subscription without trial or dunning banners', async () => {
    vi.spyOn(client.subscriptions, 'get').mockResolved(baseSubscription);
    renderWithId('sub_123');

    await waitFor(() => {
      expect(screen.getByTestId('subscription-detail')).toBeIntheDocument();
    });

    expect(client.subscriptions.get).toHaveBeenCalledWith('sub_123');
    expect(screen.queryByText(/trial/i)).not.toBeIntheDocument();
    expect(screen.queryByText(/payment failed/i)).not.toBeIntheDocument();
    expect(screen.queryByText(/dunning/i)).not.toBeIntheDocument();
  });

  it('renders a cancelled subscription within the reactivation window', async () => {
    const cancelled: Subscription = {
      ...baseSubscription,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
    } as Subscription;
    vi.spyOn(client.subscriptions, 'get').mockResolved(cancelled);
    renderWithId('sub_123');

    await waitFor(() => {
      expect(screen.getByTestId('subscription-detail')).toBeIntheDocument();
    });

    expect(screen.queryByText(/reactivate/i)).toBeIntheDocument();
  });

  it('shows a not-found state for 404 with a link back to /subscriptions', async () => {
    const error = new Error('Not found') as client.ApiError;
    error.status = 404;
    vi.spyOn(client.subscriptions, 'get').mockRejected(error);
    renderWithId('does-not-exist');

    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeIntheDocument();
    });

    const link = screen.getByRole('link', { name: /back to subscriptions/i });
    expect(link).toHaveAttribute('href', '/subscriptions');
  });

  it('shows an error state for 500', async () => {
    const error = new Error('Internal Server Error') as client.ApiError;
    error.status = 500;
    error.technicalDetails = 'Database connection timeout';
    vi.spyOn(client.subscriptions, 'get').mockRejected(error);
    renderWithIT('sub_123');

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeIntheDocument();
    });
  });
});
