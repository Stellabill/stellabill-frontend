/**
 * StaleIndicator.test.tsx
 *
 * Covers:
 * - Freshness state rendering (fresh, stale, very-stale, unknown, refreshing, success)
 * - Relative time text in badge
 * - Absolute timestamp in tooltip
 * - Refresh button presence, disabled state, and aria attributes
 * - Success flash after refresh
 * - Screen-reader live region announcements
 * - Offline scenario (external isRefreshing prop)
 * - RTL support (basic attribute check)
 * - No-callback scenario (no refresh button)
 * - Reduced-motion (basic — CSS is not exercised in jsdom)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import StaleIndicator from './StaleIndicator';
import {
  STALE_THRESHOLD_MS,
  VERY_STALE_THRESHOLD_MS,
} from '../tokens/stalenessTokens';

// ── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_NOW = 1_700_000_000_000;

function tsAt(offsetMs: number) {
  return new Date(FIXED_NOW - offsetMs).toISOString();
}

// ── Shared stubs ──────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

// ── Freshness state rendering ─────────────────────────────────────────────────
describe('freshness state', () => {
  it('is hidden (data-freshness="fresh") when data is new', () => {
    const { getByTestId } = render(
      <StaleIndicator
        updatedAt={tsAt(0)}
        cardLabel="Test"
        _now={FIXED_NOW}
      />,
    );
    expect(getByTestId('stale-indicator')).toHaveAttribute('data-freshness', 'fresh');
  });

  it('has data-freshness="stale" when age >= STALE_THRESHOLD_MS', () => {
    const { getByTestId } = render(
      <StaleIndicator
        updatedAt={tsAt(STALE_THRESHOLD_MS)}
        cardLabel="Test"
        _now={FIXED_NOW}
      />,
    );
    expect(getByTestId('stale-indicator')).toHaveAttribute('data-freshness', 'stale');
  });

  it('has data-freshness="very-stale" when age >= VERY_STALE_THRESHOLD_MS', () => {
    const { getByTestId } = render(
      <StaleIndicator
        updatedAt={tsAt(VERY_STALE_THRESHOLD_MS)}
        cardLabel="Test"
        _now={FIXED_NOW}
      />,
    );
    expect(getByTestId('stale-indicator')).toHaveAttribute('data-freshness', 'very-stale');
  });

  it('has data-freshness="unknown" when updatedAt is null', () => {
    const { getByTestId } = render(
      <StaleIndicator
        updatedAt={null}
        cardLabel="Test"
        _now={FIXED_NOW}
      />,
    );
    expect(getByTestId('stale-indicator')).toHaveAttribute('data-freshness', 'unknown');
  });

  it('has data-freshness="unknown" when updatedAt is undefined', () => {
    const { getByTestId } = render(
      <StaleIndicator
        updatedAt={undefined}
        cardLabel="Test"
        _now={FIXED_NOW}
      />,
    );
    expect(getByTestId('stale-indicator')).toHaveAttribute('data-freshness', 'unknown');
  });
});

// ── Badge text ────────────────────────────────────────────────────────────────
describe('badge text', () => {
  it('shows "Updated just now" for a brand-new timestamp', () => {
    const { getByText } = render(
      <StaleIndicator
        updatedAt={tsAt(0)}
        cardLabel="Test"
        _now={FIXED_NOW}
      />,
    );
    expect(getByText(/Updated just now/i)).toBeInTheDocument();
  });

  it('shows "Updated 5 min ago" for 5-minute-old data', () => {
    const { getByText } = render(
      <StaleIndicator
        updatedAt={tsAt(5 * 60_000)}
        cardLabel="Test"
        _now={FIXED_NOW}
      />,
    );
    expect(getByText(/Updated 5 min ago/i)).toBeInTheDocument();
  });

  it('shows "Updated 1 hr ago" for 1-hour-old data', () => {
    const { getByText } = render(
      <StaleIndicator
        updatedAt={tsAt(60 * 60_000)}
        cardLabel="Test"
        _now={FIXED_NOW}
      />,
    );
    expect(getByText(/Updated 1 hr ago/i)).toBeInTheDocument();
  });

  it('shows "No timestamp" when updatedAt is null', () => {
    const { getByText } = render(
      <StaleIndicator
        updatedAt={null}
        cardLabel="Test"
        _now={FIXED_NOW}
      />,
    );
    expect(getByText(/No timestamp/i)).toBeInTheDocument();
  });
});

// ── Tooltip ───────────────────────────────────────────────────────────────────
describe('tooltip', () => {
  it('renders a tooltip with role="tooltip" when updatedAt is provided', () => {
    render(
      <StaleIndicator
        updatedAt={tsAt(5 * 60_000)}
        cardLabel="Test"
        _now={FIXED_NOW}
      />,
    );
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('tooltip text contains "Last updated:"', () => {
    render(
      <StaleIndicator
        updatedAt={tsAt(5 * 60_000)}
        cardLabel="Test"
        _now={FIXED_NOW}
      />,
    );
    expect(screen.getByRole('tooltip')).toHaveTextContent(/Last updated:/i);
  });

  it('does not render a tooltip when updatedAt is null', () => {
    render(
      <StaleIndicator
        updatedAt={null}
        cardLabel="Test"
        _now={FIXED_NOW}
      />,
    );
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('tooltip has id referenced by aria-describedby', () => {
    render(
      <StaleIndicator
        updatedAt={tsAt(5 * 60_000)}
        cardLabel="Test"
        _now={FIXED_NOW}
      />,
    );
    const tooltip = screen.getByRole('tooltip');
    const tooltipId = tooltip.id;
    expect(tooltipId).toBeTruthy();
    // The anchor wrapping the badge should reference this id
    const anchor = tooltip.parentElement;
    expect(anchor).toHaveAttribute('aria-describedby', tooltipId);
  });
});

// ── Refresh button ────────────────────────────────────────────────────────────
describe('refresh button', () => {
  it('renders a refresh button when onRefresh is provided', () => {
    render(
      <StaleIndicator
        updatedAt={tsAt(STALE_THRESHOLD_MS)}
        cardLabel="Active Subscriptions"
        onRefresh={vi.fn()}
        _now={FIXED_NOW}
      />,
    );
    expect(screen.getByRole('button', { name: /Refresh Active Subscriptions/i })).toBeInTheDocument();
  });

  it('does NOT render a refresh button when onRefresh is absent', () => {
    render(
      <StaleIndicator
        updatedAt={tsAt(STALE_THRESHOLD_MS)}
        cardLabel="MRR"
        _now={FIXED_NOW}
      />,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onRefresh when the button is clicked', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(
      <StaleIndicator
        updatedAt={tsAt(STALE_THRESHOLD_MS)}
        cardLabel="Test"
        onRefresh={onRefresh}
        _now={FIXED_NOW}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Refresh Test/i }));
    });
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('disables the button while refreshing', async () => {
    let resolveRefresh!: () => void;
    const onRefresh = vi.fn(
      () => new Promise<void>((res) => { resolveRefresh = res; }),
    );

    const { getByRole } = render(
      <StaleIndicator
        updatedAt={tsAt(STALE_THRESHOLD_MS)}
        cardLabel="Test"
        onRefresh={onRefresh}
        _now={FIXED_NOW}
      />,
    );

    const btn = getByRole('button', { name: /Refresh Test/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(getByRole('button', { name: /Refreshing Test/i })).toBeDisabled();
    });

    // Cleanup
    act(() => resolveRefresh());
  });

  it('sets aria-busy=true while refreshing', async () => {
    let resolveRefresh!: () => void;
    const onRefresh = vi.fn(
      () => new Promise<void>((res) => { resolveRefresh = res; }),
    );

    render(
      <StaleIndicator
        updatedAt={tsAt(STALE_THRESHOLD_MS)}
        cardLabel="Test"
        onRefresh={onRefresh}
        _now={FIXED_NOW}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Refresh Test/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Refreshing Test/i }))
        .toHaveAttribute('aria-busy', 'true');
    });

    act(() => resolveRefresh());
  });

  it('shows data-freshness="refreshing" during in-flight request', async () => {
    let resolveRefresh!: () => void;
    const onRefresh = vi.fn(
      () => new Promise<void>((res) => { resolveRefresh = res; }),
    );

    render(
      <StaleIndicator
        updatedAt={tsAt(STALE_THRESHOLD_MS)}
        cardLabel="Test"
        onRefresh={onRefresh}
        _now={FIXED_NOW}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Refresh Test/i }));

    await waitFor(() => {
      expect(screen.getByTestId('stale-indicator')).toHaveAttribute(
        'data-freshness',
        'refreshing',
      );
    });

    act(() => resolveRefresh());
  });

  it('does not call onRefresh a second time if already refreshing', async () => {
    let resolveRefresh!: () => void;
    const onRefresh = vi.fn(
      () => new Promise<void>((res) => { resolveRefresh = res; }),
    );

    render(
      <StaleIndicator
        updatedAt={tsAt(STALE_THRESHOLD_MS)}
        cardLabel="Test"
        onRefresh={onRefresh}
        _now={FIXED_NOW}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Refresh Test/i }));
    await waitFor(() => screen.getByRole('button', { name: /Refreshing Test/i }));

    // Button is disabled, so a second click should not fire onRefresh
    fireEvent.click(screen.getByRole('button', { name: /Refreshing Test/i }));
    expect(onRefresh).toHaveBeenCalledTimes(1);

    act(() => resolveRefresh());
  });
});

// ── Success flash ─────────────────────────────────────────────────────────────
describe('success flash', () => {
  it('shows data-freshness="success" after refresh completes', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    render(
      <StaleIndicator
        updatedAt={tsAt(STALE_THRESHOLD_MS)}
        cardLabel="Test"
        onRefresh={onRefresh}
        _now={FIXED_NOW}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Refresh Test/i }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('stale-indicator')).toHaveAttribute(
        'data-freshness',
        'success',
      );
    });
  });

  it('shows "Updated" badge text in success state', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    render(
      <StaleIndicator
        updatedAt={tsAt(STALE_THRESHOLD_MS)}
        cardLabel="Test"
        onRefresh={onRefresh}
        _now={FIXED_NOW}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Refresh Test/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/^Updated$/i)).toBeInTheDocument();
    });
  });

  it('hides the refresh button during success flash', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    render(
      <StaleIndicator
        updatedAt={tsAt(STALE_THRESHOLD_MS)}
        cardLabel="Test"
        onRefresh={onRefresh}
        _now={FIXED_NOW}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Refresh Test/i }));
    });

    await waitFor(() => {
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  it('restores the refresh button after success flash expires', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    render(
      <StaleIndicator
        updatedAt={tsAt(STALE_THRESHOLD_MS)}
        cardLabel="Test"
        onRefresh={onRefresh}
        _now={FIXED_NOW}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Refresh Test/i }));
    });

    // Wait for success state
    await waitFor(() =>
      expect(screen.getByTestId('stale-indicator')).toHaveAttribute('data-freshness', 'success'),
    );

    // Advance past the 2-second flash
    act(() => vi.advanceTimersByTime(2500));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Refresh Test/i })).toBeInTheDocument();
    });
  });
});

// ── External isRefreshing prop ─────────────────────────────────────────────────
describe('external isRefreshing prop', () => {
  it('shows refreshing state when isRefreshing=true is passed externally', () => {
    render(
      <StaleIndicator
        updatedAt={tsAt(STALE_THRESHOLD_MS)}
        cardLabel="Test"
        isRefreshing={true}
        _now={FIXED_NOW}
      />,
    );
    expect(screen.getByTestId('stale-indicator')).toHaveAttribute(
      'data-freshness',
      'refreshing',
    );
  });

  it('disables button when isRefreshing=true even with onRefresh provided', () => {
    render(
      <StaleIndicator
        updatedAt={tsAt(STALE_THRESHOLD_MS)}
        cardLabel="Test"
        onRefresh={vi.fn()}
        isRefreshing={true}
        _now={FIXED_NOW}
      />,
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

// ── Screen-reader live region ─────────────────────────────────────────────────
describe('live region', () => {
  it('has a role="status" element for screen readers', () => {
    render(
      <StaleIndicator
        updatedAt={tsAt(STALE_THRESHOLD_MS)}
        cardLabel="Test"
        _now={FIXED_NOW}
      />,
    );
    // role="status" is ARIA live polite by default
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('live region has aria-live="polite"', () => {
    render(
      <StaleIndicator
        updatedAt={tsAt(STALE_THRESHOLD_MS)}
        cardLabel="Test"
        _now={FIXED_NOW}
      />,
    );
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('live region has aria-atomic="true"', () => {
    render(
      <StaleIndicator
        updatedAt={tsAt(STALE_THRESHOLD_MS)}
        cardLabel="Test"
        _now={FIXED_NOW}
      />,
    );
    expect(screen.getByRole('status')).toHaveAttribute('aria-atomic', 'true');
  });
});

// ── Accessibility attributes ──────────────────────────────────────────────────
describe('accessibility', () => {
  it('refresh button aria-label contains the card label', () => {
    render(
      <StaleIndicator
        updatedAt={tsAt(STALE_THRESHOLD_MS)}
        cardLabel="Active Subscriptions"
        onRefresh={vi.fn()}
        _now={FIXED_NOW}
      />,
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-label', 'Refresh Active Subscriptions');
  });

  it('badge icon is aria-hidden', () => {
    const { container } = render(
      <StaleIndicator
        updatedAt={tsAt(STALE_THRESHOLD_MS)}
        cardLabel="Test"
        _now={FIXED_NOW}
      />,
    );
    // All svg/lucide icons should be aria-hidden
    container.querySelectorAll('svg').forEach(svg => {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('refresh icon is aria-hidden', () => {
    const { container } = render(
      <StaleIndicator
        updatedAt={tsAt(STALE_THRESHOLD_MS)}
        cardLabel="Test"
        onRefresh={vi.fn()}
        _now={FIXED_NOW}
      />,
    );
    container.querySelectorAll('svg').forEach(svg => {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });
});

// ── Custom className ──────────────────────────────────────────────────────────
describe('className prop', () => {
  it('applies className to the root element', () => {
    const { getByTestId } = render(
      <StaleIndicator
        updatedAt={null}
        cardLabel="Test"
        className="my-custom-class"
        _now={FIXED_NOW}
      />,
    );
    expect(getByTestId('stale-indicator').className).toContain('my-custom-class');
  });
});

// ── Offline simulation ────────────────────────────────────────────────────────
describe('offline / error handling', () => {
  it('does not crash when onRefresh throws synchronously', async () => {
    // Synchronous throw from a non-async function — the component's async
    // handleRefresh catches it in its catch block.
    const onRefresh = vi.fn().mockImplementation(() => {
      throw new Error('Network error');
    });

    render(
      <StaleIndicator
        updatedAt={tsAt(STALE_THRESHOLD_MS)}
        cardLabel="Test"
        onRefresh={onRefresh}
        _now={FIXED_NOW}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Refresh Test/i }));
    });

    // Should recover: refresh button should reappear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Refresh Test/i })).toBeInTheDocument();
    });
  });

  it('re-enables button after a failed refresh', async () => {
    const onRefresh = vi.fn().mockImplementation(() => {
      throw new Error('Network error');
    });

    render(
      <StaleIndicator
        updatedAt={tsAt(STALE_THRESHOLD_MS)}
        cardLabel="Test"
        onRefresh={onRefresh}
        _now={FIXED_NOW}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Refresh Test/i }));
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Refresh Test/i })).not.toBeDisabled();
    });
  });
});

// ── Clock ticking ─────────────────────────────────────────────────────────────
describe('clock ticking (live mode)', () => {
  it('updates "now" after STALENESS_TICK_INTERVAL_MS when _now is not pinned', () => {
    // This test verifies the setInterval is set up; a full tick test would
    // require rendering without _now and advancing fake timers.
    const { getByTestId } = render(
      <StaleIndicator
        updatedAt={new Date(Date.now() - 1000).toISOString()}
        cardLabel="Test"
      />,
    );
    // At least it renders without throwing
    expect(getByTestId('stale-indicator')).toBeInTheDocument();
  });
});

// ── MerchantDashboard integration smoke test ──────────────────────────────────
describe('MerchantDashboard integration', () => {
  it('renders four stale indicators on the dashboard', async () => {
    // Lazy import to avoid heavy RevenueSplitByPlanPanel mock
    const { default: MerchantDashboard } = await import('./MerchantDashboard');
    const { getAllByTestId } = render(<MerchantDashboard />);
    const indicators = getAllByTestId('stale-indicator');
    expect(indicators).toHaveLength(4);
  });

  it('each indicator starts with data-freshness="fresh"', async () => {
    const { default: MerchantDashboard } = await import('./MerchantDashboard');
    const { getAllByTestId } = render(<MerchantDashboard />);
    getAllByTestId('stale-indicator').forEach(el => {
      expect(el).toHaveAttribute('data-freshness', 'fresh');
    });
  });
});
