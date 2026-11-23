import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SubscriptionDetail from './SubscriptionDetail';
import { subscriptions } from '../api/client';

vi.mock('../api/client', () => ({
  subscriptions: {
    get: vi.fn(),
  },
}));

vi.mock('../hooks/useCommandScope', () => ({
  useCommandScope: vi.fn(),
}));

vi.mock('../components/RecentPayments', () => ({
  default: () => <div data-testid="recent-payments" />,
}));

vi.mock('../components/PlanStatusTimeline', () => ({
  default: () => <div data-testid="plan-status-timeline" />,
}));

const mockedGet = vi.mocked(subscriptions.get);

function renderPage(id = 'sub-1') {
  return render(
    <MemoryRouter initialEntries={[`/subscriptions/${id}`]}>
      <Routes>
        <Route path="/subscriptions/:id" element={<SubscriptionDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SubscriptionDetail', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('renders loading skeleton without inline style attributes', () => {
    mockedGet.mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();

    const status = screen.getByRole('status', { name: 'Loading subscription' });
    expect(status).toBeInTheDocument();
    expect(container.firstElementChild?.getAttribute('style')).toBeNull();
    expect(status.getAttribute('style')).toBeNull();
  });

  it('renders not-found state without inline style attributes', async () => {
    mockedGet.mockRejectedValueOnce({ status: 404, message: 'Not found' });
    const { container } = renderPage('missing-sub');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Subscription not found');
    expect(container.firstElementChild?.getAttribute('style')).toBeNull();
    expect(alert.getAttribute('style')).toBeNull();
  });

  it('renders loaded subscription detail and toggles billing interval without inline styles', async () => {
    const user = userEvent.setup();
    mockedGet.mockResolvedValueOnce({
      id: 'sub-1',
      planName: 'Pro',
      merchantName: 'Acme',
      status: 'Active',
      price: 50,
      currency: 'USDC',
      interval: 'monthly',
      lastPayment: '2026-07-01',
      nextCharge: '2026-08-01',
      subscribedSince: '2026-01-01',
    });

    const { container } = renderPage('sub-1');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Subscription sub-1' })).toBeInTheDocument();
    });

    expect(container.firstElementChild?.getAttribute('style')).toBeNull();
    const downgradeBtn = screen.getByRole('button', { name: 'Downgrade to a lower plan' });
    expect(downgradeBtn.getAttribute('style')).toBeNull();

    const yearlyBtn = screen.getByRole('button', { name: 'Yearly' });
    expect(yearlyBtn).toHaveAttribute('aria-pressed', 'false');
    await user.click(yearlyBtn);
    expect(yearlyBtn).toHaveAttribute('aria-pressed', 'true');
    expect(yearlyBtn.getAttribute('style')).toBeNull();
  });
});
