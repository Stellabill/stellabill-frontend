import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  Bell,
  BellOff,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Info,
  RefreshCcw,
  Timer,
  VolumeX,
  WalletCards,
  X,
} from 'lucide-react';
import './NotificationsCenter.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

/** Duration constants in milliseconds. */
export const SNOOZE_1H = 60 * 60 * 1000;
export const SNOOZE_8H = 8 * 60 * 60 * 1000;
export const SNOOZE_24H = 24 * 60 * 60 * 1000;

/** Possible silence modes for a single notification. */
export type SnoozeDuration = typeof SNOOZE_1H | typeof SNOOZE_8H | typeof SNOOZE_24H;

/**
 * Tracks the silence state of a single notification.
 * - `expiresAt !== null`  → snoozed until that timestamp (ms since epoch)
 * - `expiresAt === null`  → muted indefinitely
 */
export interface NotificationSilenceState {
  expiresAt: number | null;
}

// ---------------------------------------------------------------------------
// Default data
// ---------------------------------------------------------------------------

const defaultNotifications: BillingNotification[] = [
  {
    id: 'failed-charge-pro-seat',
    type: 'error',
    title: 'Charge failed for Pro Seat',
    message:
      "We couldn't process the most recent payment for this subscription. Update the payment method to avoid service interruptions.",
    timestamp: '4 min ago',
    actionLabel: 'Fix payment method',
    href: '/subscriptions',
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

// ---------------------------------------------------------------------------
// Static config maps
// ---------------------------------------------------------------------------

const typeConfig = {
  info: { label: 'Info', Icon: Info },
  warning: { label: 'Warning', Icon: WalletCards },
  error: { label: 'Urgent', Icon: AlertCircle },
} satisfies Record<BillingNotificationType, { label: string; Icon: typeof Info }>;

const categoryIcon = {
  'failed-charge': RefreshCcw,
  'low-balance': CircleDollarSign,
  'plan-change': CheckCircle2,
};

// ---------------------------------------------------------------------------
// SnoozeMenu sub-component
// ---------------------------------------------------------------------------

interface SnoozeMenuProps {
  notificationId: string;
  notificationTitle: string;
  isSnoozed: boolean;
  isMuted: boolean;
  snoozeExpiresAt: number | null | undefined;
  onSnooze: (id: string, duration: SnoozeDuration) => void;
  onMute: (id: string) => void;
  onUnmute: (id: string) => void;
}

function SnoozeMenu({
  notificationId,
  notificationTitle,
  isSnoozed,
  isMuted,
  snoozeExpiresAt,
  onSnooze,
  onMute,
  onUnmute,
}: SnoozeMenuProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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

  // Keyboard navigation within menu items
  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();

    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []
    );
    if (items.length === 0) return;

    const currentIndex = items.findIndex((el) => el === document.activeElement);

    if (e.key === 'ArrowDown' || e.key === 'Home') {
      const next = e.key === 'Home' ? 0 : Math.min(currentIndex + 1, items.length - 1);
      items[next]?.focus();
    } else if (e.key === 'ArrowUp' || e.key === 'End') {
      const prev = e.key === 'End' ? items.length - 1 : Math.max(currentIndex - 1, 0);
      items[prev]?.focus();
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      // Focus first item on next render
      setTimeout(() => {
        const first = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
        first?.focus();
      }, 0);
    }
  };

  const handleSnooze = (duration: SnoozeDuration) => {
    onSnooze(notificationId, duration);
    setIsOpen(false);
  };

  const handleMute = () => {
    onMute(notificationId);
    setIsOpen(false);
  };

  const handleUnmute = () => {
    onUnmute(notificationId);
    setIsOpen(false);
  };

  // Derive friendly resume label if snoozed
  const resumeLabel = useMemo(() => {
    if (!isSnoozed || snoozeExpiresAt == null) return null;
    const remaining = snoozeExpiresAt - Date.now();
    if (remaining <= 0) return null;
    const hours = Math.ceil(remaining / (60 * 60 * 1000));
    if (hours < 1) {
      const mins = Math.ceil(remaining / 60000);
      return t('notifications.snooze.resumesInMinutes', { count: mins });
    }
    return t('notifications.snooze.resumesInHours', { count: hours });
  }, [isSnoozed, snoozeExpiresAt, t]);

  return (
    <div className="notifications-snooze-wrapper" ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        className="notifications-snooze-trigger"
        aria-label={
          isMuted
            ? t('notifications.snooze.triggerLabelMuted', { title: notificationTitle })
            : isSnoozed
            ? t('notifications.snooze.triggerLabelSnoozed', { title: notificationTitle })
            : t('notifications.snooze.triggerLabel', { title: notificationTitle })
        }
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setIsOpen((v) => !v)}
        onKeyDown={handleTriggerKeyDown}
        data-snoozed={isSnoozed || undefined}
        data-muted={isMuted || undefined}
      >
        {isMuted ? (
          <VolumeX size={15} aria-hidden="true" />
        ) : isSnoozed ? (
          <Clock size={15} aria-hidden="true" />
        ) : (
          <Timer size={15} aria-hidden="true" />
        )}
        <ChevronDown size={12} aria-hidden="true" className="notifications-snooze-chevron" />
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label={t('notifications.snooze.menuLabel', { title: notificationTitle })}
          className="notifications-snooze-menu"
          onKeyDown={handleMenuKeyDown}
        >
          {/* Snooze options — only show when not currently muted */}
          {!isMuted && (
            <>
              <p className="notifications-snooze-menu-heading" role="presentation">
                {t('notifications.snooze.snoozeFor')}
              </p>
              <button
                type="button"
                role="menuitem"
                className="notifications-snooze-menu-item"
                onClick={() => handleSnooze(SNOOZE_1H)}
              >
                <Clock size={14} aria-hidden="true" />
                {t('notifications.snooze.1h')}
              </button>
              <button
                type="button"
                role="menuitem"
                className="notifications-snooze-menu-item"
                onClick={() => handleSnooze(SNOOZE_8H)}
              >
                <Clock size={14} aria-hidden="true" />
                {t('notifications.snooze.8h')}
              </button>
              <button
                type="button"
                role="menuitem"
                className="notifications-snooze-menu-item"
                onClick={() => handleSnooze(SNOOZE_24H)}
              >
                <Clock size={14} aria-hidden="true" />
                {t('notifications.snooze.24h')}
              </button>

              <div className="notifications-snooze-divider" role="separator" aria-hidden="true" />
            </>
          )}

          {/* Mute / Unmute */}
          {isMuted ? (
            <button
              type="button"
              role="menuitem"
              className="notifications-snooze-menu-item notifications-snooze-menu-item-unmute"
              onClick={handleUnmute}
            >
              <Bell size={14} aria-hidden="true" />
              {t('notifications.snooze.unmute')}
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              className="notifications-snooze-menu-item notifications-snooze-menu-item-mute"
              onClick={handleMute}
            >
              <VolumeX size={14} aria-hidden="true" />
              {t('notifications.snooze.mute')}
            </button>
          )}

          {/* Unsnooze shortcut when snoozed */}
          {isSnoozed && !isMuted && (
            <button
              type="button"
              role="menuitem"
              className="notifications-snooze-menu-item notifications-snooze-menu-item-unsnooze"
              onClick={handleUnmute}
            >
              <Bell size={14} aria-hidden="true" />
              {t('notifications.snooze.unsnooze')}
            </button>
          )}
        </div>
      )}

      {/* Resume hint shown inline under trigger when snoozed */}
      {(isSnoozed || isMuted) && !isOpen && (
        <span className="notifications-snooze-resume" aria-live="off">
          {isMuted
            ? t('notifications.snooze.mutedLabel')
            : resumeLabel}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// NotificationsCenter component props
// ---------------------------------------------------------------------------

interface NotificationsCenterProps {
  initialNotifications?: BillingNotification[];
  /** Override Date.now() for deterministic tests */
  getNow?: () => number;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function NotificationsCenter({
  initialNotifications = defaultNotifications,
  getNow = Date.now,
}: NotificationsCenterProps) {
  const { t } = useTranslation();
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);

  /**
   * Maps notification ID → silence state.
   *  expiresAt = number  → snoozed until that timestamp
   *  expiresAt = null    → muted indefinitely
   */
  const [silenceMap, setSilenceMap] = useState<Map<string, NotificationSilenceState>>(
    () => new Map()
  );

  /** Whether the muted section footer is collapsed or expanded. */
  const [mutedExpanded, setMutedExpanded] = useState(false);

  // Live-region message driven by the last user action
  const [liveMessage, setLiveMessage] = useState('');

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const now = getNow();

  const isSnoozed = (id: string): boolean => {
    const state = silenceMap.get(id);
    if (!state) return false;
    if (state.expiresAt === null) return false; // muted, not snoozed
    return state.expiresAt > now;
  };

  const isMuted = (id: string): boolean => {
    const state = silenceMap.get(id);
    if (!state) return false;
    return state.expiresAt === null;
  };

  const isSilenced = (id: string) => isSnoozed(id) || isMuted(id);

  const activeNotifications = useMemo(
    () => notifications.filter((n) => !isSilenced(n.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [notifications, silenceMap, now]
  );

  const mutedNotifications = useMemo(
    () => notifications.filter((n) => isMuted(n.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [notifications, silenceMap]
  );

  const snoozedNotifications = useMemo(
    () => notifications.filter((n) => isSnoozed(n.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [notifications, silenceMap, now]
  );

  const unreadCount = useMemo(
    () => activeNotifications.filter((n) => !n.isRead).length,
    [activeNotifications]
  );

  const hasActiveNotifications = activeNotifications.length > 0;
  const allRead = hasActiveNotifications && unreadCount === 0;

  // ---------------------------------------------------------------------------
  // Panel open/close effects (Escape + outside click)
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const markAllRead = () => {
    setNotifications((current) =>
      current.map((n) => ({ ...n, isRead: true }))
    );
  };

  const snoozeNotification = (id: string, duration: SnoozeDuration) => {
    const expiresAt = getNow() + duration;
    setSilenceMap((prev) => {
      const next = new Map(prev);
      next.set(id, { expiresAt });
      return next;
    });
    const hours = duration / (60 * 60 * 1000);
    const labelKey =
      hours === 1
        ? 'notifications.snooze.announceSnoozed1h'
        : hours === 8
        ? 'notifications.snooze.announceSnoozed8h'
        : 'notifications.snooze.announceSnoozed24h';
    const title = notifications.find((n) => n.id === id)?.title ?? id;
    setLiveMessage(t(labelKey, { title }));
  };

  const muteNotification = (id: string) => {
    setSilenceMap((prev) => {
      const next = new Map(prev);
      next.set(id, { expiresAt: null });
      return next;
    });
    const title = notifications.find((n) => n.id === id)?.title ?? id;
    setLiveMessage(t('notifications.snooze.announceMuted', { title }));
  };

  const unmuteNotification = (id: string) => {
    setSilenceMap((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
    const title = notifications.find((n) => n.id === id)?.title ?? id;
    setLiveMessage(t('notifications.snooze.announceResumed', { title }));
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderNotificationItem = (notification: BillingNotification, inMutedSection = false) => {
    const { Icon, label } = typeConfig[notification.type];
    const CategoryIcon = categoryIcon[notification.category];
    const snoozed = isSnoozed(notification.id);
    const muted = isMuted(notification.id);
    const silenceState = silenceMap.get(notification.id);

    return (
      <li
        key={notification.id}
        className={`notifications-item notifications-item-${notification.type}${inMutedSection ? ' notifications-item-muted' : ''}`}
        data-read={notification.isRead}
        data-snoozed={snoozed || undefined}
        data-muted={muted || undefined}
      >
        <div className="notifications-type-icon" aria-hidden="true">
          <Icon size={18} />
        </div>
        <div className="notifications-item-content">
          <div className="notifications-item-meta">
            <span>{label}</span>
            <div className="notifications-item-meta-right">
              <span aria-label={`Received ${notification.timestamp}`}>
                {notification.timestamp}
              </span>
              <SnoozeMenu
                notificationId={notification.id}
                notificationTitle={notification.title}
                isSnoozed={snoozed}
                isMuted={muted}
                snoozeExpiresAt={silenceState?.expiresAt}
                onSnooze={snoozeNotification}
                onMute={muteNotification}
                onUnmute={unmuteNotification}
              />
            </div>
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
            {notification.actionLabel && notification.href && !inMutedSection && (
              <a href={notification.href} className="notifications-action">
                {notification.actionLabel}
                <ChevronRight size={15} aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </li>
    );
  };

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------

  const silencedCount = mutedNotifications.length + snoozedNotifications.length;

  return (
    <div className="notifications-center">
      {/* Polite live region for screen readers */}
      <span
        className="notifications-live-region"
        aria-live="polite"
        aria-atomic="true"
      >
        {liveMessage || t('notifications.liveRegion', { count: unreadCount })}
      </span>

      {/* Bell trigger */}
      <button
        ref={triggerRef}
        type="button"
        className="notifications-trigger"
        aria-label={t('notifications.triggerLabel', { count: unreadCount })}
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

      {/* Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          id={panelId}
          className="notifications-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${panelId}-title`}
        >
          {/* Header */}
          <div className="notifications-panel-header">
            <div>
              <p className="notifications-kicker">{t('notifications.billingAlerts')}</p>
              <h2 id={`${panelId}-title`}>{t('notifications.title')}</h2>
            </div>
            <button
              type="button"
              className="notifications-icon-button"
              aria-label={t('notifications.close')}
              onClick={() => {
                setIsOpen(false);
                triggerRef.current?.focus();
              }}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {/* Toolbar */}
          <div className="notifications-toolbar">
            <span>
              {allRead
                ? t('notifications.toolbarAllRead')
                : t('notifications.toolbar', { count: unreadCount })}
            </span>
            <button
              type="button"
              className="notifications-mark-read"
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              {t('notifications.markAllRead')}
            </button>
          </div>

          {/* Main notification list */}
          {!hasActiveNotifications && silencedCount === 0 ? (
            <div className="notifications-empty" role="status">
              <CheckCircle2 size={32} aria-hidden="true" />
              <h3>{t('notifications.emptyTitle')}</h3>
              <p>{t('notifications.emptyDescription')}</p>
            </div>
          ) : !hasActiveNotifications && silencedCount > 0 ? (
            <div className="notifications-empty notifications-empty-compact" role="status">
              <BellOff size={28} aria-hidden="true" />
              <h3>{t('notifications.allSilencedTitle')}</h3>
              <p>{t('notifications.allSilencedDescription', { count: silencedCount })}</p>
            </div>
          ) : allRead ? (
            <div className="notifications-empty notifications-empty-compact" role="status">
              <CheckCircle2 size={28} aria-hidden="true" />
              <h3>{t('notifications.allReadTitle')}</h3>
              <p>{t('notifications.allReadDescription')}</p>
            </div>
          ) : (
            <ul
              className="notifications-list"
              aria-label={t('notifications.listLabel')}
            >
              {activeNotifications.map((n) => renderNotificationItem(n))}
            </ul>
          )}

          {/* Muted / snoozed section footer */}
          {silencedCount > 0 && (
            <div className="notifications-silenced-section">
              <button
                type="button"
                className="notifications-silenced-toggle"
                aria-expanded={mutedExpanded}
                aria-controls="notifications-silenced-list"
                onClick={() => setMutedExpanded((v) => !v)}
              >
                <BellOff size={14} aria-hidden="true" />
                <span>
                  {t('notifications.snooze.silencedCount', { count: silencedCount })}
                </span>
                <ChevronDown
                  size={14}
                  aria-hidden="true"
                  className={`notifications-silenced-chevron${mutedExpanded ? ' notifications-silenced-chevron-open' : ''}`}
                />
              </button>

              {mutedExpanded && (
                <ul
                  id="notifications-silenced-list"
                  className="notifications-list notifications-list-silenced"
                  aria-label={t('notifications.snooze.silencedListLabel')}
                >
                  {mutedNotifications.map((n) => renderNotificationItem(n, true))}
                  {snoozedNotifications.map((n) => renderNotificationItem(n, true))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
