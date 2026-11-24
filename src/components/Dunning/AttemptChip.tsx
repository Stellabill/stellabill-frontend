/**
 * AttemptChip
 * -----------
 * Renders a single retry-attempt list item: icon chip, date, relative
 * delta, payment-method badge, status badge, and optional probability bar.
 */

import { getProbClass, computeDelta } from './retryScheduleVizHelpers';
import { MethodIcon, StatusIcon } from './retryScheduleVizIcons';
import type { RetryAttempt, RetryScheduleVizLabels } from './retryScheduleVizHelpers';

export interface AttemptChipProps {
  attempt: RetryAttempt;
  isNext: boolean;
  now: Date;
  labels: RetryScheduleVizLabels;
}

export function AttemptChip({ attempt, isNext, now, labels }: AttemptChipProps) {
  const { status, when, scheduledAt, method, successProbability } = attempt;
  const delta     = computeDelta(scheduledAt, now);
  const prob      = successProbability;
  const probClass = prob != null ? getProbClass(prob) : null;
  const probPct   = prob != null ? `${Math.round(prob * 100)}%` : null;

  const isUpcoming  = status === 'upcoming';
  const itemClasses = [
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
      <span className="rsv__chip" aria-hidden="true">
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
