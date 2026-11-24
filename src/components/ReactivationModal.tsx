import { useRef, MouseEvent } from 'react';
import { useModalFocus } from '../hooks/useModalFocus';
import ReactivationDateSection from './ReactivationDateSection';
import ReactivationPlanSummary from './ReactivationPlanSummary';
import {
  nextBillingDayDate,
  today,
  type ReactivationPlan,
  type StartDateMode,
} from './reactivationDateHelpers';
import { useReactivationDateState } from './useReactivationDateState';
import './ReactivationModal.css';

export type { ReactivationPlan, StartDateMode };

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
   * The subscriber's original monthly billing day (1–31).
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
  const { mode, setMode, customDate, setCustomDate } =
    useReactivationDateState(isOpen);

  useModalFocus(modalRef, {
    isOpen,
    onClose,
    initialFocusRef,
    closeOnEscape: !isLoading,
  });

  if (!isOpen) return null;

  const todayDate = today();
  const billingDayDate = nextBillingDayDate(billingDay);

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

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(resolvedStartDate);
  };

  const handleDismiss = () => {
    if (isLoading) return;
    onClose();
  };

  return (
    <div
      className="reactivation-modal-overlay"
      onClick={(e: MouseEvent<HTMLDivElement>) =>
        e.target === e.currentTarget && handleDismiss()
      }
      role="dialog"
      aria-modal="true"
      aria-labelledby="reactivation-modal-title"
      aria-describedby="reactivation-modal-description"
    >
      <div
        className="reactivation-modal-content"
        ref={modalRef}
        aria-busy={isLoading}
      >
        <button
          className="reactivation-close-btn"
          onClick={handleDismiss}
          disabled={isLoading}
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
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </div>
        </div>

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

        <ReactivationPlanSummary plan={plan} windowExpired={windowExpired} />

        <ReactivationDateSection
          mode={mode}
          onModeChange={setMode}
          customDate={customDate}
          onCustomDateChange={setCustomDate}
          todayDate={todayDate}
          billingDay={billingDay}
          billingDayDate={billingDayDate}
          maxDate={maxDate}
          disabled={windowExpired || Boolean(plan.deleted)}
        />

        <div className="reactivation-actions">
          <button
            ref={initialFocusRef}
            className="reactivation-btn reactivation-btn-cancel"
            onClick={handleDismiss}
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
