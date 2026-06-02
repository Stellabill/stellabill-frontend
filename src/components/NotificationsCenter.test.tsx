import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import NotificationsCenter, { BillingNotification } from './NotificationsCenter';

const manyNotifications: BillingNotification[] = Array.from({ length: 14 }, (_, index) => ({
  id: `notification-${index}`,
  type: index % 3 === 0 ? 'error' : index % 3 === 1 ? 'warning' : 'info',
  title: `Billing event ${index + 1}`,
  message: 'A billing event needs attention.',
  timestamp: `${index + 1} min ago`,
  actionLabel: 'Review',
  href: '/dashboard',
  isRead: index > 4,
  category: index % 3 === 0 ? 'failed-charge' : index % 3 === 1 ? 'low-balance' : 'plan-change',
}));

describe('NotificationsCenter', () => {
  it('shows an accessible bell trigger with unread badge count', () => {
    render(<NotificationsCenter />);

    expect(
      screen.getByRole('button', { name: /open billing notifications, 2 unread/i })
    ).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('opens the panel with actionable billing notification types', () => {
    render(<NotificationsCenter />);

    fireEvent.click(screen.getByRole('button', { name: /open billing notifications/i }));

    expect(screen.getByRole('dialog', { name: /notifications/i })).toBeInTheDocument();
    expect(screen.getByText(/charge failed for pro seat/i)).toBeInTheDocument();
    expect(screen.getByText(/prepaid balance is running low/i)).toBeInTheDocument();
    expect(screen.getByText(/plan changed to growth/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /review charge/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /top up/i })).toHaveAttribute('href', '/subscriptions');
  });

  it('marks every notification read and shows the all caught up state', () => {
    render(<NotificationsCenter />);

    fireEvent.click(screen.getByRole('button', { name: /open billing notifications/i }));
    fireEvent.click(screen.getByRole('button', { name: /mark all read/i }));

    expect(screen.getByText(/there are no unread billing events/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mark all read/i })).toBeDisabled();
    expect(screen.queryByRole('list', { name: /billing notification list/i })).not.toBeInTheDocument();
  });

  it('renders the empty state when there are no persistent alerts', () => {
    render(<NotificationsCenter initialNotifications={[]} />);

    fireEvent.click(screen.getByRole('button', { name: /open billing notifications/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/no billing alerts/i);
    expect(screen.getByText(/failed charges, low balances, and plan changes/i)).toBeInTheDocument();
  });

  it('supports many items in a scrollable list', () => {
    render(<NotificationsCenter initialNotifications={manyNotifications} />);

    fireEvent.click(screen.getByRole('button', { name: /open billing notifications/i }));

    const list = screen.getByRole('list', { name: /billing notification list/i });
    expect(within(list).getAllByRole('listitem')).toHaveLength(14);
  });

  it('closes with Escape and returns focus to the trigger', () => {
    render(<NotificationsCenter />);

    const trigger = screen.getByRole('button', { name: /open billing notifications/i });
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: /notifications/i })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
