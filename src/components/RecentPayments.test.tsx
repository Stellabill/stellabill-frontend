/**
 * Focused behavior suite for src/components/RecentPayments.tsx
 *
 * Covers:
 *  - Loading state: skeleton rows rendered while data is fetching
 *  - Loaded state: all five mock payments appear with correct date/amount
 *  - Success badge rendered for success payments
 *  - Failed badge rendered for failed payments
 *  - Etherscan link present for success payments (opens in new tab)
 *  - Failed payments show an em-dash placeholder instead of a hash link
 *  - "View all" link navigates to the correct payments route
 *  - Optional subscriptionId prop wires into the "View all" URL
 *  - Fallback subscriptionId used when prop is omitted
 *  - Table has accessible role and label
 *  - Re-fetch is triggered when subscriptionId changes (timer resets)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import RecentPayments from './RecentPayments';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Render with MemoryRouter required by the <Link> inside the component. */
function renderRecentPayments(subscriptionId?: string) {
  return render(
    <MemoryRouter>
      <RecentPayments subscriptionId={subscriptionId} />
    </MemoryRouter>,
  );
}

/** Advance timers past the 1 500 ms mock-fetch delay and flush micro-tasks. */
async function resolveLoading() {
  await act(async () => {
    vi.advanceTimersByTime(1500);
  });
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('RecentPayments', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('renders five skeleton placeholder rows while data is fetching', () => {
      const { container } = renderRecentPayments();

      // Before the timeout fires, the loading branch must be active.
      // The skeletons are <div> elements with an inline pulse animation; they
      // live inside <tbody> rows. Each row has four cells, one skeleton each.
      const tbody = container.querySelector('tbody');
      expect(tbody).toBeInTheDocument();

      const rows = tbody!.querySelectorAll('tr');
      expect(rows).toHaveLength(5);

      // Every row should contain skeleton divs, not real text
      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        expect(cells).toHaveLength(4);
        // Each cell should hold a skeleton div, not real payment data
        cells.forEach((cell) => {
          const skeleton = cell.querySelector('div');
          expect(skeleton).toBeInTheDocument();
        });
      });
    });

    it('does NOT show payment data before the timer fires', () => {
      renderRecentPayments();
      // The first mock payment date should not be visible yet
      expect(screen.queryByText('Feb 15, 2026')).not.toBeInTheDocument();
    });
  });

  // ── Loaded state ───────────────────────────────────────────────────────────

  describe('loaded state (after 1 500 ms)', () => {
    it('renders all five payment rows', async () => {
      const { container } = renderRecentPayments();
      await resolveLoading();

      const tbody = container.querySelector('tbody');
      const rows = tbody!.querySelectorAll('tr');
      expect(rows).toHaveLength(5);
    });

    it('displays each payment date', async () => {
      renderRecentPayments();
      await resolveLoading();

      expect(screen.getByText('Feb 15, 2026')).toBeInTheDocument();
      expect(screen.getByText('Jan 15, 2026')).toBeInTheDocument();
      expect(screen.getByText('Dec 15, 2025')).toBeInTheDocument();
      expect(screen.getByText('Dec 1, 2025')).toBeInTheDocument();
      expect(screen.getByText('Nov 15, 2025')).toBeInTheDocument();
    });

    it('displays each payment amount', async () => {
      renderRecentPayments();
      await resolveLoading();

      const amounts = screen.getAllByText('10 USDC');
      expect(amounts).toHaveLength(5);
    });
  });

  // ── Status badges ──────────────────────────────────────────────────────────

  describe('status badges', () => {
    it('renders a "Success" badge for each successful payment', async () => {
      renderRecentPayments();
      await resolveLoading();

      // 4 of 5 mock payments are successes
      const successBadges = screen.getAllByText('Success');
      expect(successBadges).toHaveLength(4);
    });

    it('renders a "Failed" badge for each failed payment', async () => {
      renderRecentPayments();
      await resolveLoading();

      // 1 of 5 mock payments is failed
      const failedBadges = screen.getAllByText('Failed');
      expect(failedBadges).toHaveLength(1);
    });
  });

  // ── Transaction column ─────────────────────────────────────────────────────

  describe('transaction hash column', () => {
    it('renders an etherscan link for each successful payment', async () => {
      renderRecentPayments();
      await resolveLoading();

      // The 4 success payments have hashes; verify each link targets etherscan
      const etherscanLinks = screen
        .getAllByRole('link')
        .filter((link) =>
          (link as HTMLAnchorElement).href.startsWith('https://etherscan.io/tx/'),
        );

      expect(etherscanLinks).toHaveLength(4);
    });

    it('links open in a new tab with rel="noreferrer"', async () => {
      renderRecentPayments();
      await resolveLoading();

      const etherscanLinks = screen
        .getAllByRole('link')
        .filter((link) =>
          (link as HTMLAnchorElement).href.startsWith('https://etherscan.io/tx/'),
        );

      etherscanLinks.forEach((link) => {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noreferrer');
      });
    });

    it('shows an em-dash placeholder for failed payments instead of a link', async () => {
      const { container } = renderRecentPayments();
      await resolveLoading();

      // The failed payment row (id=4) has no hash; the component renders "—"
      const emDashes = container.querySelectorAll('td span');
      const placeholder = Array.from(emDashes).find((el) => el.textContent === '—');
      expect(placeholder).toBeInTheDocument();
    });
  });

  // ── "View all" link ────────────────────────────────────────────────────────

  describe('"View all" link', () => {
    it('renders the "View all" link', () => {
      renderRecentPayments('sub-42');
      // Link is present even during loading
      expect(screen.getByRole('link', { name: /view all/i })).toBeInTheDocument();
    });

    it('navigates to /subscriptions/{subscriptionId}/payments when subscriptionId is provided', () => {
      renderRecentPayments('sub-42');
      const link = screen.getByRole('link', { name: /view all/i });
      expect(link).toHaveAttribute('href', '/subscriptions/sub-42/payments');
    });

    it('uses the fallback "123" when subscriptionId is not provided', () => {
      renderRecentPayments(); // no prop
      const link = screen.getByRole('link', { name: /view all/i });
      expect(link).toHaveAttribute('href', '/subscriptions/123/payments');
    });
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  describe('accessibility', () => {
    it('renders the table with role="table" and an aria-label', () => {
      renderRecentPayments();
      const table = screen.getByRole('table', { name: /recent payments/i });
      expect(table).toBeInTheDocument();
    });

    it('renders column headers with scope="col"', () => {
      const { container } = renderRecentPayments();
      const headers = container.querySelectorAll('th[scope="col"]');
      expect(headers).toHaveLength(4);
    });

    it('renders the section heading "Recent payments"', () => {
      renderRecentPayments();
      expect(
        screen.getByRole('heading', { name: /recent payments/i }),
      ).toBeInTheDocument();
    });
  });

  // ── subscriptionId reactivity ──────────────────────────────────────────────

  describe('subscriptionId prop changes', () => {
    it('updates the "View all" link when subscriptionId changes', async () => {
      const { rerender } = render(
        <MemoryRouter>
          <RecentPayments subscriptionId="sub-1" />
        </MemoryRouter>,
      );

      expect(screen.getByRole('link', { name: /view all/i })).toHaveAttribute(
        'href',
        '/subscriptions/sub-1/payments',
      );

      rerender(
        <MemoryRouter>
          <RecentPayments subscriptionId="sub-999" />
        </MemoryRouter>,
      );

      expect(screen.getByRole('link', { name: /view all/i })).toHaveAttribute(
        'href',
        '/subscriptions/sub-999/payments',
      );
    });

    it('resets to loading when subscriptionId changes', async () => {
      const { container, rerender } = render(
        <MemoryRouter>
          <RecentPayments subscriptionId="sub-1" />
        </MemoryRouter>,
      );

      // First load completes
      await resolveLoading();
      expect(screen.getAllByText('10 USDC')).toHaveLength(5);

      // Change prop — component re-mounts the effect and reloads
      rerender(
        <MemoryRouter>
          <RecentPayments subscriptionId="sub-2" />
        </MemoryRouter>,
      );

      // During the new fetch cycle, skeleton rows are shown again
      const tbody = container.querySelector('tbody');
      const rows = tbody!.querySelectorAll('tr');
      expect(rows).toHaveLength(5);
      // Payment dates should not be visible during re-load
      expect(screen.queryByText('Feb 15, 2026')).not.toBeInTheDocument();

      // Advance again and data returns
      await resolveLoading();
      expect(screen.getAllByText('10 USDC')).toHaveLength(5);
    });
  });

  // ── Table column headers ───────────────────────────────────────────────────

  describe('table column headers', () => {
    it('renders DATE, AMOUNT, STATUS and TRANSACTION column headers', () => {
      renderRecentPayments();
      expect(screen.getByText('DATE')).toBeInTheDocument();
      expect(screen.getByText('AMOUNT')).toBeInTheDocument();
      expect(screen.getByText('STATUS')).toBeInTheDocument();
      expect(screen.getByText('TRANSACTION')).toBeInTheDocument();
    });
  });
});
