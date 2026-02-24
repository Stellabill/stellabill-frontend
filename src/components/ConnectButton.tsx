import React from 'react';
import styles from './ConnectButton.module.css';

interface ConnectButtonProps {
  onClick: () => void;
}

const ConnectButton: React.FC<ConnectButtonProps> = ({ onClick }) => {
  return (
    <button className={styles.connectButton} onClick={onClick}>
      Connect wallet
    </button>
  );
};

export default ConnectButton;
