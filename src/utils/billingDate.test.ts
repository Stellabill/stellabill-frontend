import { afterEach, describe, it, expect, vi } from "vitest";
import {
  addBillingInterval,
  buildBillingSchedule,
  formatBillingDate,
  getCurrentBillingPeriod,
  parseBillingDate,
} from "./billingDate";

function iso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dt(y: number, m: number, d: number): Date {
  // m is 1-based here for readability
  return new Date(y, m - 1, d);
}

describe("addBillingInterval", () => {
  it("clamps month-end dates to the last day of the target month", () => {
    const anchor = dt(2026, 1, 31);
    expect(iso(addBillingInterval(anchor, "monthly", 1))).toBe("2026-02-28");
    expect(iso(addBillingInterval(anchor, "monthly", 2))).toBe("2026-03-31");
    expect(iso(addBillingInterval(anchor, "monthly", 3))).toBe("2026-04-30");
  });

  it("handles leap year annual recurrence", () => {
    const anchor = dt(2028, 2, 29);
    expect(iso(addBillingInterval(anchor, "yearly", 1))).toBe("2029-02-28");
    expect(iso(addBillingInterval(anchor, "yearly", 4))).toBe("2032-02-29");
  });

  it("handles quarterly clamping", () => {
    const anchor = dt(2026, 1, 31);
    expect(iso(addBillingInterval(anchor, "quarterly", 1))).toBe("2026-04-30");
    expect(iso(addBillingInterval(anchor, "quarterly", 2))).toBe("2026-07-31");
  });

  it("leaves weekly and biweekly unchanged", () => {
    const anchor = dt(2026, 1, 31);
    expect(iso(addBillingInterval(anchor, "weekly", 1))).toBe("2026-02-07");
    expect(iso(addBillingInterval(anchor, "biweekly", 1))).toBe("2026-02-14");
  });

  it("returns the anchor for n = 0", () => {
    const anchor = dt(2026, 1, 31);
    expect(iso(addBillingInterval(anchor, "monthly", 0))).toBe("2026-01-31");
  });

  it("throws on negative n", () => {
    expect(() => addBillingInterval(dt(2026, 1, 31), "monthly", -1)).toThrow();
  });
});

describe("buildBillingSchedule", () => {
  it("builds a monthly schedule from an anchor without drift", () => {
    const schedule = buildBillingSchedule(dt(2026, 1, 31), "monthly", 4);
    expect(schedule.map(iso)).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
    ]);
  });

  it("respects billingDay 31", () => {
    // Reactivation scenario: anchor on the 31st, schedule clamps per month.
    const schedule = buildBillingSchedule(dt(2026, 1, 31), "monthly", 6);
    expect(schedule.map(iso)).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
      "2026-05-31",
      "2026-06-30",
    ]);
  });
});

describe("billing date strings", () => {
  it("parses and formats calendar dates without timezone shifts", () => {
    expect(formatBillingDate(parseBillingDate("2026-03-31"))).toBe("2026-03-31");
  });
});

describe("getCurrentBillingPeriod", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the period containing the mocked current date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(dt(2027, 7, 20));

    const period = getCurrentBillingPeriod(dt(2026, 1, 15), "monthly");

    expect(iso(period.start)).toBe("2027-07-15");
    expect(iso(period.end)).toBe("2027-08-15");
  });

  it("moves to the next period on the boundary date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(dt(2026, 3, 15));

    const period = getCurrentBillingPeriod(dt(2026, 1, 15), "monthly");

    expect(iso(period.start)).toBe("2026-03-15");
    expect(iso(period.end)).toBe("2026-04-15");
  });

  it("preserves the original month-end anchor without drift", () => {
    vi.useFakeTimers();
    vi.setSystemTime(dt(2026, 3, 30));

    const period = getCurrentBillingPeriod(dt(2026, 1, 31), "monthly");

    expect(iso(period.start)).toBe("2026-02-28");
    expect(iso(period.end)).toBe("2026-03-31");
  });
});
