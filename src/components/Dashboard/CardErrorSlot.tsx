import { WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import './CardErrorSlot.css';

export interface CardErrorSlotProps {
  /** Short label identifying the widget, e.g. "Active Subscriptions". */
  widgetLabel: string;
  /** Human-readable error message. */
  message?: string;
  /** Whether the error is a network-offline condition. */
  isOffline?: boolean;
  /** Callback fired when the user presses Retry. */
  onRetry?: () => void;
  /** True while a retry request is in-flight. */
  retrying?: boolean;
  /** Additional CSS class names to merge onto the root element. */
  className?: string;
}

/**
 * CardErrorSlot
 *
 * An in-card error placeholder that matches the visual weight of the card's
 * data content so the layout grid never shifts.  Drop it anywhere a widget
 * normally renders its metric/chart body.
 *
 * Accessibility
 * - Wrapper has role="status" so the slot is announced when it mounts.
 * - Retry button carries aria-busy and aria-label for screen readers.
 * - Reduced-motion: spinner animation is suppressed.
 */
export default function CardErrorSlot({
  widgetLabel,
  message,
  isOffline = false,
  onRetry,
  retrying = false,
  className = '',
}: CardErrorSlotProps) {
  const Icon = isOffline ? WifiOff : AlertCircle;
  const defaultMessage = isOffline
    ? 'No internet connection'
    : 'Failed to load data';
  const displayMessage = message ?? defaultMessage;

  return (
    <div
      className={`card-error-slot${className ? ` ${className}` : ''}`}
      role="status"
      aria-label={`${widgetLabel}: ${displayMessage}. ${onRetry ? 'Retry available.' : ''}`}
    >
      <span className={`card-error-slot__icon ${isOffline ? 'card-error-slot__icon--offline' : 'card-error-slot__icon--error'}`}>
        <Icon size={20} aria-hidden="true" />
      </span>

      <p className="card-error-slot__message">{displayMessage}</p>

      {onRetry && (
        <button
          type="button"
          className="card-error-slot__retry"
          onClick={onRetry}
          disabled={retrying}
          aria-busy={retrying}
          aria-label={retrying ? `Retrying ${widgetLabel}…` : `Retry ${widgetLabel}`}
        >
          <RefreshCw
            size={13}
            aria-hidden="true"
            className={retrying ? 'card-error-slot__spin' : ''}
          />
          {retrying ? 'Retrying…' : 'Retry'}
        </button>
      )}
    </div>
  );
}
