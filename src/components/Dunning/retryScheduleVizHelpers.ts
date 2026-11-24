/**
 * retryScheduleVizHelpers
 * -----------------------
 * Pure-function helpers and shared constants for RetryScheduleViz.
 * No React imports — safe to test without a DOM environment.
 */

// ─── Types ──────────────────────────────────────────────────

export type AttemptStatus = 'past' | 'upcoming' | 'failed' | 'succeeded';

export type PaymentMethodKind = 'card' | 'usdc' | 'prepaid' | 'bank' | 'other';

export interface RetryAttempt {
  /** Unique identifier */
  id: string;
  /** ISO-8601 timestamp, e.g. "2026-03-22T09:00:00Z" */
  scheduledAt: string;
  /** Human-readable date label, e.g. "Mar 22, 09:00" */
  when: string;
  status: AttemptStatus;
  /**
   * Payment method used / to be used for this attempt.
   * If omitted, the method badge is hidden.
   */
  method?: PaymentMethodKind;
  /**
   * Estimated success probability 0–1.
   * Omit to hide the probability bar.
   */
  successProbability?: number;
}

export interface RetryScheduleVizLabels {
  title: string;
  whyButton: string;
  whyTitle: string;
  whyClose: string;
  showMore: string;
  showLess: string;
  srNextAttempt: (when: string) => string;
  srAllFailed: string;
  srNoSchedule: string;
  emptyTitle: string;
  emptyBody: string;
  methodLabels: Record<PaymentMethodKind, string>;
  statusLabels: Record<AttemptStatus, string>;
}

export const DEFAULT_LABELS: RetryScheduleVizLabels = {
  title: 'Retry schedule',
  whyButton: 'Why these times?',
  whyTitle: 'How we schedule retries',
  whyClose: 'Got it',
  showMore: 'Show all attempts',
  showLess: 'Show less',
  srNextAttempt: (when) => `Next payment retry scheduled for ${when}.`,
  srAllFailed: 'All retry attempts have failed. Please update your payment method.',
  srNoSchedule: 'No retry schedule is available.',
  emptyTitle: 'All retries exhausted',
  emptyBody:
    'Every scheduled attempt has failed. Update your payment method to reactivate your subscription.',
  methodLabels: {
    card: 'Card',
    usdc: 'USDC',
    prepaid: 'Prepaid',
    bank: 'Bank',
    other: 'Other',
  },
  statusLabels: {
    past: 'Attempted',
    upcoming: 'Upcoming',
    failed: 'Failed',
    succeeded: 'Succeeded',
  },
};

export const DEFAULT_MAX_VISIBLE = 5;

// ─── Pure helpers ────────────────────────────────────────────

/**
 * Maps a success probability (0–1) to a CSS modifier class name.
 * ≥ 0.65 → 'high', ≥ 0.35 → 'medium', otherwise → 'low'.
 */
export function getProbClass(p: number): 'high' | 'medium' | 'low' {
  if (p >= 0.65) return 'high';
  if (p >= 0.35) return 'medium';
  return 'low';
}

/**
 * Returns a human-readable relative-time string between `scheduledAt`
 * and `now`.  Examples: 'now', '+4 h', '−2 d', '+1 mo'.
 */
export function computeDelta(scheduledAt: string, now: Date): string {
  const diff = new Date(scheduledAt).getTime() - now.getTime();
  if (Number.isNaN(diff)) return '';
  const abs = Math.abs(diff);
  const isPast = diff < 0;
  const prefix = isPast ? '−' : '+';

  if (abs < 60_000)              return 'now';
  if (abs < 3_600_000)           return `${prefix}${Math.round(abs / 60_000)} m`;
  if (abs < 86_400_000)          return `${prefix}${Math.round(abs / 3_600_000)} h`;
  if (abs < 86_400_000 * 30)     return `${prefix}${Math.round(abs / 86_400_000)} d`;
  return `${prefix}${Math.round(abs / (86_400_000 * 30))} mo`;
}
