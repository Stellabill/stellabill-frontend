import { useState, useEffect, useRef, useId, RefObject } from 'react'
import WalletPill from './WalletPill'
import WalletConnectModal from './WalletConnectModal'
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from './Branding/Logo';
import LocaleSwitcher from './LocaleSwitcher';
import { Menu, X, Github, Rocket, Zap, BookOpen, MessageSquare, ChevronRight } from 'lucide-react';
import { useWalletConnection, type UseWalletConnectionOptions } from '../hooks/useWalletConnection';

export interface LandingNavbarProps extends UseWalletConnectionOptions {}

export default function LandingNavbar(props: LandingNavbarProps = {}) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const {
    connectionState,
    isConnected,
    address,
    errorMessage,
    isModalOpen: isWalletModalOpen,
    openModal: handleConnectWallet,
    closeModal: handleCloseModal,
    connectFreighter: handleFreighterConnect,
    disconnect: handleDisconnect,
    retry: handleRetry,
  } = useWalletConnection(props);

  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const drawerId = useId();

  const closeDrawer = () => setIsMobileMenuOpen(false);

  useModalFocus(drawerRef as RefObject<HTMLElement>, {
    isOpen: isMobileMenuOpen,
    onClose: closeDrawer,
    initialFocusRef: closeButtonRef as RefObject<HTMLElement>,
  });

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const location = useLocation();
  const navigate = useNavigate();
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

  const handleSubscribe = () => {
    navigate("/browse-plans");
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
                <a
                    href="https://github.com/Stellabill/stellabill-frontend"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Stellabill on GitHub"
                    className="site-navbar__text-action rounded-lg p-2 transition-colors flex items-center gap-1.5 text-sm font-medium"
                >
                  <Github size={18} /> GitHub
                </a>
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
                {isConnected && (
                    <div className="scale-90 origin-right">
                      <WalletPill address={address} onDisconnect={handleDisconnect} />
                    </div>
                )}
                <button
                    ref={toggleButtonRef}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="site-navbar__mobile-toggle p-2 rounded-lg transition-colors"
                    aria-expanded={isMobileMenuOpen}
                    aria-controls={drawerId}
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
                  onClick={closeDrawer}
                  aria-hidden="true"
              />
          )}

          {/* Mobile Menu Drawer */}
          <div
              ref={drawerRef}
              id={drawerId}
              role="dialog"
              aria-modal="true"
              aria-label="Main menu"
              className={`site-navbar__mobile-drawer fixed inset-y-0 right-0 w-full max-w-xs z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
                  isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
              }`}
              inert={isMobileMenuOpen ? undefined : ''}
              aria-hidden={!isMobileMenuOpen}
          >
            <div className="flex flex-col h-full">
              <div className="site-navbar__mobile-section flex items-center justify-between p-5 border-b">
                <Logo size="sm" />
                <button
                    ref={closeButtonRef}
                    onClick={closeDrawer}
                    className="site-navbar__drawer-close site-navbar__mobile-toggle p-2 rounded-lg transition-colors"
                    aria-label="Close menu"
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
                <div className="flex items-center justify-between gap-3">
                  <a
                      href="https://github.com/Stellabill/stellabill-frontend"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="site-navbar__text-action flex items-center gap-2 text-sm font-medium"
                  >
                    <Github size={18} /> GitHub
                  </a>
                  <LocaleSwitcher />
                </div>
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
            onClose={handleCloseModal}
            onConnectFreighter={handleFreighterConnect}
            connectionState={connectionState}
            errorMessage={errorMessage}
            onRetry={handleRetry}
        />
      </>
  );
}
