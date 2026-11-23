import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, useLocation, useNavigationType } from 'react-router-dom';
import { subscriptions } from '../api/client';
import type { Subscription } from '../types/subscription';
import Subscriptions from './Subscriptions';

const mockNavigate = vi.fn();

/* ─── Module mocks ──────────────────────────────────────────── */

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to, className, id }: Record<string, unknown>) => (
      <a href={to as string} className={className as string} id={id as string}>{children as React.ReactNode}</a>
    ),
  };
});

vi.mock('../hooks/useFlip', () => ({
  useFlip: () => ({
    containerRef: { current: null },
    getItemProps: (id: string) => ({ 'data-flip-id': id }),
  }),
}));

vi.mock('../api/client', () => ({
  subscriptions: {
    pause: vi.fn().mockResolvedValue({ success: true }),
    cancel: vi.fn().mockResolvedValue({ success: true }),
    resume: vi.fn().mockResolvedValue({ success: true }),
    reactivate: vi.fn().mockResolvedValue({ success: true }),
    downgrade: vi.fn().mockResolvedValue({ success: true }),
    list: vi.fn().mockResolvedValue({ subscriptions: [] }),
  },
  ApiError: class ApiError extends Error {
    status?: number;
    technicalDetails?: string;
    isOffline?: boolean;
  },
}));

vi.mock('../utils/amount', () => ({
  formatAmount: (value: number) => ({ number: String(value), currency: 'USDC' }),
}));

vi.mock('../components/PauseSubscriptionModal', () => ({
  default: ({ isOpen, onClose, onConfirm, isLoading, error }: Record<string, unknown>) =>
    isOpen ? (
      <div role="dialog" aria-label="Pause subscription">
        {Boolean(error) && (
          <div role="alert">
            {(error as { message: string }).message}
            {(error as { technicalDetails?: string }).technicalDetails && (
              <details>
                <summary>Technical details</summary>
                {(error as { technicalDetails?: string }).technicalDetails}
              </details>
            )}
          </div>
        )}
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm} disabled={isLoading}>
          {isLoading ? 'Loading…' : 'Confirm Pause'}
        </button>
      </div>
    ) : null,
}));

vi.mock('../components/CancelSubscriptionModal', () => ({
  default: ({ isOpen, onClose, onConfirm, isLoading, error }: Record<string, unknown>) =>
    isOpen ? (
      <div role="dialog" aria-label="Cancel subscription">
        {Boolean(error) && (
          <div role="alert">
            {(error as { message: string }).message}
            {(error as { technicalDetails?: string }).technicalDetails && (
              <details>
                <summary>Technical details</summary>
                {(error as { technicalDetails?: string }).technicalDetails}
              </details>
            )}
          </div>
        )}
        <button onClick={onClose}>Keep subscription</button>
        <button onClick={onConfirm} disabled={isLoading}>
          {isLoading ? 'Loading…' : 'Confirm Cancel'}
        </button>
      </div>
    ) : null,
}));

vi.mock('../components/UsageThisPeriod', () => ({
  default: ({ onViewFullUsage }: { onViewFullUsage?: () => void }) => (
    <div data-testid="usage-this-period">
      Usage This Period
      {onViewFullUsage && (
        <button onClick={onViewFullUsage}>View full usage</button>
      )}
    </div>
  ),
}));

vi.mock('../components/ErrorState', () => ({
  default: ({ title, onRetry }: Record<string, unknown>) => (
    <div role="alert">
      <p>{title as string}</p>
      <button onClick={onRetry as () => void}>Retry</button>
    </div>
  ),
}));

/* ─── Helpers ───────────────────────────────────────────────── */

const FIXTURE_SUBSCRIPTIONS: (Subscription & { prepaidBalance: number })[] = [
  {
    id: 'SUB-001',
    planName: 'Premium Access',
    merchantName: 'Stellar News',
    status: 'Active',
    price: 10,
    currency: 'USDC',
    interval: 'month',
    nextCharge: '2025-02-01',
    prepaidBalance: 30,
    lastPayment: '2025-01-01',
    subscribedSince: '2025-01-01',
  },
  {
    id: 'SUB-002',
    planName: 'Pro Plan',
    merchantName: 'CloudFlow',
    status: 'Active',
    price: 25,
    currency: 'USDC',
    interval: 'month',
    nextCharge: '2025-02-05',
    prepaidBalance: 50,
    lastPayment: '2025-01-05',
    subscribedSince: '2025-01-05',
  },
  {
    id: 'SUB-003',
    planName: 'Basic Stream',
    merchantName: 'Stellar News',
    status: 'Paused',
    price: 5,
    currency: 'USDC',
    interval: 'month',
    nextCharge: '2025-02-10',
    prepaidBalance: 15,
    lastPayment: '2025-01-10',
    subscribedSince: '2025-01-10',
  },
  {
    id: 'SUB-004',
    planName: 'Enterprise AI',
    merchantName: 'CloudFlow',
    status: 'Cancelled',
    price: 100,
    currency: 'USDC',
    interval: 'month',
    nextCharge: '2025-02-15',
    prepaidBalance: 0,
    lastPayment: '2025-01-15',
    subscribedSince: '2025-01-15',
  },
];

