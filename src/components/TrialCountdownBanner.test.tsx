import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TrialCountdownBanner, {
  type TrialCountdownBannerProps,
  type TrialUrgencyTier,
} from './TrialCountdownBanner';

const SNOOZE_STORAGE_KEY = 'stellabill-trial-banner-snooze';
const HOUR_MS = 3_600_000;

/**
 * Frozen clock. Mid-June keeps the calendar arithmetic below clear of every
 * daylight-saving transition, so "N days remaining" resolves to the same tier
 * no matter which timezone the suite runs in.
 */
const FROZEN_NOW = new Date(2026, 5, 15, 9, 30, 0);

/**
 * `getDaysRemaining` normalises the trial end to 23:59:59.999 and "now" to
 * 00:00:00, so a trial that ends later *today* still reports one day left.
 * Shifting the end date back one day makes it resolve to exactly `days`.
 */
function trialEndingIn(days: number): Date {
  return new Date(2026, 5, 15 + days - 1, 12, 0, 0);
}

function renderBanner(overrides: Partial<TrialCountdownBannerProps> = {}) {
  return render(<TrialCountdownBanner trialEndsAt={trialEndingIn(4)} {...overrides} />);
}

function seedSnooze(tier: TrialUrgencyTier, expiresInMs: number) {
  sessionStorage.setItem(
    SNOOZE_STORAGE_KEY,
    JSON.stringify({ expiry: Date.now() + expiresInMs, tier }),
  );
}

