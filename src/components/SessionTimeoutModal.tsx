import { useRef, useEffect, useState } from 'react';
import { useModalFocus } from '../hooks/useModalFocus';
import './SessionTimeoutModal.css';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  remainingSeconds: number;
  onStaySignedIn: () => void;
  onLogout: () => void;
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

  useModalFocus(modalRef, {
    isOpen,
    onClose: onLogout,
    initialFocusRef: initialFocusRef
  });

  // Announce remaining time via aria-live every 30 seconds and at key milestones
  useEffect(() => {
    if (!isOpen) return;

    const milestones = [120, 90, 60, 30, 10, 5, 4, 3, 2, 1];
    if (
      remainingSeconds !== lastAnnouncedSeconds &&
      (milestones.includes(remainingSeconds) || remainingSeconds % 30 === 0)
    ) {
      setLastAnnouncedSeconds(remainingSeconds);
    }
  }, [remainingSeconds, isOpen, lastAnnouncedSeconds]);

  // Calculate progress for countdown ring
  const totalWarningSeconds = 120; // 2 minutes warning
  const progress = (remainingSeconds / totalWarningSeconds) * 100;
  const circumference = 2 * Math.PI * 45; // r=45
  const offset = circumference - (progress / 100) * circumference;

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
        <div
          className="session-timeout__live-region"
          aria-live="polite"
          aria-atomic="true"
        >
          {lastAnnouncedSeconds !== null && (
            <span>
              {lastAnnouncedSeconds === 1
                ? 'Your session will expire in 1 second.'
                : `Your session will expire in ${lastAnnouncedSeconds} seconds.`}
            </span>
          )}
        </div>

        <div className="session-timeout__content">
          <div className="session-timeout__countdown">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <defs>
                <linearGradient id="countdown-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00CCFF" />
                  <stop offset="100%" stopColor="#67d5f0" />
                </linearGradient>
              </defs>
              <circle
                className="session-timeout__countdown-bg"
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="8"
              />
              <circle
                className="session-timeout__countdown-progress"
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                style={{
                  strokeDasharray: `${circumference} ${circumference}`,
                  strokeDashoffset: offset
                }}
              />
            </svg>
            <div className="session-timeout__countdown-text">
              <span className="session-timeout__countdown-seconds">
                {remainingSeconds}
              </span>
              <span className="session-timeout__countdown-label">seconds</span>
            </div>
          </div>

          <div className="session-timeout__text">
            <h2 id="session-timeout-title" className="session-timeout__title">
              Your session is about to expire
            </h2>
            <p id="session-timeout-description" className="session-timeout__description">
              You'll be logged out automatically if there's no activity.
              Continue to stay signed in and keep your work.
            </p>
          </div>

          <div className="session-timeout__actions">
            <button
              className="session-timeout__btn session-timeout__btn--stay"
              onClick={onStaySignedIn}
              ref={initialFocusRef}
            >
              Stay signed in
            </button>
            <button
              className="session-timeout__btn session-timeout__btn--logout"
              onClick={onLogout}
            >
              Log out now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
