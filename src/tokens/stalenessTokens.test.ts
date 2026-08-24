import { describe, it, expect } from 'vitest';
import {
  getFreshnessState,
  formatRelativeTime,
  STALE_THRESHOLD_MS,
  VERY_STALE_THRESHOLD_MS,
  STALENESS_TICK_INTERVAL_MS,
} from './stalenessTokens';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build an ISO timestamp exactly `ms` milliseconds before `now`. */
function isoAtOffset(ms: number, now = Date.now()) {
  return new Date(now - ms).toISOString();
}

const NOW = 1_700_000_000_000; // Fixed epoch for deterministic tests

// ── Token value sanity ────────────────────────────────────────────────────────
describe('token values', () => {
  it('STALE_THRESHOLD_MS defaults to 5 minutes', () => {
    expect(STALE_THRESHOLD_MS).toBe(5 * 60 * 1000);
  });

  it('VERY_STALE_THRESHOLD_MS defaults to 15 minutes', () => {
    expect(VERY_STALE_THRESHOLD_MS).toBe(15 * 60 * 1000);
  });

  it('VERY_STALE_THRESHOLD_MS is greater than STALE_THRESHOLD_MS', () => {
    expect(VERY_STALE_THRESHOLD_MS).toBeGreaterThan(STALE_THRESHOLD_MS);
  });

  it('STALENESS_TICK_INTERVAL_MS is 30 seconds', () => {
    expect(STALENESS_TICK_INTERVAL_MS).toBe(30_000);
  });
});

// ── getFreshnessState ─────────────────────────────────────────────────────────
describe('getFreshnessState', () => {
  it('returns "unknown" for null', () => {
    expect(getFreshnessState(null, NOW)).toBe('unknown');
  });

  it('returns "unknown" for undefined', () => {
    expect(getFreshnessState(undefined, NOW)).toBe('unknown');
  });

  it('returns "unknown" for empty string', () => {
    expect(getFreshnessState('', NOW)).toBe('unknown');
  });

  it('returns "unknown" for an invalid ISO string', () => {
    expect(getFreshnessState('not-a-date', NOW)).toBe('unknown');
  });

  it('returns "unknown" when timestamp is in the future', () => {
    const future = new Date(NOW + 1000).toISOString();
    expect(getFreshnessState(future, NOW)).toBe('unknown');
  });

  it('returns "fresh" when age is 0 ms', () => {
    const ts = new Date(NOW).toISOString();
    expect(getFreshnessState(ts, NOW)).toBe('fresh');
  });

  it('returns "fresh" when age is just below STALE_THRESHOLD_MS', () => {
    const ts = isoAtOffset(STALE_THRESHOLD_MS - 1, NOW);
    expect(getFreshnessState(ts, NOW)).toBe('fresh');
  });

  it('returns "stale" when age equals STALE_THRESHOLD_MS exactly', () => {
    const ts = isoAtOffset(STALE_THRESHOLD_MS, NOW);
    expect(getFreshnessState(ts, NOW)).toBe('stale');
  });

  it('returns "stale" in the middle of the stale window', () => {
    const tenMin = 10 * 60 * 1000;
    const ts = isoAtOffset(tenMin, NOW);
    expect(getFreshnessState(ts, NOW)).toBe('stale');
  });

  it('returns "stale" at VERY_STALE_THRESHOLD_MS - 1 ms', () => {
    const ts = isoAtOffset(VERY_STALE_THRESHOLD_MS - 1, NOW);
    expect(getFreshnessState(ts, NOW)).toBe('stale');
  });

  it('returns "very-stale" when age equals VERY_STALE_THRESHOLD_MS', () => {
    const ts = isoAtOffset(VERY_STALE_THRESHOLD_MS, NOW);
    expect(getFreshnessState(ts, NOW)).toBe('very-stale');
  });

  it('returns "very-stale" for data that is hours old', () => {
    const twoHours = 2 * 60 * 60 * 1000;
    const ts = isoAtOffset(twoHours, NOW);
    expect(getFreshnessState(ts, NOW)).toBe('very-stale');
  });

  it('returns "very-stale" for data from a different day', () => {
    const yesterday = isoAtOffset(26 * 60 * 60 * 1000, NOW);
    expect(getFreshnessState(yesterday, NOW)).toBe('very-stale');
  });

  it('uses Date.now() when no `now` argument is provided', () => {
    // Just ensure it doesn't throw and returns a valid state
    const ts = new Date(Date.now() - 1000).toISOString();
    const state = getFreshnessState(ts);
    expect(['fresh', 'stale', 'very-stale', 'unknown']).toContain(state);
  });

  // Timezone edge: same UTC instant expressed in different offset strings
  it('handles positive UTC offset strings (e.g. +05:30)', () => {
    const ts = new Date(NOW - 3 * 60 * 1000).toISOString().replace('Z', '+05:30');
    // The date parsing should normalise to UTC regardless
    // Note: "+05:30" in place of "Z" shifts interpretation but Date() handles it
    const result = getFreshnessState(ts, NOW);
    expect(['fresh', 'stale', 'very-stale', 'unknown']).toContain(result);
  });
});

