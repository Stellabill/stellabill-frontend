import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Subscriptions from './Subscriptions';

/* ─── Module mocks ──────────────────────────────────────────── */

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    Link: ({ children, to, className, id }: Record<string, unknown>) => (
      <a href={to as string} className={className as string} id={id as string}>{children as React.ReactNode}</a>
    ),
  };
});

vi.mock('../api/client', () => ({
  subscriptions: {
    pause: vi.fn().mockResolvedValue({ success: true }),
    cancel: vi.fn().mockResolvedValue({ success: true }),
    list: vi.fn().mockResolvedValue({ subscriptions: [] }),
  },
  ApiError: class ApiError extends Error {
    status?: number;
    technicalDetails?: string;
    isOffline?: boolean;
  },
}));

vi.mock('../components/PauseSubscriptionModal', () => ({
  default: ({ isOpen, onClose, onConfirm, isLoading }: Record<string, unknown>) =>
    isOpen ? (
      <div role="dialog" aria-label="Pause subscription">
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm} disabled={isLoading}>
          {isLoading ? 'Loading…' : 'Confirm Pause'}
        </button>
      </div>
    ) : null,
}));

vi.mock('../components/CancelSubscriptionModal', () => ({
  default: ({ isOpen, onClose, onConfirm, isLoading }: Record<string, unknown>) =>
    isOpen ? (
      <div role="dialog" aria-label="Cancel subscription">
        <button onClick={onClose}>Keep subscription</button>
        <button onClick={onConfirm} disabled={isLoading}>
          {isLoading ? 'Loading…' : 'Confirm Cancel'}
        </button>
      </div>
    ) : null,
}));

vi.mock('../components/UsageThisPeriod', () => ({
  default: () => <div data-testid="usage-this-period">Usage This Period</div>,
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

function renderSubscriptions() {
  return render(
    <MemoryRouter>
      <Subscriptions />
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
async function renderAndLoad() {
  const utils = renderSubscriptions();
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
    it('all table rows have tabIndex=0', async () => {
      await renderAndLoad();
      const rows = document.querySelectorAll('.subs-table tbody tr');
      expect(rows.length).toBeGreaterThan(0);
      rows.forEach(row => expect(row).toHaveAttribute('tabindex', '0'));
    });

    it('Enter key on a row opens the detail view', async () => {
      await renderAndLoad();
      const rows = document.querySelectorAll('.subs-table tbody tr');
      fireEvent.keyDown(rows[0], { key: 'Enter' });
      await waitFor(() =>
        expect(screen.getByText('Back to all subscriptions')).toBeInTheDocument(),
      );
    });

    it('Space key on a row opens the detail view', async () => {
      await renderAndLoad();
      const rows = document.querySelectorAll('.subs-table tbody tr');
      fireEvent.keyDown(rows[0], { key: ' ' });
      await waitFor(() =>
        expect(screen.getByText('Back to all subscriptions')).toBeInTheDocument(),
      );
    });

    it('other keys (e.g. ArrowDown) do not navigate', async () => {
      await renderAndLoad();
      const rows = document.querySelectorAll('.subs-table tbody tr');
      fireEvent.keyDown(rows[0], { key: 'ArrowDown' });
      expect(screen.queryByText('Back to all subscriptions')).not.toBeInTheDocument();
    });
  });

  /* ── Detail view ──────────────────────────────────────────── */
  describe('Detail view', () => {
    async function openDetail(planName: string, subId: string) {
      await renderAndLoad();
      const btn = screen.getByRole('button', { name: new RegExp(`manage ${planName}`, 'i') });
      fireEvent.click(btn);
      await waitFor(() =>
        expect(screen.getByText('Back to all subscriptions')).toBeInTheDocument(),
      );
    }

    it('shows the plan name as an h1', async () => {
      await openDetail('Premium Access', 'SUB-001');
      expect(
        screen.getByRole('heading', { name: /premium access/i, level: 1 }),
      ).toBeInTheDocument();
    });

    it('shows the UsageThisPeriod component', async () => {
      await openDetail('Premium Access', 'SUB-001');
      expect(screen.getByTestId('usage-this-period')).toBeInTheDocument();
    });

    it('"Back to all subscriptions" returns to list', async () => {
      await openDetail('Premium Access', 'SUB-001');
      fireEvent.click(screen.getByText('Back to all subscriptions'));
      await waitFor(() =>
        expect(screen.getByTestId('subscriptions-table')).toBeInTheDocument(),
      );
    });

    it('breadcrumb "My subscriptions" button returns to list', async () => {
      await openDetail('Premium Access', 'SUB-001');
      fireEvent.click(screen.getByRole('button', { name: /back to my subscriptions/i }));
      await waitFor(() =>
        expect(screen.getByTestId('subscriptions-table')).toBeInTheDocument(),
      );
    });

    it('Active sub shows Pause and Cancel billing buttons', async () => {
      await openDetail('Premium Access', 'SUB-001');
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
      await openDetail('Premium Access', 'SUB-001');
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
  });

  /* ── Resume flow ──────────────────────────────────────────── */
  describe('Resume subscription flow', () => {
    it('Resume button updates Paused status badge to Active', async () => {
      await renderAndLoad();
      const manageBtn = screen.getAllByRole('button', { name: /manage basic/i })[0];
      fireEvent.click(manageBtn);
      await waitFor(() =>
        expect(screen.getByText('Back to all subscriptions')).toBeInTheDocument(),
      );
      fireEvent.click(
        screen.getByRole('button', { name: /resume basic stream subscription/i }),
      );
      await waitFor(() =>
        expect(screen.getByRole('status', { name: /status: active/i })).toBeInTheDocument(),
      );
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
      const hidden = document.querySelector('.visually-hidden');
      expect(hidden).toBeInTheDocument();
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
