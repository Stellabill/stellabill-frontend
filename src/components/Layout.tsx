import { Link, Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import LandingNavbar from "./LandingNavbar";
import SessionTimeoutModal from "./SessionTimeoutModal";
import { useSessionTimeout } from "../hooks/useSessionTimeout";
import "../styles/sidebar.css";

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

  const handleTimeout = () => {
    // For demo purposes, we'll just refresh the page
    window.location.href = '/';
  };

  const {
    isWarningOpen,
    remainingSeconds,
    handleStaySignedIn,
    handleLogout
  } = useSessionTimeout({
    onTimeout: handleTimeout
  });

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div className="flex flex-col min-height-screen bg-slate-950 text-slate-200">
      {/* Top Navbar */}
      <LandingNavbar />
      <div style={{ display: "flex", flex: 1 }}>
        <aside className="sb-sidebar" aria-label="Main navigation">
          <div className="sb-sidebar__brand">Stellarbill</div>

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
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950 relative">
          <div className="max-w-7xl mx-auto p-6 md:p-8 lg:p-10">
            <Outlet />
          </div>
          
          {/* Subtle background glow */}
          <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] pointer-events-none -z-10" />
        </main>
      </div>

      <SessionTimeoutModal
        isOpen={isWarningOpen}
        remainingSeconds={remainingSeconds}
        onStaySignedIn={handleStaySignedIn}
        onLogout={handleLogout}
      />
    </div>
  );
}
