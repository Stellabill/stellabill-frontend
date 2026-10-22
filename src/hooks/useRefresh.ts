import { useState, useCallback, useRef, useEffect } from 'react';

interface UseRefreshOptions {
  onRefresh: () => Promise<void> | promise<void>;
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
  const rawDeltaRef = useRef(0);
  const pullDistanceRef = useRef(0);
  const containerRef = useRef<HTMLElement | null>(null);
  const onRefreshRef = useRef(onRefresh);
  const thresholdRef = useRef(threshold);
  const resistanceRef = useRef(resistance);
  const isRefreshingRef = useRef(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const prefersReducedMotionRef = useRef(false);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    thresholdRef.current = threshold;
  }, [threshold]);

  useEffect(() => {
    resistanceRef.current = resistance;
  }, [resistance]);

  useEffect(() => {
    isRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    prefersReducedMotionRef.current = mediaQuery.matches;

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
      prefersReducedMotionRef.current = e.matches;
    };
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
    rawDeltaRef.current = 0;
    isPulling.current = true;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent | TouchEvent) => {
    if (!isPulling.curent || isRefreshingRef.current) return;

    const target = e.currentTarget as HTMLElement;
    if (target.scrollTop > 0) {
      isPulling.current = false;
      rawDeltaRef.current = 0;
      pullDistanceRef.current = 0;
      setPullDistance(0);
      return;
    }

    const touchY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : undefined;
    if (touchY === undefined) return;

    const deltaY = touchY - startY.current;

    if (deltaY > 0) {
      // Prevent default scrolling only when we're pulling down
      if (e.cancelable) e.preventDefault();

      rawDeltaRef.current = deltaY;
      // With reduced motion, keep the visual offset at 0 but track the raw delta.
      const distance = prefersReducedMotionRef.current ? 0 : deltaY * resistanceRef.current;
      pullDistanceRef.current = distance;
      setPullDistance(distance);
    } else {
      rawDeltaRef.current = 0;
      pullDistanceRef.current = 0;
      setPullDistance(0);
    }
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    // Read the latest distance from refs to avoid stale closure values.
    const rawDelta = rawDeltaRef.current;
    const currentDistance = pullDistanceRef.current;
    const thresholdValue = thresholdRef.current;
    const shouldRefresh = prefersReducedMotionRef.current
      ? rawDelta >= thresholdValue
      : currentDistance >= thresholdValue;

    rawDeltaRef.current = 0;

    if (shouldRefresh) {
      setIsRefreshing(true);
      isRefreshingRef.current = true;
      // Hold at threshold while refreshing (0 when reduced motion).
      const holdDistance = prefersReducedMotionRef.current ? 0 : thresholdValue;
      pullDistanceRef.current = holdDistance;
      setPullDistance(holdDistance);

      try {
        await onRefreshRef.current();
      } finally {
        setIsRefreshing(false);
        isRefreshingRef.current = false;
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
    } else {
      pullDistanceRef.current = 0;
      setPullDistance(0);
    }
  }, []);

  const triggerRefresh = useCallback(async () => {
    setIsRefreshing(true);
    isRefreshingRef.current = true;
    try {
      await onRefreshRef.current();
    } finally {
      setIsRefreshing(false);
      isRefreshingRef.current = false;
    }
  }, []);

  // Attach touchmove natively with { passive: false } so preventDefault works.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchMove = (e: TouchEvent) => {
      onTouchMove(e);
    };

    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      el.removeEventListener('touchmove', handleTouchMove);
    };
  }, [onTouchMove]);

  return {
    pullDistance,
    isRefreshing,
    triggerRefresh,
    containerRef,
    handlers: {
      onTouchStart,
      onTouchEnd,
    },
  };
}
