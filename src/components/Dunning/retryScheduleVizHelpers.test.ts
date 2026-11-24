/**
 * retryScheduleVizHelpers – unit tests
 * ------------------------------------
 * Tests every branch of getProbClass and computeDelta in isolation,
 * without a DOM or React environment.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { getProbClass, computeDelta } from './retryScheduleVizHelpers';

afterEach(() => {
  vi.useRealTimers();
});

// ─── getProbClass ────────────────────────────────────────────

describe('getProbClass', () => {
  it('returns "high" for p === 0.65 (boundary)', () => {
    expect(getProbClass(0.65)).toBe('high');
  });

  it('returns "high" for p above 0.65', () => {
    expect(getProbClass(0.9)).toBe('high');
    expect(getProbClass(1.0)).toBe('high');
  });

  it('returns "medium" for p === 0.35 (boundary)', () => {
    expect(getProbClass(0.35)).toBe('medium');
  });

  it('returns "medium" for values between 0.35 and 0.65', () => {
    expect(getProbClass(0.5)).toBe('medium');
    expect(getProbClass(0.64)).toBe('medium');
  });

  it('returns "low" for p below 0.35', () => {
    expect(getProbClass(0.0)).toBe('low');
    expect(getProbClass(0.1)).toBe('low');
    expect(getProbClass(0.34)).toBe('low');
  });
});

// ─── computeDelta ────────────────────────────────────────────

describe('computeDelta', () => {
  const now = new Date('2026-03-22T10:00:00Z');

  it('returns "now" for a difference under 60 seconds (future)', () => {
    const scheduledAt = new Date(now.getTime() + 30_000).toISOString(); // +30 s
    expect(computeDelta(scheduledAt, now)).toBe('now');
  });

  it('returns "now" for a difference under 60 seconds (past)', () => {
    const scheduledAt = new Date(now.getTime() - 30_000).toISOString(); // −30 s
    expect(computeDelta(scheduledAt, now)).toBe('now');
  });

  it('returns "+N m" for differences between 1 min and 1 hour (future)', () => {
    const scheduledAt = new Date(now.getTime() + 15 * 60_000).toISOString(); // +15 min
    expect(computeDelta(scheduledAt, now)).toBe('+15 m');
  });

  it('returns "−N m" for differences between 1 min and 1 hour (past)', () => {
    const scheduledAt = new Date(now.getTime() - 45 * 60_000).toISOString(); // −45 min
    expect(computeDelta(scheduledAt, now)).toBe('−45 m');
  });

  it('returns "+N h" for differences between 1 hour and 1 day (future)', () => {
    const scheduledAt = new Date(now.getTime() + 4 * 3_600_000).toISOString(); // +4 h
    expect(computeDelta(scheduledAt, now)).toBe('+4 h');
  });

  it('returns "−N h" for differences between 1 hour and 1 day (past)', () => {
    const scheduledAt = new Date(now.getTime() - 6 * 3_600_000).toISOString(); // −6 h
    expect(computeDelta(scheduledAt, now)).toBe('−6 h');
  });

  it('returns "+N d" for differences between 1 day and 30 days (future)', () => {
    const scheduledAt = new Date(now.getTime() + 2 * 86_400_000).toISOString(); // +2 d
    expect(computeDelta(scheduledAt, now)).toBe('+2 d');
  });

  it('returns "−N d" for differences between 1 day and 30 days (past)', () => {
    const scheduledAt = new Date(now.getTime() - 7 * 86_400_000).toISOString(); // −7 d
    expect(computeDelta(scheduledAt, now)).toBe('−7 d');
  });

  it('returns "+N mo" for differences of 30 days or more (future)', () => {
    const scheduledAt = new Date(now.getTime() + 60 * 86_400_000).toISOString(); // +60 d ≈ 2 mo
    expect(computeDelta(scheduledAt, now)).toBe('+2 mo');
  });

  it('returns "−N mo" for differences of 30 days or more (past)', () => {
    const scheduledAt = new Date(now.getTime() - 90 * 86_400_000).toISOString(); // −90 d ≈ 3 mo
    expect(computeDelta(scheduledAt, now)).toBe('−3 mo');
  });

  it('returns "" for an invalid scheduledAt string', () => {
    expect(computeDelta('not-a-date', now)).toBe('');
  });

  it('returns "now" at the exact boundary of 1 day minus 1 ms', () => {
    // 59 999 ms < 60_000 → still "now"
    const scheduledAt = new Date(now.getTime() + 59_999).toISOString();
    expect(computeDelta(scheduledAt, now)).toBe('now');
  });

  it('rounds minutes correctly at 1-minute boundary', () => {
    // exactly 60 000 ms → rounds to 1 m
    const scheduledAt = new Date(now.getTime() + 60_000).toISOString();
    expect(computeDelta(scheduledAt, now)).toBe('+1 m');
  });
});
