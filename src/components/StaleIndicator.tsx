/**
 * StaleIndicator
 *
 * Displays how long ago a dashboard card's data was last refreshed and offers
 * a one-click refresh affordance.
 *
 * Features:
 * - Badge with relative time ("updated 3 min ago") and hover tooltip with
 *   absolute UTC timestamp
 * - Amber warning when data is stale (5–15 min old by default)
 * - Red alert when data is very stale (≥ 15 min old by default)
 * - Spinner + "Refreshing…" pending state during in-flight refresh
 * - Green success flash after a refresh completes
 * - WCAG 2.1 AA accessible: aria-live region, aria-busy, focus-visible ring,
 *   44 × 44 px minimum touch target, decorative icons aria-hidden
 * - Respects prefers-reduced-motion
 * - RTL-safe tooltip positioning
 *
 * Thresholds are controlled by the tokens in src/tokens/stalenessTokens.ts
 * and the corresponding CSS custom properties in src/styles/tokens.css.
 *
 * @example
 * ```tsx
 * <StaleIndicator
 *   updatedAt={lastFetchedAt}
 *   cardLabel="Active Subscriptions"
 *   onRefresh={handleRefresh}
 * />
 * ```
 */

import { useEffect, useId, useRef, useState } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import {
  getFreshnessState,
  formatRelativeTime,
  STALENESS_TICK_INTERVAL_MS,
  type FreshnessState,
} from '../tokens/stalenessTokens';
import styles from './StaleIndicator.module.css';

// ── Types ────────────────────────────────────────────────────────────────────

export interface StaleIndicatorProps {
  /**
   * ISO-8601 timestamp of when the card's data was last fetched.
   * Pass `null` or `undefined` when the timestamp is not yet known
   * (e.g. on first load).
   */
  updatedAt: string | null | undefined;
  /**
   * Human-readable label identifying the card, used in aria-labels.
   * E.g. "Active Subscriptions".
   */
  cardLabel: string;
  /**
   * Called when the user clicks the refresh button.
   * May be async; the component will show a spinner until the returned
   * Promise resolves or rejects.
   */
  onRefresh?: () => Promise<void> | void;
  /**
   * Pass `true` to force the refreshing state from an external source,
   * e.g. when a parent coordinates multiple cards refreshing together.
   * When provided, the internal pending state is overridden.
   */
  isRefreshing?: boolean;
  /**
   * Additional CSS class to merge onto the root element.
   */
  className?: string;
  /**
   * Override "now" for deterministic rendering in tests and Storybook.
   */
  _now?: number;
}

// ── Success flash duration (ms) ──────────────────────────────────────────────
const SUCCESS_FLASH_MS = 2000;

// ── Component ────────────────────────────────────────────────────────────────

