import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Info,
  RefreshCcw,
  WalletCards,
  X,
} from 'lucide-react';
import './NotificationsCenter.css';

export type BillingNotificationType = 'info' | 'warning' | 'error';

export interface BillingNotification {
  id: string;
  type: BillingNotificationType;
  title: string;
  message: string;
  timestamp: string;
  actionLabel?: string;
  href?: string;
  isRead: boolean;
  category: 'failed-charge' | 'low-balance' | 'plan-change';
}

interface NotificationsCenterProps {
  initialNotifications?: BillingNotification[];
}

const defaultNotifications: BillingNotification[] = [
  {
    id: 'failed-charge-pro-seat',
    type: 'error',
    title: 'Charge failed for Pro Seat',
    message: 'Customer Alicia Stone needs a new payment method before the next retry.',
    timestamp: '4 min ago',
    actionLabel: 'Review charge',
    href: '/dashboard',
    isRead: false,
    category: 'failed-charge',
  },
  {
    id: 'low-balance-api-team',
    type: 'warning',
    title: 'Prepaid balance is running low',
    message: 'API Team has $18.40 remaining and is projected to run out today.',
    timestamp: '21 min ago',
    actionLabel: 'Top up',
    href: '/subscriptions',
    isRead: false,
    category: 'low-balance',
  },
  {
    id: 'plan-change-growth',
    type: 'info',
    title: 'Plan changed to Growth',
    message: 'Northstar Labs upgraded from Starter. The new price is active now.',
    timestamp: 'Yesterday',
    actionLabel: 'View plan',
    href: '/plans',
    isRead: true,
    category: 'plan-change',
  },
];

const typeConfig = {
  info: {
    label: 'Info',
    Icon: Info,
  },
  warning: {
    label: 'Warning',
    Icon: WalletCards,
  },
  error: {
    label: 'Urgent',
    Icon: AlertCircle,
  },
} satisfies Record<BillingNotificationType, { label: string; Icon: typeof Info }>;

const categoryIcon = {
  'failed-charge': RefreshCcw,
  'low-balance': CircleDollarSign,
  'plan-change': CheckCircle2,
};

export default function NotificationsCenter({
  initialNotifications = defaultNotifications,
}: NotificationsCenterProps) {
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const hasNotifications = notifications.length > 0;
  const allRead = hasNotifications && unreadCount === 0;

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        panelRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }

      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const markAllRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isRead: true }))
    );
  };

  return (
    <div className="notifications-center">
      <span className="notifications-live-region" aria-live="polite">
        {unreadCount > 0
          ? `${unreadCount} unread billing notification${unreadCount === 1 ? '' : 's'}`
          : 'All billing notifications are read'}
      </span>

      <button
        ref={triggerRef}
        type="button"
        className="notifications-trigger"
        aria-label={`Open billing notifications${
          unreadCount > 0 ? `, ${unreadCount} unread` : ''
        }`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((current) => !current)}
      >
        <Bell size={20} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="notifications-badge" aria-hidden="true">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          id={panelId}
          className="notifications-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${panelId}-title`}
        >
          <div className="notifications-panel-header">
            <div>
              <p className="notifications-kicker">Billing alerts</p>
              <h2 id={`${panelId}-title`}>Notifications</h2>
            </div>
            <button
              type="button"
              className="notifications-icon-button"
              aria-label="Close billing notifications"
              onClick={() => {
                setIsOpen(false);
                triggerRef.current?.focus();
              }}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="notifications-toolbar">
            <span>
              {unreadCount > 0
                ? `${unreadCount} unread`
                : hasNotifications
                  ? 'All caught up'
                  : 'No alerts'}
            </span>
            <button
              type="button"
              className="notifications-mark-read"
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              Mark all read
            </button>
          </div>

          {!hasNotifications ? (
            <div className="notifications-empty" role="status">
              <CheckCircle2 size={32} aria-hidden="true" />
              <h3>No billing alerts</h3>
              <p>Failed charges, low balances, and plan changes will appear here.</p>
            </div>
          ) : allRead ? (
            <div className="notifications-empty notifications-empty-compact" role="status">
              <CheckCircle2 size={28} aria-hidden="true" />
              <h3>All caught up</h3>
              <p>There are no unread billing events right now.</p>
            </div>
          ) : (
            <ul className="notifications-list" aria-label="Billing notification list">
              {notifications.map((notification) => {
                const { Icon, label } = typeConfig[notification.type];
                const CategoryIcon = categoryIcon[notification.category];

                return (
                  <li
                    key={notification.id}
                    className={`notifications-item notifications-item-${notification.type}`}
                    data-read={notification.isRead}
                  >
                    <div className="notifications-type-icon" aria-hidden="true">
                      <Icon size={18} />
                    </div>
                    <div className="notifications-item-content">
                      <div className="notifications-item-meta">
                        <span>{label}</span>
                        <span aria-label={`Received ${notification.timestamp}`}>
                          {notification.timestamp}
                        </span>
                      </div>
                      <h3>
                        {!notification.isRead && (
                          <span className="notifications-unread-dot" aria-label="Unread" />
                        )}
                        {notification.title}
                      </h3>
                      <p>{notification.message}</p>
                      <div className="notifications-item-footer">
                        <span>
                          <CategoryIcon size={15} aria-hidden="true" />
                          {notification.category.replace('-', ' ')}
                        </span>
                        {notification.actionLabel && notification.href && (
                          <a href={notification.href} className="notifications-action">
                            {notification.actionLabel}
                            <ChevronRight size={15} aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
