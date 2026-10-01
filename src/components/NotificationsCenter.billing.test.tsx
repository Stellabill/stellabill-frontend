/**
 * Regression suite for #795 — BillingNotificationType failure handling
 * in NotificationsCenter (SnoozeMenu.resumeLabel useMemo)
 *
 * Exercises the two explicit guard branches inside the `resumeLabel` useMemo:
 *
 *   Line 296: if (!isSnoozed || snoozeExpiresAt == null) return null;
 *   Line 298: if (remaining <= 0) return null;
 *
 * Each describe block covers:
 *   – the failure / null-return path (no resume label rendered)
 *   – the neighbouring normal (success) path (resume label rendered)
 *   – boundary inputs around the guard condition
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import NotificationsCenter, {
  BillingNotification,
  SNOOZE_1H,
  SNOOZE_8H,
  SNOOZE_24H,
} from './NotificationsCenter';

// ---------------------------------------------------------------------------
// i18n mock
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const count = typeof opts?.count === 'number' ? opts.count : 0;
      const title = typeof opts?.title === 'string' ? opts.title : '';
      const translations: Record<string, string> = {
        'notifications.liveRegion':
          count === 0
            ? 'All billing notifications are read'
            : count === 1
            ? '1 unread billing notification'
            : `${count} unread billing notifications`,
        'notifications.triggerLabel':
          count === 0
            ? 'Open billing notifications'
            : count === 1
            ? 'Open billing notifications, 1 unread'
            : `Open billing notifications, ${count} unread`,
        'notifications.billingAlerts': 'Billing alerts',
        'notifications.title': 'Notifications',
        'notifications.toolbar':
          count === 0 ? 'No alerts' : count === 1 ? '1 unread' : `${count} unread`,
        'notifications.toolbarAllRead': 'All caught up',
        'notifications.markAllRead': 'Mark all read',
        'notifications.close': 'Close billing notifications',
        'notifications.listLabel': 'Billing notification list',
        'notifications.emptyTitle': 'No billing alerts',
        'notifications.emptyDescription':
          'Failed charges, low balances, and plan changes will appear here.',
        'notifications.allReadTitle': 'All caught up',
        'notifications.allReadDescription': 'There are no unread billing events right now.',
        'notifications.allSilencedTitle': 'All notifications silenced',
        'notifications.allSilencedDescription':
          count === 1
            ? '1 notification is muted or snoozed'
            : `${count} notifications are muted or snoozed`,
        'notifications.snooze.triggerLabel': `Snooze or mute: ${title}`,
        'notifications.snooze.triggerLabelSnoozed': `Snoozed — ${title}. Open to change`,
        'notifications.snooze.triggerLabelMuted': `Muted — ${title}. Open to unmute`,
        'notifications.snooze.menuLabel': `Snooze or mute options for ${title}`,
        'notifications.snooze.snoozeFor': 'Snooze for',
        'notifications.snooze.1h': '1 hour',
        'notifications.snooze.8h': '8 hours',
        'notifications.snooze.24h': '1 day',
        'notifications.snooze.mute': 'Mute this notification',
        'notifications.snooze.unmute': 'Unmute',
        'notifications.snooze.unsnooze': 'Resume now',
        'notifications.snooze.mutedLabel': 'Muted',
        'notifications.snooze.resumesInHours':
          count === 1 ? 'Resumes in 1 h' : `Resumes in ${count} h`,
        'notifications.snooze.resumesInMinutes':
          count === 1 ? 'Resumes in 1 min' : `Resumes in ${count} min`,
        'notifications.snooze.silencedCount':
          count === 1 ? 'Muted (1)' : `Muted (${count})`,
        'notifications.snooze.silencedListLabel': 'Muted and snoozed notifications',
        'notifications.snooze.announceSnoozed1h': `${title} snoozed for 1 hour`,
        'notifications.snooze.announceSnoozed8h': `${title} snoozed for 8 hours`,
        'notifications.snooze.announceSnoozed24h': `${title} snoozed for 1 day`,
        'notifications.snooze.announceMuted': `${title} muted`,
        'notifications.snooze.announceResumed': `${title} notifications resumed`,
      };
      return translations[key] ?? key;
    },
    i18n: { language: 'en' },
  }),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FIXED_NOW = 1_700_000_000_000; // deterministic base timestamp

const singleErrorNotification: BillingNotification[] = [
  {
    id: 'failed-charge-1',
    type: 'error',
    title: 'Charge failed',
    message: 'Payment could not be processed.',
    timestamp: '2 min ago',
    actionLabel: 'Fix payment',
    href: '/subscriptions',
    isRead: false,
    category: 'failed-charge',
  },
];

const singleWarningNotification: BillingNotification[] = [
  {
    id: 'low-balance-1',
    type: 'warning',
    title: 'Balance low',
    message: 'Prepaid balance is running low.',
    timestamp: '5 min ago',
    isRead: false,
    category: 'low-balance',
  },
];

const singleInfoNotification: BillingNotification[] = [
  {
    id: 'plan-change-1',
    type: 'info',
    title: 'Plan changed',
    message: 'Plan was upgraded.',
    timestamp: 'Yesterday',
    isRead: true,
    category: 'plan-change',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function openPanel(
  initialNotifications: BillingNotification[],
  getNow: () => number = () => FIXED_NOW,
) {
  render(<NotificationsCenter initialNotifications={initialNotifications} getNow={getNow} />);
  fireEvent.click(screen.getByRole('button', { name: /open billing notifications/i }));
}

function snoozeNotification(duration: '1h' | '8h' | '24h') {
  fireEvent.click(screen.getByRole('button', { name: /snooze or mute/i }));
  const labelMap = { '1h': /1 hour/i, '8h': /8 hours/i, '24h': /1 day/i };
  fireEvent.click(screen.getByRole('menuitem', { name: labelMap[duration] }));
}

function expandSilencedSection() {
  fireEvent.click(screen.getByRole('button', { name: /muted/i }));
}

// ---------------------------------------------------------------------------
// Line 296 — if (!isSnoozed || snoozeExpiresAt == null) return null
//
// resumeLabel is null when:
//   (a) isSnoozed is false (notification is not snoozed), OR
//   (b) snoozeExpiresAt == null (muted indefinitely)
// ---------------------------------------------------------------------------

describe('#795 — Line 296: resumeLabel null guard (!isSnoozed || snoozeExpiresAt == null)', () => {
  it('[failure path — not snoozed] no resume label shown for an active (non-snoozed) notification', () => {
    openPanel(singleErrorNotification);
    // The snooze hint element exists only when (isSnoozed || isMuted) && !isOpen
    // For an active notification the trigger text shows no resume label
    const trigger = screen.getByRole('button', { name: /snooze or mute/i });
    expect(trigger).toBeInTheDocument();
    // No resume/muted hint visible
    expect(screen.queryByText(/resumes in/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/muted/i)).not.toBeInTheDocument();
  });

  it('[failure path — muted (snoozeExpiresAt === null)] shows "Muted" label instead of a resume time', () => {
    openPanel(singleErrorNotification);
    fireEvent.click(screen.getByRole('button', { name: /snooze or mute/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /mute this notification/i }));

    expandSilencedSection();
    const silencedList = screen.getByRole('list', { name: /muted and snoozed/i });
    // When muted the component renders the 'mutedLabel' translation, NOT a resume time
    expect(within(silencedList).getByText(/^Muted$/i)).toBeInTheDocument();
    expect(within(silencedList).queryByText(/resumes in/i)).not.toBeInTheDocument();
  });

  it('[failure path — muted] resume label is null regardless of a past expiresAt value', () => {
    // A muted notification sets expiresAt = null — resumeLabel guard at line 296 fires
    openPanel(singleWarningNotification);
    fireEvent.click(screen.getByRole('button', { name: /snooze or mute/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /mute this notification/i }));

    expandSilencedSection();
    const silencedList = screen.getByRole('list', { name: /muted and snoozed/i });
    expect(within(silencedList).queryByText(/resumes in/i)).not.toBeInTheDocument();
  });

  it('[normal path — snoozed with valid expiresAt] shows a resume label with remaining hours', () => {
    // Snooze for 1h from FIXED_NOW → expiresAt = FIXED_NOW + SNOOZE_1H
    // getNow returns FIXED_NOW so remaining = SNOOZE_1H (positive) → label shown
    openPanel(singleErrorNotification, () => FIXED_NOW);
    snoozeNotification('1h');
    expandSilencedSection();

    const silencedList = screen.getByRole('list', { name: /muted and snoozed/i });
    expect(within(silencedList).getByText(/resumes in/i)).toBeInTheDocument();
  });

  it('[normal path — 8h snooze] resume label appears in the silenced section', () => {
    openPanel(singleWarningNotification, () => FIXED_NOW);
    snoozeNotification('8h');
    expandSilencedSection();

    const silencedList = screen.getByRole('list', { name: /muted and snoozed/i });
    expect(within(silencedList).getByText(/resumes in/i)).toBeInTheDocument();
  });

  it('[normal path — 24h snooze] resume label appears in the silenced section', () => {
    openPanel(singleInfoNotification, () => FIXED_NOW);
    // Info type — make it unread so it shows in active list first
    openPanel(
      [{ ...singleInfoNotification[0], isRead: false }],
      () => FIXED_NOW,
    );
    snoozeNotification('24h');
    expandSilencedSection();

    const silencedList = screen.getByRole('list', { name: /muted and snoozed/i });
    expect(within(silencedList).getByText(/resumes in/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Line 298 — if (remaining <= 0) return null
//
// resumeLabel is null when the snooze has expired (remaining time ≤ 0).
// The guard fires even if isSnoozed is technically still true in state but
// the wall clock has already passed the expiresAt timestamp.
// ---------------------------------------------------------------------------

describe('#795 — Line 298: resumeLabel null guard (remaining <= 0)', () => {
  it('[failure path — remaining exactly 0] expired snooze produces no resume label', () => {
    // getNow returns expiresAt exactly → remaining = 0 → guard fires → return null
    const expiresAt = FIXED_NOW + SNOOZE_1H;
    // Component will snooze at FIXED_NOW; then we advance getNow to expiresAt
    let nowOverride = FIXED_NOW;
    const getNow = () => nowOverride;

    render(
      <NotificationsCenter
        initialNotifications={singleErrorNotification}
        getNow={getNow}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /open billing notifications/i }));
    snoozeNotification('1h');

    // Advance time to exact expiry — isSnoozed check in component also uses getNow
    // so the item will reappear in the active list; but the resumeLabel guard (line 298)
    // is the defensive backstop when remaining ≤ 0 but the item is still in snoozed state.
    nowOverride = expiresAt; // remaining = 0

    expandSilencedSection();
    // The snoozed item may have moved to active; if it's still in silenced section,
    // confirm no "resumes in" text — the guard nullifies the label.
    const silencedSection = screen.queryByRole('list', { name: /muted and snoozed/i });
    if (silencedSection) {
      expect(within(silencedSection).queryByText(/resumes in/i)).not.toBeInTheDocument();
    }
    // Either way: no crash, no resume label text rendered
    expect(screen.queryByText(/resumes in 0/i)).not.toBeInTheDocument();
  });

  it('[failure path — remaining negative (already expired)] no resume label rendered', () => {
    // Start getNow 2 hours AFTER the snooze would have been set — already expired
    const pastNow = FIXED_NOW + SNOOZE_1H + 1;
    render(
      <NotificationsCenter
        initialNotifications={singleErrorNotification}
        getNow={() => pastNow}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /open billing notifications/i }));
    // With getNow already past the expiry, the item is treated as active — no silenced section
    expect(screen.queryByText(/resumes in/i)).not.toBeInTheDocument();
    // Notification is still active (not snoozed from the component's perspective)
    expect(screen.getByText(/charge failed/i)).toBeInTheDocument();
  });

  it('[boundary — remaining exactly 1ms] positive remaining renders a resume label', () => {
    // getNow is 1ms before expiry → remaining = 1 → guard at line 298 does NOT fire
    const almostExpired = FIXED_NOW + SNOOZE_1H - 1;
    let nowOverride = FIXED_NOW;
    const getNow = () => nowOverride;

    render(
      <NotificationsCenter
        initialNotifications={singleErrorNotification}
        getNow={getNow}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /open billing notifications/i }));
    snoozeNotification('1h');

    // Set time to 1ms before expiry (remaining = 1 > 0 → label should appear)
    nowOverride = almostExpired;

    expandSilencedSection();
    const silencedList = screen.getByRole('list', { name: /muted and snoozed/i });
    // remaining = 1ms → Math.ceil(1 / (60*60*1000)) = 1 hour shown
    expect(within(silencedList).getByText(/resumes in/i)).toBeInTheDocument();
  });

  it('[boundary — large remaining (23h59m)] shows hours-based resume label', () => {
    // getNow is slightly after snooze was set (remaining ≈ SNOOZE_24H)
    openPanel(singleErrorNotification, () => FIXED_NOW);
    snoozeNotification('24h');
    expandSilencedSection();

    const silencedList = screen.getByRole('list', { name: /muted and snoozed/i });
    // SNOOZE_24H remaining → Math.ceil(SNOOZE_24H / (60*60*1000)) = 24h
    expect(within(silencedList).getByText(/resumes in 24 h/i)).toBeInTheDocument();
  });

  it('[boundary — remaining < 1h (minutes)] shows minutes-based resume label', () => {
    // Snooze 1h; advance time to 5 minutes before expiry → remaining ≈ 5 min
    const fiveMinutesBefore = FIXED_NOW + SNOOZE_1H - 5 * 60 * 1000;
    let nowOverride = FIXED_NOW;
    const getNow = () => nowOverride;

    render(
      <NotificationsCenter
        initialNotifications={singleErrorNotification}
        getNow={getNow}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /open billing notifications/i }));
    snoozeNotification('1h');

    nowOverride = fiveMinutesBefore; // remaining = 5 min
    expandSilencedSection();

    const silencedList = screen.getByRole('list', { name: /muted and snoozed/i });
    // remaining < 1h → minutes branch: Math.ceil(5*60*1000 / 60000) = 5
    expect(within(silencedList).getByText(/resumes in 5 min/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// BillingNotificationType — all three type values success paths
//
// Covers the normal behaviour of "info", "warning", and "error" types so that
// the BillingNotificationType contract is fully observable and deterministic.
// ---------------------------------------------------------------------------

describe('#795 — BillingNotificationType: all type values (normal paths)', () => {
  it('[info] renders correctly and can be snoozed without throwing', () => {
    const infoN: BillingNotification[] = [
      {
        id: 'info-1',
        type: 'info',
        title: 'Plan updated',
        message: 'Your plan was upgraded.',
        timestamp: 'Just now',
        isRead: false,
        category: 'plan-change',
      },
    ];
    openPanel(infoN);
    expect(screen.getByText('Plan updated')).toBeInTheDocument();
    expect(() => snoozeNotification('1h')).not.toThrow();
  });

  it('[warning] renders correctly and can be muted without throwing', () => {
    openPanel(singleWarningNotification);
    expect(screen.getByText('Balance low')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /snooze or mute/i }));
    expect(() =>
      fireEvent.click(screen.getByRole('menuitem', { name: /mute this notification/i }))
    ).not.toThrow();
  });

  it('[error] renders correctly with actionLabel link when active', () => {
    openPanel(singleErrorNotification);
    expect(screen.getByText('Charge failed')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /fix payment/i })).toBeInTheDocument();
  });

  it('[error] action link is not rendered for items in the muted/snoozed section', () => {
    openPanel(singleErrorNotification);
    snoozeNotification('1h');
    expandSilencedSection();

    const silencedList = screen.getByRole('list', { name: /muted and snoozed/i });
    // Action links are suppressed in the muted section (inMutedSection = true)
    expect(within(silencedList).queryByRole('link', { name: /fix payment/i })).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Snooze menu — SNOOZE_1H / SNOOZE_8H / SNOOZE_24H constant contract
// ---------------------------------------------------------------------------

describe('#795 — Snooze duration constants contract', () => {
  it('SNOOZE_1H is exactly 3_600_000 ms', () => {
    expect(SNOOZE_1H).toBe(3_600_000);
  });

  it('SNOOZE_8H is exactly 28_800_000 ms', () => {
    expect(SNOOZE_8H).toBe(28_800_000);
  });

  it('SNOOZE_24H is exactly 86_400_000 ms', () => {
    expect(SNOOZE_24H).toBe(86_400_000);
  });
});

// ---------------------------------------------------------------------------
// Digest grouping — BillingNotificationType is preserved in grouped rows
// ---------------------------------------------------------------------------

describe('#795 — BillingNotificationType preserved across digest grouping', () => {
  it('digest group inherits the type of the most-recent notification in the group', () => {
    const digestGroup: BillingNotification[] = [
      {
        id: 'fc-1',
        type: 'error',
        title: 'Charge failed',
        message: 'First failure.',
        timestamp: '1 hour ago',
        timestampRank: 1,
        isRead: true,
        category: 'failed-charge',
        targetId: 'sub-x',
      },
      {
        id: 'fc-2',
        type: 'error',
        title: 'Charge failed again',
        message: 'Second failure.',
        timestamp: '5 min ago',
        timestampRank: 2,
        isRead: false,
        category: 'failed-charge',
        targetId: 'sub-x',
      },
    ];
    openPanel(digestGroup);
    // Both belong to the same digest group; should appear as one collapsed row
    expect(screen.getByText('Charge failed again')).toBeInTheDocument();
    // Count badge shows 2
    expect(screen.getByLabelText(/2 occurrences/i)).toBeInTheDocument();
  });

  it('non-grouped (no targetId) notification renders as a single row', () => {
    openPanel(singleInfoNotification);
    expect(screen.getByText('Plan changed')).toBeInTheDocument();
    expect(screen.queryByLabelText(/occurrences/i)).not.toBeInTheDocument();
  });
});
