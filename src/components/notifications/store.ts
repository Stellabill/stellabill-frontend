import { useMemo, useReducer } from "react";
import type {
  BillingNotification,
  NotificationSilenceState,
} from "./types";

export interface NotificationsState {
  notifications: BillingNotification[];
  silenceMap: Map<string, NotificationSilenceState>;
  expandedDigests: Set<string>;
  mutedExpanded: boolean;
}

export type NotificationsAction =
  | { type: "mark-all-read" }
  | { type: "snooze"; id: string; expiresAt: number }
  | { type: "mute"; id: string }
  | { type: "unmute"; id: string }
  | { type: "toggle-digest"; key: string }
  | { type: "toggle-muted" };

export function createNotificationsState(
  notifications: BillingNotification[],
): NotificationsState {
  return {
    notifications,
    silenceMap: new Map(),
    expandedDigests: new Set(),
    mutedExpanded: false,
  };
}

export function notificationsReducer(
  state: NotificationsState,
  action: NotificationsAction,
): NotificationsState {
  switch (action.type) {
    case "mark-all-read":
      return {
        ...state,
        notifications: state.notifications.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      };
    case "snooze": {
      const silenceMap = new Map(state.silenceMap);
      silenceMap.set(action.id, { expiresAt: action.expiresAt });
      return { ...state, silenceMap };
    }
    case "mute": {
      const silenceMap = new Map(state.silenceMap);
      silenceMap.set(action.id, { expiresAt: null });
      return { ...state, silenceMap };
    }
    case "unmute": {
      if (!state.silenceMap.has(action.id)) return state;
      const silenceMap = new Map(state.silenceMap);
      silenceMap.delete(action.id);
      return { ...state, silenceMap };
    }
    case "toggle-digest": {
      const expandedDigests = new Set(state.expandedDigests);
      if (expandedDigests.has(action.key)) expandedDigests.delete(action.key);
      else expandedDigests.add(action.key);
      return { ...state, expandedDigests };
    }
    case "toggle-muted":
      return { ...state, mutedExpanded: !state.mutedExpanded };
  }
}

export function isNotificationMuted(
  id: string,
  silenceMap: Map<string, NotificationSilenceState>,
) {
  return silenceMap.get(id)?.expiresAt === null;
}

export function isNotificationSnoozed(
  id: string,
  silenceMap: Map<string, NotificationSilenceState>,
  now: number,
) {
  const expiresAt = silenceMap.get(id)?.expiresAt;
  return expiresAt != null && expiresAt > now;
}

export function useNotifications(
  initialNotifications: BillingNotification[],
  getNow: () => number,
) {
  const [state, dispatch] = useReducer(
    notificationsReducer,
    initialNotifications,
    createNotificationsState,
  );
  const now = getNow();

  const activeNotifications = useMemo(
    () =>
      state.notifications.filter(
        ({ id }) =>
          !isNotificationMuted(id, state.silenceMap) &&
          !isNotificationSnoozed(id, state.silenceMap, now),
      ),
    [state.notifications, state.silenceMap, now],
  );
  const mutedNotifications = useMemo(
    () =>
      state.notifications.filter(({ id }) =>
        isNotificationMuted(id, state.silenceMap),
      ),
    [state.notifications, state.silenceMap],
  );
  const snoozedNotifications = useMemo(
    () =>
      state.notifications.filter(({ id }) =>
        isNotificationSnoozed(id, state.silenceMap, now),
      ),
    [state.notifications, state.silenceMap, now],
  );

  return {
    state,
    dispatch,
    now,
    activeNotifications,
    mutedNotifications,
    snoozedNotifications,
  };
}
