import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildDateNotice,
  clampToMonth,
  formatDate,
  nextBillingDayDate,
  today,
  toIso,
} from './reactivationDateHelpers';

describe('reactivationDateHelpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 15, 14, 30, 45, 500)); // Jun 15, 2025
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('today', () => {
    it('returns the current date normalized to local midnight', () => {
      const result = today();
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(5);
      expect(result.getDate()).toBe(15);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });
  });

  describe('clampToMonth', () => {
    it('returns the requested day when within the month length', () => {
      const result = clampToMonth(2025, 5, 15);
      expect(toIso(result)).toBe('2025-06-15');
    });

    it('clamps day 31 to the last day of a 30-day month', () => {
      const result = clampToMonth(2025, 5, 31); // June has 30 days
      expect(toIso(result)).toBe('2025-06-30');
    });

    it('clamps day 31 to Feb 28 in a non-leap year and Feb 29 in a leap year', () => {
      expect(toIso(clampToMonth(2025, 1, 31))).toBe('2025-02-28');
      expect(toIso(clampToMonth(2024, 1, 31))).toBe('2024-02-29');
    });
  });

  describe('nextBillingDayDate', () => {
    it('returns a date in the current month when billingDay is today or in the future', () => {
      expect(toIso(nextBillingDayDate(15))).toBe('2025-06-15');
      expect(toIso(nextBillingDayDate(20))).toBe('2025-06-20');
    });

    it('rolls over to the next month when billingDay has already passed this month', () => {
      expect(toIso(nextBillingDayDate(10))).toBe('2025-07-10');
    });

    it('clamps out-of-range billingDay values to [1, 31] and respects month length', () => {
      expect(toIso(nextBillingDayDate(0))).toBe('2025-07-01');
      expect(toIso(nextBillingDayDate(-10))).toBe('2025-07-01');
      expect(toIso(nextBillingDayDate(31))).toBe('2025-06-30');
      expect(toIso(nextBillingDayDate(99))).toBe('2025-06-30');
    });

    it('clamps to February month end when rolling over from January 31', () => {
      vi.setSystemTime(new Date(2025, 0, 31, 12, 0, 0)); // Jan 31, 2025
      expect(toIso(nextBillingDayDate(30))).toBe('2025-02-28');
    });
  });

  describe('formatDate', () => {
    it('formats a Date in en-US short month format', () => {
      expect(formatDate(new Date(2025, 5, 15))).toBe('Jun 15, 2025');
      expect(formatDate(new Date(2025, 0, 5))).toBe('Jan 5, 2025');
    });
  });

  describe('toIso', () => {
    it('formats a Date as YYYY-MM-DD with zero-padded month and day', () => {
      expect(toIso(new Date(2025, 0, 5))).toBe('2025-01-05');
      expect(toIso(new Date(2025, 11, 31))).toBe('2025-12-31');
    });
  });

  describe('buildDateNotice', () => {
    const todayDate = new Date(2025, 5, 15);
    const billingDayDate = new Date(2025, 5, 20);
    const customDate = new Date(2025, 6, 4);

    it('returns today microcopy when mode is today or custom without a selected date', () => {
      expect(buildDateNotice('today', 20, todayDate, billingDayDate, null)).toBe(
        'Access and billing begin today, Jun 15, 2025.',
      );
      expect(buildDateNotice('custom', 20, todayDate, billingDayDate, null)).toBe(
        'Access and billing begin today, Jun 15, 2025.',
      );
    });

    it('returns billing-day microcopy when mode is billing-day', () => {
      expect(
        buildDateNotice('billing-day', 20, todayDate, billingDayDate, null),
      ).toBe(
        'Your billing cycle will reset to day 20 of each month (clamped to the last day of shorter months). Any gap from today is unpaid — access starts on Jun 20, 2025.',
      );
    });

    it('returns custom-date microcopy when mode is custom and a date is chosen', () => {
      expect(
        buildDateNotice('custom', 20, todayDate, billingDayDate, customDate),
      ).toBe('Access and billing begin on Jul 4, 2025.');
    });
  });
});
