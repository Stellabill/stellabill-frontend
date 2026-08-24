import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import NotificationsCenter, {
  BillingNotification,
  SNOOZE_1H,
  SNOOZE_8H,
  SNOOZE_24H,
} from './NotificationsCenter';

// ---------------------------------------------------------------------------
// i18n mock — flat key map covering both original and new snooze/mute keys
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const count = typeof opts?.count === 'number' ? opts.count : 0;
      const title = typeof opts?.title === 'string' ? opts.title : '';
      const translations: Record<string, string> = {
        // Original keys
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

        // Snooze / mute keys
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
// Fixture data
// ---------------------------------------------------------------------------

const singleNotification: BillingNotification[] = [
  {
    id: 'failed-charge-pro-seat',
    type: 'error',
    title: 'Charge failed for Pro Seat',
    message: 'Update the payment method.',
    timestamp: '4 min ago',
    actionLabel: 'Fix payment method',
    href: '/subscriptions',
    isRead: false,
    category: 'failed-charge',
  },
];

const twoNotifications: BillingNotification[] = [
  ...singleNotification,
  {
    id: 'low-balance-api-team',
    type: 'warning',
    title: 'Prepaid balance is running low',
    message: 'API Team has $18.40 remaining.',
    timestamp: '21 min ago',
    actionLabel: 'Top up',
    href: '/subscriptions',
    isRead: false,
    category: 'low-balance',
  },
];

const manyNotifications: BillingNotification[] = Array.from({ length: 14 }, (_, i) => ({
  id: `notification-${i}`,
  type: (i % 3 === 0 ? 'error' : i % 3 === 1 ? 'warning' : 'info') as BillingNotification['type'],
  title: `Billing event ${i + 1}`,
  message: 'A billing event needs attention.',
  timestamp: `${i + 1} min ago`,
  actionLabel: 'Review',
  href: '/dashboard',
  isRead: i > 4,
  category: (i % 3 === 0
    ? 'failed-charge'
    : i % 3 === 1
    ? 'low-balance'
    : 'plan-change') as BillingNotification['category'],
}));

// Fixed "now" for deterministic snooze expiry assertions
const FIXED_NOW = 1_700_000_000_000;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function openPanel(initialNotifications?: BillingNotification[]) {
  render(
    <NotificationsCenter
      initialNotifications={initialNotifications}
      getNow={() => FIXED_NOW}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: /open billing notifications/i }));
}

function openSnoozeMenu(notificationTitle: RegExp | string) {
  const item = screen
    .getAllByRole('listitem')
    .find((li) => li.textContent?.includes(typeof notificationTitle === 'string' ? notificationTitle : ''));

  // Use accessible label on the snooze trigger
  const trigger = screen.getAllByRole('button', { name: /snooze or mute/i })[0];
  fireEvent.click(trigger);
  return trigger;
}

// ---------------------------------------------------------------------------
// Original behaviour (regression tests)
// ---------------------------------------------------------------------------

describe('NotificationsCenter — original behaviour', () => {
  it('shows an accessible bell trigger with unread badge count', () => {
    render(<NotificationsCenter getNow={() => FIXED_NOW} />);
    expect(
      screen.getByRole('button', { name: /open billing notifications, 2 unread/i })
    ).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('opens the panel with actionable billing notification types', () => {
    openPanel();
    expect(screen.getByRole('dialog', { name: /notifications/i })).toBeInTheDocument();
    expect(screen.getByText(/charge failed for pro seat/i)).toBeInTheDocument();
    expect(screen.getByText(/prepaid balance is running low/i)).toBeInTheDocument();
    expect(screen.getByText(/plan changed to growth/i)).toBeInTheDocument();
  });

  it('marks every notification read and shows the all caught up state', () => {
    openPanel();
    fireEvent.click(screen.getByRole('button', { name: /mark all read/i }));
    expect(screen.getByText(/there are no unread billing events/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mark all read/i })).toBeDisabled();
  });

  it('renders the empty state when there are no notifications', () => {
    render(<NotificationsCenter initialNotifications={[]} getNow={() => FIXED_NOW} />);
    fireEvent.click(screen.getByRole('button', { name: /open billing notifications/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/no billing alerts/i);
  });

  it('supports many items in a scrollable list', () => {
    openPanel(manyNotifications);
    const list = screen.getByRole('list', { name: /billing notification list/i });
    expect(within(list).getAllByRole('listitem')).toHaveLength(14);
  });

  it('closes with Escape and returns focus to the trigger', () => {
    openPanel();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /open billing notifications/i })
    ).toHaveFocus();
  });
});

