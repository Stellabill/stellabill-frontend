export type BillingNotificationType = "info" | "warning" | "error";

export interface BillingNotification {
  id: string;
  type: BillingNotificationType;
  title: string;
  message: string;
  timestamp: string;
  timestampRank?: number;
  actionLabel?: string;
  href?: string;
  isRead: boolean;
  category: "failed-charge" | "low-balance" | "plan-change";
  targetId?: string;
}

export const SNOOZE_1H = 60 * 60 * 1000;
export const SNOOZE_8H = 8 * 60 * 60 * 1000;
export const SNOOZE_24H = 24 * 60 * 60 * 1000;

export type SnoozeDuration =
  | typeof SNOOZE_1H
  | typeof SNOOZE_8H
  | typeof SNOOZE_24H;

export interface NotificationSilenceState {
  expiresAt: number | null;
}
