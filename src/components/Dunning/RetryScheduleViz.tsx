/**
 * RetryScheduleViz
 * ----------------
 * Horizontal timeline that visualises a smart-retry dunning schedule.
 *
 * Features
 * - Per-attempt chip showing status, absolute date, relative delta,
 *   payment method, and success-probability bar.
 * - "Why these times?" popover explaining the scheduling heuristics.
 * - Screen-reader live region announcing the next-attempt time.
 * - Handles edge cases: long schedules (overflow-x + "show more" cap),
 *   all-failed, empty schedule, and RTL layouts.
 * - WCAG 2.1 AA: focus-visible rings, ARIA roles/labels, reduced-motion
 *   and forced-colours media queries.
 * - Responsive via container queries: horizontal below 480 px switches
 *   to vertical stacked layout.
 */

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import {
  AlertTriangle,
  BanknoteIcon,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  HelpCircle,
  Wallet,
  X,
  Zap,
  TrendingUp,
  BarChart2,
  ShieldCheck,
  CalendarClock,
} from 'lucide-react';
import { useModalFocus } from '../../hooks/useModalFocus';
import './RetryScheduleViz.css';

// ─── Types ──────────────────────────────────────────────────

export type AttemptStatus = 'past' | 'upcoming' | 'failed' | 'succeeded';

export type PaymentMethodKind =
  | 'card'
  | 'usdc'
  | 'prepaid'
  | 'bank'
  | 'other';

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

