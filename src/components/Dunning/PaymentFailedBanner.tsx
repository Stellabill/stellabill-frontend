import { useState } from 'react';
import RetryTimeline from './RetryTimeline';
import './dunning.css';

interface RetryAttempt {
  id: string;
  when: string; // human friendly time
  status: 'past' | 'upcoming' | 'failed' | 'succeeded';
}

interface PaymentFailedBannerProps {
  subscriptionId: string | undefined;
  failedAttempts: number;
  retrySchedule: RetryAttempt[];
  onFixPayment?: () => void;
}

export default function PaymentFailedBanner({
  subscriptionId,
  failedAttempts,
  retrySchedule,
  onFixPayment,
}: PaymentFailedBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || failedAttempts === 0) return null;

  return (
    <div className="dunning-banner" role="region" aria-labelledby="dunning-title" aria-live="polite">
      <div className="dunning-banner-inner">
        <div className="dunning-content">
          <h2 id="dunning-title">Payment failed</h2>
          <p className="dunning-message">We weren't able to process the latest payment. We'll retry automatically — here's what to expect.</p>
          <div className="dunning-ctas">
            <a
              href={subscriptionId ? `/subscriptions/${subscriptionId}/payment-method` : '/subscriptions'}
              className="dunning-primary"
              onClick={(e) => {
                if (onFixPayment) {
                  e.preventDefault();
                  onFixPayment();
                }
              }}
            >
              Fix payment method
            </a>
            <button
              type="button"
              className="dunning-secondary"
              onClick={() => setDismissed(true)}
            >
              Dismiss for now
            </button>
          </div>
        </div>

        <div className="dunning-timeline-wrapper">
          <RetryTimeline attempts={retrySchedule} />
        </div>
      </div>
    </div>
  );
}
