import { describe, expect, it } from "vitest";
import {
  createNotificationsState,
  notificationsReducer,
} from "./store";
import type { BillingNotification } from "./types";

const notification: BillingNotification = {
  id: "charge-failed",
  type: "error",
  title: "Charge failed",
  message: "Payment failed.",
  timestamp: "Just now",
  isRead: false,
  category: "failed-charge",
};

describe("notificationsReducer", () => {
  it("marks every notification read without mutating its previous state", () => {
    const initialState = createNotificationsState([notification]);

    const nextState = notificationsReducer(initialState, { type: "mark-all-read" });

    expect(nextState.notifications[0].isRead).toBe(true);
    expect(initialState.notifications[0].isRead).toBe(false);
  });

  it("updates snooze, mute, and unmute state immutably", () => {
    const initialState = createNotificationsState([notification]);
    const snoozedState = notificationsReducer(initialState, {
      type: "snooze",
      id: notification.id,
      expiresAt: 1234,
    });
    const mutedState = notificationsReducer(snoozedState, {
      type: "mute",
      id: notification.id,
    });
    const resumedState = notificationsReducer(mutedState, {
      type: "unmute",
      id: notification.id,
    });

    expect(snoozedState.silenceMap.get(notification.id)).toEqual({ expiresAt: 1234 });
    expect(mutedState.silenceMap.get(notification.id)).toEqual({ expiresAt: null });
    expect(resumedState.silenceMap.has(notification.id)).toBe(false);
    expect(initialState.silenceMap.size).toBe(0);
  });

  it("toggles digest and muted-section expansion", () => {
    const initialState = createNotificationsState([notification]);
    const expandedDigest = notificationsReducer(initialState, {
      type: "toggle-digest",
      key: "failed-charge::subscription-1",
    });
    const expandedMuted = notificationsReducer(expandedDigest, {
      type: "toggle-muted",
    });
    const collapsedDigest = notificationsReducer(expandedMuted, {
      type: "toggle-digest",
      key: "failed-charge::subscription-1",
    });

    expect(expandedDigest.expandedDigests.has("failed-charge::subscription-1")).toBe(true);
    expect(expandedMuted.mutedExpanded).toBe(true);
    expect(collapsedDigest.expandedDigests.has("failed-charge::subscription-1")).toBe(false);
    expect(initialState.mutedExpanded).toBe(false);
  });
});
