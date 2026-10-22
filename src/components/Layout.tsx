import { useEffect, useMemo, useState, useRef, createContext, useContext, useCallback } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { CircleHelp, Sparkles } from "lucide-react";
import LandingNavbar from "./LandingNavbar";
import CommandPalette, { CommandItem } from "./CommandPalette";
import KeyboardShortcutsOverlay from "./KeyboardShortcutsOverlay";
import KeyboardChordIndicator from "./KeyboardChordIndicator";
import HelpSidebar from "./help/HelpSidebar";
import ChangelogPanel from "./changelog/ChangelogPanel";
import FocusOrderVisualizer from "./FocusOrderVisualizer";
import RouteErrorBoundary from "./RouteErrorBoundary";
import { LayoutContextType } from "../hooks/useCommandScope";
import "../styles/sidebar.css";

const RECENT_COMMANDS_KEY = "sb:recent-commands";
const RECENT_COMMANDS_LIMIT = 5;
const PINNED_COMMANDS_KEY = "sb:pinned-commands";
const PINNED_COMMANDS_LIMIT = 5;

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

function readRecentCommands(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_COMMANDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readPinnedCommands(): string[] {
  try {
    const raw = localStorage.getItem(PINNED_COMMANDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistPinnedCommands(ids: string[]) {
  try {
    if (ids.length === 0) {
      localStorage.removeItem(PINNED_COMMANDS_KEY);
    } else {
      localStorage.setItem(PINNED_COMMANDS_KEY, JSON.stringify(ids));
    }
  } catch {
    // storage unavailable — keep pins in memory only
  }
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
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isShortcutsOverlayOpen, setIsShortcutsOverlayOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isQAOverlayOpen, setIsQAOverlayOpen] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>(() => readRecentCommands());
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => readPinnedCommands());
  const [scopeName, setScopeName] = useState<string | null>(null);
  const [scopedItems, setScopedItems] = useState<CommandItem[]>([]);
  const [paletteMode, setPaletteMode] = useState<'global' | 'scoped'>('global');
  const [showScopeToast, setShowScopeToast] = useState(false);

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

  const [pendingChordKey, setPendingChordKey] = useState<string | null>(null);
  const pendingChordKeyRef = useRef<string | null>(null);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  // Catalog of every page and action the palette can surface.
  const catalog = useMemo<CommandItem[]>(() => {
    const pages: CommandItem[] = [
      { id: "page-dashboard", label: "Dashboard", group: "Pages", keywords: "home overview", perform: () => guardedNavigate("/dashboard") },
      { id: "page-subscriptions", label: "Subscriptions", group: "Pages", keywords: "subscribers customers", perform: () => guardedNavigate("/subscriptions") },
      { id: "page-plans", label: "Plans", group: "Pages", keywords: "pricing billing", perform: () => guardedNavigate("/plans") },
      { id: "page-browse-plans", label: "Browse Plans", group: "Pages", keywords: "catalog explore", perform: () => guardedNavigate("/browse-plans") },
      { id: "page-settings", label: "Settings", group: "Pages", keywords: "preferences account", perform: () => guardedNavigate("/settings") },
      { id: "page-brand", label: "Brand", group: "Pages", keywords: "design tokens", perform: () => guardedNavigate("/brand") },
      { id: "page-design-tokens", label: "Design Tokens", group: "Pages", keywords: "css variables colors spacing typography motion", perform: () => guardedNavigate("/design-tokens") },
    ];
    const actions: CommandItem[] = [
      { id: "action-create-plan", label: "Create plan", group: "Actions", hint: "Start a new billing plan", keywords: "add new plan", perform: () => guardedNavigate("/plans/create") },
      { id: "action-refund", label: "Issue refund", group: "Actions", hint: "Refund a subscription payment", keywords: "money back return reverse", perform: () => guardedNavigate("/subscriptions") },
      { id: "action-pause", label: "Pause subscription", group: "Actions", hint: "Temporarily stop billing", keywords: "hold suspend freeze", perform: () => guardedNavigate("/subscriptions") },
      { id: "action-tour", label: "Start product tour", group: "Actions", hint: "Take a guided tour of the dashboard", keywords: "help guide tutorial onboarding walkthrough", perform: () => {
        // Trigger tour restart by clearing localStorage and reloading
        localStorage.removeItem('sb:tour-completed');
        localStorage.removeItem('sb:tour-dismissed');
        window.location.reload();
      }},
    ];
    return [...pages, ...actions];
  }, [guardedNavigate]);

  const handleCommandSelect = (item: CommandItem) => {
    const baseId = item.id.replace(/^recent-/, "");
    setRecentIds((prev) => {
      const next = [baseId, ...prev.filter((id) => id !== baseId)].slice(0, RECENT_COMMANDS_LIMIT);
      try {
        localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable — keep recents in memory only */
      }
      return next;
    });
  };

  const handleTogglePin = (itemId: string) => {
    setPinnedIds((prev) => {
      const isPinned = prev.includes(itemId);
      const next = isPinned ? prev.filter((id) => id !== itemId) : [itemId, ...prev].slice(0, PINNED_COMMANDS_LIMIT);
      persistPinnedCommands(next);
      return next;
    });
  };

  // Build palette items: each command appears once — in Pinned if pinned,
  // in Recent if recently used, or in its original group otherwise.
  const paletteItems = useMemo<CommandItem[]>(() => {
    const pinned = pinnedIds
      .map((id) => catalog.find((item) => item.id === id))
      .filter((item): item is CommandItem => Boolean(item))
      .map((item) => ({ ...item, group: "Pinned" as const }));
    const recent = recentIds
      .map((id) => catalog.find((item) => item.id === id))
      .filter((item): item is CommandItem => Boolean(item))
      .filter((item) => !pinnedIds.includes(item.id))
      .map((item) => ({ ...item, id: `recent-${item.id}`, group: "Recent" as const }));
    const unpinnedNonRecent = catalog.filter((item) => !pinnedIds.includes(item.id));
    return [...pinned, ...unpinnedNonRecent, ...recent];
  }, [catalog, recentIds, pinnedIds]);

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

        {/* Main Content Area */}
        <main className="app-layout__main">
          <div className="app-layout__content">
            <RouteErrorBoundary pathname={location.pathname}>
              <Outlet context={layoutContext} />
            </RouteErrorBoundary>
          </div>

          {/* Subtle background glow */}
          <div className="app-layout__glow" />
        </main>
      </div>
    </UnsavedChangesContext.Provider>
  );
}