export interface RetryScheduleVizProps {
  attempts: RetryAttempt[];
  /**
   * Max chips shown before a "show more" toggle appears.
   * Defaults to 5. Set to Infinity to disable.
   */
  maxVisible?: number;
  /** Called when user expands beyond maxVisible */
  onShowMore?: () => void;
  /** Override the "why" popover content */
  whyContent?: React.ReactNode;
  /** i18n override for static strings */
  labels?: Partial<RetryScheduleVizLabels>;
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

const DEFAULT_LABELS: RetryScheduleVizLabels = {
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

// ─── Heuristic explanations for the "why" popover ───────────

const DEFAULT_WHY_ITEMS = [
  {
    icon: <CalendarClock size={14} />,
    title: 'Off-peak window',
    body: 'Retries run in early-morning off-peak windows (02:00–06:00 UTC) when bank processors have lower error rates.',
  },
  {
    icon: <TrendingUp size={14} />,
    title: 'Exponential back-off',
    body: 'Each subsequent attempt waits longer (1 h → 6 h → 24 h → 72 h) to avoid triggering fraud checks.',
  },
  {
    icon: <BarChart2 size={14} />,
    title: 'Success-probability model',
    body: 'Machine-learning scores predict the likelihood of success based on card network, time-of-day, and recent decline codes.',
  },
  {
    icon: <ShieldCheck size={14} />,
    title: 'Smart method rotation',
    body: 'If a card is hard-declined, we attempt your next configured method (USDC wallet, prepaid balance) before giving up.',
  },
];

// ─── Helpers ────────────────────────────────────────────────

function getProbClass(p: number): 'high' | 'medium' | 'low' {
  if (p >= 0.65) return 'high';
  if (p >= 0.35) return 'medium';
  return 'low';
}

function MethodIcon({ kind }: { kind: PaymentMethodKind }) {
  const size = 10;
  switch (kind) {
    case 'card':    return <CreditCard size={size} aria-hidden="true" />;
    case 'usdc':    return <Zap size={size} aria-hidden="true" />;
    case 'prepaid': return <Wallet size={size} aria-hidden="true" />;
    case 'bank':    return <BanknoteIcon size={size} aria-hidden="true" />;
    default:        return null;
  }
}

function StatusIcon({ status }: { status: AttemptStatus }) {
  const size = 14;
  switch (status) {
    case 'succeeded': return <Check size={size} aria-hidden="true" />;
    case 'failed':    return <X size={size} aria-hidden="true" />;
    case 'upcoming':  return <Clock size={size} aria-hidden="true" />;
    default:          return <Check size={size} aria-hidden="true" />;
  }
}

// Compute a human-readable delta relative to "now"
function computeDelta(scheduledAt: string, now: Date): string {
  const diff = new Date(scheduledAt).getTime() - now.getTime();
  const abs = Math.abs(diff);
  const isPast = diff < 0;
  const prefix = isPast ? '−' : '+';

  if (abs < 60_000)              return 'now';
  if (abs < 3_600_000)           return `${prefix}${Math.round(abs / 60_000)} m`;
  if (abs < 86_400_000)          return `${prefix}${Math.round(abs / 3_600_000)} h`;
  if (abs < 86_400_000 * 30)     return `${prefix}${Math.round(abs / 86_400_000)} d`;
  return `${prefix}${Math.round(abs / (86_400_000 * 30))} mo`;
}

// ─── Why Popover ─────────────────────────────────────────────

interface WhyPopoverProps {
  labels: RetryScheduleVizLabels;
  customContent?: React.ReactNode;
}

function WhyPopover({ labels, customContent }: WhyPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [positionBelow, setPositionBelow] = useState(false);
  const rootRef    = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef   = useRef<HTMLButtonElement>(null);
  const id = useId();
  const popoverId = `${id}-why-popover`;
  const titleId   = `${id}-why-title`;

  useModalFocus(popoverRef, {
    isOpen,
    onClose: () => setIsOpen(false),
    initialFocusRef: closeRef,
  });

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [isOpen]);

  // Flip above/below based on available space
  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => {
      const popover = popoverRef.current;
      if (!popover) return;
      const rect = popover.getBoundingClientRect();
      setPositionBelow(rect.top < 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  return (
    <span className="rsv__why-wrap" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="rsv__why-btn"
        aria-label={labels.whyTitle}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? popoverId : undefined}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <HelpCircle size={12} aria-hidden="true" />
        {labels.whyButton}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          id={popoverId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          className={`rsv__why-popover${positionBelow ? ' rsv__why-popover--below' : ''}`}
        >
          <h4 id={titleId} className="rsv__why-title">
            {labels.whyTitle}
          </h4>

          {customContent ?? (
            <ul className="rsv__why-list" role="list">
              {DEFAULT_WHY_ITEMS.map((item) => (
                <li key={item.title} className="rsv__why-item">
                  <span className="rsv__why-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <p className="rsv__why-text">
                    <strong>{item.title}</strong>
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <button
            ref={closeRef}
            type="button"
            className="rsv__why-close"
            onClick={close}
          >
            {labels.whyClose}
          </button>
        </div>
      )}
    </span>
  );
}

// ─── Single attempt chip ─────────────────────────────────────

interface AttemptChipProps {
  attempt: RetryAttempt;
  isNext: boolean;
  now: Date;
  labels: RetryScheduleVizLabels;
}

function AttemptChip({ attempt, isNext, now, labels }: AttemptChipProps) {
  const { status, when, scheduledAt, method, successProbability } = attempt;
  const delta = computeDelta(scheduledAt, now);
  const prob  = successProbability;
  const probClass = prob != null ? getProbClass(prob) : null;
  const probPct   = prob != null ? `${Math.round(prob * 100)}%` : null;

  const isUpcoming   = status === 'upcoming';
  const itemClasses  = [
    'rsv__item',
    `rsv__item--${status}`,
    isNext && isUpcoming ? 'rsv__item--next' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li
      className={itemClasses}
      aria-current={isNext && isUpcoming ? 'true' : undefined}
    >
      {/* Icon chip */}
      <span
        className="rsv__chip"
        aria-hidden="true"
      >
        <StatusIcon status={status} />
      </span>

      {/* Text labels */}
      <div className="rsv__labels">
        {/* Absolute date */}
        <time
          className="rsv__when"
          dateTime={scheduledAt}
          aria-label={`Attempt on ${when}`}
        >
          {when}
        </time>

        {/* Relative delta */}
        <span className="rsv__delta" aria-hidden="true">
          {delta}
        </span>

        {/* Method badge */}
        {method && (
          <span
            className={`rsv__method rsv__method--${method}`}
            aria-label={`Method: ${labels.methodLabels[method]}`}
          >
            <MethodIcon kind={method} />
            {labels.methodLabels[method]}
          </span>
        )}

        {/* Status badge */}
        <span
          className={`rsv__status-badge rsv__status-badge--${status}`}
          aria-label={`Status: ${labels.statusLabels[status]}`}
        >
          {labels.statusLabels[status]}
        </span>

        {/* Probability bar */}
        {probClass && probPct && (
          <>
            <div
              className="rsv__prob-track"
              role="meter"
              aria-label={`Success probability: ${probPct}`}
              aria-valuenow={Math.round((prob ?? 0) * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`rsv__prob-fill rsv__prob-fill--${probClass}`}
                style={{ width: probPct }}
              />
            </div>
            <span className="rsv__prob-label" aria-hidden="true">
              {probPct}
            </span>
          </>
        )}
      </div>
    </li>
  );
}

// ─── Main component ──────────────────────────────────────────

const DEFAULT_MAX_VISIBLE = 5;

export function RetryScheduleViz({
  attempts,
  maxVisible = DEFAULT_MAX_VISIBLE,
  onShowMore,
  whyContent,
  labels: labelOverrides,
}: RetryScheduleVizProps) {
  const labels  = { ...DEFAULT_LABELS, ...labelOverrides } as RetryScheduleVizLabels;
  const [showAll, setShowAll] = useState(false);
  const [now]    = useState(() => new Date());

  const allFailed  = attempts.length > 0 && attempts.every((a) => a.status === 'failed');
  const isEmpty    = attempts.length === 0;

  const nextAttempt = attempts.find((a) => a.status === 'upcoming');

  // SR announcement for next-attempt time
  const srMessage = isEmpty
    ? labels.srNoSchedule
    : allFailed
    ? labels.srAllFailed
    : nextAttempt
    ? labels.srNextAttempt(nextAttempt.when)
    : '';

  // Decide which items to show
  const clampedMax   = Math.max(1, maxVisible);
  const showOverflow = !showAll && attempts.length > clampedMax;
  const visibleItems = showAll ? attempts : attempts.slice(0, clampedMax);

  const handleShowMore = () => {
    setShowAll(true);
    onShowMore?.();
  };

  // Empty / all-failed state
  if (isEmpty || allFailed) {
    return (
      <div className="rsv" data-testid="retry-schedule-viz">
        {/* SR live region */}
        <div
          className="rsv__sr-live"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {srMessage}
        </div>

        <div className="rsv__empty" role="alert">
          <AlertTriangle
            size={24}
            className="rsv__empty-icon"
            aria-hidden="true"
          />
          <p className="rsv__empty-title">{labels.emptyTitle}</p>
          <p className="rsv__empty-body">{labels.emptyBody}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rsv" data-testid="retry-schedule-viz">
      {/* Off-screen SR live region */}
      <div
        className="rsv__sr-live"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {srMessage}
      </div>

      {/* Header */}
      <div className="rsv__header">
        <h3 className="rsv__title">{labels.title}</h3>
        <WhyPopover labels={labels} customContent={whyContent} />
      </div>

      {/* Scrollable horizontal track */}
      <div
        className="rsv__track"
        role="region"
        aria-label={labels.title}
        tabIndex={0}
      >
        <ol
          className="rsv__list"
          aria-label={labels.title}
        >
          {visibleItems.map((attempt) => (
            <AttemptChip
              key={attempt.id}
              attempt={attempt}
              isNext={attempt.id === nextAttempt?.id}
              now={now}
              labels={labels}
            />
          ))}
        </ol>
      </div>

      {/* Show more / less toggle */}
      {attempts.length > clampedMax && (
        <button
          type="button"
          className="rsv__overflow-btn"
          onClick={showOverflow ? handleShowMore : () => setShowAll(false)}
          aria-expanded={showAll}
          aria-controls="rsv-list"
        >
          {showOverflow ? (
            <>
              <ChevronDown size={14} aria-hidden="true" />
              {labels.showMore} ({attempts.length - clampedMax} more)
            </>
          ) : (
            <>
              <ChevronUp size={14} aria-hidden="true" />
              {labels.showLess}
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default RetryScheduleViz;
