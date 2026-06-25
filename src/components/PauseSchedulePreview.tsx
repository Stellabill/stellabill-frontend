import './PauseSchedulePreview.css';

interface PauseSchedulePreviewProps {
  pauseUntilDate: Date | null;
  currentNextChargeDate: string;
  estimatedNextCharge: string;
  currency: string;
}

export default function PauseSchedulePreview({
  pauseUntilDate,
  currentNextChargeDate,
  estimatedNextCharge,
  currency
}: PauseSchedulePreviewProps) {
  if (!pauseUntilDate) {
    return null;
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateNewNextChargeDate = (resumeDate: Date): string => {
    // In a real app, this would calculate based on the subscription frequency
    // For now, we'll add 30 days (monthly billing period)
    const newCharge = new Date(resumeDate);
    newCharge.setDate(newCharge.getDate() + 30);
    return formatDate(newCharge);
  };

  const newNextChargeDate = calculateNewNextChargeDate(pauseUntilDate);
  const daysOfPause = Math.ceil((pauseUntilDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="pause-schedule-preview" role="region" aria-labelledby="preview-title">
      <div className="preview-header">
        <div className="preview-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
        <h3 id="preview-title" className="preview-title">Preview</h3>
      </div>

      <div className="preview-content">
        <div className="preview-section">
          <div className="section-label">
            <span>Current next charge</span>
            <span className="strikethrough">{currentNextChargeDate}</span>
          </div>
          <div className="section-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </div>

        <div className="preview-section highlight">
          <div className="section-label primary">
            <span>New next charge</span>
            <time dateTime={pauseUntilDate.toISOString().split('T')[0]} className="new-charge-date">
              {newNextChargeDate}
            </time>
          </div>
          <div className="charge-amount">
            {estimatedNextCharge} {currency}
          </div>
        </div>

        <div className="preview-stats">
          <div className="stat-item">
            <span className="stat-label">Pause duration</span>
            <span className="stat-value">{daysOfPause} days</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-label">Resume on</span>
            <span className="stat-value">{formatDate(pauseUntilDate)}</span>
          </div>
        </div>

        <div className="preview-notice">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>You won't be charged until {formatDate(pauseUntilDate)}</p>
        </div>
      </div>
    </div>
  );
}
