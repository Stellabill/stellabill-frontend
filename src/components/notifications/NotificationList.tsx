import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Info,
  Layers3,
  WalletCards,
  RefreshCcw,
} from "lucide-react";
import SnoozeMenu from "./SnoozeMenu";
import {
  isNotificationMuted,
  isNotificationSnoozed,
} from "./store";
import type {
  BillingNotification,
  BillingNotificationType,
  NotificationSilenceState,
  SnoozeDuration,
} from "./types";

type NotificationDigestGroup = {
  key: string;
  type: BillingNotificationType;
  category: BillingNotification["category"];
  title: string;
  actionLabel?: string;
  href?: string;
  hasUnread: boolean;
  oldestTimestamp: string;
  newestTimestamp: string;
  items: BillingNotification[];
};

export type NotificationDigestRow =
  | { kind: "single"; notification: BillingNotification }
  | { kind: "digest"; group: NotificationDigestGroup };

const typeConfig = {
  info: { label: "Info", Icon: Info },
  warning: { label: "Warning", Icon: WalletCards },
  error: { label: "Urgent", Icon: AlertCircle },
} satisfies Record<BillingNotificationType, { label: string; Icon: typeof Info }>;

const categoryIcon = {
  "failed-charge": RefreshCcw,
  "low-balance": CircleDollarSign,
  "plan-change": CheckCircle2,
};

export function buildDigestRows(items: BillingNotification[]): NotificationDigestRow[] {
  const groups = new Map<string, BillingNotification[]>();
  const singletons: BillingNotification[] = [];

  for (const item of items) {
    if (!item.targetId) {
      singletons.push(item);
      continue;
    }
    const key = `${item.category}::${item.targetId}`;
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }

  const rank = (notification: BillingNotification) =>
    notification.timestampRank ?? Number.MIN_SAFE_INTEGER;

  const groupRows = Array.from(groups.entries())
    .map(([key, bucket]) => {
      const ordered = [...bucket].sort((a, b) => rank(b) - rank(a));
      const newest = ordered[0];
      const oldest = ordered[ordered.length - 1];
      const firstAction = ordered.find((item) => item.actionLabel && item.href);
      return {
        kind: "digest" as const,
        group: {
          key,
          type: newest.type,
          category: newest.category,
          title: newest.title,
          actionLabel: firstAction?.actionLabel,
          href: firstAction?.href,
          hasUnread: ordered.some((item) => !item.isRead),
          oldestTimestamp: oldest.timestamp,
          newestTimestamp: newest.timestamp,
          items: ordered,
        },
      };
    })
    .sort((a, b) => rank(b.group.items[0]) - rank(a.group.items[0]));

  const singletonRows = singletons
    .sort((a, b) => rank(b) - rank(a))
    .map((notification) => ({ kind: "single" as const, notification }));

  const merged: NotificationDigestRow[] = [];
  let groupIndex = 0;
  let singletonIndex = 0;
  while (groupIndex < groupRows.length && singletonIndex < singletonRows.length) {
    const groupRank = rank(groupRows[groupIndex].group.items[0]);
    const singletonRank = rank(singletonRows[singletonIndex].notification);
    if (groupRank >= singletonRank) merged.push(groupRows[groupIndex++]);
    else merged.push(singletonRows[singletonIndex++]);
  }
  return merged.concat(groupRows.slice(groupIndex), singletonRows.slice(singletonIndex));
}

interface NotificationListProps {
  rows: NotificationDigestRow[];
  silenceMap: Map<string, NotificationSilenceState>;
  expandedDigests: Set<string>;
  now: number;
  inMutedSection?: boolean;
  onToggleDigest: (key: string) => void;
  onSnooze: (id: string, duration: SnoozeDuration) => void;
  onMute: (id: string) => void;
  onUnmute: (id: string) => void;
}

