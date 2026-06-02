import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * NotFound — 404 page shown for any unmatched route.
 *
 * Behaviour:
 *  - Authenticated-shell paths (/dashboard, /plans, /subscriptions, …)
 *    show recovery links that stay inside the app shell.
 *  - Public / unknown paths show a lighter set of links.
 *
 * Accessibility:
 *  - role="main" landmark with a descriptive aria-label.
 *  - Focus is moved to the heading on mount so screen-reader users
 *    hear the 404 message immediately (WCAG 2.1 SC 2.4.3).
 *  - All interactive elements are keyboard-reachable and have
 *    visible focus rings (focus-visible).
 *  - Colour contrast ≥ 4.5:1 for all text against dark backgrounds.
 */
const SHELL_PREFIXES = [
  '/dashboard',
  '/plans',
  '/subscriptions',
  '/browse-plans',
  '/settings',
  '/ui-kit',
  '/brand',
];

function isShellPath(pathname: string) {
  return SHELL_PREFIXES.some((p) => pathname.startsWith(p));
}

export default function NotFound() {
  const { pathname } = useLocation();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inShell = isShellPath(pathname);

  // Move focus to heading on mount for screen-reader announcement
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <main
      role="main"
      aria-label="Page not found"
      className="min-h-screen bg-[#020617] flex flex-col items-center justify-center px-4 py-16 text-center"
    >
      {/* Decorative 404 number */}
      <div
        aria-hidden="true"
        className="text-[clamp(6rem,20vw,12rem)] font-extrabold leading-none select-none"
        style={{
          background: 'linear-gradient(135deg, #1cb2dc 0%, #19d4bf 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          opacity: 0.18,
        }}
      >
        404
      </div>

      {/* Heading — receives focus on mount */}
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-[-1rem] mb-3 text-3xl sm:text-4xl font-bold text-slate-50 outline-none"
      >
        Page not found
      </h1>

      <p className="max-w-md text-slate-400 text-base sm:text-lg mb-8">
        The path{' '}
        <code className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 text-sm font-mono break-all">
          {pathname}
        </code>{' '}
        doesn't exist. It may have been moved, deleted, or you may have mistyped
        the URL.
      </p>

      {/* Recovery CTAs */}
      <nav aria-label="Recovery links" className="flex flex-wrap justify-center gap-3">
        {inShell ? (
          <>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
              style={{ background: 'linear-gradient(90deg, #1cb2dc, #19d4bf)' }}
            >
              Go to Dashboard
            </Link>
            <Link
              to="/plans"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-200 border border-slate-700 bg-slate-900/60 hover:bg-slate-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            >
              Browse Plans
            </Link>
            <a
              href="mailto:support@stellabill.com"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-400 border border-slate-800 bg-transparent hover:bg-slate-900 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            >
              Contact Support
            </a>
          </>
        ) : (
          <>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
              style={{ background: 'linear-gradient(90deg, #1cb2dc, #19d4bf)' }}
            >
              Go to Home
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-200 border border-slate-700 bg-slate-900/60 hover:bg-slate-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            >
              View Pricing
            </Link>
            <a
              href="mailto:support@stellabill.com"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-400 border border-slate-800 bg-transparent hover:bg-slate-900 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            >
              Contact Support
            </a>
          </>
        )}
      </nav>
    </main>
  );
}
