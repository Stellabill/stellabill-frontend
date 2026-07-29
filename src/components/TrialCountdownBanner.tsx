/**
 * TrialCountdownBanner
 *
 * Persistent banner that counts down trial days remaining and escalates
 * visual urgency as expiry approaches.
 *
 * Urgency tiers
 * ─────────────
 *   >7 days  → "info"    blue     — low urgency
 *   3–7 days → "warning" amber    — moderate urgency
 *   <3 days  → "urgent"  red      — high urgency
 *   0 days   → "expired" red      — trial ended today / already over
 *
 * Snooze / remind-me
 * ──────────────────
 *   "Remind me later" hides the banner until the snooze period ends OR the
 *   tier escalates (i.e. urgency increases).  The banner always reappears on
 *   tier change so the subscriber never misses an escalation.
 *   Snooze state is stored in sessionStorage (clears on tab close).
 *
 * Accessibility
 * ─────────────
 *   • role="region" + aria-labelledby on the banner
 *   • Tier escalation announced via a dedicated aria-live="assertive" region
 *     (fires only when tier changes, not on every render)
 *   • Snooze/dismiss buttons have descriptive aria-labels
 *   • Countdown badge labelled for screen readers
 *   • All icons aria-hidden
 *   • Focus-visible rings on all interactive elements
 *   • Reduced-motion: pulse animation suppressed
 *
 * Responsive
 * ──────────
 *   Stacks to single column on mobile (≤ 640 px).
 */

import { useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, Bell, BellOff, Clock, Rocket, X } from 'lucide-react';
import './TrialCountdownBanner.css';

// ── Types ────────────────────────────────────────────────────────────────────

export type TrialUrgencyTier = 'info' | 'warning' | 'urgent' | 'expired';

export interface TrialCountdownBannerProps {
  /** The UTC date-string or Date when the trial ends, e.g. "2026-08-05" */
  trialEndsAt: string | Date;
  /** Called when the user clicks "Upgrade now" */
  onUpgrade?: () => void;
  /** URL for the upgrade CTA when onUpgrade is not provided */
  upgradeHref?: string;
  /** Called when the user permanently dismisses the banner */
  onDismiss?: () => void;
  /**
   * Snooze durations offered in the "Remind me later" menu.
   * Array of { label, hours }.  Defaults to 1h / 4h / 24h.
   */
  snoozeDurations?: { label: string; hours: number }[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_SNOOZE_DURATIONS = [
  { label: '1 hour',   hours: 1  },
  { label: '4 hours',  hours: 4  },
  { label: 'Tomorrow', hours: 24 },
];

const STORAGE_KEY = 'stellabill-trial-banner-snooze';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDaysRemaining(trialEndsAt: string | Date): number {
  const end = new Date(trialEndsAt);
  // Normalize both to midnight local time for a clean day diff
  end.setHours(23, 59, 59, 999);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffMs = end.getTime() - now.getTime();
  return Math.max(-1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function getTier(daysRemaining: number): TrialUrgencyTier {
  if (daysRemaining < 0) return 'expired';
  if (daysRemaining === 0) return 'expired';
  if (daysRemaining < 3)  return 'urgent';
  if (daysRemaining <= 7) return 'warning';
  return 'info';
}

function getSnoozeExpiry(): number | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { expiry: number; tier: TrialUrgencyTier };
    return parsed.expiry;
  } catch {
    return null;
  }
}

function getSnoozedTier(): TrialUrgencyTier | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { expiry: number; tier: TrialUrgencyTier };
    return parsed.tier;
  } catch {
    return null;
  }
}

function isSnoozed(currentTier: TrialUrgencyTier): boolean {
  const expiry = getSnoozeExpiry();
  const snoozedTier = getSnoozedTier();
  if (!expiry || !snoozedTier) return false;
  // Snooze is cancelled if tier has escalated since snooze was set
  if (snoozedTier !== currentTier) return false;
  return Date.now() < expiry;
}

