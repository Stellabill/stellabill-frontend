/**
 * RecentPayments – focused behaviour coverage (#1129)
 *
 * Covers every success criterion listed in the issue:
 *   1. While loading, no payment rows show (fake timers simulate the async
 *      state transition from isLoading=true → isLoading=false).
 *   2. After the delay the table "Recent payments" lists each mock payment's
 *      date, amount and hash.
 *   3. Status "success" and "failed" render distinguishable labels.
 *   4. Each successful hash links to an explorer URL.
 *
 * ⚠  MISMATCH FLAGGED (issue requirement):
 *    RecentPayments.tsx currently builds explorer links as
 *      https://etherscan.io/tx/<hash>
 *    Etherscan is the Ethereum block explorer.  StellaBill is a Stellar-based
 *    billing product; the correct explorer for Stellar transactions is
 *    Stellar Expert:
 *      https://stellar.expert/explorer/public/tx/<hash>
 *    or the Horizon-backed Stellar Laboratory link:
 *      https://laboratory.stellar.org/#explorer?resource=transactions&endpoint=single&values=...
 *    The tests below assert the CURRENT behaviour (etherscan.io) so the test
 *    suite stays green, but each assertion is annotated with a TODO so the
 *    mismatch is impossible to miss during review.  Fix the source component
 *    and update the assertions when the correct explorer URL is decided.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RecentPayments, { type Payment } from './RecentPayments';

// ── Shared fixtures ──────────────────────────────────────────────────────────

const MOCK_PAYMENTS: Payment[] = [
  {
    id: '1',
    date: 'Feb 15, 2026',
    amount: '10 USDC',
    status: 'success',
    hash: '0xabc123def456',
  },
  {
    id: '2',
    date: 'Jan 15, 2026',
    amount: '20 USDC',
    status: 'success',
    hash: '0x111aaa222bbb',
  },
  {
    id: '3',
    date: 'Dec 15, 2025',
    amount: '5 USDC',
    status: 'failed',
    hash: '',
  },
];

/** Thin React wrapper that lets tests flip isLoading off inside fake timers. */
function AsyncPaymentsWrapper({
  delayMs = 200,
  payments = MOCK_PAYMENTS,
}: {
  delayMs?: number;
  payments?: Payment[];
}) {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<Payment[]>([]);

  React.useEffect(() => {
    const id = setTimeout(() => {
      setLoading(false);
      setData(payments);
    }, delayMs);
    return () => clearTimeout(id);
  }, [delayMs, payments]);

  return (
    <MemoryRouter>
      <RecentPayments payments={data} isLoading={loading} subscriptionId="sub_1" />
    </MemoryRouter>
  );
}

// React import for the wrapper above (vitest + @testing-library/react auto-imports JSX,
// but React.useState / React.useEffect still need the namespace import).
import React from 'react';

// ── 1. Loading state with fake timers ────────────────────────────────────────

describe('loading state (fake timers)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows skeleton rows while the simulated delay is pending', () => {
    vi.useFakeTimers();

    const { container } = render(<AsyncPaymentsWrapper delayMs={300} />);

    // Before the timer fires: no real payment text
    expect(screen.queryByText('Feb 15, 2026')).toBeNull();
    expect(screen.queryByText('10 USDC')).toBeNull();
    expect(screen.queryByText('No recent payments found.')).toBeNull();

    // Five skeleton <tr> elements should be in the tbody
    const skeletonRows = container.querySelectorAll('tbody tr');
    expect(skeletonRows.length).toBe(5);

    vi.useRealTimers();
  });

  it('shows no payment data rows while isLoading=true (prop-driven, no timers needed)', () => {
    render(
      <MemoryRouter>
        <RecentPayments subscriptionId="sub_1" isLoading={true} />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Feb 15, 2026')).toBeNull();
    expect(screen.queryByText('No recent payments found.')).toBeNull();
  });

  it('replaces skeleton rows with payment rows after the delay fires', async () => {
    vi.useFakeTimers();

    render(<AsyncPaymentsWrapper delayMs={200} />);

    // Still loading
    expect(screen.queryByText('Feb 15, 2026')).toBeNull();

    // Advance timers past the delay
    await act(async () => {
      vi.advanceTimersByTime(250);
    });

    // Now payment rows are visible
    expect(screen.getByText('Feb 15, 2026')).toBeInTheDocument();

    vi.useRealTimers();
  });
});

// ── 2. Payment rows: date, amount and hash ───────────────────────────────────

