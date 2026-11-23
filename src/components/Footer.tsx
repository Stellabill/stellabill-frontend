import React, { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "./Branding/Logo";
import { Send, Check, Github, ExternalLink } from "lucide-react";
import { DOCS_URL, GITHUB_REPO_URL, SUPPORT_URL, DEMO_URL } from "../config/links";

interface LinkItem {
  label: string;
  href: string;
  isExternal?: boolean;
}

interface FooterSectionProps {
  title: string;
  links: LinkItem[];
}

const PRODUCT_LINKS: LinkItem[] = [
  { label: "Features", href: "/#product" },
  { label: "Pricing", href: "/pricing" },
  { label: "Dashboard (demo)", href: "/dashboard" },
  { label: "Browse plans", href: "/browse-plans" },
];

const RESOURCES_LINKS: LinkItem[] = [
  { label: "Documentation", href: DOCS_URL, isExternal: true },
  { label: "Source code", href: GITHUB_REPO_URL, isExternal: true },
  { label: "Stellar Network", href: "https://stellar.org", isExternal: true },
  { label: "Report an issue", href: SUPPORT_URL, isExternal: true },
];

const LEGAL_LINKS: LinkItem[] = [
  { label: "About prepaid balances", href: "/about-prepaid-balances" },
  { label: "Brand pack", href: "/brand" },
];

const FooterSection: React.FC<FooterSectionProps> = ({ title, links }) => (
  <div className="flex flex-col space-y-4">
    <h4 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h4>
    <ul className="space-y-3">
      {links.map((link) => (
        <li key={link.label}>
          {link.isExternal ? (
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-cyan-400 text-sm transition-colors duration-200 flex items-center gap-1.5 group"
            >
              {link.label}
              <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ) : (
            <Link
              to={link.href}
              className="text-slate-400 hover:text-cyan-400 text-sm transition-colors duration-200"
            >
              {link.label}
            </Link>
          )}
        </li>
      ))}
    </ul>
  </div>
);

const Footer: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail("");
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-slate-950 border-t border-white/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
          {/* Brand and Newsletter */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <Logo size="md" />
              <p className="text-slate-400 text-base leading-relaxed max-w-sm">
                Next-generation recurring billing infrastructure built on Stellar. 
                Secure, transparent, and developer-first.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Stay updated</h4>
              <form onSubmit={handleSubscribe} className="flex max-w-md">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 bg-white/5 border border-white/10 rounded-l-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  required
                />
                <button
                  type="submit"
                  className="bg-linear-to-r from-cyan-400 to-teal-500 hover:from-cyan-300 hover:to-teal-400 text-black px-6 py-3 rounded-r-xl font-bold transition-all flex items-center justify-center min-w-[60px]"
                >
                  {isSubscribed ? <Check size={20} /> : <Send size={20} />}
                </button>
              </form>
              {isSubscribed && (
                <p className="text-teal-400 text-xs animate-in fade-in slide-in-from-top-1">
                  Demo only: no email is stored.
                </p>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" aria-label="Stellabill on GitHub" className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 rounded-xl transition-all">
                <Github size={20} />
              </a>
            </div>
          </div>

          {/* Links Sections */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <FooterSection title="Product" links={PRODUCT_LINKS} />
            <FooterSection title="Resources" links={RESOURCES_LINKS} />
            <FooterSection title="Legal" links={LEGAL_LINKS} />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Stellabill. Built on the Stellar Network.
          </p>
          <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
            Live demo: stellabill-frontend-blush.vercel.app
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;