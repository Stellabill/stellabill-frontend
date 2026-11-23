import { useEffect, useMemo, useState, useRef, createContext, useContext, useCallback } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { type CommandItem } from "./CommandPalette";
import RouteErrorBoundary from "./RouteErrorBoundary";
import { LayoutContextType } from "../hooks/useCommandScope";
import "../styles/sidebar.css";

// ------------------------------------------------------------------------------
// Unsaved-changes guard context
// Pages (e.g. CreatePlan) register a guard while they have unsaved edits.
// Layout intercepts in-app navigation (sidebar, command palette, chords) and
// asks the guard to confirm before leaving.
// -------------------------------------------------------------------------------

export interface UnsavedChangesGuard {
  /** Return true when the page has unsaved changes. */
  isDirty: () => boolean;
  /** Ask the page to show its exit confirm modal. Resolves true if the
   * user confirmed leaving (and the page has already navigated), false otherwise. */
  confirmLeave: () => Promise<boolean>;
}

export interface UnsavedChangesContextType {
  registerGuard: (guard: UnsavedChangesGuard | null) => void;
  /** Returns true if navigation is allowed (no guard or user confirmed). */
  requestNavigation: (to: string) => Promise<boolean>;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | null>(null);

export function useUnsavedChangesGuard(): UnsavedChangesContextType {
  const ctx = useContext(UnsavedChangesContext);
  if (!ctx) {
    // Fallback for tests/stories that render pages without Layout.
    return {
      registerGuard: () => {},
      requestNavigation: async () => true,
    };
  }
  return ctx;
}

const mainNav = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="sb-sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    path: "/subscriptions",
    label: "Subscriptions",
    icon: (
      <svg className="sb-sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      </svg>
    ),
  },
  {
    path: "/plans",
    label: "Plans",
    icon: (
      <svg className="sb-sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    path: "/browse-plans",
    label: "Browse Plans",
    icon: (
      <svg className="sb-sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    path: "/settings",
    label: "Settings",
    icon: (
      <svg className="sb-sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

const devNav = [
  {
    path: "/brand",
    label: "Brand",
    icon: (
      <svg className="sb-sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" />
        <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" /><line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
        <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" /><line x1="14.83" y1="9.17" x2="18.36" y2="5.64" />
        <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
      </svg>
    ),
  },
  {
    path: "/design-tokens",
    label: "Design Tokens",
    icon: (
      <svg className="sb-sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" />
        <circle cx="8" cy="7" r="2" /><circle cx="14" cy="12" r="2" /><circle cx="10" cy="17" r="2" />
      </svg>
    ),
  },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [, setScopeName] = useState<string | null>(null);
  const [, setScopedItems] = useState<CommandItem[]>([]);
  const [, setPaletteMode] = useState<'global' | 'scoped'>('global');

  // Unsaved-changes guard registry. A single page at a time can own the guard.
  const guardRef = useRef<UnsavedChangesGuard | null>(null);
  const registerGuard = useCallback((guard: UnsavedChangesGuard | null) => {
    guardRef.current = guard;
  }, []);

  const requestNavigation = useCallback(async (to: string): Promise<boolean> => {
    const guard = guardRef.current;
    if (!guard || !guard.isDirty()) return true;
    const confirmed = await guard.confirmLeave();
    if (confirmed) {
      // Page confirmed leaving; navigate now that the guard is cleared.
      navigate(to);
    }
    return confirmed;
  }, [navigate]);

  const unsavedContext = useMemo<UnsavedChangesContextType>(() => ({
    registerGuard,
    requestNavigation,
  }), [registerGuard, requestNavigation]);

  // Wrapped navigate used by sidebar links, palette and chords.
  const guardedNavigate = useCallback((to: string) => {
    void requestNavigation(to);
  }, [requestNavigation]);

  const registerScope = useMemo(() => (name: string, items: CommandItem[]) => {
    setScopeName(name);
    setScopedItems(items);
  }, []);
  const clearScope = useMemo(() => () => {
    setScopeName(null);
    setScopedItems([]);
    setPaletteMode('global');
  }, []);
  const layoutContext = useMemo<LayoutContextType>(() => ({
    registerScope, clearScope
  }), [registerScope, clearScope]);

  const [, setPendingChordKey] = useState<string | null>(null);
  const pendingChordKeyRef = useRef<string | null>(null);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  // Global keyboard shortcuts
  useEffect(() => {
    let chordTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if in an input field (except for Escape maybe, but handled separately usually)
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Ignore IME composition
      if (event.isComposing || event.keyCode === 229) return;

      if (!isInputField) {
        // If a chord is pending, process the second key
        if (pendingChordKeyRef.current) {
          const chord = pendingChordKeyRef.current;
          const key = event.key.toLowerCase();

          if (chord === 'g' && key === 's') {
            event.preventDefault();
            guardedNavigate('/subscriptions');
          }

          // Clear chord regardless of match
          setPendingChordKey(null);
          pendingChordKeyRef.current = null;
          if (chordTimeoutId) clearTimeout(chordTimeoutId);
          return;
        }

        // Check for chord start
        if (event.key === 'g') {
          event.preventDefault();
          setPendingChordKey('g');
          pendingChordKeyRef.current = 'g';
          chordTimeoutId = setTimeout(() => {
            setPendingChordKey(null);
            pendingChordKeyRef.current = null;
          }, 1000);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (chordTimeoutId) clearTimeout(chordTimeoutId);
    };
  }, [guardedNavigate]);

  // Intercept browser Back/Forward and close/reload while dirty.
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const guard = guardRef.current;
      if (guard && guard.isDirty()) {
        event.preventDefault();
        // Chrome requires returnValue to be set for the prompt to appear.
        event.returnValue = '';
        return '';
      }
      return undefined;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Intercept popstate (browser Back/Forward) navigation while dirty.
  useEffect(() => {
    const handlePopState = () => {
      const guard = guardRef.current;
      if (!guard || !guard.isDirty()) return;
      // Restore the current entry and ask the page to confirm.
      window.history.pushState(null, '', window.location.href);
      void guard.confirmLeave().then((confirmed) => {
        if (confirmed) {
          window.history.back();
        }
      });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <UnsavedChangesContext.Provider value={unsavedContext}>
      <div className="sb-layout">
        <aside className="sb-sidebar">
          <div className="sb-sidebar__brand">
            <Link to="/dashboard" className="sb-sidebar__brand-link" onClick={(e => {
              if (location.pathname === "/dashboard") return;
              const guard = guardRef.current;
              if (guard && guard.isDirty()) {
                e.preventDefault();
                void requestNavigation("/dashboard");
              }
            })}>
              <Sparkles className="sb-sidebar__brand-icon" aria-hidden="true" />
              <span>Subscription Billing</span>
            </Link>
          </div>
          <nav className="sb-sidebar__nav" aria-label="Main">
            {mainNav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`sb-sidebar__link${isActive(item.path) ? " sb-sidebar__link--active" : ""}`}
                aria-current={isActive(item.path) ? "page" : undefined}
                onClick={(e) => {
                  if (isActive(item.path)) return;
                  const guard = guardRef.current;
                  if (guard && guard.isDirty()) {
                    e.preventDefault();
                    void requestNavigation(item.path);
                  }
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <nav className="sb-sidebar__nav sb-sidebar__nav--dev" aria-label="Developer">
            {devNav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`sb-sidebar__link${isActive(item.path) ? " sb-sidebar__link--active" : ""}`}
                aria-current={isActive(item.path) ? "page" : undefined}
                onClick={(e) => {
                  if (isActive(item.path)) return;
                  const guard = guardRef.current;
                  if (guard && guard.isDirty()) {
                    e.preventDefault();
                    void requestNavigation(item.path);
                  }
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>
        <main className="sb-main">
          <RouteErrorBoundary pathname={location.pathname}>
            <Outlet context={layoutContext} />
          </RouteErrorBoundary>
        </main>
      </div>
    </UnsavedChangesContext.Provider>
  );
}
