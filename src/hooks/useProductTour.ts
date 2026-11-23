import { useState, useCallback, useEffect } from 'react';

const TOUR_STORAGE_KEY = 'sb:tour-completed';
const TOUR_DISMISSED_KEY = 'sb:tour-dismissed';
const TOUR_VERSION = '1.0'; // Increment to reset tour for all users

function getStorage(): Storage | null {
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function safeGetItem(key: string): string | null {
  try {
    return getStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    getStorage()?.setItem(key, value);
  } catch {
    return;
  }
}

function safeRemoveItem(key: string): void {
  try {
    getStorage()?.removeItem(key);
  } catch {
    return;
  }
}

export interface TourState {
  isOpen: boolean;
  isCompleted: boolean;
  isDismissed: boolean;
  currentVersion: string;
}

export function useProductTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  // Check if tour should be shown on mount
  useEffect(() => {
    const completed = safeGetItem(TOUR_STORAGE_KEY);
    const dismissed = safeGetItem(TOUR_DISMISSED_KEY);
    const storedVersion = safeGetItem(`${TOUR_STORAGE_KEY}-version`);

    // Reset tour if version has changed
    if (storedVersion !== TOUR_VERSION) {
      safeRemoveItem(TOUR_STORAGE_KEY);
      safeRemoveItem(TOUR_DISMISSED_KEY);
      safeSetItem(`${TOUR_STORAGE_KEY}-version`, TOUR_VERSION);
    }

    // Show tour if not completed and not dismissed
    const shouldShow = !completed && !dismissed;
    if (shouldShow) {
      // Delay showing tour to allow page to render
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTour = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeTour = useCallback(() => {
    setIsOpen(false);
  }, []);

  const completeTour = useCallback(() => {
    safeSetItem(TOUR_STORAGE_KEY, 'true');
    setShowCompletion(true);
  }, []);

  const dismissTour = useCallback(() => {
    safeSetItem(TOUR_DISMISSED_KEY, 'true');
    setIsOpen(false);
  }, []);

  const resetTour = useCallback(() => {
    safeRemoveItem(TOUR_STORAGE_KEY);
    safeRemoveItem(TOUR_DISMISSED_KEY);
    setIsOpen(false);
    setShowCompletion(false);
  }, []);

  const closeCompletion = useCallback(() => {
    setShowCompletion(false);
  }, []);

  return {
    isOpen,
    showCompletion,
    startTour,
    closeTour,
    completeTour,
    dismissTour,
    resetTour,
    closeCompletion,
  };
}
