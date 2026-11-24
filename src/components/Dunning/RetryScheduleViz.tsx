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

import { useId, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

import {
  DEFAULT_LABELS,
  DEFAULT_MAX_VISIBLE,
} from './retryScheduleVizHelpers';
import type {
  RetryAttempt,
  RetryScheduleVizLabels,
} from './retryScheduleVizHelpers';
import { AttemptChip } from './AttemptChip';
import { WhyPopover } from './WhyPopover';
import './RetryScheduleViz.css';

// Re-export types so existing consumers can keep importing from this file.
export type { AttemptStatus, PaymentMethodKind, RetryAttempt, RetryScheduleVizLabels } from './retryScheduleVizHelpers';

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
  const listId   = useId();

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
          id={listId}
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
          aria-controls={listId}
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
