import { useState, useEffect, useRef, useCallback } from 'react';

const SESSION_CHANNEL_NAME = 'stellabill-session';
const SESSION_STORAGE_KEY = 'stellabill-session-event';

type SessionMessageType = 'activity' | 'timeout';

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
  const channelRef = useRef<BroadcastChannel | null>(null);
  const storageFallbackRef = useRef(false);
  const storageErrorLoggedRef = useRef(false);

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

  const publishMessage = useCallback((type: SessionMessageType) => {
    if (channelRef.current) {
      channelRef.current.postMessage({ type });
      return;
    }

    if (storageFallbackRef.current) {
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, [type, Date.now(), Math.random()].join(':'));
      } catch (error) {
        if (!storageErrorLoggedRef.current) {
          console.error('Unable to synchronize session activity across tabs using storage.', error);
          storageErrorLoggedRef.current = true;
        }
      }
    }
  }, []);

  const handleStaySignedIn = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const logout = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    if (countdownIdRef.current) {
      clearInterval(countdownIdRef.current);
    }
    onTimeout();
  }, [onTimeout]);

  const handleLogout = useCallback(() => {
    publishMessage('timeout');
    logout();
  }, [logout, publishMessage]);

  useEffect(() => {
    // Check if remainingSeconds reached 0
    if (isWarningOpen && remainingSeconds === 0) {
      handleLogout();
    }
  }, [isWarningOpen, remainingSeconds, handleLogout]);

  useEffect(() => {
    const handleSessionMessage = (type: SessionMessageType) => {
      if (type === 'activity') {
        resetTimer();
      } else {
        logout();
      }
    };

    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(SESSION_CHANNEL_NAME);
      channelRef.current = channel;
      channel.onmessage = (event: MessageEvent<{ type?: unknown }>) => {
        if (event.data?.type === 'activity' || event.data?.type === 'timeout') {
          handleSessionMessage(event.data.type);
        }
      };
    } else {
      storageFallbackRef.current = true;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== SESSION_STORAGE_KEY || !event.newValue) return;

      if (event.newValue.startsWith('activity:')) {
        handleSessionMessage('activity');
      } else if (event.newValue.startsWith('timeout:')) {
        handleSessionMessage('timeout');
      }
    };

    if (storageFallbackRef.current) {
      window.addEventListener('storage', handleStorage);
    }

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
      publishMessage('activity');
      resetTimer();
    };

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    resetTimer();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      window.removeEventListener('storage', handleStorage);
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
      storageFallbackRef.current = false;
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      if (countdownIdRef.current) {
        clearInterval(countdownIdRef.current);
      }
    };
  }, [logout, publishMessage, resetTimer]);

  return {
    isWarningOpen,
    remainingSeconds,
    handleStaySignedIn,
    handleLogout
  };
}
