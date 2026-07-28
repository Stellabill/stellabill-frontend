import { useRef, useEffect, useState } from 'react';
import { useModalFocus } from '../hooks/useModalFocus';
import './SessionTimeoutModal.css';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  remainingSeconds: number;
  onStaySignedIn: () => void;
  onLogout: () => void;
}

const TOTAL_WARNING_SECONDS = 120;

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      setPrefersReducedMotion(false);
      return;
    }

    const mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(Boolean(mediaQueryList?.matches));

    updatePreference();
    if (typeof mediaQueryList?.addEventListener === 'function') {
      mediaQueryList.addEventListener('change', updatePreference);
    }

    return () => {
      if (typeof mediaQueryList?.removeEventListener === 'function') {
        mediaQueryList.removeEventListener('change', updatePreference);
      }
    };
  }, []);

  return prefersReducedMotion;
}

function getAnnouncementText(remainingSeconds: number) {
  if (remainingSeconds <= 0) {
    return 'Your session has expired.';
  }

  return remainingSeconds === 1
    ? 'Your session will expire in 1 second.'
    : `Your session will expire in ${remainingSeconds} seconds.`;
}

export default function SessionTimeoutModal({
  isOpen,
  remainingSeconds,
  onStaySignedIn,
  onLogout
}: SessionTimeoutModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const [lastAnnouncedSeconds, setLastAnnouncedSeconds] = useState<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useModalFocus(modalRef, {
    isOpen,
    onClose: onLogout,
    initialFocusRef: initialFocusRef
  });

  useEffect(() => {
    if (!isOpen) {
      setLastAnnouncedSeconds(null);
      return;
    }

    const normalizedSeconds = Math.max(0, Math.min(remainingSeconds, TOTAL_WARNING_SECONDS));
    const milestones = [TOTAL_WARNING_SECONDS, 90, 60, 30, 10, 5, 4, 3, 2, 1, 0];
    const shouldAnnounce =
      normalizedSeconds !== lastAnnouncedSeconds &&
      (milestones.includes(normalizedSeconds) || normalizedSeconds % 30 === 0);

    if (shouldAnnounce) {
      setLastAnnouncedSeconds(normalizedSeconds);
    }
  }, [remainingSeconds, isOpen, lastAnnouncedSeconds]);

  const normalizedSeconds = Math.max(0, Math.min(remainingSeconds, TOTAL_WARNING_SECONDS));
  const progress = (normalizedSeconds / TOTAL_WARNING_SECONDS) * 100;
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (progress / 100) * circumference;
  const countdownLabel = normalizedSeconds === 1 ? 'second' : 'seconds';

  if (!isOpen) return null;

  return (
    <div className="session-timeout-overlay">
      <div
        ref={modalRef}
        className="session-timeout-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-timeout-title"
        aria-describedby="session-timeout-description"
      >
        <div className="session-timeout__live-region" aria-live="polite" aria-atomic="true">
          {lastAnnouncedSeconds !== null && <span>{getAnnouncementText(lastAnnouncedSeconds)}</span>}
        </div>

        <div className="session-timeout__content">
          <div className="session-timeout__countdown" data-reduced-motion={prefersReducedMotion ? 'true' : 'false'}>
            {!prefersReducedMotion ? (
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <defs>
                  <linearGradient id="countdown-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#067d99" />
                    <stop offset="100%" stopColor="#67d5f0" />
                  </linearGradient>
                </defs>
                <circle
                  className="session-timeout__countdown-bg"
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  strokeWidth="8"
                />
                <circle
                  className="session-timeout__countdown-progress"
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: `${circumference} ${circumference}`,
                    strokeDashoffset: offset
                  }}
                />
              </svg>
            ) : (
              <div className="session-timeout__countdown-plain" aria-hidden="true">
                <span className="session-timeout__countdown-seconds">{normalizedSeconds}</span>
              </div>
            )}
            <div className="session-timeout__countdown-text">
              <span className="session-timeout__countdown-seconds">{normalizedSeconds}</span>
              <span className="session-timeout__countdown-label">{countdownLabel}</span>
            </div>
          </div>

          <div className="session-timeout__text">
            <h2 id="session-timeout-title" className="session-timeout__title">
              Your session is about to expire
            </h2>
            <p id="session-timeout-description" className="session-timeout__description">
              If you remain inactive, we’ll sign you out automatically and any unsaved work could be lost.
            </p>
          </div>

          <div className="session-timeout__actions">
            <button
              type="button"
              className="session-timeout__btn session-timeout__btn--stay"
              onClick={onStaySignedIn}
              ref={initialFocusRef}
            >
              Stay signed in
            </button>
            <button type="button" className="session-timeout__btn session-timeout__btn--logout" onClick={onLogout}>
              Log out now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