function storedSnooze(): { expiry: number; tier: TrialUrgencyTier } | null {
  const raw = sessionStorage.getItem(SNOOZE_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

beforeEach(() => {
  sessionStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(FROZEN_NOW);
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  sessionStorage.clear();
});

describe('TrialCountdownBanner — TrialUrgencyTier resolution', () => {
  it('reports the info tier while more than 7 days remain', () => {
    renderBanner({ trialEndsAt: trialEndingIn(8) });

    expect(screen.getByRole('region')).toHaveClass('trial-banner', 'trial-banner--info');
    expect(screen.getByText('Your trial expires in 8 days')).toBeInTheDocument();
    expect(screen.getByLabelText('8 days left')).toHaveTextContent('8d');
  });

  it('escalates to the warning tier at exactly 7 days remaining', () => {
    renderBanner({ trialEndsAt: trialEndingIn(7) });

    expect(screen.getByRole('region')).toHaveClass('trial-banner--warning');
    expect(screen.getByText('Your trial expires in 7 days')).toBeInTheDocument();
    expect(screen.getByLabelText('7 days left')).toHaveTextContent('7d');
  });

  it('stays on the warning tier at exactly 3 days remaining', () => {
    renderBanner({ trialEndsAt: trialEndingIn(3) });

    expect(screen.getByRole('region')).toHaveClass('trial-banner--warning');
    expect(screen.getByLabelText('3 days left')).toHaveTextContent('3d');
  });

  it('escalates to the urgent tier below the 3 day boundary', () => {
    renderBanner({ trialEndsAt: trialEndingIn(2) });

    expect(screen.getByRole('region')).toHaveClass('trial-banner--urgent');
    expect(screen.getByText('Your trial expires in 2 days')).toBeInTheDocument();
    expect(screen.getByLabelText('2 days left')).toHaveTextContent('2d');
  });

  it('uses the final-day copy when the trial ends today', () => {
    renderBanner({ trialEndsAt: trialEndingIn(1) });

    expect(screen.getByRole('region')).toHaveClass('trial-banner--urgent');
    expect(screen.getByText('Your trial expires today')).toBeInTheDocument();
    expect(screen.getByLabelText('1 day left')).toHaveTextContent('1d');
    expect(screen.getByRole('button', { name: /remind me later/i })).toBeInTheDocument();
  });

  it('uses the expired tier when the trial ended today', () => {
    renderBanner({ trialEndsAt: trialEndingIn(0) });

    expect(screen.getByRole('region')).toHaveClass('trial-banner--expired');
    expect(screen.getByText('Your trial has expired')).toBeInTheDocument();
    expect(screen.getByText('Upgrade now to keep full access to all features.')).toBeInTheDocument();
    expect(screen.getByLabelText('Trial expired')).toHaveTextContent('Expired');
    // Nothing left to snooze once the trial is over.
    expect(screen.queryByRole('button', { name: /remind me later/i })).not.toBeInTheDocument();
  });

  it('clamps long-past trial dates to the expired tier', () => {
    renderBanner({ trialEndsAt: trialEndingIn(-30) });

    expect(screen.getByRole('region')).toHaveClass('trial-banner--expired');
    expect(screen.getByLabelText('Trial expired')).toHaveTextContent('Expired');
  });
});

describe('TrialCountdownBanner — snooze state failure handling', () => {
  it('renders the banner when no snooze entry is stored', () => {
    expect(sessionStorage.getItem(SNOOZE_STORAGE_KEY)).toBeNull();

    renderBanner();

    expect(screen.getByRole('region')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remind me later/i })).toBeInTheDocument();
  });

  it('ignores a corrupt snooze entry instead of crashing', () => {
    sessionStorage.setItem(SNOOZE_STORAGE_KEY, '{ not json');

    renderBanner();

    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('ignores a stored JSON literal that is not a snooze object', () => {
    // Valid JSON, but reading `.expiry` off `null` throws — the helpers must
    // swallow that and fall back to "not snoozed".
    sessionStorage.setItem(SNOOZE_STORAGE_KEY, 'null');

    renderBanner();

    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('ignores a snooze entry with no expiry', () => {
    sessionStorage.setItem(SNOOZE_STORAGE_KEY, JSON.stringify({ tier: 'warning' }));

    renderBanner();

    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('ignores a snooze entry with no tier', () => {
    sessionStorage.setItem(
      SNOOZE_STORAGE_KEY,
      JSON.stringify({ expiry: Date.now() + HOUR_MS }),
    );

    renderBanner();

    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('keeps a matching, unexpired snooze hidden', () => {
    seedSnooze('warning', HOUR_MS);

    const { container } = renderBanner({ trialEndsAt: trialEndingIn(4) });

    expect(container).toBeEmptyDOMElement();
  });

  it('ignores a snooze recorded under a different tier', () => {
    // A snooze taken at a lower urgency must not keep hiding the banner once
    // the trial has escalated.
    seedSnooze('urgent', HOUR_MS);

    renderBanner({ trialEndsAt: trialEndingIn(4) }); // warning tier

    expect(screen.getByRole('region')).toHaveClass('trial-banner--warning');
  });

  it('ignores a snooze entry whose tier is not a known tier', () => {
    sessionStorage.setItem(
      SNOOZE_STORAGE_KEY,
      JSON.stringify({ expiry: Date.now() + HOUR_MS, tier: 'bogus' }),
    );

    renderBanner({ trialEndsAt: trialEndingIn(4) });

    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('re-shows the banner once the snooze window elapses', () => {
    seedSnooze('warning', 30_000);
    const { container } = renderBanner({ trialEndsAt: trialEndingIn(4) });
    expect(container).toBeEmptyDOMElement();

    act(() => {
      vi.advanceTimersByTime(61_000);
    });

    expect(screen.getByRole('region')).toHaveClass('trial-banner--warning');
  });

  it('re-shows the banner when the stored snooze has already expired', () => {
    seedSnooze('warning', -1);

    renderBanner({ trialEndsAt: trialEndingIn(4) });

    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('re-shows the banner and clears the snooze when the tier escalates', () => {
    seedSnooze('warning', HOUR_MS);
    const { container, rerender } = render(
      <TrialCountdownBanner trialEndsAt={trialEndingIn(4)} />,
    );
    expect(container).toBeEmptyDOMElement();

    rerender(<TrialCountdownBanner trialEndsAt={trialEndingIn(1)} />);

    expect(screen.getByRole('region')).toHaveClass('trial-banner--urgent');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Urgent: your trial expires in less than 3 days.',
    );
    expect(sessionStorage.getItem(SNOOZE_STORAGE_KEY)).toBeNull();
  });

  it('renders safely when reading sessionStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    renderBanner();

    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('still snoozes in-memory when persisting the snooze fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    const { container } = renderBanner();

    fireEvent.click(screen.getByRole('button', { name: /remind me later/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Tomorrow' }));

    expect(container).toBeEmptyDOMElement();
  });

  it('dismisses even when clearing the stored snooze fails', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    const onDismiss = vi.fn();
    const { container } = renderBanner({ onDismiss });

    fireEvent.click(
      screen.getByRole('button', { name: /dismiss trial expiration banner/i }),
    );

    expect(container).toBeEmptyDOMElement();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe('TrialCountdownBanner — actions', () => {
  it('calls onUpgrade instead of navigating when a handler is provided', () => {
    const onUpgrade = vi.fn();
    renderBanner({ onUpgrade });

    fireEvent.click(screen.getByRole('button', { name: /upgrade your plan now/i }));

    expect(onUpgrade).toHaveBeenCalledTimes(1);
  });

  it('persists the current tier and the selected snooze window', () => {
    renderBanner({ trialEndsAt: trialEndingIn(4) });

    fireEvent.click(screen.getByRole('button', { name: /remind me later/i }));
    expect(screen.getByRole('menu', { name: 'Snooze options' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: '4 hours' }));

    expect(storedSnooze()).toEqual({
      expiry: FROZEN_NOW.getTime() + 4 * HOUR_MS,
      tier: 'warning',
    });
  });

  it('honours a custom snooze list', () => {
    renderBanner({ snoozeDurations: [{ label: '2 hours', hours: 2 }] });

    fireEvent.click(screen.getByRole('button', { name: /remind me later/i }));

    expect(screen.getByRole('menuitem', { name: '2 hours' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Tomorrow' })).not.toBeInTheDocument();
  });

  it('closes the snooze menu on an outside pointer press', () => {
    renderBanner();

    fireEvent.click(screen.getByRole('button', { name: /remind me later/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.pointerDown(document.body);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('calls onDismiss and hides the banner when dismissed', () => {
    const onDismiss = vi.fn();
    const { container } = renderBanner({ onDismiss });

    fireEvent.click(
      screen.getByRole('button', { name: /dismiss trial expiration banner/i }),
    );

    expect(container).toBeEmptyDOMElement();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
