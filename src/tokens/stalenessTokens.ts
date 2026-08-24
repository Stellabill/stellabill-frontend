/**
 * Staleness threshold tokens for the stale-data indicator.
 *
 * These values control when merchant dashboard card data transitions between
 * freshness states. Support can tune them per environment by overriding the
 * module via environment-specific config or by adjusting the CSS custom
 * properties that mirror these values (see src/styles/tokens.css addendum).
 *
 * Thresholds are expressed in **milliseconds** for use in JavaScript, and as
 * **minutes** in CSS custom properties for human-readable token docs.
 *
 * States:
 *   fresh     – data was loaded recently; no indicator shown
 *   stale     – data is getting old; amber badge shown
 *   very-stale – data is significantly outdated; red badge shown
 */

/** How long (ms) before data transitions from fresh → stale. Default: 5 min. */
export const STALE_THRESHOLD_MS =
  typeof import.meta !== 'undefined' &&
  import.meta.env?.VITE_STALE_THRESHOLD_MS
    ? Number(import.meta.env.VITE_STALE_THRESHOLD_MS)
    : 5 * 60 * 1000; // 5 minutes

/** How long (ms) before data transitions from stale → very-stale. Default: 15 min. */
export const VERY_STALE_THRESHOLD_MS =
  typeof import.meta !== 'undefined' &&
  import.meta.env?.VITE_VERY_STALE_THRESHOLD_MS
    ? Number(import.meta.env.VITE_VERY_STALE_THRESHOLD_MS)
    : 15 * 60 * 1000; // 15 minutes

/**
 * How often (ms) the StaleIndicator clock ticks to refresh relative-time text.
 * Lower values are more accurate but cause more re-renders.
 * Default: 30 s (acceptable rounding for "N min ago" display).
 */
export const STALENESS_TICK_INTERVAL_MS = 30_000;

/**
 * Possible freshness states for a dashboard card datum.
 *
 * - `fresh`      – within STALE_THRESHOLD_MS; indicator hidden
 * - `stale`      – between thresholds; amber warning shown
 * - `very-stale` – past VERY_STALE_THRESHOLD_MS; red alert shown
 * - `unknown`    – no timestamp available (first load or server didn't report)
 */
export type FreshnessState = 'fresh' | 'stale' | 'very-stale' | 'unknown';

/**
 * Compute the freshness state for a given ISO-8601 timestamp.
 *
 * @param updatedAt - ISO-8601 string (or null/undefined when unknown)
 * @param now       - optional override for "now" (useful in tests)
 */
export function getFreshnessState(
  updatedAt: string | null | undefined,
  now = Date.now(),
): FreshnessState {
  if (!updatedAt) return 'unknown';
  const age = now - new Date(updatedAt).getTime();
  if (isNaN(age) || age < 0) return 'unknown';
  if (age < STALE_THRESHOLD_MS) return 'fresh';
  if (age < VERY_STALE_THRESHOLD_MS) return 'stale';
  return 'very-stale';
}

/**
 * Format the age of a timestamp as human-readable relative text.
 * Designed for compact badge display ("just now", "3 min ago", "2 hr ago").
 *
 * @param updatedAt - ISO-8601 string
 * @param now       - optional override for "now" (useful in tests)
 */
export function formatRelativeTime(
  updatedAt: string,
  now = Date.now(),
): string {
  const diff = now - new Date(updatedAt).getTime();
  if (isNaN(diff) || diff < 0) return 'just now';
  const seconds = Math.floor(diff / 1000);
  if (seconds < 30) return 'just now';
  if (seconds < 90) return '1 min ago';
  const minutes = Math.round(diff / 60_000);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}
