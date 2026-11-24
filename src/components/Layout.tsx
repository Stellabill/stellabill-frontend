import { useEffect, useMemo, useState, useRef, createContext, useContext, useCallback } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import CommandPalette, { CommandItem } from "./CommandPalette";
import RouteErrorBoundary from "./RouteErrorBoundary";
import { LayoutContextType } from "../hooks/useCommandScope";
import { useCommands } from "../hooks/useCommands";
import { mainNav, devNav } from "./layout/navItems";
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

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>(() => readRecentCommands());
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => readPinnedCommands());
  const [isShortcutsOverlayOpen, setIsShortcutsOverlayOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isQAOverlayOpen, setIsQAOverlayOpen] = useState(false);
  const [scopeName, setScopeName] = useState<string | null>(null);
  const [scopedItems, setScopedItems] = useState<CommandItem[]>([]);
  const [paletteMode, setPaletteMode] = useState<'global' | 'scoped'>('global');

  // Unsaved-changes guard registry. A single page at a time can own the guard.
  const guardRef = useRef<UnsavedChangesGuard | null>(null);
  const registerGuard = useCallback((guard: UnsavedChangesGuard | null) => {
    guardRef.current = guard;
  }, []);

  const requestNavigation = useCallback(async (to: string): Promise<boolean> => {
    const guard = guardRef.current;
    if (!guard || !guard.isDirty()) {
      navigate(to);
      return true;
    }
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

  const { paletteItems, handleCommandSelect, handleTogglePin } = useCommands(guardedNavigate);

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

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsPaletteOpen(true);
        return;
      }

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
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        items={paletteMode === 'scoped' ? scopedItems : paletteItems}
        onSelect={handleCommandSelect}
        onTogglePin={handleTogglePin}
        mode={paletteMode}
        onModeChange={setPaletteMode}
        scopeName={scopeName}
      />
    </UnsavedChangesContext.Provider>
  );
}
