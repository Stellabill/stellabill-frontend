import { useState, useCallback, useEffect } from 'react';

const TOUR_STORAGE_KEY = 'sb:tour-completed';
const TOUR_DISMISSED_KEY = 'sb:tour-dismissed';
const TOUR_VERSION = '1.0'; // Increment to reset tour for all users

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
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    const dismissed = localStorage.getItem(TOUR_DISMISSED_KEY);
    const storedVersion = localStorage.getItem(`${TOUR_STORAGE_KEY}-version`);

    // Reset tour if version has changed
    if (storedVersion !== TOUR_VERSION) {
      localStorage.removeItem(TOUR_STORAGE_KEY);
      localStorage.removeItem(TOUR_DISMISSED_KEY);
      localStorage.setItem(`${TOUR_STORAGE_KEY}-version`, TOUR_VERSION);
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
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setShowCompletion(true);
  }, []);

  const dismissTour = useCallback(() => {
    localStorage.setItem(TOUR_DISMISSED_KEY, 'true');
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    localStorage.removeItem(TOUR_DISMISSED_KEY);
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
