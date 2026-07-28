import { useEffect, useId, useRef, useState } from 'react';
import './dunning.css';

interface RetryAttempt {
  id: string;
  when: string;
  status: 'past' | 'upcoming' | 'failed' | 'succeeded';
  delta?: string;
  method?: string;
  successProbability?: string;
}

const statusLabelMap = {
  past: 'Attempted',
  upcoming: 'Next attempt',
  failed: 'Failed',
  succeeded: 'Succeeded',
} as const;

export default function RetryTimeline({ attempts }: { attempts: RetryAttempt[] }) {
  const [isRtl, setIsRtl] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsRtl(document.documentElement.dir === 'rtl');
    }
  }, []);

  useEffect(() => {
    if (!showExplanation) return;

    const handlePointerDown = (event: MouseEvent) => {
      const clickedOutside =
        dialogRef.current &&
        !dialogRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node);

      if (clickedOutside) {
        setShowExplanation(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowExplanation(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showExplanation]);

  const nextAttempt = attempts.find((attempt) => attempt.status === 'upcoming') ?? attempts[attempts.length - 1];
  const nextAttemptText = nextAttempt
    ? `Next retry scheduled for ${nextAttempt.when}`
    : 'No retry is scheduled right now.';

  return (
    <div className="dunning-schedule" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="dunning-schedule-header">
        <div>
          <p className="dunning-schedule-kicker">Smart retry</p>
          <h3 className="dunning-schedule-title">Retry schedule</h3>
        </div>
        <button
          ref={triggerRef}
          type="button"
          className="dunning-schedule-help"
          onClick={() => setShowExplanation((current) => !current)}
          aria-expanded={showExplanation}
          aria-haspopup="dialog"
          aria-controls={`${titleId}-explanation`}
        >
          Why these times?
        </button>
      </div>

      <p className="dunning-schedule-summary">
        Each attempt is spaced to balance recovery likelihood and customer effort.
      </p>

      <p className="dunning-schedule-live" aria-live="polite">
        {nextAttemptText}
      </p>

      <ol className="dunning-timeline" aria-label="Retry schedule">
        {attempts.map((attempt) => {
          const icon = attempt.status === 'upcoming' ? '⏳' : attempt.status === 'failed' ? '⚠️' : '✓';

          return (
            <li
              key={attempt.id}
              className={`dunning-step-card dunning-step-card--${attempt.status}`}
              aria-current={attempt.status === 'upcoming' ? 'step' : undefined}
            >
              <span className="dunning-step-icon" aria-hidden="true">
                {icon}
              </span>
              <div className="dunning-step-content">
                <div className="dunning-step-heading">
                  <span className="dunning-step-label">{statusLabelMap[attempt.status]}</span>
                  <span className="dunning-step-delta">{attempt.delta ?? 'Pending'}</span>
                </div>
                <div className="dunning-step-when">{attempt.when}</div>
                <div className="dunning-step-meta">
                  <span className="dunning-step-pill">{attempt.method ?? 'Automatic retry'}</span>
                  <span className="dunning-step-pill">{attempt.successProbability ?? '—'}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {showExplanation && (
        <div
          ref={dialogRef}
          id={`${titleId}-explanation`}
          className="dunning-schedule-dialog"
          role="dialog"
          aria-labelledby={titleId}
          aria-describedby={bodyId}
        >
          <h4 id={titleId}>Why these times?</h4>
          <p id={bodyId}>
            We use a simple heuristic to pace retries: earlier attempts are more likely to succeed when the card issuer is still processing the payment, while later attempts are spaced farther apart to reduce friction and avoid unnecessary retries.
          </p>
        </div>
      )}
    </div>
  );
}
