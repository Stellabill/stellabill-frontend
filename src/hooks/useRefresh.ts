import { useState, useCallback, useRef, useEffect } from 'react';

interface UseRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  resistance?: number;
}

export function useRefresh({
  onRefresh,
  threshold = 60,
  resistance = 0.4,
}: UseRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    // Use modern event listener
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent | TouchEvent) => {
    // Only allow pull-to-refresh if we're at the top of the container
    const target = e.currentTarget as HTMLElement;
    if (target.scrollTop > 0) return;
    
    // Support both React synthetic events and native DOM events
    const touchY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : undefined;
    if (touchY === undefined) return;

    startY.current = touchY;
    isPulling.current = true;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent | TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;

    const target = e.currentTarget as HTMLElement;
    if (target.scrollTop > 0) {
      isPulling.current = false;
      setPullDistance(0);
      return;
    }

    const touchY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : undefined;
    if (touchY === undefined) return;

    const deltaY = touchY - startY.current;

    if (deltaY > 0) {
      // Prevent default scrolling only when we're pulling down
      if (e.cancelable) e.preventDefault();
      
      const distance = prefersReducedMotion ? 0 : deltaY * resistance;
      setPullDistance(distance);
    } else {
      setPullDistance(0);
    }
  }, [isRefreshing, resistance, prefersReducedMotion]);

  const onTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold); // Hold at threshold while refreshing
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, onRefresh]);

  const triggerRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  return {
    pullDistance,
    isRefreshing,
    triggerRefresh,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
