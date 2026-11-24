import React, { useState } from 'react';
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp, WifiOff, Clock, FileWarning } from 'lucide-react';
import type { ApiError, ApiErrorKind } from '../api/client';
import { openExternal } from '../utils/openExternal';
import { SUPPORT_URL } from '../config/links';
import './ErrorState.css';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  technicalDetails?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  type?: 'error' | 'offline';
  kind?: ApiErrorKind;
  error?: ApiError | null;
}

const KIND_COPY: Record<ApiErrorKind, { title: string; message: string }> = {
  network: {
    title: 'Network error',
    message: 'Unable to reach the server. Please check your connection and try again.',
  },
  timeout: {
    title: 'Request timed out',
    message: 'The server took too long to respond. Please try again in a moment.',
  },
  http: {
    title: 'Server error',
    message: 'The request could not be completed by the server. Please try again.',
  },
  parse: {
    title: 'Unexpected response format',
    message: 'We received an invalid response from the server. Please try again.',
  },
};

function resolveErrorKind(
  kind?: ApiErrorKind,
  error?: ApiError | null,
  type?: 'error' | 'offline'
): ApiErrorKind | undefined {
  if (kind) return kind;
  if (error?.kind) return error.kind;
  if (error?.isTimeout) return 'timeout';
  if (error?.isNetworkError || error?.isOffline || type === 'offline') return 'network';
  if (typeof error?.status === 'number') return 'http';
  return undefined;
}

/**
 * A reusable component to display standardized error states across the application.
 * 
 * Features:
 * - User-friendly error message and title.
 * - Discriminated `ApiErrorKind` ('network' | 'timeout' | 'http' | 'parse') mapping.
 * - Retry affordance with loading state.
 * - Technical details hidden behind an expandable section.
 * - Specialized offline mode messaging.
 * - Accessible ARIA labels and roles.
 * 
 * @param props.title - Optional heading for the error (defaults based on kind or "Something went wrong").
 * @param props.message - The primary error message to display to the user.
 * @param props.technicalDetails - Optional technical information (e.g., stack trace) shown in an expandable area.
 * @param props.onRetry - Optional callback function triggered when the "Try Again" button is clicked.
 * @param props.isRetrying - Boolean indicating if a retry operation is currently in progress.
 * @param props.type - The type of error state ('error' or 'offline').
 * @param props.kind - Optional discriminated ApiError kind ('network' | 'timeout' | 'http' | 'parse').
 * @param props.error - Optional ApiError object from which kind, message, and technicalDetails are derived.
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  technicalDetails,
  onRetry,
  isRetrying = false,
  type = 'error',
  kind,
  error,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const isOffline =
    type === 'offline' ||
    Boolean(error?.isOffline) ||
    (typeof navigator !== 'undefined' && !navigator.onLine);

  const resolvedKind = resolveErrorKind(kind, error, type);
  const kindDefaults = resolvedKind ? KIND_COPY[resolvedKind] : undefined;

  const resolvedTitle = isOffline
    ? 'No internet connection'
    : title ?? kindDefaults?.title ?? 'Something went wrong';

  const resolvedMessage = isOffline
    ? 'Please check your network settings and try again.'
    : message ?? error?.message ?? kindDefaults?.message ?? 'An unexpected error occurred.';

  const resolvedTechnicalDetails = technicalDetails ?? error?.technicalDetails;

  const renderIcon = () => {
    if (isOffline || resolvedKind === 'network') {
      return <WifiOff size={48} className="icon-offline" />;
    }
    if (resolvedKind === 'timeout') {
      return <Clock size={48} className="icon-timeout icon-error" />;
    }
    if (resolvedKind === 'parse') {
      return <FileWarning size={48} className="icon-parse icon-error" />;
    }
    return <AlertCircle size={48} className="icon-error" />;
  };

  return (
    <div
      className="error-state-container"
      role="alert"
      aria-live="polite"
      data-error-kind={resolvedKind ?? (isOffline ? 'network' : 'http')}
    >
      <div className="error-state-icon">
        {renderIcon()}
      </div>

      <h3 className="error-state-title">
        {resolvedTitle}
      </h3>
      
      <p className="error-state-message">
        {resolvedMessage}
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

      {resolvedTechnicalDetails && (
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
              {resolvedTechnicalDetails}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default ErrorState;
