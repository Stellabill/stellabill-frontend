import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  Bell,
  ChevronDown,
  Clock,
  Timer,
  VolumeX,
} from "lucide-react";
import {
  SNOOZE_1H,
  SNOOZE_8H,
  SNOOZE_24H,
  type SnoozeDuration,
} from "./types";

const snoozeOptions = [
  { duration: SNOOZE_1H, label: "notifications.snooze.1h" },
  { duration: SNOOZE_8H, label: "notifications.snooze.8h" },
  { duration: SNOOZE_24H, label: "notifications.snooze.24h" },
] as const;

interface SnoozeMenuProps {
  notificationId: string;
  notificationTitle: string;
  isSnoozed: boolean;
  isMuted: boolean;
  snoozeExpiresAt: number | null | undefined;
  now: number;
  onSnooze: (id: string, duration: SnoozeDuration) => void;
  onMute: (id: string) => void;
  onUnmute: (id: string) => void;
}

export default function SnoozeMenu({
  notificationId,
  notificationTitle,
  isSnoozed,
  isMuted,
  snoozeExpiresAt,
  now,
  onSnooze,
  onMute,
  onUnmute,
}: SnoozeMenuProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
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

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    if (items.length === 0) return;

    const currentIndex = items.findIndex((item) => item === document.activeElement);
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : event.key === "ArrowDown"
            ? Math.min(currentIndex + 1, items.length - 1)
            : Math.max(currentIndex - 1, 0);
    items[nextIndex]?.focus();
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowDown") return;
    event.preventDefault();
    setIsOpen(true);
    setTimeout(() => {
      menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    }, 0);
  };

  const resumeLabel = useMemo(() => {
    if (!isSnoozed || snoozeExpiresAt == null) return null;
    const remaining = snoozeExpiresAt - now;
    if (remaining <= 0) return null;
    const hours = Math.ceil(remaining / (60 * 60 * 1000));
    return hours < 1
      ? t("notifications.snooze.resumesInMinutes", {
          count: Math.ceil(remaining / 60000),
        })
      : t("notifications.snooze.resumesInHours", { count: hours });
  }, [isSnoozed, snoozeExpiresAt, now, t]);

  return (
    <div className="notifications-snooze-wrapper" ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        className="notifications-snooze-trigger"
        aria-label={
          isMuted
            ? t("notifications.snooze.triggerLabelMuted", { title: notificationTitle })
            : isSnoozed
              ? t("notifications.snooze.triggerLabelSnoozed", { title: notificationTitle })
              : t("notifications.snooze.triggerLabel", { title: notificationTitle })
        }
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setIsOpen((open) => !open)}
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
          aria-label={t("notifications.snooze.menuLabel", { title: notificationTitle })}
          className="notifications-snooze-menu"
          onKeyDown={handleMenuKeyDown}
        >
          {!isMuted && (
            <>
              <p className="notifications-snooze-menu-heading" role="presentation">
                {t("notifications.snooze.snoozeFor")}
              </p>
              {snoozeOptions.map(({ duration, label }) => (
                <button
                  key={duration}
                  type="button"
                  role="menuitem"
                  className="notifications-snooze-menu-item"
                  onClick={() => {
                    onSnooze(notificationId, duration);
                    setIsOpen(false);
                  }}
                >
                  <Clock size={14} aria-hidden="true" />
                  {t(label)}
                </button>
              ))}
              <div className="notifications-snooze-divider" role="separator" aria-hidden="true" />
            </>
          )}

          <button
            type="button"
            role="menuitem"
            className={`notifications-snooze-menu-item notifications-snooze-menu-item-${isMuted ? "unmute" : "mute"}`}
            onClick={() => {
              (isMuted ? onUnmute : onMute)(notificationId);
              setIsOpen(false);
            }}
          >
            {isMuted ? <Bell size={14} aria-hidden="true" /> : <VolumeX size={14} aria-hidden="true" />}
            {t(isMuted ? "notifications.snooze.unmute" : "notifications.snooze.mute")}
          </button>

          {isSnoozed && !isMuted && (
            <button
              type="button"
              role="menuitem"
              className="notifications-snooze-menu-item notifications-snooze-menu-item-unsnooze"
              onClick={() => {
                onUnmute(notificationId);
                setIsOpen(false);
              }}
            >
              <Bell size={14} aria-hidden="true" />
              {t("notifications.snooze.unsnooze")}
            </button>
          )}
        </div>
      )}

      {(isSnoozed || isMuted) && !isOpen && (
        <span className="notifications-snooze-resume" aria-live="off">
          {isMuted ? t("notifications.snooze.mutedLabel") : resumeLabel}
        </span>
      )}
    </div>
  );
}