// ── formatRelativeTime ────────────────────────────────────────────────────────
describe('formatRelativeTime', () => {
  it('returns "just now" for 0 ms old', () => {
    expect(formatRelativeTime(new Date(NOW).toISOString(), NOW)).toBe('just now');
  });

  it('returns "just now" for 29 seconds old', () => {
    expect(formatRelativeTime(isoAtOffset(29_000, NOW), NOW)).toBe('just now');
  });

  it('returns "1 min ago" for 30 seconds old (boundary)', () => {
    expect(formatRelativeTime(isoAtOffset(30_000, NOW), NOW)).toBe('1 min ago');
  });

  it('returns "1 min ago" for 89 seconds old', () => {
    expect(formatRelativeTime(isoAtOffset(89_000, NOW), NOW)).toBe('1 min ago');
  });

  it('returns "2 min ago" for 90 seconds old', () => {
    // round(90/60) = 2
    expect(formatRelativeTime(isoAtOffset(90_000, NOW), NOW)).toBe('2 min ago');
  });

  it('returns "5 min ago" for exactly 5 minutes', () => {
    expect(formatRelativeTime(isoAtOffset(5 * 60_000, NOW), NOW)).toBe('5 min ago');
  });

  it('returns "59 min ago" for 59 minutes', () => {
    expect(formatRelativeTime(isoAtOffset(59 * 60_000, NOW), NOW)).toBe('59 min ago');
  });

  it('returns "1 hr ago" for exactly 1 hour', () => {
    expect(formatRelativeTime(isoAtOffset(60 * 60_000, NOW), NOW)).toBe('1 hr ago');
  });

  it('returns "2 hr ago" for 2 hours', () => {
    expect(formatRelativeTime(isoAtOffset(2 * 60 * 60_000, NOW), NOW)).toBe('2 hr ago');
  });

  it('returns "23 hr ago" for 23 hours', () => {
    expect(formatRelativeTime(isoAtOffset(23 * 60 * 60_000, NOW), NOW)).toBe('23 hr ago');
  });

  it('returns "1 day ago" for exactly 24 hours', () => {
    expect(formatRelativeTime(isoAtOffset(24 * 60 * 60_000, NOW), NOW)).toBe('1 day ago');
  });

  it('returns "2 days ago" for 48 hours', () => {
    expect(formatRelativeTime(isoAtOffset(48 * 60 * 60_000, NOW), NOW)).toBe('2 days ago');
  });

  it('returns "7 days ago" for 7 days', () => {
    expect(formatRelativeTime(isoAtOffset(7 * 24 * 60 * 60_000, NOW), NOW)).toBe('7 days ago');
  });

  // Minute rounding: 4m 29s rounds down to 4, 4m 30s rounds up to 5
  it('rounds minutes correctly (4 min 29 s → 4 min ago)', () => {
    const ms = 4 * 60_000 + 29_000;
    expect(formatRelativeTime(isoAtOffset(ms, NOW), NOW)).toBe('4 min ago');
  });

  it('rounds minutes correctly (4 min 30 s → 5 min ago)', () => {
    const ms = 4 * 60_000 + 30_000;
    expect(formatRelativeTime(isoAtOffset(ms, NOW), NOW)).toBe('5 min ago');
  });

  it('returns "just now" for a future timestamp', () => {
    const future = new Date(NOW + 5000).toISOString();
    expect(formatRelativeTime(future, NOW)).toBe('just now');
  });

  it('returns "just now" for an invalid ISO string', () => {
    expect(formatRelativeTime('bad-date', NOW)).toBe('just now');
  });

  it('uses Date.now() when no `now` argument is provided', () => {
    const ts = new Date(Date.now() - 2 * 60_000).toISOString();
    const result = formatRelativeTime(ts);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