function setSnooze(hours: number, tier: TrialUrgencyTier) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ expiry: Date.now() + hours * 3600 * 1000, tier }),
    );
  } catch { /* storage disabled — ignore */ }
}

function clearSnooze() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

// ── Tier config ───────────────────────────────────────────────────────────────

interface TierConfig {
  label: string;
  a11yLabel: string;
  badgeClass: string;
  Icon: typeof Clock;
  escalationAnnouncement: string;
}

const TIER_CONFIG: Record<TrialUrgencyTier, TierConfig> = {
  info: {
    label: 'Trial active',
    a11yLabel: 'Trial period status',
    badgeClass: 'trial-banner--info',
    Icon: Clock,
    escalationAnnouncement: '',
  },
  warning: {
    label: 'Trial ending soon',
    a11yLabel: 'Trial ending soon',
    badgeClass: 'trial-banner--warning',
    Icon: AlertTriangle,
    escalationAnnouncement: 'Your trial is ending soon — fewer than 7 days remain.',
  },
  urgent: {
    label: 'Trial expiring in days',
    a11yLabel: 'Trial expiring very soon',
    badgeClass: 'trial-banner--urgent',
    Icon: AlertTriangle,
    escalationAnnouncement: 'Urgent: your trial expires in less than 3 days.',
  },
  expired: {
    label: 'Trial expired',
    a11yLabel: 'Trial has expired',
    badgeClass: 'trial-banner--expired',
    Icon: AlertTriangle,
    escalationAnnouncement: 'Your trial has expired. Upgrade to keep access.',
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function TrialCountdownBanner({
  trialEndsAt,
  onUpgrade,
  upgradeHref = '/plans',
  onDismiss,
  snoozeDurations = DEFAULT_SNOOZE_DURATIONS,
}: TrialCountdownBannerProps) {
  const titleId = useId();
  const liveRegionId = useId();
  const snoozeMenuId = useId();

  const daysRemaining = getDaysRemaining(trialEndsAt);
  const tier = getTier(daysRemaining);
  const config = TIER_CONFIG[tier];

  const prevTierRef = useRef<TrialUrgencyTier | null>(null);

  const [dismissed, setDismissed] = useState(false);
  const [snoozed, setSnoozed] = useState(() => isSnoozed(tier));
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');

  const snoozeMenuRef = useRef<HTMLDivElement>(null);
  const snoozeButtonRef = useRef<HTMLButtonElement>(null);

  // Announce escalation only when tier changes (not on mount)
  useEffect(() => {
    if (prevTierRef.current === null) {
      prevTierRef.current = tier;
      return;
    }
    if (prevTierRef.current !== tier) {
      prevTierRef.current = tier;
      const msg = config.escalationAnnouncement;
      if (msg) setLiveMessage(msg);
      // Re-show banner if tier escalated during snooze
      setSnoozed(false);
      clearSnooze();
    }
  }, [tier, config.escalationAnnouncement]);

  // Close snooze menu on outside click
  useEffect(() => {
    if (!showSnoozeMenu) return;
    const handler = (e: MouseEvent) => {
      if (snoozeMenuRef.current && !snoozeMenuRef.current.contains(e.target as Node)) {
        setShowSnoozeMenu(false);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [showSnoozeMenu]);

  // Re-check snooze expiry every minute
  useEffect(() => {
    const id = window.setInterval(() => {
      setSnoozed(isSnoozed(tier));
    }, 60_000);
    return () => clearInterval(id);
  }, [tier]);

  const handleDismiss = () => {
    setDismissed(true);
    clearSnooze();
    onDismiss?.();
  };

  const handleSnooze = (hours: number) => {
    setSnooze(hours, tier);
    setSnoozed(true);
    setShowSnoozeMenu(false);
    setLiveMessage(`Trial reminder snoozed for ${snoozeDurations.find(d => d.hours === hours)?.label ?? `${hours} hours`}.`);
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      window.location.href = upgradeHref;
    }
  };

  // Don't render if dismissed or snoozed
  if (dismissed || snoozed) return null;

  const countdownLabel =
    daysRemaining <= 0
      ? 'Trial expired'
      : daysRemaining === 1
      ? '1 day left'
      : `${daysRemaining} days left`;

  const headlineText =
    daysRemaining <= 0
      ? 'Your trial has expired'
      : daysRemaining === 1
      ? 'Your trial expires today'
      : `Your trial expires in ${daysRemaining} days`;

  const subText =
    daysRemaining <= 0
      ? 'Upgrade now to keep full access to all features.'
      : isExpiredTier(tier)
      ? 'Upgrade to restore access.'
      : 'Upgrade before your trial ends to avoid interruption.';

  return (
    <>
      {/* ── Assertive live region: tier escalation only ──────────────── */}
      <div
        id={liveRegionId}
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        className="trial-banner-live-region"
      >
        {liveMessage}
      </div>

      <div
        className={`trial-banner ${config.badgeClass}`}
        role="region"
        aria-labelledby={titleId}
      >
        <div className="trial-banner__inner">
          {/* ── Left: icon + copy ─────────────────────────────────────── */}
          <div className="trial-banner__body">
            <span className="trial-banner__icon" aria-hidden="true">
              <config.Icon size={18} strokeWidth={2.2} />
            </span>

            <div className="trial-banner__copy">
              <p id={titleId} className="trial-banner__headline">
                <strong>{headlineText}</strong>
                {/* Countdown badge */}
                <span
                  className={`trial-banner__badge ${config.badgeClass}`}
                  aria-label={countdownLabel}
                >
                  {daysRemaining <= 0 ? 'Expired' : `${daysRemaining}d`}
                </span>
              </p>
              <p className="trial-banner__sub">{subText}</p>
            </div>
          </div>

          {/* ── Right: actions ────────────────────────────────────────── */}
          <div className="trial-banner__actions">
            {/* Upgrade CTA */}
            <button
              type="button"
              className="trial-banner__upgrade-btn"
              onClick={handleUpgrade}
              aria-label="Upgrade your plan now"
            >
              <Rocket size={14} aria-hidden="true" />
              Upgrade now
            </button>

            {/* Snooze / remind me later */}
            {daysRemaining > 0 && (
              <div className="trial-banner__snooze-wrap" ref={snoozeMenuRef}>
                <button
                  ref={snoozeButtonRef}
                  type="button"
                  className="trial-banner__snooze-btn"
                  onClick={() => setShowSnoozeMenu((p) => !p)}
                  aria-expanded={showSnoozeMenu}
                  aria-haspopup="menu"
                  aria-controls={snoozeMenuId}
                  aria-label="Remind me later — snooze this banner"
                >
                  <Bell size={14} aria-hidden="true" />
                  Remind me later
                </button>

                {showSnoozeMenu && (
                  <div
                    id={snoozeMenuId}
                    role="menu"
                    aria-label="Snooze options"
                    className="trial-banner__snooze-menu"
                  >
                    {snoozeDurations.map((d) => (
                      <button
                        key={d.hours}
                        type="button"
                        role="menuitem"
                        className="trial-banner__snooze-item"
                        onClick={() => handleSnooze(d.hours)}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Dismiss */}
            <button
              type="button"
              className="trial-banner__dismiss-btn"
              onClick={handleDismiss}
              aria-label="Dismiss trial expiration banner"
            >
              <BellOff size={14} aria-hidden="true" />
              <span className="trial-banner__dismiss-label">Don't show again</span>
              <X size={14} aria-hidden="true" className="trial-banner__dismiss-x" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function isExpiredTier(tier: TrialUrgencyTier): tier is 'expired' {
  return tier === 'expired';
}
