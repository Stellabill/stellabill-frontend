"use client";

import React, { useState } from "react";

interface LinkItem {
  label: string;
  href: string;
}

interface LinkColumnProps {
  heading: string;
  links: LinkItem[];
}

const PRODUCT_LINKS: LinkItem[] = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "API", href: "#api" },
  { label: "Security", href: "#security" },
];

const RESOURCES_LINKS: LinkItem[] = [
  { label: "Documentation", href: "#docs" },
  { label: "Status", href: "#status" },
  { label: "Blog", href: "#blog" },
  { label: "Changelog", href: "#changelog" },
];

const COMPANY_LINKS: LinkItem[] = [
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
  { label: "Grants", href: "#grants" },
  { label: "Careers", href: "#careers" },
];

const C = {
  bg: "#09090f",
  teal: "#0ec4c4",
  tealDim: "#0a9e9e",
  tealGlow: "rgba(14,196,196,0.25)",
  tealGlowSoft: "rgba(14,196,196,0.10)",
  white: "#ffffff",
  gray: "#9ca3af",
  border: "rgba(14,196,196,0.18)",
};

const TwitterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const GitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const SendIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const Logo: React.FC = () => (
  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
    <div style={{
      width: 36, height: 36, borderRadius: 8,
      background: `linear-gradient(135deg, ${C.teal} 0%, ${C.tealDim} 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: `0 0 14px ${C.tealGlow}`, flexShrink: 0,
    }}>
      <span style={{ color: C.white, fontWeight: 800, fontSize: 16, fontFamily: "monospace" }}>S</span>
    </div>
    <span style={{ color: C.white, fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em", fontFamily: "Georgia, serif" }}>
      Stellabill
    </span>
  </div>
);

const SubscribeForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail("");
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <div style={{ marginTop: "24px" }}>
      <p style={{
        color: C.white, fontWeight: 600, fontSize: 13, marginBottom: 12,
        letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "Georgia, serif",
      }}>
        Subscribe to updates
      </p>
      <form onSubmit={handleSubmit} style={{ display: "flex" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          aria-label="Email address"
          style={{
            flex: 1, background: "rgba(255,255,255,0.04)",
            border: `1px solid ${C.border}`, borderRight: "none",
            borderRadius: "8px 0 0 8px", padding: "10px 14px",
            color: C.white, fontSize: 13, outline: "none",
            fontFamily: "inherit", minWidth: 0,
          }}
          onFocus={(e) => { e.target.style.borderColor = C.teal; }}
          onBlur={(e) => { e.target.style.borderColor = C.border; }}
        />
        <button
          type="submit"
          aria-label="Subscribe"
          style={{
            width: 44, background: `linear-gradient(135deg, ${C.teal}, ${C.tealDim})`,
            border: "none", borderRadius: "0 8px 8px 0",
            color: C.white, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, transition: "box-shadow 0.2s",
            boxShadow: `0 0 10px ${C.tealGlowSoft}`,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 20px ${C.tealGlow}`; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 10px ${C.tealGlowSoft}`; }}
        >
          {submitted ? <CheckIcon /> : <SendIcon />}
        </button>
      </form>
    </div>
  );
};

const SocialButton: React.FC<{ icon: React.ReactNode; label: string; href: string }> = ({ icon, label, href }) => (
  <a
    href={href} aria-label={label} target="_blank" rel="noopener noreferrer"
    style={{
      width: 40, height: 40, borderRadius: 10,
      border: `1px solid ${C.border}`,
      background: "rgba(14,196,196,0.04)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: C.gray, cursor: "pointer", textDecoration: "none",
      transition: "all 0.2s",
    }}
    onMouseEnter={(e) => {
      const el = e.currentTarget as HTMLAnchorElement;
      el.style.borderColor = C.teal; el.style.color = C.teal;
      el.style.boxShadow = `0 0 12px ${C.tealGlowSoft}`;
      el.style.background = "rgba(14,196,196,0.10)";
    }}
    onMouseLeave={(e) => {
      const el = e.currentTarget as HTMLAnchorElement;
      el.style.borderColor = C.border; el.style.color = C.gray;
      el.style.boxShadow = "none"; el.style.background = "rgba(14,196,196,0.04)";
    }}
  >
    {icon}
  </a>
);

const LinkColumn: React.FC<LinkColumnProps> = ({ heading, links }) => (
  <nav aria-label={heading}>
    <p style={{
      color: C.white, fontWeight: 700, fontSize: 14, marginBottom: 18,
      letterSpacing: "0.01em", fontFamily: "Georgia, serif", margin: "0 0 18px",
    }}>
      {heading}
    </p>
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 13 }}>
      {links.map((link) => (
        <li key={link.label}>
          <a
            href={link.href}
            style={{ color: C.gray, textDecoration: "none", fontSize: 14, lineHeight: 1.4, transition: "color 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = C.teal; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = C.gray; }}
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  </nav>
);

const Footer: React.FC = () => {
  return (
    <>
      <style>{`
        @keyframes teal-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.9; }
        }
        .sb-footer * { box-sizing: border-box; }
        .sb-footer input::placeholder { color: #4b5563; }
        @media (max-width: 768px) {
          .sb-top { flex-direction: column !important; }
          .sb-brand { max-width: 100% !important; flex: unset !important; }
          .sb-links { flex-wrap: wrap !important; gap: 32px !important; }
          .sb-bottom { flex-direction: column !important; gap: 14px !important; align-items: flex-start !important; }
        }
      `}</style>

      <footer className="sb-footer" style={{ background: C.bg, borderTop: `1px solid rgba(14,196,196,0.12)`, fontFamily: "system-ui, sans-serif", position: "relative" }}>
       
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent 0%, ${C.teal} 25%, ${C.teal} 75%, transparent 100%)`,
          opacity: 0.6, animation: "teal-pulse 4s ease-in-out infinite",
        }} />

        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "56px 28px 0" }}>
         
          <div className="sb-top" style={{ display: "flex", gap: 40, paddingBottom: 52 }}>

            
            <div className="sb-brand" style={{ flex: "0 0 280px", minWidth: 0 }}>
              <Logo />
              <p style={{ color: C.gray, fontSize: 14, lineHeight: 1.75, margin: 0, maxWidth: 268 }}>
                Recurring USDC subscription billing infrastructure on the Stellar blockchain. Built with Soroban smart contracts.
              </p>
              <SubscribeForm />
              <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <SocialButton icon={<TwitterIcon />} label="Twitter" href="https://twitter.com" />
                <SocialButton icon={<GitHubIcon />} label="GitHub" href="https://github.com" />
                <SocialButton icon={<LinkedInIcon />} label="LinkedIn" href="https://linkedin.com" />
              </div>
            </div>

           
            <div style={{ flex: 1 }} />

         
            <div className="sb-links" style={{ display: "flex", gap: 60, alignItems: "flex-start", flexShrink: 0 }}>
              <LinkColumn heading="Product" links={PRODUCT_LINKS} />
              <LinkColumn heading="Resources" links={RESOURCES_LINKS} />
              <LinkColumn heading="Company" links={COMPANY_LINKS} />
            </div>
          </div>

          
          <div style={{ position: "relative", height: 1 }}>
            <div style={{
              position: "absolute", inset: 0,
              background: `linear-gradient(90deg, transparent 0%, ${C.teal} 20%, ${C.teal} 80%, transparent 100%)`,
              opacity: 0.3,
            }} />
            <div style={{
              position: "absolute", inset: "0 20%",
              background: C.teal,
              opacity: 0.08, filter: "blur(6px)",
            }} />
          </div>

         
          <div className="sb-bottom" style={{
            display: "flex", flexDirection: "row",
            alignItems: "center", justifyContent: "space-between",
            padding: "20px 0 28px",
          }}>
            <p style={{ color: C.gray, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
              © 2026 Stellabill. Part of the Stellar ecosystem.
            </p>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {["Privacy", "Terms", "Cookies"].map((label) => (
                <a
                  key={label}
                  href={`#${label.toLowerCase()}`}
                  style={{ color: C.gray, textDecoration: "none", fontSize: 13, transition: "color 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = C.teal; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = C.gray; }}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;