describe('payment rows render date, amount and hash', () => {
  it('renders the table heading "Recent payments"', () => {
    render(
      <MemoryRouter>
        <RecentPayments payments={MOCK_PAYMENTS} isLoading={false} subscriptionId="sub_1" />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', { name: /recent payments/i }),
    ).toBeInTheDocument();
  });

  it('renders the date for each payment', () => {
    render(
      <MemoryRouter>
        <RecentPayments payments={MOCK_PAYMENTS} isLoading={false} subscriptionId="sub_1" />
      </MemoryRouter>,
    );
    expect(screen.getByText('Feb 15, 2026')).toBeInTheDocument();
    expect(screen.getByText('Jan 15, 2026')).toBeInTheDocument();
    expect(screen.getByText('Dec 15, 2025')).toBeInTheDocument();
  });

  it('renders the amount for each payment', () => {
    render(
      <MemoryRouter>
        <RecentPayments payments={MOCK_PAYMENTS} isLoading={false} subscriptionId="sub_1" />
      </MemoryRouter>,
    );
    expect(screen.getByText('10 USDC')).toBeInTheDocument();
    expect(screen.getByText('20 USDC')).toBeInTheDocument();
    expect(screen.getByText('5 USDC')).toBeInTheDocument();
  });

  it('renders the hash for successful payments', () => {
    render(
      <MemoryRouter>
        <RecentPayments payments={MOCK_PAYMENTS} isLoading={false} subscriptionId="sub_1" />
      </MemoryRouter>,
    );
    expect(screen.getByText('0xabc123def456')).toBeInTheDocument();
    expect(screen.getByText('0x111aaa222bbb')).toBeInTheDocument();
  });

  it('shows a placeholder (—) instead of a hash for failed payments', () => {
    render(
      <MemoryRouter>
        <RecentPayments payments={MOCK_PAYMENTS} isLoading={false} subscriptionId="sub_1" />
      </MemoryRouter>,
    );
    // The failed payment row should show the em-dash placeholder
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders one row per payment', () => {
    const { container } = render(
      <MemoryRouter>
        <RecentPayments payments={MOCK_PAYMENTS} isLoading={false} subscriptionId="sub_1" />
      </MemoryRouter>,
    );
    // 3 payments → 3 tbody rows
    expect(container.querySelectorAll('tbody tr')).toHaveLength(MOCK_PAYMENTS.length);
  });
});

// ── 3. Status labels are distinguishable ────────────────────────────────────

