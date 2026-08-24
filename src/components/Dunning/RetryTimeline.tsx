/**
 * RetryTimeline (updated)
 * -----------------------
 * Thin wrapper that maps the original simple RetryAttempt shape
 * to the richer RetryScheduleViz component.
 *
 * Backward-compatible: callers that only supply { id, when, status }
 * continue to work unchanged; the new optional fields are accepted
 * via the `retryAttempts` prop when available.
 */
import RetryScheduleViz, {
  type RetryAttempt as RichAttempt,
} from './RetryScheduleViz';
import './dunning.css';

interface RetryAttempt {
  id: string;
  /** Human-readable date label */
  when: string;
  status: 'past' | 'upcoming' | 'failed' | 'succeeded';
  /**
   * ISO-8601 timestamp.  Falls back to `when` if not supplied so
   * computeDelta still works (it may produce a less precise value).
   */
  scheduledAt?: string;
  method?: RichAttempt['method'];
  successProbability?: number;
}

interface RetryTimelineProps {
  attempts: RetryAttempt[];
  /** Max chips shown before "show more" toggle.  Defaults to 5. */
  maxVisible?: number;
  /** Override the "why these times?" popover content */
  whyContent?: React.ReactNode;
}

export default function RetryTimeline({
  attempts,
  maxVisible,
  whyContent,
}: RetryTimelineProps) {
  const richAttempts: RichAttempt[] = attempts.map((a) => ({
    ...a,
    // If `scheduledAt` is missing, use `when` as a fallback.
    // computeDelta will show "now" or an imprecise delta, which is
    // acceptable for callers that don't supply machine-readable dates.
    scheduledAt: a.scheduledAt ?? a.when,
  }));

  return (
    <RetryScheduleViz
      attempts={richAttempts}
      maxVisible={maxVisible}
      whyContent={whyContent}
    />
  );
}