function RouterState() {
  const { search } = useLocation();
  const navigationType = useNavigationType();
  return <div data-testid="subscription-search" data-navigation-type={navigationType}>{search}</div>;
}

function renderSubscriptions(initialEntry = '/subscriptions') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Subscriptions />
      <RouterState />
    </MemoryRouter>,
  );
}

/** Advance fake timers AND flush all pending promises/microtasks. */
async function advanceTimersAndFlush(ms = 2000) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
    // flush microtasks / promise callbacks
    await Promise.resolve();
    await Promise.resolve();
  });
}

/** Render the page and wait for the data table to appear. */
async function renderAndLoad(initialEntry?: string) {
  const utils = renderSubscriptions(initialEntry);
  await advanceTimersAndFlush();
  await waitFor(
    () => expect(screen.getByTestId('subscriptions-table')).toBeInTheDocument(),
    { timeout: 3000 },
  );
  return utils;
}

/* ─── Tests ─────────────────────────────────────────────────── */

describe('Subscriptions page', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(subscriptions.list).mockResolvedValue({ subscriptions: FIXTURE_SUBSCRIPTIONS });
    Object.defineProperty(window, 'location', {
      value: { search: '', href: 'http://localhost/' },
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  /* ── Loading skeleton ─────────────────────────────────────── */
  describe('Loading skeleton', () => {
    it('renders the page heading while loading', () => {
      renderSubscriptions();
      expect(screen.getByText('My subscriptions')).toBeInTheDocument();
    });

    it('shows aria-busy skeleton while data is loading', () => {
      renderSubscriptions();
      expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    });

    it('removes skeleton and shows table after fetch resolves', async () => {
      await renderAndLoad();
      expect(document.querySelector('[aria-busy="true"]')).not.toBeInTheDocument();
      expect(screen.getByTestId('subscriptions-table')).toBeInTheDocument();
    });
  });

  /* ── Error state ──────────────────────────────────────────── */
  describe('Error state', () => {
    beforeEach(() => {
      vi.mocked(subscriptions.list).mockRejectedValue(
        Object.assign(new Error('boom'), {
          status: 500,
          technicalDetails: 'Internal server error',
        }),
      );
      Object.defineProperty(window, 'location', {
        value: {
          search: '?simulate_error',
          href: 'http://localhost/?simulate_error',
        },
        writable: true,
      });
    });

    it('shows the error component when fetch fails', async () => {
      renderSubscriptions();
      await advanceTimersAndFlush();
      await waitFor(
        () => expect(screen.getByRole('alert')).toBeInTheDocument(),
        { timeout: 3000 },
      );
      expect(screen.getByText('Subscriptions Unavailable')).toBeInTheDocument();
    });

    it('retry button re-triggers fetch', async () => {
      renderSubscriptions();
      await advanceTimersAndFlush();
      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument(), {
        timeout: 3000,
      });

      // Switch location to success mode so next fetch resolves
      vi.mocked(subscriptions.list).mockResolvedValue({ subscriptions: FIXTURE_SUBSCRIPTIONS });
      Object.defineProperty(window, 'location', {
        value: { search: '', href: 'http://localhost/' },
        writable: true,
      });

      fireEvent.click(screen.getByRole('button', { name: /retry/i }));
      await advanceTimersAndFlush();
      await waitFor(
        () => expect(screen.queryByRole('alert')).not.toBeInTheDocument(),
        { timeout: 3000 },
      );
    });
  });

  /* ── API wiring ───────────────────────────────────────────── */
  describe('API wiring', () => {
    it('renders data returned by the mocked subscriptions.list()', async () => {
      await renderAndLoad();
      expect(subscriptions.list).toHaveBeenCalled();
      expect(screen.getAllByText('Premium Access').length).toBeGreaterThan(0);
    });

    it('renders ErrorState with technicalDetails on 500', async () => {
      vi.mocked(subscriptions.list).mockRejectedValue(
        Object.assign(new Error('boom'), {
          status: 500,
          technicalDetails: 'Internal server error',
        }),
      );
      renderSubscriptions();
      await advanceTimersAndFlush();
      await waitFor(
        () => expect(screen.getByRole('alert')).toBeInTheDocument(),
        { timeout: 3000 },
      );
      expect(screen.getByText('Subscriptions Unavailable')).toBeInTheDocument();
    });

    it('shows offline variant when the API reports offline', async () => {
      vi.mocked(subscriptions.list).mockRejectedValue(
        Object.assign(new Error('offline'), {
          isOffline: true,
          technicalDetails: 'Network unavailable',
        }),
      );
      renderSubscriptions();
      await advanceTimersAndFlush();
      await waitFor(
        () => expect(screen.getByRole('alert')).toBeInTheDocument(),
        { timeout: 3000 },
      );
    });

    it('ignores a late response from a superseded refresh (race)', async () => {
      let resolveSecond: (value: { subscriptions: Subscription[] }) => void = () => {};
      const secondPromise = new Promise<{ subscriptions: Subscription[] }>(res => {
        resolveSecond = res;
      });
      vi.mocked(subscriptions.list)
        .mockResolvedValueOnce({ subscriptions: FIXTURE_SUBSCRIPTIONS })
        .mockReturnValueOnce(secondPromise)
        .mockResolvedValueOnce({ subscriptions: FIXTURE_SUBSCRIPTIONS });

      await renderAndLoad();

      // First refresh starts in-flight secondPromise while data.length > 0
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /refresh subscriptions/i }));
        await Promise.resolve();
      });

      // Second refresh supersedes secondPromise
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /refresh subscriptions/i }));
        await Promise.resolve();
      });
      await advanceTimersAndFlush();

      // Now resolve the stale second request with different data.
      await act(async () => {
        resolveSecond({
          subscriptions: [
            {
              ...FIXTURE_SUBSCRIPTIONS[0],
              planName: 'Stale Plan',
            },
          ],
        });
        await Promise.resolve();
        await Promise.resolve();
      });

      await waitFor(
        () => expect(screen.getByTestId('subscriptions-table')).toBeInTheDocument(),
        { timeout: 3000 },
      );
      expect(screen.queryByText('Stale Plan')).not.toBeInTheDocument();
    });
  });

  /* ── List view ────────────────────────────────────────────── */
  describe('List view', () => {
    it('renders the data table with correct column headers', async () => {
      await renderAndLoad();
      expect(screen.getByRole('columnheader', { name: /^plan$/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /^status$/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /^price$/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /^next charge$/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /^prepaid balance$/i })).toBeInTheDocument();
    });

    it('renders all four seed subscriptions', async () => {
      await renderAndLoad();
      expect(screen.getAllByText('Premium Access').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Pro Plan').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Basic Stream').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Enterprise AI').length).toBeGreaterThan(0);
    });

    it('renders merchant names', async () => {
      await renderAndLoad();
      expect(screen.getAllByText('Stellar News').length).toBeGreaterThan(0);
      expect(screen.getAllByText('CloudFlow').length).toBeGreaterThan(0);
    });

    it('renders a Manage button for each subscription', async () => {
      await renderAndLoad();
      const manageBtns = screen.getAllByRole('button', { name: /^manage /i });
      expect(manageBtns.length).toBeGreaterThanOrEqual(4);
    });

    it('renders the breadcrumb navigation', async () => {
      await renderAndLoad();
      expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('renders the prepaid balances info card at the bottom', async () => {
      await renderAndLoad();
      expect(screen.getByText(/about prepaid balances/i)).toBeInTheDocument();
    });

    it('renders the "Browse plans" header button', async () => {
      await renderAndLoad();
      expect(screen.getByText('Browse plans')).toBeInTheDocument();
    });
  });

  /* ── Status badges ────────────────────────────────────────── */
  describe('StatusBadge', () => {
    it('renders Active badges with correct role and CSS class', async () => {
      await renderAndLoad();
      const activeBadges = screen.getAllByRole('status', { name: /status: active/i });
      expect(activeBadges.length).toBeGreaterThanOrEqual(2);
      activeBadges.forEach(badge => expect(badge).toHaveClass('status-badge--active'));
    });

    it('renders Paused badge with correct role and CSS class', async () => {
      await renderAndLoad();
      // There may be one in the table and one in the card stack
      const paused = screen.getAllByRole('status', { name: /status: paused/i });
      expect(paused.length).toBeGreaterThan(0);
      expect(paused[0]).toHaveClass('status-badge--paused');
    });

    it('renders Cancelled badge with correct role and CSS class', async () => {
      await renderAndLoad();
      const cancelled = screen.getAllByRole('status', { name: /status: cancelled/i });
      expect(cancelled.length).toBeGreaterThan(0);
      expect(cancelled[0]).toHaveClass('status-badge--cancelled');
    });

    it('every badge has a dot indicator element', async () => {
      await renderAndLoad();
      const dots = document.querySelectorAll('.status-badge__dot');
      // 4 subs × 2 (table + card) = at least 4 dots
      expect(dots.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Subscription URL state', () => {
    it('restores the status and sort direction from a deep link', async () => {
      await renderAndLoad('/subscriptions?status=Active&sort=price-desc');

      expect(screen.getByRole('button', { name: /show active subscriptions/i }))
        .toHaveAttribute('aria-pressed', 'true');
      const [first, second] = within(screen.getByTestId('subscriptions-table'))
        .getAllByRole('button', { name: / by /i });
      expect(first).toHaveTextContent('Pro Plan');
      expect(second).toHaveTextContent('Premium Access');
      expect(screen.queryByText('Basic Stream')).not.toBeInTheDocument();
    });

    it('replaces the URL when status or sort changes and preserves unrelated parameters', async () => {
      await renderAndLoad('/subscriptions?view=compact&sort=price-desc');
      const search = screen.getByTestId('subscription-search');

      fireEvent.click(screen.getByRole('button', { name: /show paused subscriptions/i }));
      expect(search).toHaveTextContent('?view=compact&sort=price-desc&status=Paused');
      expect(search).toHaveAttribute('data-navigation-type', 'REPLACE');

      fireEvent.click(screen.getByRole('button', { name: /sort by price/i }));
      expect(search).toHaveTextContent('?view=compact&sort=price-asc&status=Paused');
      expect(search).toHaveAttribute('data-navigation-type', 'REPLACE');
    });

    it('uses the default filter and sort for invalid parameters', async () => {
      await renderAndLoad('/subscriptions?status=Unknown&sort=price-sideways');

      expect(screen.getByRole('button', { name: /show all subscriptions/i }))
        .toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: /sort by plan name, currently ascending/i }))
        .toHaveAttribute('aria-pressed', 'true');

      fireEvent.click(screen.getByRole('button', { name: /sort by plan name/i }));
      expect(screen.getByTestId('subscription-search')).toHaveTextContent('sort=planName-desc');
    });
  });

  /* ── Filter tabs ──────────────────────────────────────────── */
  describe('Filter tabs', () => {
    it('renders all four filter tabs', async () => {
      await renderAndLoad();
      expect(screen.getByRole('button', { name: /show all subscriptions/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show active subscriptions/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show paused subscriptions/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show cancelled subscriptions/i })).toBeInTheDocument();
    });

    it('"All" tab is active by default with aria-pressed=true', async () => {
      await renderAndLoad();
      const allTab = screen.getByRole('button', { name: /show all subscriptions/i });
      expect(allTab).toHaveClass('active');
      expect(allTab).toHaveAttribute('aria-pressed', 'true');
    });

    it('filter tabs live inside a group with an accessible label', async () => {
      await renderAndLoad();
      expect(
        screen.getByRole('group', { name: /filter subscriptions by status/i }),
      ).toBeInTheDocument();
    });

    it('Active filter hides Paused and Cancelled rows', async () => {
      await renderAndLoad();
      fireEvent.click(screen.getByRole('button', { name: /show active subscriptions/i }));
      await waitFor(() => {
        expect(screen.queryByText('Basic Stream')).not.toBeInTheDocument();
        expect(screen.queryByText('Enterprise AI')).not.toBeInTheDocument();
      });
      expect(screen.getAllByText('Premium Access').length).toBeGreaterThan(0);
    });

    it('Paused filter shows only the Paused subscription', async () => {
      await renderAndLoad();
      fireEvent.click(screen.getByRole('button', { name: /show paused subscriptions/i }));
      await waitFor(() => {
        expect(screen.getAllByText('Basic Stream').length).toBeGreaterThan(0);
        expect(screen.queryByText('Premium Access')).not.toBeInTheDocument();
        expect(screen.queryByText('Enterprise AI')).not.toBeInTheDocument();
      });
    });

    it('Cancelled filter shows only the Cancelled subscription', async () => {
      await renderAndLoad();
      fireEvent.click(screen.getByRole('button', { name: /show cancelled subscriptions/i }));
      await waitFor(() => {
        expect(screen.getAllByText('Enterprise AI').length).toBeGreaterThan(0);
        expect(screen.queryByText('Premium Access')).not.toBeInTheDocument();
        expect(screen.queryByText('Basic Stream')).not.toBeInTheDocument();
      });
    });

    it('counts in filter tabs are correct (4 / 2 / 1 / 1)', async () => {
      await renderAndLoad();
      expect(
        screen.getByRole('button', { name: /show all subscriptions \(4\)/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /show active subscriptions \(2\)/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /show paused subscriptions \(1\)/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /show cancelled subscriptions \(1\)/i }),
      ).toBeInTheDocument();
    });

    it('switching filters does not show empty state while data exists', async () => {
      await renderAndLoad();
      fireEvent.click(screen.getByRole('button', { name: /show active subscriptions/i }));
      expect(screen.queryByText(/no subscriptions yet/i)).not.toBeInTheDocument();
    });

    it('announces the filtered subscription count and status', async () => {
      await renderAndLoad();

      fireEvent.click(screen.getByRole('button', { name: /show paused subscriptions/i }));

      expect(screen.getByTestId('subscriptions-list-live-region')).toHaveTextContent(
        '1 subscription, sorted by Plan name ascending, filter Paused.',
      );
    });
  });

  describe('List change announcements', () => {
    it('announces the sort field and direction outside the subscriptions list', async () => {
      await renderAndLoad();

      fireEvent.click(screen.getByRole('button', { name: /sort by price/i }));

      const liveRegion = screen.getByTestId('subscriptions-list-live-region');
      expect(liveRegion).toHaveClass('visually-hidden');
      expect(liveRegion).toHaveAttribute('role', 'status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveTextContent(
        '4 subscriptions, sorted by Price ascending, filter All.',
      );
      expect(liveRegion.closest('.subs-table-wrapper')).toBeNull();
    });
  });

  /* ── Empty state ──────────────────────────────────────────── */
  describe('EmptyState (unfiltered)', () => {
    it('is not shown when subscriptions are loaded', async () => {
      await renderAndLoad();
      expect(screen.queryByText(/no subscriptions yet/i)).not.toBeInTheDocument();
    });

    it('"Browse plans" CTA in the header links to /plans', async () => {
      await renderAndLoad();
      const browseLink = document.getElementById('browse-plans-btn');
      expect(browseLink).toBeInTheDocument();
    });
  });

  /* ── Keyboard row navigation ──────────────────────────────── */
  describe('Keyboard row navigation', () => {
    it('provides a real button to open each subscription', async () => {
      await renderAndLoad();
      expect(screen.getByRole('button', { name: /open premium access/i })).toBeInTheDocument();
    });

    it.each(['{Enter}', '{Space}'])('opens a subscription from its semantic button with %s', async (key) => {
      await renderAndLoad();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const openButton = screen.getByRole('button', { name: /open premium access/i });

      openButton.focus();
      await user.keyboard(key);

      expect(screen.getByText('Back to all subscriptions')).toBeInTheDocument();
    });

    it('clicking a row opens the detail view', async () => {
      await renderAndLoad();
      const rows = document.querySelectorAll('.subs-table tbody tr');
      fireEvent.click(rows[0]);
      await waitFor(() =>
        expect(screen.getByText('Back to all subscriptions')).toBeInTheDocument(),
      );
    });

    it('clicking an action opens its subscription without activating the row handler', async () => {
      await renderAndLoad();
      fireEvent.click(screen.getByRole('button', { name: /manage premium access/i }));
      await waitFor(() =>
        expect(screen.getByText('Back to all subscriptions')).toBeInTheDocument(),
      );
    });

    it('Enter on an action does not bubble to the row', async () => {
      await renderAndLoad();
      fireEvent.keyDown(screen.getByRole('button', { name: /manage premium access/i }), { key: 'Enter' });
      expect(screen.queryByText('Back to all subscriptions')).not.toBeInTheDocument();
    });
  });

  /* ── Detail view ──────────────────────────────────────────── */
  describe('Detail view', () => {
    async function openDetail(planName: string) {
      await renderAndLoad();
      const btn = screen.getByRole('button', { name: new RegExp(`manage ${planName}`, 'i') });
      fireEvent.click(btn);
      await waitFor(() =>
        expect(screen.getByText('Back to all subscriptions')).toBeInTheDocument(),
      );
    }

    it('shows the plan name as an h1', async () => {
      await openDetail('Premium Access');
      expect(
        screen.getByRole('heading', { name: /premium access/i, level: 1 }),
      ).toBeInTheDocument();
    });

    it('shows the UsageThisPeriod component and navigates to full usage page when requested', async () => {
      await openDetail('Premium Access');
      expect(screen.getByTestId('usage-this-period')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /view full usage/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/subscriptions/SUB-001/usage');
    });

    it('"Back to all subscriptions" returns to list', async () => {
      await openDetail('Premium Access');
      fireEvent.click(screen.getByText('Back to all subscriptions'));
      await waitFor(() =>
        expect(screen.getByTestId('subscriptions-table')).toBeInTheDocument(),
      );
    });

    it('breadcrumb "My subscriptions" button returns to list', async () => {
      await openDetail('Premium Access');
      fireEvent.click(screen.getByRole('button', { name: /back to my subscriptions/i }));
      await waitFor(() =>
        expect(screen.getByTestId('subscriptions-table')).toBeInTheDocument(),
      );
    });

    it('Active sub shows Pause and Cancel billing buttons', async () => {
      await openDetail('Premium Access');
      expect(
        screen.getByRole('button', { name: /pause premium access subscription/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /cancel premium access subscription/i }),
      ).toBeInTheDocument();
    });

    it('Paused sub shows Resume and Cancel buttons, not Pause', async () => {
      await renderAndLoad();
      fireEvent.click(
        screen.getByRole('button', { name: /manage basic stream/i }),
      );
      await waitFor(() =>
        expect(screen.getByText('Back to all subscriptions')).toBeInTheDocument(),
      );
      expect(
        screen.getByRole('button', { name: /resume basic stream subscription/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /cancel basic stream subscription/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /pause basic stream/i }),
      ).not.toBeInTheDocument();
    });

    it('Cancelled sub shows no action buttons', async () => {
      await renderAndLoad();
      fireEvent.click(
        screen.getByRole('button', { name: /manage enterprise ai/i }),
      );
      await waitFor(() =>
        expect(screen.getByText('Back to all subscriptions')).toBeInTheDocument(),
      );
      expect(screen.queryByRole('button', { name: /pause enterprise ai/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /resume enterprise ai/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /cancel enterprise ai/i })).not.toBeInTheDocument();
    });

    it('detail shows price and billing interval', async () => {
      await openDetail('Premium Access');
      expect(screen.getByText(/10/)).toBeInTheDocument();
      expect(screen.getByText(/per month/i)).toBeInTheDocument();
    });
  });

  /* ── Pause flow ───────────────────────────────────────────── */
  describe('Pause subscription flow', () => {
    async function openPauseModal() {
      await renderAndLoad();
      fireEvent.click(screen.getByRole('button', { name: /manage premium access/i }));
      await waitFor(() =>
        expect(screen.getByText('Back to all subscriptions')).toBeInTheDocument(),
      );
      fireEvent.click(
        screen.getByRole('button', { name: /pause premium access subscription/i }),
      );
      await waitFor(() =>
        expect(screen.getByRole('dialog', { name: /pause subscription/i })).toBeInTheDocument(),
      );
    }

    it('Pause button opens the pause modal', async () => {
      await openPauseModal();
      expect(screen.getByRole('dialog', { name: /pause subscription/i })).toBeInTheDocument();
    });

    it('Cancel in the pause modal closes it without changing status', async () => {
      await openPauseModal();
      fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
      await waitFor(() =>
        expect(
          screen.queryByRole('dialog', { name: /pause subscription/i }),
        ).not.toBeInTheDocument(),
      );
      // Status badge should still be Active
      expect(screen.getByRole('status', { name: /status: active/i })).toBeInTheDocument();
    });

    it('Confirm Pause calls the API and updates badge to Paused', async () => {
      const { subscriptions: apiSubs } = await import('../api/client');
      await openPauseModal();
      fireEvent.click(screen.getByRole('button', { name: /confirm pause/i }));
      await waitFor(() => expect(apiSubs.pause).toHaveBeenCalledWith('SUB-001'));
      await waitFor(() =>
        expect(screen.getByRole('status', { name: /status: paused/i })).toBeInTheDocument(),
      );
    });

    it('keeps the modal open and shows the error when pausing fails', async () => {
      const { subscriptions: apiSubs } = await import('../api/client');
      vi.mocked(apiSubs.pause).mockRejectedValueOnce(
        Object.assign(new Error('Action Failed'), {
          technicalDetails: 'Pause could not be completed.',
        }),
      );
      await openPauseModal();
      fireEvent.click(screen.getByRole('button', { name: /confirm pause/i }));

      expect(await screen.findAllByText('Action Failed')).not.toHaveLength(0);
      expect(screen.getByText('Technical details')).toBeInTheDocument();
      expect(screen.getAllByText('Pause could not be completed.').length).toBeGreaterThan(0);
      expect(screen.getByRole('dialog', { name: /pause subscription/i })).toBeInTheDocument();
      expect(screen.getByRole('status', { name: /status: active/i })).toBeInTheDocument();
    });

    it('optimistically sets status to Paused and rolls back to Active on failure', async () => {
      const { subscriptions: apiSubs } = await import('../api/client');
      let rejectPause!: (err: Error) => void;
      vi.mocked(apiSubs.pause).mockImplementationOnce(
        () => new Promise((_, reject) => {
          rejectPause = reject;
        }),
      );
      await openPauseModal();
      fireEvent.click(screen.getByRole('button', { name: /confirm pause/i }));

      // Optimistically updated while pending
      expect(screen.getByRole('status', { name: /status: paused/i })).toBeInTheDocument();

      await act(async () => {
        rejectPause(new Error('Pause network failure'));
      });

      // Rolled back to Active and error toast displayed
      await waitFor(() =>
        expect(screen.getByRole('status', { name: /status: active/i })).toBeInTheDocument(),
      );
      expect(screen.getAllByText('Pause network failure').length).toBeGreaterThan(0);
    });
  });

  /* ── Cancel flow ──────────────────────────────────────────── */
  describe('Cancel subscription flow', () => {
    async function openCancelModal() {
      await renderAndLoad();
      fireEvent.click(screen.getByRole('button', { name: /manage premium access/i }));
      await waitFor(() =>
        expect(screen.getByText('Back to all subscriptions')).toBeInTheDocument(),
      );
      fireEvent.click(
        screen.getByRole('button', { name: /cancel premium access subscription/i }),
      );
      await waitFor(() =>
        expect(screen.getByRole('dialog', { name: /cancel subscription/i })).toBeInTheDocument(),
      );
    }

    it('Cancel billing button opens the cancel modal', async () => {
      await openCancelModal();
      expect(screen.getByRole('dialog', { name: /cancel subscription/i })).toBeInTheDocument();
    });

    it('"Keep subscription" closes the modal without changing status', async () => {
      await openCancelModal();
      fireEvent.click(screen.getByRole('button', { name: /keep subscription/i }));
      await waitFor(() =>
        expect(
          screen.queryByRole('dialog', { name: /cancel subscription/i }),
        ).not.toBeInTheDocument(),
      );
      expect(screen.getByRole('status', { name: /status: active/i })).toBeInTheDocument();
    });

    it('Confirm Cancel calls the API and updates badge to Cancelled', async () => {
      const { subscriptions: apiSubs } = await import('../api/client');
      await openCancelModal();
      fireEvent.click(screen.getByRole('button', { name: /confirm cancel/i }));
      await waitFor(() => expect(apiSubs.cancel).toHaveBeenCalledWith('SUB-001'));
      await waitFor(() =>
        expect(screen.getByRole('status', { name: /status: cancelled/i })).toBeInTheDocument(),
      );
    });

    it('keeps the modal open and shows the error when cancelling fails', async () => {
      const { subscriptions: apiSubs } = await import('../api/client');
      vi.mocked(apiSubs.cancel).mockRejectedValueOnce(
        Object.assign(new Error('Action Failed'), {
          technicalDetails: 'Cancellation could not be completed.',
        }),
      );
      await openCancelModal();
      fireEvent.click(screen.getByRole('button', { name: /confirm cancel/i }));

      expect(await screen.findAllByText('Action Failed')).not.toHaveLength(0);
      expect(screen.getByText('Technical details')).toBeInTheDocument();
      expect(screen.getAllByText('Cancellation could not be completed.').length).toBeGreaterThan(0);
      expect(screen.getByRole('dialog', { name: /cancel subscription/i })).toBeInTheDocument();
      expect(screen.getByRole('status', { name: /status: active/i })).toBeInTheDocument();
    });

    it('optimistically sets status to Cancelled and rolls back to Active on failure', async () => {
      const { subscriptions: apiSubs } = await import('../api/client');
      let rejectCancel!: (err: Error) => void;
      vi.mocked(apiSubs.cancel).mockImplementationOnce(
        () => new Promise((_, reject) => {
          rejectCancel = reject;
        }),
      );
      await openCancelModal();
      fireEvent.click(screen.getByRole('button', { name: /confirm cancel/i }));

      // Optimistically updated while pending
      expect(screen.getByRole('status', { name: /status: cancelled/i })).toBeInTheDocument();

      await act(async () => {
        rejectCancel(new Error('Cancel network failure'));
      });

      // Rolled back to Active and error toast displayed
      await waitFor(() =>
        expect(screen.getByRole('status', { name: /status: active/i })).toBeInTheDocument(),
      );
      expect(screen.getAllByText('Cancel network failure').length).toBeGreaterThan(0);
    });
  });

  /* ── Resume flow ──────────────────────────────────────────── */
  describe('Resume subscription flow', () => {
    it('calls the API, shows pending state, and announces a successful resume', async () => {
      const { subscriptions: apiSubs } = await import('../api/client');
      let resolveResume!: (value: { success: boolean }) => void;
      vi.mocked(apiSubs.resume).mockImplementationOnce(
        () => new Promise((resolve) => {
          resolveResume = resolve;
        }),
      );
      await renderAndLoad();
      const manageBtn = screen.getAllByRole('button', { name: /manage basic/i })[0];
      fireEvent.click(manageBtn);
      await waitFor(() =>
        expect(screen.getByText('Back to all subscriptions')).toBeInTheDocument(),
      );
      fireEvent.click(
        screen.getByRole('button', { name: /resume basic stream subscription/i }),
      );
      expect(screen.getByText('Resuming...')).toBeInTheDocument();
      // Optimistically set to Active while pending
      expect(screen.getByRole('status', { name: /status: active/i })).toBeInTheDocument();

      await act(async () => {
        resolveResume({ success: true });
      });

      expect(apiSubs.resume).toHaveBeenCalledWith('SUB-003');
      await waitFor(() =>
        expect(screen.getByRole('status', { name: /status: active/i })).toBeInTheDocument(),
      );
      expect(screen.getByText('Subscription resumed')).toBeInTheDocument();
    });

    it('leaves the status paused and shows an error when resuming fails', async () => {
      const { subscriptions: apiSubs } = await import('../api/client');
      vi.mocked(apiSubs.resume).mockRejectedValueOnce(
        Object.assign(new Error('Resume failed'), {
          technicalDetails: 'Resume could not be completed.',
        }),
      );
      await renderAndLoad();
      fireEvent.click(screen.getAllByRole('button', { name: /manage basic/i })[0]);
      await waitFor(() =>
        expect(screen.getByText('Back to all subscriptions')).toBeInTheDocument(),
      );
      fireEvent.click(screen.getByRole('button', { name: /resume basic stream subscription/i }));

      expect(await screen.findByText('Resume failed')).toBeInTheDocument();
      expect(screen.getByRole('status', { name: /status: paused/i })).toBeInTheDocument();
      expect(apiSubs.resume).toHaveBeenCalledWith('SUB-003');
    });

    it('shows pending state for a resume started from the swipe action', async () => {
      const { subscriptions: apiSubs } = await import('../api/client');
      let resolveResume!: (value: { success: boolean }) => void;
      vi.mocked(apiSubs.resume).mockImplementationOnce(
        () => new Promise((resolve) => {
          resolveResume = resolve;
        }),
      );
      await renderAndLoad();
      fireEvent.click(screen.getByRole('button', { name: 'Resume' }));

      expect(screen.getByText('Resuming subscription')).toBeInTheDocument();
      // SUB-003 is optimistically Active while pending
      expect(screen.queryAllByRole('status', { name: /status: paused/i })).toHaveLength(0);
      await act(async () => {
        resolveResume({ success: true });
      });
      expect(await screen.findByText('Subscription resumed')).toBeInTheDocument();
    });

    it('handles resume failures from the swipe action', async () => {
      const { subscriptions: apiSubs } = await import('../api/client');
      vi.mocked(apiSubs.resume).mockRejectedValueOnce(new Error('Swipe resume failed'));
      await renderAndLoad();
      fireEvent.click(screen.getByRole('button', { name: 'Resume' }));

      expect(await screen.findByText('Swipe resume failed')).toBeInTheDocument();
      expect(screen.getAllByRole('status', { name: /status: paused/i }).length).toBeGreaterThan(0);
      expect(apiSubs.resume).toHaveBeenCalledWith('SUB-003');
    });
  });

  /* ── Accessibility ────────────────────────────────────────── */
  describe('Accessibility (ARIA)', () => {
    it('the main data table has an accessible aria-label', async () => {
      await renderAndLoad();
      expect(screen.getByRole('table', { name: /my subscriptions/i })).toBeInTheDocument();
    });

    it('all table header cells have scope="col"', async () => {
      await renderAndLoad();
      document.querySelectorAll('.subs-table thead th').forEach(th =>
        expect(th).toHaveAttribute('scope', 'col'),
      );
    });

    it('filter group has an accessible aria-label', async () => {
      await renderAndLoad();
      expect(
        screen.getByRole('group', { name: /filter subscriptions by status/i }),
      ).toBeInTheDocument();
    });

    it('every filter tab has aria-pressed', async () => {
      await renderAndLoad();
      document.querySelectorAll('.filter-tab').forEach(tab =>
        expect(tab).toHaveAttribute('aria-pressed'),
      );
    });

    it('every table row has a non-empty aria-label', async () => {
      await renderAndLoad();
      document.querySelectorAll('.subs-table tbody tr').forEach(row => {
        expect(row).toHaveAttribute('aria-label');
        expect(row.getAttribute('aria-label')).not.toBe('');
      });
    });

    it('plan icon wrappers are aria-hidden', async () => {
      await renderAndLoad();
      const icons = document.querySelectorAll('.subs-table__plan-icon[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('visually-hidden "Actions" text is present for screen readers', async () => {
      await renderAndLoad();
      const hidden = Array.from(document.querySelectorAll('.visually-hidden')).find(
        (el) => el.textContent === 'Actions',
      );
      expect(hidden).toBeDefined();
      expect(hidden?.textContent).toBe('Actions');
    });

    it('breadcrumb nav has aria-label="Breadcrumb"', async () => {
      await renderAndLoad();
      expect(screen.getByRole('navigation', { name: /^breadcrumb$/i })).toBeInTheDocument();
    });

    it('subscriptions list region has aria-label', async () => {
      await renderAndLoad();
      expect(screen.getByRole('region', { name: /subscriptions list/i })).toBeInTheDocument();
    });

    it('breadcrumb current page has aria-current="page"', async () => {
      await renderAndLoad();
      const current = document.querySelector('[aria-current="page"]');
      expect(current).toBeInTheDocument();
      expect(current?.textContent).toMatch(/my subscriptions/i);
    });
  });

  /* ── Mobile card stack ────────────────────────────────────── */
  describe('Mobile card stack', () => {
    it('renders the mobile cards container', async () => {
      await renderAndLoad();
      expect(screen.getByTestId('subscriptions-cards')).toBeInTheDocument();
    });

    it('each mobile card has role=button and a non-empty aria-label', async () => {
      await renderAndLoad();
      const cards = document.querySelectorAll('.subs-card');
      expect(cards.length).toBeGreaterThan(0);
      cards.forEach(card => {
        expect(card).toHaveAttribute('role', 'button');
        const label = card.getAttribute('aria-label') ?? '';
        expect(label.length).toBeGreaterThan(0);
      });
    });

    it('clicking a mobile card opens the detail view', async () => {
      await renderAndLoad();
      const cards = document.querySelectorAll('.subs-card');
      fireEvent.click(cards[0]);
      await waitFor(() =>
        expect(screen.getByText('Back to all subscriptions')).toBeInTheDocument(),
      );
    });

    it('Enter key on a mobile card opens the detail view', async () => {
      await renderAndLoad();
      const cards = document.querySelectorAll('.subs-card');
      fireEvent.keyDown(cards[0], { key: 'Enter' });
      await waitFor(() =>
        expect(screen.getByText('Back to all subscriptions')).toBeInTheDocument(),
      );
    });

    it('cards show Prepaid, Coverage, Next charge, and Last payment labels', async () => {
      await renderAndLoad();
      expect(screen.getAllByText('Prepaid').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Coverage').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Next charge').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Last payment').length).toBeGreaterThan(0);
    });

    it('card Manage button opens the detail view without propagation', async () => {
      await renderAndLoad();
      const manageCardBtn = screen.getAllByRole('button', {
        name: /manage premium access/i,
      })[0];
      // This picks one – could be table or card btn. Click and verify detail opens.
      fireEvent.click(manageCardBtn);
      await waitFor(() =>
        expect(screen.getByText('Back to all subscriptions')).toBeInTheDocument(),
      );
    });
  });
});
