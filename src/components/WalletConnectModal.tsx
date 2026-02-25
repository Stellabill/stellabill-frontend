import { useEffect, useRef, useState } from 'react';
import './WalletConnectModal.css';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectFreighter?: () => void;
}

export default function WalletConnectModal({ 
  isOpen, 
  onClose, 
  onConnectFreighter 
}: WalletConnectModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Reset state when opened and manage focus return
  useEffect(() => {
    if (isOpen) {
      setIsConnecting(false);
      previousFocusRef.current = document.activeElement as HTMLElement;
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  // Focus trap and escape key logic
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements?.length) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Focus first element
    setTimeout(() => {
      const firstFocusable = modalRef.current?.querySelector('button');
      firstFocusable?.focus();
    }, 50);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleFreighterConnect = () => {
    setIsConnecting(true);
    // Simulate connection process
    setTimeout(() => {
      if (onConnectFreighter) {
        onConnectFreighter();
      }
      setIsConnecting(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="wallet-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div className="wallet-modal-content" ref={modalRef}>
        {/* Stellar Icon Header */}
        <div className="wallet-modal-icon">
          <div className="stellar-icon">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="20" fill="#00D4FF" fillOpacity="0.1"/>
              <path d="M20 8L28 13.5V24.5L20 30L12 24.5V13.5L20 8Z" stroke="#00D4FF" strokeWidth="2" strokeLinejoin="round"/>
              <circle cx="20" cy="20" r="2" fill="#00D4FF"/>
            </svg>
          </div>
        </div>

        <button
          className="wallet-close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <h2 id="modal-title" className="wallet-modal-title">
          Connect your<br />Stellar wallet
        </h2>
        
        <p id="modal-description" className="wallet-description">
          Sign in with your wallet to manage subscriptions or accept payments.
          <span className="trust-line">We never hold your keys.</span>
        </p>

        {/* Secure Connection Block */}
        <div className="secure-connection">
          <div className="secure-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#00D4FF" fill="#00D4FF" fillOpacity="0.1"/>
              <path d="M9 12l2 2 4-4" stroke="#00D4FF" strokeWidth="3"/>
            </svg>
          </div>
          <div className="secure-text">
            <h3>Secure connection</h3>
            <p>Powered by Stellar & Soroban smart contracts</p>
          </div>
        </div>

        {/* Wallet Options */}
        <div className="wallet-options">
          {/* Freighter - Active */}
          <div className="wallet-option">
            <div className="wallet-info">
              <div className="wallet-icon freighter-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="#FFB347" fillOpacity="0.2" stroke="#FFB347" strokeWidth="1.5"/>
                  <path d="M12 6L14 10L18 10.5L15 13L16 17L12 15L8 17L9 13L6 10.5L10 10L12 6Z" fill="#FFB347"/>
                </svg>
              </div>
              <div className="wallet-details">
                <span className="wallet-name">Freighter</span>
                <span className="wallet-type">Browser extension</span>
              </div>
            </div>
            <button 
              className="connect-btn freighter-btn"
              onClick={handleFreighterConnect}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          </div>

          {/* Lobstr - Coming Soon */}
          <div className="wallet-option disabled">
            <div className="wallet-info">
              <div className="wallet-icon lobstr-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="#FF6B4A" fillOpacity="0.1" stroke="#FF6B4A" strokeWidth="1.5"/>
                  <path d="M8 8L16 16M16 8L8 16" stroke="#FF6B4A" strokeWidth="2"/>
                </svg>
              </div>
              <div className="wallet-details">
                <div className="wallet-name-wrapper">
                  <span className="wallet-name">Lobstr</span>
                  <span className="coming-soon-tag">Coming soon</span>
                </div>
                <span className="wallet-type">Mobile & web wallet</span>
              </div>
            </div>
            <button className="connect-btn disabled" disabled>
              Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
