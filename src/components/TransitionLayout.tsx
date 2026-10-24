import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { transitionTokens, TransitionKind } from '../design/tokens/transitions';

export default function TransitionLayout() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const hasMounted = useRef(false);
  const [announcement, setAnnouncement] = useState('');

  const [prefersReduced, setPrefersReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );

  useEffect(() => {
    if (!window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReduced(mediaQuery.matches);
    updatePreference();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updatePreference);
      return () => mediaQuery.removeEventListener('change', updatePreference);
    }
    mediaQuery.addListener?.(updatePreference);
    return () => mediaQuery.removeListener?.(updatePreference);
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

  const { duration, easing: rawEasing, distance } = transitionTokens[kind];
  const durationRef = useRef(duration);
  durationRef.current = duration;
  const easing = (({ "ease-out": "easeOut", "ease-in": "easeIn", "ease-in-out": "easeInOut", linear: "linear" }) as Record<string, string>)[rawEasing as string] ?? rawEasing;

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
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    if (location.hash) return;

    const timeout = setTimeout(() => {
      const main = document.querySelector('main');
      const heading = main?.querySelector('h1, h2, h3') as HTMLElement | null;
      let pageName = 'Page';
      if (heading) {
        heading.tabIndex = -1;
        heading.focus();
        pageName = heading.textContent?.trim() || pageName;
      }
      setAnnouncement(`${pageName} page`);
    }, durationRef.current);
    return () => clearTimeout(timeout);
  }, [location.key, location.hash]);

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.key}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ height: '100%' }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
      <div className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </>
  );
}
