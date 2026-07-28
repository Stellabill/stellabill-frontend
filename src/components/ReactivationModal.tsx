/**
 * ReactivationModal
 *
 * Confirm modal for reactivating a previously cancelled subscription.
 * Surfaces only when reactivation is possible within the support window
 * (planDeleted=false AND windowExpired=false).
 *
 * Features
 * ─────────
 * • Plan summary card (name, interval, price)
 * • Start-date picker: "Start today" | "Same billing day" | "Custom date"
 * • Microcopy explaining billing-day rounding
 * • Deleted-plan warning (read-only, blocks confirm)
 * • Expired-window banner (read-only, blocks confirm)
 * • Full keyboard nav + focus trap via useModalFocus
 * • WCAG 2.1 AA: role=dialog, aria-modal, aria-labelledby/describedby,
 *   aria-pressed on date options, aria-live loading state, all icons aria-hidden
 * • Responsive: single-column on mobile
 * • RTL-safe
 */

import { useRef, MouseEvent, useState, useEffect } from 'react';
import { useModalFocus } from '../hooks/useModalFocus';
import DatePickerCalendar from './DatePickerCalendar';
import './ReactivationModal.css';

// ── Types ────────────────────────────────────────────────────────────────────

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

export interface ReactivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Called with the chosen start date when the user confirms reactivation.
   * The parent is responsible for the API call.
   */
  onConfirm: (startDate: Date) => void;
  /** Details of the plan being reactivated */
  plan: ReactivationPlan;
  /**
   * Whether the reactivation support window has expired.
   * When true, the Reactivate button is disabled.
   */
  windowExpired?: boolean;
  /**
   * The subscriber's original monthly billing day (1–28).
   * Used to compute the "Same billing day" option.
   * Defaults to the 1st if omitted.
   */
  billingDay?: number;
  /** Shows a loading spinner in the confirm button while the API call is in flight */
  isLoading?: boolean;
  /**
   * Maximum number of days ahead the user can pick for a custom start date.
   * Defaults to 90.
   */
  maxDaysAhead?: number;
}

// ── Date helpers ─────────────────────────────────────────────────────────────

/** Today at midnight local time */
function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Next occurrence of `billingDay` at or after today.
 * Clamps to day 28 to avoid month-length edge cases.
 */
