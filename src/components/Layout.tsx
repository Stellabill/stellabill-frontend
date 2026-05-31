import { Link, Outlet, useLocation } from "react-router-dom";
import LandingNavbar from "./LandingNavbar";
import { useState, useEffect } from "react";

const nav = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/subscriptions", label: "Subscriptions" },
  { path: "/plans", label: "Plans" },
  { path: "/browse-plans", label: "Browse Plans" },
  { path: "/settings", label: "Settings" },
  { path: "/ui-kit", label: "UI Kit (Mockups)" },
];

export default function Layout() {
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Update mobile flag on resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close drawer when navigating
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "#0a0a0a",
      }}
    >
      <LandingNavbar />
      <div style={{ display: "flex", flex: 1 }}>
{isMobile && (
        {/* Mobile toggle button */}
        <button
          aria-label="Toggle navigation"
          aria-controls="sidebar"
          aria-expanded={isDrawerOpen}
          className="sb-sidebar-toggle"
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            zIndex: 1000,
            background: "transparent",
            border: "none",
            color: "#fff",
            fontSize: "1.5rem",
          }}
        >
          ☰
        </button>
      )}

        {/* Overlay */}
        {isDrawerOpen && (
          <div
            className="sb-overlay"
            onClick={() => setIsDrawerOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 999,
            }}
          />
        )}

        <aside
          id="sidebar"
          role="navigation"
          aria-hidden={isMobile && !isDrawerOpen}
          className={`sb-sidebar ${isDrawerOpen ? "open" : ""}`}
          style={{
            width: 220,
            background: "#1a1a2e",
            color: "#fff",
            padding: "1.5rem 0",
            position: isMobile ? "fixed" : "static",
            height: "100vh",
            transform: isMobile && !isDrawerOpen ? "translateX(-100%)" : "translateX(0)",
            transition: "transform 0.3s ease-in-out",
            zIndex: 1000,
          }}
        >
          <div style={{ padding: "0 1rem", marginBottom: "1.5rem" }}>
            <strong style={{ fontSize: "1.1rem" }}>Stellarbill</strong>
          </div>
          <nav>
            {nav.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                style={{
                  display: "block",
                  padding: "0.5rem 1rem",
                  color: location.pathname === path ? "#fff" : "#94a3b8",
                  background:
                    location.pathname === path ? "#2d2d44" : "transparent",
                  textDecoration: "none",
                }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        <main style={{ flex: 1, padding: "2rem", overflow: "auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
