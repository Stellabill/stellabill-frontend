import React, { useState, useRef, useEffect } from 'react';
import styles from './WalletPill.module.css';
import WalletDropdown from './WalletDropdown';

interface WalletPillProps {
  address: string;
  onDisconnect: () => void;
}

const WalletPill: React.FC<WalletPillProps> = ({ address, onDisconnect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Truncate address: GABC...XYZ9
  const truncatedAddress = address.length > 10 
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : address;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={styles.pillContainer} ref={containerRef}>
      <button 
        className={`${styles.pill} ${isOpen ? styles.pillOpen : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className={styles.statusDot} />
        <span>{truncatedAddress}</span>
        <svg 
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <WalletDropdown 
        isOpen={isOpen} 
        address={address} 
        onClose={() => setIsOpen(false)} 
        onDisconnect={onDisconnect}
      />
    </div>
  );
};

export default WalletPill;
