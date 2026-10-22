import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Subscriptions from './Subscriptions';

if (!Element.prototype.animate) {
  Element.prototype.animate = vi.fn().mockReturnValue({
    finished: Promise.resolve(),
    onfinish: null,
    cancel: vi.fn(),
  }) as unknown as typeof Element.prototype.animate;
}

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

vi.mock('../components/UsageThisPeriod', () => ({
  default: () => <div data-testid="usage-this-period">Usage This Period</div>,
}));

describe('Subscriptions Detail - Prepaid Balance & Top Up', () => {
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

  async function openDetail(planName = 'Premium Access') {
    render(
      <MemoryRouter>
        <Subscriptions />
      </MemoryRouter>,
    );

    // Advance initial 800ms fetch delay
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    await waitFor(() =>
      expect(screen.getByTestId('subscriptions-table')).toBeInTheDocument(),
    );

    const btn = screen.getByRole('button', { name: new RegExp(`manage ${planName}`, 'i') });
    fireEvent.click(btn);

    await waitFor(() =>
      expect(screen.getByText('Back to all subscriptions')).toBeInTheDocument(),
    );
  }

  it('renders "Top up balance" button on subscription detail and opens modal with subscription data', async () => {
    await openDetail('Premium Access');

    // A "Top up balance" button exists on subscription detail
    const topUpButton = screen.getByRole('button', { name: /top up balance/i });
    expect(topUpButton).toBeInTheDocument();

    // Clicking it opens TopUpModal
    fireEvent.click(topUpButton);

    const modal = screen.getByRole('dialog', { name: /top up balance/i });
    expect(modal).toBeInTheDocument();

    // Modal is populated with subscription's data
    expect(within(modal).getByText(/Premium Access/i)).toBeInTheDocument();
    expect(within(modal).getByText('30.00')).toBeInTheDocument();
  });

  it('completes top up flow and updates the displayed balance and coverage on the detail view', async () => {
    await openDetail('Premium Access');

    const topUpButton = screen.getByRole('button', { name: /top up balance/i });
    fireEvent.click(topUpButton);

    // Choose 3 months (30 USDC)
    const option3m = screen.getByRole('button', { name: /3 months/i });
    fireEvent.click(option3m);

    // Review
    const reviewBtn = screen.getByRole('button', { name: /review top up/i });
    fireEvent.click(reviewBtn);

    // Confirm
    const confirmBtn = screen.getByRole('button', { name: /confirm top up/i });
    fireEvent.click(confirmBtn);

    // Wait for the async stub delay to resolve
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    // Modal shows success with updated balance (30 + 30 = 60 USDC)
    expect(screen.getByText(/top up successful/i)).toBeInTheDocument();
    expect(screen.getByText(/updated to 60\.00 usdc/i)).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByRole('button', { name: /^close$/i }));

    // Verify detail view now displays updated balance (60 USDC) and coverage
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    expect(screen.getByText('60 USDC')).toBeInTheDocument();
    expect(screen.getByText(/covers approximately/i)).toHaveTextContent('6');
  });
});