export default function StaleIndicator({
  updatedAt,
  cardLabel,
  onRefresh,
  isRefreshing: externalRefreshing,
  className,
  _now,
}: StaleIndicatorProps) {
  const tooltipId = useId();

  // ── Local state ────────────────────────────────────────────────────────────
  const [now, setNow] = useState(() => _now ?? Date.now());
  const [internalRefreshing, setInternalRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [announce, setAnnounce] = useState('');

  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevFreshnessRef = useRef<FreshnessState | null>(null);

  // Use external refreshing flag if supplied; otherwise internal.
  const isRefreshing = externalRefreshing ?? internalRefreshing;

  // ── Tick clock ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (_now !== undefined) return; // Pinned in tests/stories — no ticking
    const id = setInterval(() => setNow(Date.now()), STALENESS_TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [_now]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const effectiveState: FreshnessState = showSuccess
    ? 'success'
    : isRefreshing
      ? 'refreshing'
      : getFreshnessState(updatedAt, now);

  const relativeText = updatedAt ? formatRelativeTime(updatedAt, now) : null;

  // Absolute timestamp for the tooltip (use the user's locale + UTC offset).
  const absoluteText = updatedAt
    ? new Date(updatedAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  // ── Announce freshness changes to screen readers ───────────────────────────
  useEffect(() => {
    const prev = prevFreshnessRef.current;
    prevFreshnessRef.current = effectiveState;

    if (prev === null) return; // Skip initial mount announcement
    if (effectiveState === prev) return;

    let message = '';
    if (effectiveState === 'refreshing') {
      message = `${cardLabel}: refreshing data.`;
    } else if (effectiveState === 'success') {
      message = `${cardLabel}: data refreshed successfully.`;
    } else if (effectiveState === 'stale') {
      message = `${cardLabel} data is ${relativeText ?? 'getting old'}.`;
    } else if (effectiveState === 'very-stale') {
      message = `${cardLabel} data is significantly outdated — ${relativeText ?? 'please refresh'}.`;
    }

    if (message) {
      // Delay by 50 ms so the live region picks up the change even if
      // the text hasn't changed since the previous announcement.
      const t = setTimeout(() => setAnnounce(message), 50);
      return () => clearTimeout(t);
    }
  }, [effectiveState, cardLabel, relativeText]);

  // ── Refresh handler ────────────────────────────────────────────────────────
  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;

    // Clear any pending success timer
    if (successTimer.current) clearTimeout(successTimer.current);
    setShowSuccess(false);

    setInternalRefreshing(true);
    try {
      await onRefresh();
      // Show success flash
      setShowSuccess(true);
      successTimer.current = setTimeout(() => setShowSuccess(false), SUCCESS_FLASH_MS);
    } catch {
      // Errors from onRefresh are handled by the caller (e.g. via CardErrorSlot).
      // The indicator simply reverts to a non-refreshing state so the button
      // re-enables and the user can retry.
    } finally {
      setInternalRefreshing(false);
    }
  };

  // Cleanup success timer on unmount
  useEffect(() => {
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  // ── Badge label ────────────────────────────────────────────────────────────
  const badgeText = (() => {
    if (effectiveState === 'refreshing') return 'Refreshing…';
    if (effectiveState === 'success') return 'Updated';
    if (relativeText) return `Updated ${relativeText}`;
    return 'No timestamp';
  })();

  // ── Button aria-label ──────────────────────────────────────────────────────
  const buttonAriaLabel = isRefreshing
    ? `Refreshing ${cardLabel}…`
    : `Refresh ${cardLabel}`;

  // ── Icon ───────────────────────────────────────────────────────────────────
  const BadgeIcon = (() => {
    if (effectiveState === 'refreshing') return Loader2;
    if (effectiveState === 'success') return CheckCircle2;
    if (effectiveState === 'very-stale') return AlertTriangle;
    return Clock;
  })();

  const iconClassName =
    effectiveState === 'refreshing'
      ? styles['stale-indicator__spinner']
      : effectiveState === 'success'
        ? styles['stale-indicator__success-icon']
        : undefined;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className={[styles['stale-indicator'], className].filter(Boolean).join(' ')}
      data-freshness={effectiveState}
      data-testid="stale-indicator"
    >
      {/* Polite live region — only announced on state transitions */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={styles['stale-indicator__live-region']}
      >
        {announce}
      </div>

      {/* Badge with hover tooltip */}
      <div
        className={styles['stale-indicator__tooltip-anchor']}
        aria-describedby={tooltipId}
      >
        <span
          className={styles['stale-indicator__badge']}
          aria-hidden="true"
        >
          <BadgeIcon
            size={11}
            aria-hidden="true"
            className={iconClassName}
          />
          {badgeText}
        </span>

        {/* Tooltip — shown on hover/focus; contains absolute timestamp */}
        {absoluteText && (
          <div
            id={tooltipId}
            role="tooltip"
            className={styles['stale-indicator__tooltip']}
          >
            Last updated: {absoluteText}
          </div>
        )}
      </div>

      {/* Refresh button — only when a callback is provided and not success */}
      {onRefresh && effectiveState !== 'success' && (
        <button
          type="button"
          className={styles['stale-indicator__refresh']}
          onClick={handleRefresh}
          disabled={isRefreshing}
          aria-busy={isRefreshing}
          aria-label={buttonAriaLabel}
        >
          <RefreshCw
            size={11}
            aria-hidden="true"
            className={isRefreshing ? styles['stale-indicator__spinner'] : undefined}
          />
          <span>{isRefreshing ? 'Refreshing…' : 'Refresh'}</span>
        </button>
      )}
    </div>
  );
}
