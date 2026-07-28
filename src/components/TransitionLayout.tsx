import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo } from 'react';
import { transitionTokens, TransitionKind } from '../design/tokens/transitions';

export default function TransitionLayout() {
  const location = useLocation();
  const navigationType = useNavigationType();

  const prefersReduced = useMemo(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  }, []);

  const kind: TransitionKind = useMemo(() => {
    if (prefersReduced) return 'reducedMotion';
    switch (navigationType) {
      case 'PUSH':
        return 'forward';
      case 'POP':
        return 'backward';
      case 'REPLACE':
        return 'peer';
      default:
        return 'forward';
    }
  }, [navigationType, prefersReduced]);

  const { duration, easing, distance } = transitionTokens[kind];

  // Define animation variants based on kind
  const variants = useMemo(() => {
    if (kind === 'peer') {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: duration / 1000, ease: easing } },
        exit: { opacity: 0, transition: { duration: duration / 1000, ease: easing } },
      };
    }
    if (kind === 'forward') {
      return {
        initial: { x: distance },
        animate: { x: 0, transition: { duration: duration / 1000, ease: easing } },
        exit: { x: -distance, transition: { duration: duration / 1000, ease: easing } },
      };
    }
    if (kind === 'backward') {
      return {
        initial: { x: -distance },
        animate: { x: 0, transition: { duration: duration / 1000, ease: easing } },
        exit: { x: distance, transition: { duration: duration / 1000, ease: easing } },
      };
    }
    // reducedMotion – no visual change
    return {
      initial: {},
      animate: {},
      exit: {},
    };
  }, [kind, duration, easing, distance]);

  // Focus management after transition completes
  useEffect(() => {
    const timeout = setTimeout(() => {
      // Try to focus the first heading inside the new route
      const main = document.querySelector('main');
      const heading = main?.querySelector('h1, h2, h3') as HTMLElement | null;
      heading?.focus();
    }, duration);
    return () => clearTimeout(timeout);
  }, [location.key, duration]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.key}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ height: '100%' }}
        aria-live="polite"
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}
