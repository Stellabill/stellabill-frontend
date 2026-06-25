import { useState } from 'react';
import './ResumeAffordance.css';

interface ResumeAffordanceProps {
  isPaused: boolean;
  pauseUntilDate?: string | null;
  onResumeClick?: () => void;
  isLoading?: boolean;
}

export default function ResumeAffordance({
  isPaused,
  pauseUntilDate,
  onResumeClick,
  isLoading = false
}: ResumeAffordanceProps) {
  const [confirmed, setConfirmed] = useState(false);

  if (!isPaused) {
    return null;
  }

  const handleResumeClick = () => {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    if (onResumeClick) {
      onResumeClick();
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'indefinitely';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="resume-affordance" role="region" aria-labelledby="resume-title">
      <div className="resume-header">
        <div className="resume-status-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 8v8M14 8v8" />
          </svg>
        </div>
        <div className="resume-header-content">
          <h3 id="resume-title" className="resume-title">Subscription paused</h3>
          {pauseUntilDate && (
            <p className="resume-subtitle">
              Resumes on {formatDate(pauseUntilDate)}
            </p>
          )}
        </div>
      </div>

      <div className="resume-content">
        <div className="resume-info">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <p className="resume-info-text">
            No charges are being applied while your subscription is paused. You can resume at any time.
          </p>
        </div>

        {!confirmed ? (
          <button
            className="resume-btn resume-btn-primary"
            onClick={handleResumeClick}
            disabled={isLoading}
            aria-label="Resume subscription"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Resume now
          </button>
        ) : (
          <div className="resume-confirmation">
            <p className="confirmation-text">
              This will resume charging on your subscription.
            </p>
            <div className="confirmation-actions">
              <button
                className="confirmation-btn cancel-btn"
                onClick={() => setConfirmed(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className="confirmation-btn confirm-btn"
                onClick={handleResumeClick}
                disabled={isLoading}
              >
                {isLoading ? 'Resuming...' : 'Confirm resume'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
