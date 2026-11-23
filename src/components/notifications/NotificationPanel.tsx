import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import {
  BellOff,
  CheckCircle2,
  ChevronDown,
  RefreshCcw,
  X,
} from "lucide-react";
import { useRefresh } from "../../hooks/useRefresh";
import NotificationList, { type NotificationDigestRow } from "./NotificationList";
import type { NotificationsState } from "./store";
import type { SnoozeDuration } from "./types";

interface NotificationPanelProps {
  panelId: string;
  titleId: string;
  panelRef: RefObject<HTMLDivElement>;
  state: NotificationsState;
  activeDigestRows: NotificationDigestRow[];
  silencedDigestRows: NotificationDigestRow[];
  unreadCount: number;
  silencedCount: number;
  hasActiveNotifications: boolean;
  allRead: boolean;
  now: number;
  onClose: () => void;
  onMarkAllRead: () => void;
  onToggleMuted: () => void;
  onToggleDigest: (key: string) => void;
  onSnooze: (id: string, duration: SnoozeDuration) => void;
  onMute: (id: string) => void;
  onUnmute: (id: string) => void;
}

export default function NotificationPanel({
  panelId,
  titleId,
  panelRef,
  state,
  activeDigestRows,
  silencedDigestRows,
  unreadCount,
  silencedCount,
  hasActiveNotifications,
  allRead,
  now,
  onClose,
  onMarkAllRead,
  onToggleMuted,
  onToggleDigest,
  onSnooze,
  onMute,
  onUnmute,
}: NotificationPanelProps) {
  const { t } = useTranslation();
  const {
    pullDistance,
    isRefreshing,
    triggerRefresh,
    containerRef: refreshContainerRef,
    handlers: refreshHandlers,
  } = useRefresh({
    onRefresh: () =>
      new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 800);
      }),
  });

  const notificationListProps = {
    silenceMap: state.silenceMap,
    expandedDigests: state.expandedDigests,
    now,
    onToggleDigest,
    onSnooze,
    onMute,
    onUnmute,
  };

  return (
    <div
      ref={panelRef}
      id={panelId}
      className="notifications-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
    >
      <div className="notifications-panel-header">
        <div>
          <p className="notifications-kicker">{t("notifications.billingAlerts")}</p>
          <h2 id={titleId}>{t("notifications.title")}</h2>
        </div>
        <button type="button" className="notifications-icon-button" aria-label={t("notifications.close")} onClick={onClose}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="notifications-toolbar">
        <span>
          {allRead
            ? t("notifications.toolbarAllRead")
            : t("notifications.toolbar", { count: unreadCount })}
        </span>
        <button
          type="button"
          className="notifications-mark-read"
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
        >
          {t("notifications.markAllRead")}
        </button>
      </div>

      {!hasActiveNotifications && silencedCount === 0 ? (
        <div className="notifications-empty" role="status">
          <CheckCircle2 size={32} aria-hidden="true" />
          <h3>{t("notifications.emptyTitle")}</h3>
          <p>{t("notifications.emptyDescription")}</p>
        </div>
      ) : !hasActiveNotifications && silencedCount > 0 ? (
        <div className="notifications-empty notifications-empty-compact" role="status">
          <BellOff size={28} aria-hidden="true" />
          <h3>{t("notifications.allSilencedTitle")}</h3>
          <p>{t("notifications.allSilencedDescription", { count: silencedCount })}</p>
        </div>
      ) : allRead ? (
        <div className="notifications-empty notifications-empty-compact" role="status">
          <CheckCircle2 size={28} aria-hidden="true" />
          <h3>{t("notifications.allReadTitle")}</h3>
          <p>{t("notifications.allReadDescription")}</p>
        </div>
      ) : (
        <div
          className="notifications-scroll-area"
          ref={refreshContainerRef as RefObject<HTMLDivElement>}
          {...refreshHandlers}
          style={{ position: "relative", overflowY: "auto", flex: 1 }}
        >
          <div className="visually-hidden" aria-live="polite">
            {isRefreshing ? t("notifications.refreshing", "Refreshing notifications...") : ""}
          </div>
          <button className="ptr-fallback-btn" onClick={triggerRefresh} aria-label="Refresh notifications">
            <RefreshCcw size={16} />
            <span className="visually-hidden">Refresh</span>
          </button>
          <div
            className="ptr-indicator"
            style={{ height: `${Math.min(pullDistance, 100)}px`, opacity: pullDistance > 10 ? 1 : 0 }}
            aria-hidden="true"
          >
            {isRefreshing || pullDistance > 0 ? (
              <div
                className={`ptr-spinner ${isRefreshing ? "spinning" : ""}`}
                style={{ transform: `rotate(${pullDistance * 3}deg)` }}
              >
                <RefreshCcw size={20} />
              </div>
            ) : null}
          </div>
          <ul
            className="notifications-list"
            aria-label={t("notifications.listLabel")}
            style={{
              transform: `translateY(${pullDistance}px)`,
              transition:
                pullDistance === 0
                  ? "transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)"
                  : "none",
            }}
          >
            <NotificationList rows={activeDigestRows} {...notificationListProps} />
          </ul>
        </div>
      )}

      {silencedCount > 0 && (
        <div className="notifications-silenced-section">
          <button
            type="button"
            className="notifications-silenced-toggle"
            aria-expanded={state.mutedExpanded}
            aria-controls="notifications-silenced-list"
            onClick={onToggleMuted}
          >
            <BellOff size={14} aria-hidden="true" />
            <span>{t("notifications.snooze.silencedCount", { count: silencedCount })}</span>
            <ChevronDown
              size={14}
              aria-hidden="true"
              className={`notifications-silenced-chevron${state.mutedExpanded ? " notifications-silenced-chevron-open" : ""}`}
            />
          </button>
          {state.mutedExpanded && (
            <ul
              id="notifications-silenced-list"
              className="notifications-list notifications-list-silenced"
              aria-label={t("notifications.snooze.silencedListLabel")}
            >
              <NotificationList
                rows={silencedDigestRows}
                {...notificationListProps}
                inMutedSection
              />
            </ul>
          )}
        </div>
      )}

    </div>
  );
}
