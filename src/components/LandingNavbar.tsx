import { useState, useEffect } from 'react'
import WalletPill from './WalletPill'
import WalletConnectModal from './WalletConnectModal'
import { Link, useLocation } from "react-router-dom";
import Logo from './Branding/Logo';
import ThemeToggle from './ThemeToggle';
import LocaleSwitcher from './LocaleSwitcher';
import { Menu, X, Rocket, Zap, BookOpen, MessageSquare, ChevronRight } from 'lucide-react';

export default function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [address] = useState("GABCDEFGHIJK1234567890ABCDEFGHIJK1234567890ABCDEXYZ9")

  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard') ||
      location.pathname.startsWith('/subscriptions') ||
      location.pathname.startsWith('/plans') ||
      location.pathname.startsWith('/settings');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleConnectWallet = () => {
    setIsWalletModalOpen(true);
  }

  const handleFreighterConnect = () => {
    setIsConnected(true);
    console.log("Freighter connected successfully");
  }

  const handleDisconnect = () => {
    setIsConnected(false);
  }

  const handleSubscribe = () => {
    console.log("Subscribe with USDC clicked");
  };

  const navLinks = isDashboard ? [] : [
    { label: "Product", href: "/#product", icon: <Zap size={16} /> },
    { label: "Pricing", href: "/pricing", icon: <Rocket size={16} /> },
    { label: "Docs", href: "/#docs", icon: <BookOpen size={16} /> },
    { label: "Contact", href: "/#contact", icon: <MessageSquare size={16} /> },
  ];

  return (
      <>
        <header className={`site-navbar ${isScrolled ? "site-navbar--scrolled" : ""}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-18 lg:h-20">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link to="/" className="flex items-center group">
                  <Logo size="md" />
                </Link>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-1 lg:space-x-4">
                {navLinks.map((link) => (
                    <Link
                        key={link.label}
                        to={link.href}
                        className="site-navbar__link px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      {link.label}
                    </Link>
                ))}
              </nav>

              {/* Actions */}
              <div className="hidden md:flex items-center space-x-4">
                {!isDashboard && (
                    <button
                        onClick={handleSubscribe}
                        className="site-navbar__text-action rounded-lg px-2 py-2 text-sm font-medium transition-colors"
                    >
                      Subscribe with USDC
                    </button>
                )}
                <ThemeToggle />
                <LocaleSwitcher />

                {isConnected ? (
                    <WalletPill
                        address={address}
                        onDisconnect={handleDisconnect}
                    />
                ) : (
                    <button
                        onClick={handleConnectWallet}
                        className="site-navbar__connect px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      Connect wallet
                    </button>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <div className="md:hidden flex items-center gap-3">
                <ThemeToggle />
                <LocaleSwitcher />
                {isConnected && (
                    <div className="scale-90 origin-right">
                      <WalletPill address={address} onDisconnect={handleDisconnect} />
                    </div>
                )}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="site-navbar__mobile-toggle p-2 rounded-lg transition-colors"
                    aria-expanded={isMobileMenuOpen}
                    aria-label="Main menu"
                >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu Backdrop */}
          {isMobileMenuOpen && (
              <div
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                  onClick={() => setIsMobileMenuOpen(false)}
              />
          )}

          {/* Mobile Menu Drawer */}
          <div
              className={`site-navbar__mobile-drawer fixed inset-y-0 right-0 w-full max-w-xs z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
                  isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
              }`}
          >
            <div className="flex flex-col h-full">
              <div className="site-navbar__mobile-section flex items-center justify-between p-5 border-b">
                <Logo size="sm" />
                <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="site-navbar__drawer-close site-navbar__mobile-toggle p-2 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-5 space-y-1">
                {!isDashboard ? (
                    <>
                      <p className="site-navbar__mobile-label text-xs font-semibold uppercase tracking-widest mb-4 px-3">Navigation</p>
                      {navLinks.map((link) => (
                          <Link
                              key={link.label}
                              to={link.href}
                              className="site-navbar__mobile-link flex items-center justify-between px-3 py-4 text-lg font-medium rounded-xl transition-all group"
                          >
                      <span className="flex items-center gap-3">
                        <span className="site-navbar__mobile-link-icon transition-colors">
                          {link.icon}
                        </span>
                        {link.label}
                      </span>
                            <ChevronRight size={18} className="site-navbar__mobile-chevron transition-colors" />
                          </Link>
                      ))}
                    </>
                ) : (
                    <div className="py-4 text-center">
                      <p className="site-navbar__workspace-note text-sm italic">Authenticated Workspace</p>
                    </div>
                )}
              </div>

              <div className="site-navbar__mobile-section p-5 border-t space-y-4">
                {!isDashboard && (
                    <button
                        onClick={() => {
                          handleSubscribe();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full py-4 px-6 text-center text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-all"
                    >
                      Subscribe with USDC
                    </button>
                )}

                {!isConnected && (
                    <button
                        onClick={() => {
                          handleConnectWallet();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full py-4 px-6 text-center text-black bg-linear-to-r from-cyan-400 to-teal-500 hover:from-cyan-300 hover:to-teal-400 rounded-xl font-bold transition-all shadow-xl"
                    >
                      Connect wallet
                    </button>
                )}

                {isConnected && (
                    <button
                        onClick={() => {
                          handleDisconnect();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full py-4 px-6 text-center text-red-400 bg-red-400/5 hover:bg-red-400/10 border border-red-400/20 rounded-xl font-medium transition-all"
                    >
                      Disconnect Wallet
                    </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Wallet Connect Modal */}
        <WalletConnectModal
            isOpen={isWalletModalOpen}
            onClose={() => setIsWalletModalOpen(false)}
            onConnectFreighter={handleFreighterConnect}
            connectionState="disconnected"
        />
      </>
  );
}
