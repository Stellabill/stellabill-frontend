import { useState, useEffect } from 'react'
import WalletPill from './WalletPill'
import { Link } from "react-router-dom";


export default function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [address] = useState("GABCDEFGHIJK1234567890ABCDEFGHIJK1234567890ABCDEXYZ9")

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleConnectWallet = () => {
    setIsConnected(true)
  }

  const handleDisconnect = () => {
    setIsConnected(false)
  }

  const handleSubscribe = () => {
    console.log("Subscribe with USDC clicked");
    // Navigate to subscription page
  };

  const navLinks = [
    { label: "Product", href: "#product", isAnchor: true },
    { label: "Pricing", href: "/pricing", isAnchor: false },
    { label: "Docs", href: "#docs", isAnchor: true },
    { label: "Contact", href: "#contact", isAnchor: true },
  ];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "#0a0a0a",
        borderBottom: isScrolled
          ? "1px solid #1a1a1a"
          : "1px solid transparent",
        boxShadow: isScrolled
          ? "0 4px 20px rgba(0, 0, 0, 0.5), 0 -2px 20px rgba(34, 211, 238, 0.1)"
          : "0 -2px 20px rgba(34, 211, 238, 0.08)",
        transition: "all 0.3s ease",
      }}
    >
      <nav
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 1.5rem",
          height: "72px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "2rem",
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Left - Branding */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              background: "linear-gradient(135deg, #22d3ee 0%, #14b8a6 100%)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                "0 0 20px rgba(34, 211, 238, 0.4), 0 0 40px rgba(34, 211, 238, 0.2)",
              position: "relative",
            }}
          >
            <span
              style={{
                color: "#ffffff",
                fontSize: "1.5rem",
                fontWeight: 700,
                letterSpacing: "0.02em",
              }}
            >
              S
            </span>
          </div>
          <span
            style={{
              color: "#ffffff",
              fontSize: "1.25rem",
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}
          >
            Stellabill
          </span>
        </div>

        {/* Center - Navigation Links (Desktop) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2rem",
            flex: 1,
            justifyContent: "center",
          }}
          className="desktop-nav"
        >
          {navLinks.map((link) => {
            const linkProps = {
              style: {
                color: "#94a3b8",
                fontSize: "0.9375rem",
                fontWeight: 500,
                textDecoration: "none",
                transition: "color 0.2s ease",
                padding: "0.5rem 0.75rem",
                position: "relative" as const,
              },
              onMouseEnter: (e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.color = "#ffffff";
              },
              onMouseLeave: (e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.color = "#94a3b8";
              },
              onFocus: (e: React.FocusEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.outline = "2px solid #22d3ee";
                e.currentTarget.style.outlineOffset = "4px";
              },
              onBlur: (e: React.FocusEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.color = "#94a3b8";
                e.currentTarget.style.outline = "none";
              },
            };

            return link.isAnchor ? (
              <a key={link.label} href={link.href} {...linkProps}>
                {link.label}
              </a>
            ) : (
              <Link key={link.label} to={link.href} {...linkProps}>
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right - Actions (Desktop) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
          }}
          className="desktop-actions"
        >
          <button
            onClick={handleSubscribe}
            style={{
              background: "transparent",
              border: "none",
              color: "#ffffff",
              fontSize: "0.9375rem",
              fontWeight: 500,
              cursor: "pointer",
              padding: "0.5rem 0.75rem",
              transition: "color 0.2s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#22d3ee";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#ffffff";
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = "2px solid #22d3ee";
              e.currentTarget.style.outlineOffset = "4px";
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = "none";
            }}
          >
            Subscribe with USDC
          </button>

          {isConnected ? (
            <WalletPill 
              address={address} 
              onDisconnect={handleDisconnect} 
            />
          ) : (
            <button
              onClick={handleConnectWallet}
              style={{
                background: 'linear-gradient(90deg, #22d3ee 0%, #14b8a6 100%)',
                border: 'none',
                color: '#000000',
                fontSize: '0.9375rem',
                fontWeight: 600,
                padding: '0.75rem 1.75rem',
                borderRadius: '10px',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(34, 211, 238, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                minHeight: '44px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 0 30px rgba(34, 211, 238, 0.6), 0 6px 16px rgba(0, 0, 0, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 0 20px rgba(34, 211, 238, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = '2px solid #22d3ee'
                e.currentTarget.style.outlineOffset = '4px'
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none'
              }}
            >
              Connect wallet
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            display: "none",
            background: "transparent",
            border: "none",
            color: "#ffffff",
            cursor: "pointer",
            padding: "0.5rem",
            minWidth: "44px",
            minHeight: "44px",
          }}
          className="mobile-menu-button"
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          style={{
            background: "#0a0a0a",
            borderTop: "1px solid #1a1a1a",
            padding: "1.5rem",
            display: "none",
          }}
          className="mobile-menu"
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {navLinks.map((link) => {
              const linkProps = {
                onClick: () => setIsMobileMenuOpen(false),
                style: {
                  color: "#94a3b8",
                  fontSize: "1rem",
                  fontWeight: 500,
                  textDecoration: "none",
                  padding: "0.75rem",
                  transition: "color 0.2s ease",
                  minHeight: "44px",
                  display: "flex" as const,
                  alignItems: "center" as const,
                },
                onMouseEnter: (e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.currentTarget.style.color = "#ffffff";
                },
                onMouseLeave: (e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.currentTarget.style.color = "#94a3b8";
                },
              };

              return link.isAnchor ? (
                <a key={link.label} href={link.href} {...linkProps}>
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} to={link.href} {...linkProps}>
                  {link.label}
                </Link>
              );
            })}

            <div
              style={{
                height: "1px",
                background: "#1a1a1a",
                margin: "0.5rem 0",
              }}
            />

            <button
              onClick={() => {
                handleSubscribe();
                setIsMobileMenuOpen(false);
              }}
              style={{
                background: "transparent",
                border: "1px solid #2a2a2a",
                color: "#ffffff",
                fontSize: "1rem",
                fontWeight: 500,
                cursor: "pointer",
                padding: "0.75rem",
                borderRadius: "8px",
                transition: "all 0.2s ease",
                minHeight: "44px",
                textAlign: "left",
              }}
            >
              Subscribe with USDC
            </button>

            {isConnected ? (
              <WalletPill 
                address={address} 
                onDisconnect={() => {
                  handleDisconnect()
                  setIsMobileMenuOpen(false)
                }} 
              />
            ) : (
              <button
                onClick={() => {
                  handleConnectWallet()
                  setIsMobileMenuOpen(false)
                }}
                style={{
                  background: 'linear-gradient(90deg, #22d3ee 0%, #14b8a6 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: 600,
                  padding: '0.75rem',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(34, 211, 238, 0.4)',
                  minHeight: '44px'
                }}
              >
                Connect wallet
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav,
          .desktop-actions {
            display: none !important;
          }
          .mobile-menu-button {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
          .mobile-menu {
            display: block !important;
          }
        }
      `}</style>
    </header>
  );
}