function nextBillingDayDate(billingDay: number): Date {
  const day = Math.min(Math.max(billingDay, 1), 28);
  const now = today();
  const candidate = new Date(now.getFullYear(), now.getMonth(), day);
  if (candidate < now) {
    candidate.setMonth(candidate.getMonth() + 1);
  }
  return candidate;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReactivationModal({
  isOpen,
  onClose,
  onConfirm,
  plan,
  windowExpired = false,
  billingDay = 1,
  isLoading = false,
  maxDaysAhead = 90,
}: ReactivationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  const [mode, setMode] = useState<StartDateMode>('today');
  const [customDate, setCustomDate] = useState<Date | null>(null);

  // Reset state each time the modal opens
  useEffect(() => {
    if (isOpen) {
      setMode('today');
      setCustomDate(null);
    }
  }, [isOpen]);

  useModalFocus(modalRef, { isOpen, onClose, initialFocusRef });

  if (!isOpen) return null;

  // ── Derived state ──────────────────────────────────────────────────────────

  const todayDate = today();
  const billingDayDate = nextBillingDayDate(billingDay);
  const isSameDayAsBillingDay = toIso(todayDate) === toIso(billingDayDate);

  const maxDate = new Date(todayDate);
  maxDate.setDate(maxDate.getDate() + maxDaysAhead);

  const resolvedStartDate: Date =
    mode === 'today'
      ? todayDate
      : mode === 'billing-day'
      ? billingDayDate
      : (customDate ?? todayDate);

  const canConfirm =
    !plan.deleted &&
    !windowExpired &&
    !isLoading &&
    (mode !== 'custom' || customDate !== null);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(resolvedStartDate);
  };

  // ── Microcopy ──────────────────────────────────────────────────────────────

  const dateNotice =
    mode === 'billing-day'
      ? `Your billing cycle will reset to day ${billingDay} of each month. Any gap from today is unpaid — access starts on ${formatDate(billingDayDate)}.`
      : mode === 'custom' && customDate
      ? `Access and billing begin on ${formatDate(customDate)}.`
      : `Access and billing begin today, ${formatDate(todayDate)}.`;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="reactivation-modal-overlay"
      onClick={(e: MouseEvent<HTMLDivElement>) =>
        e.target === e.currentTarget && onClose()
      }
      role="dialog"
      aria-modal="true"
      aria-labelledby="reactivation-modal-title"
      aria-describedby="reactivation-modal-description"
    >
      <div className="reactivation-modal-content" ref={modalRef}>
        {/* Close */}
        <button
          className="reactivation-close-btn"
          onClick={onClose}
          aria-label="Close reactivation dialog"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Icon */}
        <div className="reactivation-icon-header" aria-hidden="true">
          <div className="reactivation-icon-circle">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00ccff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {/* Circular arrow — "refresh / reactivate" */}
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </div>
        </div>

        {/* Heading & description */}
        <h2 id="reactivation-modal-title" className="reactivation-title">
          Reactivate subscription?
        </h2>
        <p
          id="reactivation-modal-description"
          className="reactivation-description"
        >
          Restore your{' '}
          <strong style={{ color: '#e2e8f0' }}>{plan.name}</strong> plan with
          the same settings. Choose when billing should restart.
        </p>

        {/* ── Expired window banner ──────────────────────────────────────── */}
        {windowExpired && (
          <div className="reactivation-expired-banner" role="alert">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>
              <strong>Reactivation window has expired.</strong> It has been
              too long since this subscription was cancelled. Please{' '}
              <strong>browse plans</strong> to start a new subscription.
            </p>
          </div>
        )}

        {/* ── Plan summary card ──────────────────────────────────────────── */}
        <div className="reactivation-plan-card" aria-label="Plan summary">
          <div className="reactivation-plan-row">
            <div className="reactivation-plan-info">
              <p className="reactivation-plan-name">{plan.name}</p>
              <p className="reactivation-plan-interval">{plan.interval}</p>
            </div>
            <span className="reactivation-plan-price">{plan.price}</span>
          </div>

          {plan.deleted && (
            <div className="reactivation-plan-deleted" role="alert">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              This plan is no longer available. Reactivation is not possible.
            </div>
          )}
        </div>

        {/* ── Start date section ─────────────────────────────────────────── */}
        <div className="reactivation-date-section">
          <p className="reactivation-section-label" id="reactivation-date-label">
            Start date
          </p>

          {/* Option buttons */}
          <div
            className="reactivation-date-options"
            role="group"
            aria-labelledby="reactivation-date-label"
          >
            {/* Today */}
            <button
              className="reactivation-date-opt"
              aria-pressed={mode === 'today'}
              onClick={() => setMode('today')}
              disabled={windowExpired || plan.deleted}
            >
              <span className="reactivation-date-opt-title">Start today</span>
              <span className="reactivation-date-opt-sub">
                <time dateTime={toIso(todayDate)}>{formatDate(todayDate)}</time>
              </span>
            </button>

            {/* Same billing day (only shown when it differs from today) */}
            {!isSameDayAsBillingDay && (
              <button
                className="reactivation-date-opt"
                aria-pressed={mode === 'billing-day'}
                onClick={() => setMode('billing-day')}
                disabled={windowExpired || plan.deleted}
              >
                <span className="reactivation-date-opt-title">
                  Same billing day
                </span>
                <span className="reactivation-date-opt-sub">
                  Day {billingDay} ·{' '}
                  <time dateTime={toIso(billingDayDate)}>
                    {formatDate(billingDayDate)}
                  </time>
                </span>
              </button>
            )}

            {/* Custom */}
            <button
              className="reactivation-date-opt"
              aria-pressed={mode === 'custom'}
              onClick={() => setMode('custom')}
              disabled={windowExpired || plan.deleted}
            >
              <span className="reactivation-date-opt-title">Custom date</span>
              <span className="reactivation-date-opt-sub">
                {customDate ? (
                  <time dateTime={toIso(customDate)}>
                    {formatDate(customDate)}
                  </time>
                ) : (
                  'Pick a date'
                )}
              </span>
            </button>
          </div>

          {/* Calendar (only when custom mode is active) */}
          {mode === 'custom' && (
            <div className="reactivation-date-picker-wrapper">
              <DatePickerCalendar
                selectedDate={customDate}
                onDateSelect={(d) => setCustomDate(d)}
                minDate={todayDate}
                maxDate={maxDate}
              />
            </div>
          )}

          {/* Microcopy */}
          <div className="reactivation-date-notice" role="note">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>{dateNotice}</p>
          </div>
        </div>

        {/* ── Actions ────────────────────────────────────────────────────── */}
        <div className="reactivation-actions">
          <button
            ref={initialFocusRef}
            className="reactivation-btn reactivation-btn-cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            Keep cancelled
          </button>
          <button
            className="reactivation-btn reactivation-btn-confirm"
            onClick={handleConfirm}
            disabled={!canConfirm}
            aria-disabled={!canConfirm}
            aria-live="polite"
            aria-label={
              isLoading
                ? 'Reactivating subscription, please wait'
                : 'Confirm reactivation'
            }
          >
            {isLoading ? (
              <>
                <span className="reactivation-spinner" aria-hidden="true" />
                Reactivating…
              </>
            ) : (
              'Reactivate'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
