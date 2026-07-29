import { useEffect, useMemo, useState, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { CircleHelp } from "lucide-react";
import LandingNavbar from "./LandingNavbar";
import CommandPalette, { CommandItem } from "./CommandPalette";
import KeyboardShortcutsOverlay from "./KeyboardShortcutsOverlay";
import KeyboardChordIndicator from "./KeyboardChordIndicator";
import HelpSidebar from "./help/HelpSidebar";
import ChangelogPanel from "./changelog/ChangelogPanel";
import FocusOrderVisualizer from "./FocusOrderVisualizer";
import "../styles/sidebar.css";

const RECENT_COMMANDS_KEY = "sb:recent-commands";
const RECENT_COMMANDS_LIMIT = 5;
const PINNED_COMMANDS_KEY = "sb:pinned-commands";
const PINNED_COMMANDS_LIMIT = 5;

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
    path: "/ui-kit",
    label: "UI Kit",
    icon: (
      <svg className="sb-sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
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
  
  const [pendingChordKey, setPendingChordKey] = useState<string | null>(null);
  const pendingChordKeyRef = useRef<string | null>(null);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  // Catalog of every page and action the palette can surface.
  const catalog = useMemo<CommandItem[]>(() => {
    const pages: CommandItem[] = [
      { id: "page-dashboard", label: "Dashboard", group: "Pages", keywords: "home overview", perform: () => navigate("/dashboard") },
      { id: "page-subscriptions", label: "Subscriptions", group: "Pages", keywords: "subscribers customers", perform: () => navigate("/subscriptions") },
      { id: "page-plans", label: "Plans", group: "Pages", keywords: "pricing billing", perform: () => navigate("/plans") },
      { id: "page-browse-plans", label: "Browse Plans", group: "Pages", keywords: "catalog explore", perform: () => navigate("/browse-plans") },
      { id: "page-settings", label: "Settings", group: "Pages", keywords: "preferences account", perform: () => navigate("/settings") },
      { id: "page-ui-kit", label: "UI Kit", group: "Pages", keywords: "components developer", perform: () => navigate("/ui-kit") },
      { id: "page-brand", label: "Brand", group: "Pages", keywords: "design tokens", perform: () => navigate("/brand") },
    ];
    const actions: CommandItem[] = [
      { id: "action-create-plan", label: "Create plan", group: "Actions", hint: "Start a new billing plan", keywords: "add new plan", perform: () => navigate("/plans/create") },
      { id: "action-refund", label: "Issue refund", group: "Actions", hint: "Refund a subscription payment", keywords: "money back return reverse", perform: () => navigate("/subscriptions") },
      { id: "action-pause", label: "Pause subscription", group: "Actions", hint: "Temporarily stop billing", keywords: "hold suspend freeze", perform: () => navigate("/subscriptions") },
    ];
    return [...pages, ...actions];
  }, [navigate]);

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
            navigate('/subscriptions');
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
          }, 2000);
          return;
        }
      }

      // Cmd+K / Ctrl+K: Open command palette
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsPaletteOpen(true);
        return;
      }

      // Shift+?: Open help sidebar (outside input fields)
      // ? alone: Show keyboard shortcuts overlay
      if (event.key === '?' || event.key === '/') {
        if (!isInputField) {
          if (event.shiftKey && event.key === '?') {
            event.preventDefault();
            setIsHelpOpen((open) => !open);
            return;
          }
          if (event.key === '?') {
            event.preventDefault();
            setIsShortcutsOverlayOpen(true);
            return;
          }
        }
      }

      // QA Shortcut: Ctrl+Shift+F
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'f') {
        if (import.meta.env.DEV || localStorage.getItem('sb:qa-focus-visualizer') === 'true') {
          event.preventDefault();
          setIsQAOverlayOpen((prev) => !prev);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (chordTimeoutId) clearTimeout(chordTimeoutId);
    };
  }, [navigate]);

  return (
    <div className="app-layout">
      {/* Top Navbar */}
      <LandingNavbar />
      <div className="app-layout__shell">
        <aside className="sb-sidebar" aria-label="Main navigation">
          <div className="sb-sidebar__brand">Stellarbill</div>

          <button
            type="button"
            className="cmdk-trigger"
            onClick={() => setIsPaletteOpen(true)}
            aria-label="Open command palette"
            aria-haspopup="dialog"
            aria-keyshortcuts="Meta+K Control+K"
          >
            <svg
              className="cmdk-trigger__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="cmdk-trigger__label">Search…</span>
            <kbd className="cmdk-trigger__kbd">⌘K</kbd>
          </button>

          <nav className="sb-sidebar__nav" aria-label="Primary">
            <div className="sb-sidebar__group">
              <p className="sb-sidebar__group-label" aria-hidden="true">Main</p>
              {mainNav.map(({ path, label, icon }) => (
                <Link
                  key={path}
                  to={path}
                  className="sb-sidebar__link"
                  aria-current={isActive(path) ? "page" : undefined}
                >
                  {icon}
                  <span className="sb-sidebar__link-label">{label}</span>
                </Link>
              ))}
            </div>

            <div className="sb-sidebar__group">
              <p className="sb-sidebar__group-label" aria-hidden="true">Developer</p>
              {devNav.map(({ path, label, icon }) => (
                <Link
                  key={path}
                  to={path}
                  className="sb-sidebar__link"
                  aria-current={isActive(path) ? "page" : undefined}
                >
                  {icon}
                  <span className="sb-sidebar__link-label">{label}</span>
                </Link>
              ))}
            </div>

            <div className="sb-sidebar__group" style={{ marginTop: 'auto' }}>
              <p className="sb-sidebar__group-label" aria-hidden="true">Help</p>
              <button
                type="button"
                className="sb-sidebar__link"
                onClick={() => setIsChangelogOpen((o) => !o)}
                aria-haspopup="dialog"
                aria-expanded={isChangelogOpen}
              >
                <svg className="sb-sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <span className="sb-sidebar__link-label">What's new</span>
              </button>
              <button
                type="button"
                className="sb-sidebar__link"
                onClick={() => setIsHelpOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={isHelpOpen}
                aria-keyshortcuts="Shift+?"
              >
                <CircleHelp className="sb-sidebar__icon" aria-hidden="true" />
                <span className="sb-sidebar__link-label">Help &amp; support</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="app-layout__main">
          <div className="app-layout__content">
            <Outlet />
          </div>

          {/* Subtle background glow */}
          <div className="app-layout__glow" />
        </main>
      </div>

      <div className="app-layout__bottom-nav-wrapper">
        <nav className="app-layout__bottom-nav" aria-label="Primary bottom navigation">
          {mainNav.map(({ path, label, icon }) => (
            <Link
              key={path}
              to={path}
              className={`app-layout__bottom-nav-link${isActive(path) ? ' app-layout__bottom-nav-link--active' : ''}`}
              aria-current={isActive(path) ? 'page' : undefined}
            >
              <span className="app-layout__bottom-nav-icon" aria-hidden="true">
                {icon}
              </span>
              <span className="app-layout__bottom-nav-label">{label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        items={paletteItems}
        onSelect={handleCommandSelect}
        onTogglePin={handleTogglePin}
      />

      <KeyboardShortcutsOverlay
        isOpen={isShortcutsOverlayOpen}
        onClose={() => setIsShortcutsOverlayOpen(false)}
      />


      <HelpSidebar
        isOpen={isHelpOpen}
        onOpenChange={setIsHelpOpen}
        showTrigger={false}
      />

      <ChangelogPanel
        isOpen={isChangelogOpen}
        onOpenChange={setIsChangelogOpen}
      />

      <KeyboardChordIndicator pendingKey={pendingChordKey} />

      {isQAOverlayOpen && <FocusOrderVisualizer onClose={() => setIsQAOverlayOpen(false)} />}
    </div>
  );
}
