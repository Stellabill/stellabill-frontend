import type { ReactivationPlan } from './reactivationDateHelpers';

export interface ReactivationPlanSummaryProps {
  plan: ReactivationPlan;
  windowExpired: boolean;
}

export default function ReactivationPlanSummary({
  plan,
  windowExpired,
}: ReactivationPlanSummaryProps) {
  return (
    <>
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
    </>
  );
}