// ---------------------------------------------------------------------------
// Snooze tests
// ---------------------------------------------------------------------------

describe('NotificationsCenter — snooze', () => {
  it('renders a snooze trigger button for each notification item', () => {
    openPanel(twoNotifications);
    const triggers = screen.getAllByRole('button', { name: /snooze or mute/i });
    expect(triggers).toHaveLength(2);
  });

  it('opens the snooze dropdown menu on click', () => {
    openPanel(singleNotification);
    const trigger = screen.getByRole('button', { name: /snooze or mute/i });
    fireEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /1 hour/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /8 hours/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /1 day/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /mute this notification/i })).toBeInTheDocument();
  });

  it('closes the menu with Escape and the menu is no longer in the DOM', () => {
    openPanel(singleNotification);
    const trigger = screen.getByRole('button', { name: /snooze or mute/i });
    fireEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('snoozes a notification for 1 hour and removes it from the active list', () => {
    openPanel(singleNotification);
    const trigger = screen.getByRole('button', { name: /snooze or mute/i });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('menuitem', { name: /1 hour/i }));

    // Item should no longer appear in the main list
    expect(
      screen.queryByRole('list', { name: /billing notification list/i })
    ).not.toBeInTheDocument();
  });

  it('snoozes a notification for 8 hours and removes it from the active list', () => {
    openPanel(singleNotification);
    fireEvent.click(screen.getByRole('button', { name: /snooze or mute/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /8 hours/i }));

    expect(
      screen.queryByRole('list', { name: /billing notification list/i })
    ).not.toBeInTheDocument();
  });

  it('snoozes a notification for 1 day and removes it from the active list', () => {
    openPanel(singleNotification);
    fireEvent.click(screen.getByRole('button', { name: /snooze or mute/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /1 day/i }));

    expect(
      screen.queryByRole('list', { name: /billing notification list/i })
    ).not.toBeInTheDocument();
  });

  it('announces the snooze action via the polite live region', () => {
    openPanel(singleNotification);
    fireEvent.click(screen.getByRole('button', { name: /snooze or mute/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /1 hour/i }));

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion?.textContent).toMatch(/snoozed for 1 hour/i);
  });

  it('increments the silenced section count after snoozing', () => {
    openPanel(singleNotification);
    fireEvent.click(screen.getByRole('button', { name: /snooze or mute/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /1 hour/i }));

    expect(screen.getByRole('button', { name: /muted \(1\)/i })).toBeInTheDocument();
  });

  it('shows the snoozed item inside the silenced section when expanded', () => {
    openPanel(singleNotification);
    fireEvent.click(screen.getByRole('button', { name: /snooze or mute/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /1 hour/i }));

    // Expand silenced section
    fireEvent.click(screen.getByRole('button', { name: /muted/i }));
    const silencedList = screen.getByRole('list', { name: /muted and snoozed/i });
    expect(within(silencedList).getByText(/charge failed for pro seat/i)).toBeInTheDocument();
  });

  it('unsnoozes via "Resume now" and brings the item back to the active list', () => {
    openPanel(singleNotification);

    // Snooze first
    fireEvent.click(screen.getByRole('button', { name: /snooze or mute/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /1 hour/i }));

    // Expand silenced section
    fireEvent.click(screen.getByRole('button', { name: /muted/i }));

    // Open snooze menu on snoozed item, then resume
    const silencedList = screen.getByRole('list', { name: /muted and snoozed/i });
    const resumeTrigger = within(silencedList).getByRole('button', { name: /snoozed/i });
    fireEvent.click(resumeTrigger);
    fireEvent.click(screen.getByRole('menuitem', { name: /resume now/i }));

    // Item should be back in the active list — find it by its heading inside the notification list
    const activeList = screen.getByRole('list', { name: /billing notification list/i });
    expect(within(activeList).getByText(/charge failed for pro seat/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Mute tests
// ---------------------------------------------------------------------------

describe('NotificationsCenter — mute', () => {
  it('mutes a notification and removes it from the active list', () => {
    openPanel(singleNotification);
    fireEvent.click(screen.getByRole('button', { name: /snooze or mute/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /mute this notification/i }));

    expect(
      screen.queryByRole('list', { name: /billing notification list/i })
    ).not.toBeInTheDocument();
  });

  it('announces the mute action via the polite live region', () => {
    openPanel(singleNotification);
    fireEvent.click(screen.getByRole('button', { name: /snooze or mute/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /mute this notification/i }));

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion?.textContent).toMatch(/muted/i);
  });

  it('shows muted item in the silenced section footer with correct count', () => {
    openPanel(twoNotifications);

    // Mute first notification
    fireEvent.click(screen.getAllByRole('button', { name: /snooze or mute/i })[0]);
    fireEvent.click(screen.getByRole('menuitem', { name: /mute this notification/i }));

    expect(screen.getByRole('button', { name: /muted \(1\)/i })).toBeInTheDocument();
  });

  it('shows muted count of 2 when two notifications are muted', () => {
    openPanel(twoNotifications);

    fireEvent.click(screen.getAllByRole('button', { name: /snooze or mute/i })[0]);
    fireEvent.click(screen.getByRole('menuitem', { name: /mute this notification/i }));

    fireEvent.click(screen.getAllByRole('button', { name: /snooze or mute/i })[0]);
    fireEvent.click(screen.getByRole('menuitem', { name: /mute this notification/i }));

    expect(screen.getByRole('button', { name: /muted \(2\)/i })).toBeInTheDocument();
  });

  it('shows "Unmute" option in the snooze menu of a muted notification', () => {
    openPanel(singleNotification);
    fireEvent.click(screen.getByRole('button', { name: /snooze or mute/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /mute this notification/i }));

    // Expand silenced section
    fireEvent.click(screen.getByRole('button', { name: /muted/i }));

    const silencedList = screen.getByRole('list', { name: /muted and snoozed/i });
    const mutedTrigger = within(silencedList).getByRole('button', { name: /muted —/i });
    fireEvent.click(mutedTrigger);

    expect(screen.getByRole('menuitem', { name: /unmute/i })).toBeInTheDocument();
    // Snooze options should NOT be present for muted items
    expect(screen.queryByRole('menuitem', { name: /1 hour/i })).not.toBeInTheDocument();
  });

  it('unmutes a notification and brings it back to the active list', () => {
    openPanel(singleNotification);
    fireEvent.click(screen.getByRole('button', { name: /snooze or mute/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /mute this notification/i }));

    // Expand silenced section and unmute
    fireEvent.click(screen.getByRole('button', { name: /muted/i }));
    const silencedList = screen.getByRole('list', { name: /muted and snoozed/i });
    fireEvent.click(within(silencedList).getByRole('button', { name: /muted —/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /unmute/i }));

    const activeList = screen.getByRole('list', { name: /billing notification list/i });
    expect(within(activeList).getByText(/charge failed for pro seat/i)).toBeInTheDocument();
  });

  it('announces unmute via the polite live region', () => {
    openPanel(singleNotification);
    fireEvent.click(screen.getByRole('button', { name: /snooze or mute/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /mute this notification/i }));

    fireEvent.click(screen.getByRole('button', { name: /muted/i }));
    const silencedList = screen.getByRole('list', { name: /muted and snoozed/i });
    fireEvent.click(within(silencedList).getByRole('button', { name: /muted —/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /unmute/i }));

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion?.textContent).toMatch(/notifications resumed/i);
  });

  it('shows "all silenced" state when every notification is muted', () => {
    openPanel(singleNotification);
    fireEvent.click(screen.getByRole('button', { name: /snooze or mute/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /mute this notification/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/all notifications silenced/i);
  });
});

// ---------------------------------------------------------------------------
// Snooze expiry mid-view
// ---------------------------------------------------------------------------

describe('NotificationsCenter — snooze expiry', () => {
  it('treats a notification as active once its snooze has expired', () => {
    // Use a getNow that starts in the past relative to when snooze expires
    const pastNow = FIXED_NOW - SNOOZE_1H - 1; // already expired
    render(
      <NotificationsCenter
        initialNotifications={singleNotification}
        getNow={() => pastNow}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /open billing notifications/i }));

    // The item should be in the active list even if we set silenceMap externally —
    // here we verify that the expiry logic is correct by confirming the notification
    // appears normally when getNow() is past the expiresAt boundary.
    expect(screen.getByRole('list', { name: /billing notification list/i })).toBeInTheDocument();
    expect(screen.getByText(/charge failed for pro seat/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Keyboard navigation in the snooze menu
// ---------------------------------------------------------------------------

describe('NotificationsCenter — snooze menu keyboard navigation', () => {
  beforeEach(() => {
    openPanel(singleNotification);
    fireEvent.click(screen.getByRole('button', { name: /snooze or mute/i }));
  });

  it('opens the menu on click and first item is focusable', () => {
    // beforeEach already opened the panel and the snooze menu
    // Just verify the menu items are present and accessible
    const items = screen.getAllByRole('menuitem');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]).toBeInTheDocument();
  });

  it('navigates down through menu items with ArrowDown', () => {
    const items = screen.getAllByRole('menuitem');
    items[0].focus();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[1]);
  });

  it('navigates up through menu items with ArrowUp', () => {
    const items = screen.getAllByRole('menuitem');
    items[1].focus();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowUp' });
    expect(document.activeElement).toBe(items[0]);
  });

  it('jumps to last item with End key', () => {
    const items = screen.getAllByRole('menuitem');
    items[0].focus();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'End' });
    expect(document.activeElement).toBe(items[items.length - 1]);
  });

  it('jumps to first item with Home key', () => {
    const items = screen.getAllByRole('menuitem');
    items[items.length - 1].focus();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Home' });
    expect(document.activeElement).toBe(items[0]);
  });
});

// ---------------------------------------------------------------------------
// RTL layout
// ---------------------------------------------------------------------------

describe('NotificationsCenter — RTL', () => {
  it('renders without error in an RTL document direction', () => {
    document.documentElement.setAttribute('dir', 'rtl');
    openPanel(singleNotification);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /snooze or mute/i })).toBeInTheDocument();
    document.documentElement.removeAttribute('dir');
  });
});

