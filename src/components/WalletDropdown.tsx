import React, { useState } from 'react';
import styles from './WalletDropdown.module.css';

interface WalletDropdownProps {
  isOpen: boolean;
  address: string;
  onClose: () => void;
  onDisconnect: () => void;
}

const WalletDropdown: React.FC<WalletDropdownProps> = ({ isOpen, address, onClose, onDisconnect }) => {
  const [showToast, setShowToast] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleSwitch = () => {
    alert('Switch wallet flow triggered');
    onClose();
  };

  const handleDisconnect = () => {
    onDisconnect();
    onClose();
  };

  return (
    <>
      <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
        <span className={styles.label}>Connected wallet</span>
        
        <div className={styles.addressBox}>
          {address}
        </div>

        <div className={styles.actions}>
          <button className={styles.actionItem} onClick={handleCopy}>
            <svg className={styles.actionIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy address
          </button>

          <button className={styles.actionItem} onClick={handleSwitch}>
            <svg className={styles.actionIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16"></path>
            </svg>
            Switch wallet
          </button>

          <button className={`${styles.actionItem} ${styles.disconnect}`} onClick={handleDisconnect}>
            <svg className={styles.disconnectIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Disconnect
          </button>
        </div>
      </div>

      {showToast && (
        <div className={styles.toast}>
          Address copied to clipboard!
        </div>
      )}
    </>
  );
};

export default WalletDropdown;
