export type StartDateMode = 'today' | 'billing-day' | 'custom';

export interface ReactivationPlan {
  /** Human-readable plan name, e.g. "Pro Monthly" */
  name: string;
  /** Billing interval label, e.g. "Monthly" */
  interval: string;
  /** Formatted price string, e.g. "50 USDC" */
  price: string;
  /**
   * Whether the plan has been deleted and can no longer be subscribed to.
   * When true, the Reactivate button is disabled and a warning is shown.
   */
  deleted?: boolean;
}

/** Today at midnight local time */
export function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Build a date clamped to the last day of the given month. */
export function clampToMonth(year: number, month: number, day: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDay));
}

/**
 * Next occurrence of `billingDay` at or after today.
 * Clamps to the last day of the target month so days 29–31 are respected
 * (e.g. day 31 in February resolves to Feb 28/29).
 */
export function nextBillingDayDate(billingDay: number): Date {
  const day = Math.min(Math.max(billingDay, 1), 31);
  const now = today();
  const candidate = clampToMonth(now.getFullYear(), now.getMonth(), day);
  if (candidate < now) {
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return clampToMonth(next.getFullYear(), next.getMonth(), day);
  }
  return candidate;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function buildDateNotice(
  mode: StartDateMode,
  billingDay: number,
  todayDate: Date,
  billingDayDate: Date,
  customDate: Date | null,
): string {
  if (mode === 'billing-day') {
    return `Your billing cycle will reset to day ${billingDay} of each month (clamped to the last day of shorter months). Any gap from today is unpaid — access starts on ${formatDate(billingDayDate)}.`;
  }
  if (mode === 'custom' && customDate) {
    return `Access and billing begin on ${formatDate(customDate)}.`;
  }
  return `Access and billing begin today, ${formatDate(todayDate)}.`;
}