export default function NotificationList({
  rows,
  silenceMap,
  expandedDigests,
  now,
  inMutedSection = false,
  onToggleDigest,
  onSnooze,
  onMute,
  onUnmute,
}: NotificationListProps) {
  const renderNotification = (
    notification: BillingNotification,
    nestedInDigest = false,
  ) => {
    const { Icon, label } = typeConfig[notification.type];
    const CategoryIcon = categoryIcon[notification.category];
    const silence = silenceMap.get(notification.id);
    const isMuted = isNotificationMuted(notification.id, silenceMap);
    const isSnoozed = isNotificationSnoozed(notification.id, silenceMap, now);

    return (
      <li
        key={notification.id}
        className={`notifications-item notifications-item-${notification.type}${inMutedSection ? " notifications-item-muted" : ""}${nestedInDigest ? " notifications-item-nested" : ""}`}
        data-read={notification.isRead}
        data-snoozed={isSnoozed || undefined}
        data-muted={isMuted || undefined}
      >
        <div className="notifications-type-icon" aria-hidden="true">
          <Icon size={18} />
        </div>
        <div className="notifications-item-content">
          <div className="notifications-item-meta">
            <span>{label}</span>
            <div className="notifications-item-meta-right">
              <span aria-label={`Received ${notification.timestamp}`}>{notification.timestamp}</span>
              <SnoozeMenu
                notificationId={notification.id}
                notificationTitle={notification.title}
                isSnoozed={isSnoozed}
                isMuted={isMuted}
                snoozeExpiresAt={silence?.expiresAt}
                now={now}
                onSnooze={onSnooze}
                onMute={onMute}
                onUnmute={onUnmute}
              />
            </div>
          </div>
          <h3>
            {!notification.isRead && <span className="notifications-unread-dot" aria-label="Unread" />}
            {notification.title}
          </h3>
          <p>{notification.message}</p>
          <div className="notifications-item-footer">
            <span>
              <CategoryIcon size={15} aria-hidden="true" />
              {notification.category.replace("-", " ")}
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

  const renderRow = (row: NotificationDigestRow) => {
    if (row.kind === "single") return renderNotification(row.notification);

    const { group } = row;
    const expanded = expandedDigests.has(group.key);
    const { Icon, label } = typeConfig[group.type];
    const CategoryIcon = categoryIcon[group.category];
    const anchor = group.items[0];
    const silence = silenceMap.get(anchor.id);
    const isMuted = isNotificationMuted(anchor.id, silenceMap);
    const isSnoozed = isNotificationSnoozed(anchor.id, silenceMap, now);
    const timeRange =
      group.newestTimestamp === group.oldestTimestamp
        ? group.newestTimestamp
        : `${group.oldestTimestamp} – ${group.newestTimestamp}`;
    const safeKey = group.key.replace(/[^a-zA-Z0-9-]/g, "-").replace(/^-+|-+$/g, "");
    const headerId = `notifications-digest-header-${safeKey}`;
    const listId = `notifications-digest-list-${safeKey}`;

    return (
      <li
        key={group.key}
        className={`notifications-digest-row notifications-item-${group.type}${inMutedSection ? " notifications-item-muted" : ""}`}
        data-read={group.hasUnread ? "false" : "true"}
      >
        <button
          type="button"
          className={`notifications-digest-header${expanded ? " notifications-digest-header-expanded" : ""}`}
          aria-expanded={expanded}
          aria-controls={expanded ? listId : undefined}
          aria-labelledby={`${headerId}-count ${headerId}-title`}
          onClick={() => onToggleDigest(group.key)}
        >
          <div className="notifications-digest-head-grid">
            <div className="notifications-type-icon" aria-hidden="true"><Icon size={18} /></div>
            <div className="notifications-digest-head-main">
              <div className="notifications-item-meta">
                <span>
                  <span id={`${headerId}-count`} className="notifications-digest-count-badge" aria-label={`${group.items.length} occurrences`}>
                    <Layers3 size={12} aria-hidden="true" />
                    <span>{group.items.length}</span>
                  </span>
                  <span>{label}</span>
                </span>
                <div className="notifications-item-meta-right">
                  <span aria-label={`Occurrences from ${group.oldestTimestamp} to ${group.newestTimestamp}`} className="notifications-digest-time-range">
                    <Clock size={12} aria-hidden="true" />
                    {timeRange}
                  </span>
                  {!inMutedSection && (
                    <SnoozeMenu
                      notificationId={anchor.id}
                      notificationTitle={group.title}
                      isSnoozed={isSnoozed}
                      isMuted={isMuted}
                      snoozeExpiresAt={silence?.expiresAt}
                      now={now}
                      onSnooze={onSnooze}
                      onMute={onMute}
                      onUnmute={onUnmute}
                    />
                  )}
                </div>
              </div>
              <h3 id={`${headerId}-title`}>
                {group.hasUnread && <span className="notifications-unread-dot" aria-label="Unread" />}
                {group.title}
              </h3>
              <div className="notifications-item-footer notifications-digest-footer">
                <span><CategoryIcon size={15} aria-hidden="true" />{group.category.replace("-", " ")}</span>
                {group.actionLabel && group.href && !inMutedSection && (
                  <a href={group.href} className="notifications-action" onClick={(event) => event.stopPropagation()}>
                    {group.actionLabel}<ChevronRight size={15} aria-hidden="true" />
                  </a>
                )}
                <ChevronDown size={15} aria-hidden="true" className={`notifications-digest-chevron${expanded ? " notifications-digest-chevron-open" : ""}`} />
              </div>
            </div>
          </div>
        </button>
        {expanded && (
          <ul id={listId} role="group" aria-labelledby={headerId} className="notifications-digest-items">
            {group.items.map((item) => renderNotification(item, true))}
          </ul>
        )}
      </li>
    );
  };

  return <>{rows.map(renderRow)}</>;
}
