import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSessionTimeoutOptions {
  /** Total session duration in seconds (default: 15 minutes) */
  sessionDurationSeconds?: number;
  /** Warning duration in seconds before timeout (default: 2 minutes) */
  warningDurationSeconds?: number;
  /** Callback when session times out */
  onTimeout: () => void;
}

export function useSessionTimeout({
  sessionDurationSeconds = 900, // 15 minutes
  warningDurationSeconds = 120, // 2 minutes
  onTimeout
}: UseSessionTimeoutOptions) {
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(warningDurationSeconds);
  const lastActivityRef = useRef<number>(Date.now());
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIdRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIsWarningOpen(false);
    setRemainingSeconds(warningDurationSeconds);

    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    if (countdownIdRef.current) {
      clearInterval(countdownIdRef.current);
    }

    // Set timer for warning
    timeoutIdRef.current = setTimeout(() => {
      setIsWarningOpen(true);
      setRemainingSeconds(warningDurationSeconds);

      // Start countdown
      countdownIdRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIdRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, (sessionDurationSeconds - warningDurationSeconds) * 1000);
  }, [sessionDurationSeconds, warningDurationSeconds]);

  const handleStaySignedIn = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const handleLogout = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    if (countdownIdRef.current) {
      clearInterval(countdownIdRef.current);
    }
    onTimeout();
  }, [onTimeout]);

  useEffect(() => {
    // Check if remainingSeconds reached 0
    if (isWarningOpen && remainingSeconds === 0) {
      handleLogout();
    }
  }, [isWarningOpen, remainingSeconds, handleLogout]);

  useEffect(() => {
    // Activity events to listen for
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'touchmove',
      'click',
      'wheel'
    ];

    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timer setup
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      if (countdownIdRef.current) {
        clearInterval(countdownIdRef.current);
      }
    };
  }, [resetTimer]);

  return {
    isWarningOpen,
    remainingSeconds,
    handleStaySignedIn,
    handleLogout
  };
}
