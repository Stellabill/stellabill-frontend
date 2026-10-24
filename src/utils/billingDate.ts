/**
 * Calendar-safe billing date helpers.
 *
 * `Date#setMonth` overflows on month-end anchors (Jan 31 + 1 month = Mar 3).
 * These helpers always compute the n-th occurrence from the original anchor and
 * clamp the day to the last day of the target month, so schedules never drift.
 */
export type BillingInterval = "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";

const MONTHS_PER_INTERVAL: Partial<Record<BillingInterval, number>> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

const DAYS_PER_INTERVAL: Partial<Record<BillingInterval, number>> = {
  weekly: 7,
  biweekly: 14,
};

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Returns the date `n` billing intervals after `anchor` (n = 0 returns a copy of the anchor). */
export function addBillingInterval(anchor: Date, interval: BillingInterval, n = 1): Date {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError(`addBillingInterval: n must be a non-negative integer, got ${n}`);
  }

  const days = DAYS_PER_INTERVAL[interval];
  if (days !== undefined) {
    const result = new Date(anchor.getTime());
    result.setDate(result.getDate() + days * n);
    return result;
  }

  const months = MONTHS_PER_INTERVAL[interval];
  if (months === undefined) {
    throw new RangeError(`addBillingInterval: unsupported interval "${interval}"`);
  }

  const totalMonths = anchor.getMonth() + months * n;
  const year = anchor.getFullYear() + Math.floor(totalMonths / 12);
  const month = totalMonths % 12;
  const day = Math.min(anchor.getDate(), daysInMonth(year, month));

  const result = new Date(anchor.getTime());
  result.setFullYear(year, month, day);
  return result;
}

/** Builds `count` consecutive billing dates starting at (and including) `anchor`. */
export function buildBillingSchedule(anchor: Date, interval: BillingInterval, count: number): Date[] {
  const schedule: Date[] = [];
  for (let i = 0; i < count; i++) {
    schedule.push(addBillingInterval(anchor, interval, i));
  }
  return schedule;
}