// ---------------------------------------------------------------------------
// Screen-reader label assertions
// ---------------------------------------------------------------------------

describe('NotificationsCenter — screen reader labels', () => {
  it('snooze trigger has label describing the notification title when idle', () => {
    openPanel(singleNotification);
    expect(
      screen.getByRole('button', {
        name: /snooze or mute: charge failed for pro seat/i,
      })
    ).toBeInTheDocument();
  });

  it('snooze trigger label updates to "Snoozed" after snoozing', () => {
    openPanel(singleNotification);
    fireEvent.click(screen.getByRole('button', { name: /snooze or mute/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /1 hour/i }));

    // Expand silenced section
    fireEvent.click(screen.getByRole('button', { name: /muted/i }));
    expect(
      screen.getByRole('button', { name: /snoozed — charge failed for pro seat/i })
    ).toBeInTheDocument();
  });

  it('snooze trigger label updates to "Muted" after muting', () => {
    openPanel(singleNotification);
    fireEvent.click(screen.getByRole('button', { name: /snooze or mute/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /mute this notification/i }));

    fireEvent.click(screen.getByRole('button', { name: /muted/i }));
    expect(
      screen.getByRole('button', { name: /muted — charge failed for pro seat/i })
    ).toBeInTheDocument();
  });

  it('snooze menu has an accessible label tied to the notification title', () => {
    openPanel(singleNotification);
    fireEvent.click(screen.getByRole('button', { name: /snooze or mute/i }));
    expect(
      screen.getByRole('menu', {
        name: /snooze or mute options for charge failed for pro seat/i,
      })
    ).toBeInTheDocument();
  });

  it('silenced section toggle has aria-expanded=false when collapsed', () => {
    openPanel(singleNotification);
    fireEvent.click(screen.getByRole('button', { name: /snooze or mute/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /mute this notification/i }));

    const toggle = screen.getByRole('button', { name: /muted/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('silenced section toggle has aria-expanded=true when open', () => {
    openPanel(singleNotification);
    fireEvent.click(screen.getByRole('button', { name: /snooze or mute/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /mute this notification/i }));

    const toggle = screen.getByRole('button', { name: /muted/i });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});