describe('status labels', () => {
  it('renders "Success" label for payments with status="success"', () => {
    render(
      <MemoryRouter>
        <RecentPayments payments={MOCK_PAYMENTS} isLoading={false} subscriptionId="sub_1" />
      </MemoryRouter>,
    );
    // Two successful payments → two "Success" labels
    expect(screen.getAllByText('Success')).toHaveLength(2);
  });

  it('renders "Failed" label for payments with status="failed"', () => {
    render(
      <MemoryRouter>
        <RecentPayments payments={MOCK_PAYMENTS} isLoading={false} subscriptionId="sub_1" />
      </MemoryRouter>,
    );
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('"Success" and "Failed" labels are textually different', () => {
    render(
      <MemoryRouter>
        <RecentPayments
          payments={[
            { id: 'a', date: 'Mar 1, 2026', amount: '1 USDC', status: 'success', hash: '0xok' },
            { id: 'b', date: 'Mar 2, 2026', amount: '1 USDC', status: 'failed', hash: '' },
          ]}
          isLoading={false}
          subscriptionId="sub_1"
        />
      </MemoryRouter>,
    );
    const successLabel = screen.getByText('Success');
    const failedLabel = screen.getByText('Failed');
    expect(successLabel.textContent).not.toBe(failedLabel.textContent);
  });

  it('renders only "Failed" labels when all payments have failed status', () => {
    const failed: Payment[] = [
      { id: 'x', date: 'Apr 1, 2026', amount: '1 USDC', status: 'failed', hash: '' },
      { id: 'y', date: 'Apr 2, 2026', amount: '1 USDC', status: 'failed', hash: '' },
    ];
    render(
      <MemoryRouter>
        <RecentPayments payments={failed} isLoading={false} subscriptionId="sub_1" />
      </MemoryRouter>,
    );
    expect(screen.getAllByText('Failed')).toHaveLength(2);
    expect(screen.queryByText('Success')).toBeNull();
  });
});

// ── 4. Explorer links ────────────────────────────────────────────────────────

/**
 * ⚠  MISMATCH: The component currently uses https://etherscan.io/tx/<hash>
 * which is the Ethereum explorer.  StellaBill is a Stellar product; the
 * correct URL is https://stellar.expert/explorer/public/tx/<hash>.
 *
 * The assertions below verify CURRENT behaviour so CI stays green.
 * Update the href matcher below (and fix the component) once the team agrees
 * on the correct Stellar explorer URL.
 */
describe('explorer links', () => {
  it('renders an anchor tag for each successful payment hash', () => {
    render(
      <MemoryRouter>
        <RecentPayments payments={MOCK_PAYMENTS} isLoading={false} subscriptionId="sub_1" />
      </MemoryRouter>,
    );
    // Two successful payments each get a link; failed payment gets no link
    const links = screen.getAllByRole('link', { name: /^0x/i });
    expect(links).toHaveLength(2);
  });

  it('link href contains the payment hash', () => {
    render(
      <MemoryRouter>
        <RecentPayments payments={MOCK_PAYMENTS} isLoading={false} subscriptionId="sub_1" />
      </MemoryRouter>,
    );
    const link = screen.getByText('0xabc123def456').closest('a');
    expect(link).not.toBeNull();
    expect(link!.getAttribute('href')).toContain('0xabc123def456');
  });

  it(
    // TODO: change to stellar.expert when component is fixed (see mismatch note above)
    '[MISMATCH] link currently points to etherscan.io – should be stellar.expert for Stellar txns',
    () => {
      render(
        <MemoryRouter>
          <RecentPayments payments={MOCK_PAYMENTS} isLoading={false} subscriptionId="sub_1" />
        </MemoryRouter>,
      );
      const link1 = screen.getByText('0xabc123def456').closest('a');
      const link2 = screen.getByText('0x111aaa222bbb').closest('a');

      // Current (wrong) behaviour — passes today; remove once fixed:
      expect(link1!.getAttribute('href')).toBe('https://etherscan.io/tx/0xabc123def456');
      expect(link2!.getAttribute('href')).toBe('https://etherscan.io/tx/0x111aaa222bbb');

      // Desired (correct) behaviour — uncomment when component is fixed:
      // expect(link1!.getAttribute('href')).toBe(
      //   'https://stellar.expert/explorer/public/tx/0xabc123def456',
      // );
      // expect(link2!.getAttribute('href')).toBe(
      //   'https://stellar.expert/explorer/public/tx/0x111aaa222bbb',
      // );
    },
  );

  it('links open in a new tab (target=_blank)', () => {
    render(
      <MemoryRouter>
        <RecentPayments payments={MOCK_PAYMENTS} isLoading={false} subscriptionId="sub_1" />
      </MemoryRouter>,
    );
    const links = screen.getAllByRole('link', { name: /^0x/i });
    links.forEach((link) => expect(link).toHaveAttribute('target', '_blank'));
  });

  it('links include rel="noreferrer" for security', () => {
    render(
      <MemoryRouter>
        <RecentPayments payments={MOCK_PAYMENTS} isLoading={false} subscriptionId="sub_1" />
      </MemoryRouter>,
    );
    const links = screen.getAllByRole('link', { name: /^0x/i });
    links.forEach((link) => expect(link).toHaveAttribute('rel', 'noreferrer'));
  });

  it('no explorer link is rendered for failed payments', () => {
    const failedOnly: Payment[] = [
      { id: 'f1', date: 'May 1, 2026', amount: '1 USDC', status: 'failed', hash: '' },
    ];
    render(
      <MemoryRouter>
        <RecentPayments payments={failedOnly} isLoading={false} subscriptionId="sub_1" />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('link', { name: /^0x/i })).toBeNull();
  });
});

// ── Edge cases ───────────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('renders empty-state message when payments array is empty', () => {
    render(
      <MemoryRouter>
        <RecentPayments payments={[]} isLoading={false} subscriptionId="sub_1" />
      </MemoryRouter>,
    );
    expect(screen.getByText('No recent payments found.')).toBeInTheDocument();
  });

  it('renders an error alert when the error prop is provided', () => {
    render(
      <MemoryRouter>
        <RecentPayments
          payments={[]}
          isLoading={false}
          error="Failed to load recent payments."
          subscriptionId="sub_1"
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load recent payments.');
  });

  it('error state takes precedence over empty payments', () => {
    render(
      <MemoryRouter>
        <RecentPayments
          payments={[]}
          isLoading={false}
          error="Something went wrong."
          subscriptionId="sub_1"
        />
      </MemoryRouter>,
    );
    expect(screen.queryByText('No recent payments found.')).toBeNull();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('uses subscriptionId in the "View all" link', () => {
    render(
      <MemoryRouter>
        <RecentPayments payments={[]} isLoading={false} subscriptionId="sub_xyz" />
      </MemoryRouter>,
    );
    const viewAll = screen.getByRole('link', { name: /view all/i });
    expect(viewAll.getAttribute('href')).toContain('sub_xyz');
  });
});
