import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp, WifiOff, Clock } from 'lucide-react';
import './ErrorState.css';

interface ErrorStateProps {
  title?: string;
  message: string;
  technicalDetails?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  type?: 'error' | 'offline' | 'rate-limited';
  retryAfter?: number; // seconds to wait before retry (for rate-limited)
  rateLimitHeaders?: Record<string, string>; // dev-facing headers
}

/**
 * A reusable component to display standardized error states across the application.
 * 
 * Features:
 * - User-friendly error message and title.
 * - Retry affordance with loading state.
 * - Technical details hidden behind an expandable section.
 * - Specialized offline mode messaging.
 * - Rate-limited error variant with countdown timer and progress ring.
 * - Accessible ARIA labels and roles (WCAG 2.1 AA compliant).
 * 
 * @param props.title - Optional heading for the error (defaults to "Something went wrong").
 * @param props.message - The primary error message to display to the user.
 * @param props.technicalDetails - Optional technical information (e.g., stack trace) shown in an expandable area.
 * @param props.onRetry - Optional callback function triggered when the "Try Again" button is clicked.
 * @param props.isRetrying - Boolean indicating if a retry operation is currently in progress.
 * @param props.type - The type of error state ('error', 'offline', or 'rate-limited').
 * @param props.retryAfter - Seconds to wait before retry is available (for rate-limited type).
 * @param props.rateLimitHeaders - Dev-facing HTTP headers for debugging (e.g., X-RateLimit-Remaining).
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  technicalDetails,
  onRetry,
  isRetrying = false,
  type = 'error',
  retryAfter = 60,
  rateLimitHeaders
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showRateLimitInfo, setShowRateLimitInfo] = useState(false);
  const [countdown, setCountdown] = useState(retryAfter);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isOffline = type === 'offline' || (typeof navigator !== 'undefined' && !navigator.onLine);
  const isRateLimited = type === 'rate-limited';

  // Handle countdown for rate-limited errors
  useEffect(() => {
    if (!isRateLimited) return;

    setCountdown(retryAfter);

    const startCountdown = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      
      intervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    startCountdown();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRateLimited, retryAfter]);

  // Pause countdown when tab is backgrounded
  useEffect(() => {
    if (!isRateLimited) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        setIsPaused(false);
        // Re-start the interval; setCountdown callback always reads latest value
        intervalRef.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRateLimited]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const progressPercentage = isRateLimited ? ((retryAfter - countdown) / retryAfter) * 100 : 0;

  return (
    <div className="error-state-container" role="alert" aria-live="polite">
      <div className="error-state-icon">
        {isRateLimited ? (
          <div className="rate-limit-countdown-container">
            <svg className="progress-ring" width="80" height="80" aria-hidden="true">
              <circle
                className="progress-ring-circle-bg"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="4"
                fill="transparent"
                r="36"
                cx="40"
                cy="40"
              />
              <circle
                className="progress-ring-circle"
                stroke="#f59e0b"
                strokeWidth="4"
                fill="transparent"
                r="36"
                cx="40"
                cy="40"
                strokeDasharray={`${2 * Math.PI * 36}`}
                strokeDashoffset={`${2 * Math.PI * 36 * (1 - progressPercentage / 100)}`}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="countdown-text" aria-live="polite" aria-atomic="true">
              <Clock size={24} className="icon-rate-limit" />
              <span className="countdown-value">{formatTime(countdown)}</span>
            </div>
          </div>
        ) : isOffline ? (
          <WifiOff size={48} className="icon-offline" />
        ) : (
          <AlertCircle size={48} className="icon-error" />
        )}
      </div>

      <h3 className="error-state-title">
        {isRateLimited ? 'Rate limit exceeded' : isOffline ? 'No internet connection' : title}
      </h3>
      
      <p className="error-state-message">
        {isRateLimited
          ? `Too many requests. Please wait ${isPaused ? '(paused - tab inactive)' : formatTime(countdown)} before trying again.`
          : isOffline 
          ? 'Please check your network settings and try again.' 
          : message}
      </p>

      <div className="error-state-actions">
        {onRetry && (
          <button 
            className="retry-button" 
            onClick={onRetry} 
            disabled={isRetrying || (isRateLimited && countdown > 0)}
            aria-busy={isRetrying}
            aria-disabled={isRateLimited && countdown > 0}
            title={isRateLimited && countdown > 0 ? `Wait ${formatTime(countdown)} before retrying` : undefined}
          >
            <RefreshCw size={18} className={isRetrying ? 'spin' : ''} />
            {isRetrying ? 'Retrying...' : countdown === 0 && isRateLimited ? 'Try Again' : 'Try Again'}
          </button>
        )}
        
        <button 
          className="support-button" 
          onClick={() => window.open('https://support.stellarbill.com', '_blank')}
        >
          Contact Support
        </button>
      </div>

      {isRateLimited && (
        <div className="rate-limit-explainer">
          <button 
            className="explainer-toggle" 
            onClick={() => setShowRateLimitInfo(!showRateLimitInfo)}
            aria-expanded={showRateLimitInfo}
          >
            {showRateLimitInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Why did this happen?
          </button>
          
          {showRateLimitInfo && (
            <div className="explainer-content">
              <p>Rate limiting helps protect our servers from being overwhelmed. This usually happens when:</p>
              <ul>
                <li>You've made too many requests in a short time</li>
                <li>Your API key has exceeded its quota</li>
                <li>There's an issue with automated scripts or tools</li>
              </ul>
              <p className="explainer-tip">
                <strong>Tip:</strong> Implement exponential backoff in your requests or contact support if this happens frequently.
              </p>
              {rateLimitHeaders && (
                <div className="rate-limit-headers">
                  <strong>Rate Limit Info:</strong>
                  <pre className="headers-content">{JSON.stringify(rateLimitHeaders, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {technicalDetails && (
        <div className="error-technical-details">
          <button 
            className="details-toggle" 
            onClick={() => setShowDetails(!showDetails)}
            aria-expanded={showDetails}
          >
            {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Technical Details
          </button>
          
          {showDetails && (
            <pre className="details-content">
              {technicalDetails}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Parses the `Retry-After` HTTP response header into seconds.
 *
 * Handles two formats defined by RFC 7231:
 *   1. A numeric string (e.g. "120") → seconds to wait.
 *   2. An HTTP-date string (e.g. "Wed, 21 Oct 2025 07:28:00 GMT") → diff from now.
 *
 * Returns `null` when the header is absent, malformed, or in the past.
 *
 * @example
 * // In an API error handler:
 * const seconds = parseRetryAfter(response.headers.get('Retry-After'));
 * if (seconds !== null) {
 *   // render <ErrorState type="rate-limited" retryAfter={seconds} />
 * }
 */
export function parseRetryAfter(retryAfterHeader: string | null | undefined): number | null {
  if (!retryAfterHeader) return null;

  const trimmed = retryAfterHeader.trim();

  // Numeric: plain seconds
  if (/^\d+$/.test(trimmed)) {
    const seconds = parseInt(trimmed, 10);
    return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
  }

  // HTTP-date format
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    const diff = Math.ceil((date.getTime() - Date.now()) / 1000);
    return diff > 0 ? diff : null;
  }

  return null;
}

export default ErrorState;
