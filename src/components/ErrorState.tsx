import React, { useState } from 'react';
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp, WifiOff } from 'lucide-react';
import { openExternal } from '../utils/openExternal';
import { SUPPORT_URL } from '../config/links';
import './ErrorState.css';

interface ErrorStateProps {
  title?: string;
  message: string;
  technicalDetails?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  type?: 'error' | 'offline';
}

/**
 * A reusable component to display standardized error states across the application.
 * 
 * Features:
 * - User-friendly error message and title.
 * - Retry affordance with loading state.
 * - Technical details hidden behind an expandable section.
 * - Specialized offline mode messaging.
 * - Accessible ARIA labels and roles.
 * 
 * @param props.title - Optional heading for the error (defaults to "Something went wrong").
 * @param props.message - The primary error message to display to the user.
 * @param props.technicalDetails - Optional technical information (e.g., stack trace) shown in an expandable area.
 * @param props.onRetry - Optional callback function triggered when the "Try Again" button is clicked.
 * @param props.isRetrying - Boolean indicating if a retry operation is currently in progress.
 * @param props.type - The type of error state ('error' or 'offline').
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  technicalDetails,
  onRetry,
  isRetrying = false,
  type = 'error'
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const isOffline = type === 'offline' || (typeof navigator !== 'undefined' && !navigator.onLine);

  return (
    <div className="error-state-container" role="alert" aria-live="polite">
      <div className="error-state-icon">
        {isOffline ? (
          <WifiOff size={48} className="icon-offline" />
        ) : (
          <AlertCircle size={48} className="icon-error" />
        )}
      </div>

      <h3 className="error-state-title">
        {isOffline ? 'No internet connection' : title}
      </h3>
      
      <p className="error-state-message">
        {isOffline 
          ? 'Please check your network settings and try again.' 
          : message}
      </p>

      <div className="error-state-actions">
        {onRetry && (
          <button 
            className="retry-button" 
            onClick={onRetry} 
            disabled={isRetrying}
            aria-busy={isRetrying}
          >
            <RefreshCw size={18} className={isRetrying ? 'spin' : ''} />
            {isRetrying ? 'Retrying...' : 'Try Again'}
          </button>
        )}
        
        <button 
          className="support-button" 
          onClick={() => openExternal(SUPPORT_URL)}
        >
          Contact Support
        </button>
      </div>

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

export default ErrorState;
