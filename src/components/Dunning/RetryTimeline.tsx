import './dunning.css';

interface RetryAttempt {
  id: string;
  when: string;
  status: 'past' | 'upcoming' | 'failed' | 'succeeded';
}

export default function RetryTimeline({ attempts }: { attempts: RetryAttempt[] }) {
  return (
    <ol className="dunning-timeline" aria-label="Retry schedule">
      {attempts.map((a) => (
        <li key={a.id} className={`dunning-step dunning-step-${a.status}`}>
          <span className="dunning-step-icon" aria-hidden="true">{a.status === 'upcoming' ? '⏳' : a.status === 'failed' ? '⚠️' : '✓'}</span>
          <div className="dunning-step-content">
            <div className="dunning-step-when">{a.when}</div>
            <div className="dunning-step-status">{a.status === 'past' ? 'Attempted' : a.status === 'upcoming' ? 'Next attempt' : a.status === 'failed' ? 'Failed' : 'Succeeded'}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
