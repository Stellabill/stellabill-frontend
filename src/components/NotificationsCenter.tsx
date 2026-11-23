import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";
import NotificationPanel from "./notifications/NotificationPanel";
import { defaultNotifications } from "./notifications/defaults";
import { useNotifications } from "./notifications/store";
import type { BillingNotification, SnoozeDuration } from "./notifications/types";
import "./NotificationsCenter.css";

export {
  SNOOZE_1H,
  SNOOZE_8H,
  SNOOZE_24H,
} from "./notifications/types";
export type {
  BillingNotification,
  BillingNotificationType,
  NotificationSilenceState,
  SnoozeDuration,
} from "./notifications/types";

interface NotificationsCenterProps {
  initialNotifications?: BillingNotification[];
  /** Override Date.now() for deterministic tests */
  getNow?: () => number;
}

export default function NotificationsCenter({
  initialNotifications = defaultNotifications,
  getNow = Date.now,
}: NotificationsCenterProps) {
  const { t } = useTranslation();
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");
  const {
    state,
    dispatch,
    now,
    activeNotifications,
    mutedNotifications,
    snoozedNotifications,
  } = useNotifications(initialNotifications, getNow);

  const unreadCount = useMemo(
    () => activeNotifications.filter((notification) => !notification.isRead).length,
    [activeNotifications],
  );
  const hasActiveNotifications = activeNotifications.length > 0;
  const allRead = hasActiveNotifications && unreadCount === 0;

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const findTitle = (id: string) =>
    state.notifications.find((notification) => notification.id === id)?.title ?? id;

  const snoozeNotification = (id: string, duration: SnoozeDuration) => {
    dispatch({ type: "snooze", id, expiresAt: getNow() + duration });
    const hours = duration / (60 * 60 * 1000);
    const announcementKey =
      hours === 1
        ? "notifications.snooze.announceSnoozed1h"
        : hours === 8
          ? "notifications.snooze.announceSnoozed8h"
          : "notifications.snooze.announceSnoozed24h";
    setLiveMessage(t(announcementKey, { title: findTitle(id) }));
  };

  const muteNotification = (id: string) => {
    dispatch({ type: "mute", id });
    setLiveMessage(
      t("notifications.snooze.announceMuted", { title: findTitle(id) }),
    );
  };

  const unmuteNotification = (id: string) => {
    dispatch({ type: "unmute", id });
    setLiveMessage(
      t("notifications.snooze.announceResumed", { title: findTitle(id) }),
    );
  };

  return (
    <div className="notifications-center">
      <span className="notifications-live-region" aria-live="polite" aria-atomic="true">
        {liveMessage || t("notifications.liveRegion", { count: unreadCount })}
      </span>
      <button
        ref={triggerRef}
        type="button"
        className="notifications-trigger"
        aria-label={t("notifications.triggerLabel", { count: unreadCount })}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <Bell size={20} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="notifications-badge" aria-hidden="true">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <NotificationPanel
          panelId={panelId}
          titleId={`${panelId}-title`}
          panelRef={panelRef}
          state={state}
          activeNotifications={activeNotifications}
          silencedNotifications={[
            ...mutedNotifications,
            ...snoozedNotifications,
          ]}
          unreadCount={unreadCount}
          allRead={allRead}
          now={now}
          onClose={() => {
            setIsOpen(false);
            triggerRef.current?.focus();
          }}
          onMarkAllRead={() => dispatch({ type: "mark-all-read" })}
          onToggleMuted={() => dispatch({ type: "toggle-muted" })}
          onToggleDigest={(key) => dispatch({ type: "toggle-digest", key })}
          onSnooze={snoozeNotification}
          onMute={muteNotification}
          onUnmute={unmuteNotification}
        />
      )}
    </div>
  );
}
