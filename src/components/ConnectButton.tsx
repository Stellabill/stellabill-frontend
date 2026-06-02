import React, { useRef, useState } from 'react';
import WalletConnectModal from './WalletConnectModal';
import WalletDropdown from './WalletDropdown';
import styles from './ConnectButton.module.css';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

interface ConnectButtonProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  connectDelayMs?: number;
  randomFn?: () => number;
}

const ConnectButton: React.FC<ConnectButtonProps> = ({
  onConnect,
  onDisconnect,
  connectDelayMs = 1500,
  randomFn = Math.random,
}) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const activeConnectionId = useRef(0);

  const handleConnectClick = () => {
    setConnectionState('disconnected');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);

    if (connectionState === 'connecting') {
      activeConnectionId.current += 1;
      setConnectionState('disconnected');
      setErrorMessage('');
    }
  };

  const handleConnectFreighter = async () => {
    const connectionId = ++activeConnectionId.current;
    setConnectionState('connecting');
    setErrorMessage('');

    try {
      await new Promise((resolve) => setTimeout(resolve, connectDelayMs));
      if (connectionId !== activeConnectionId.current) return;

      if (randomFn() > 0.2) {
        const mockAddress = 'GB3K4Y5QYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQ';
        setWalletAddress(mockAddress);
        setConnectionState('connected');
        setIsModalOpen(false);
        onConnect?.(mockAddress);
      } else {
        throw new Error('Connection rejected by user');
      }
    } catch (error) {
      if (connectionId !== activeConnectionId.current) return;
      setConnectionState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Connection failed');
    }
  };

  const handleDisconnect = () => {
    activeConnectionId.current += 1;
    setConnectionState('disconnected');
    setWalletAddress('');
    setIsDropdownOpen(false);
    onDisconnect?.();
  };

  const handleRetry = () => {
    setConnectionState('disconnected');
    setErrorMessage('');
  };

  const getButtonText = () => {
    switch (connectionState) {
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
      case 'error':
        return 'Connect wallet';
      default:
        return 'Connect wallet';
    }
  };

  const getButtonState = () => {
    if (connectionState === 'connecting') return 'connecting';
    if (connectionState === 'connected') return 'connected';
    if (connectionState === 'error') return 'error';
    return 'disconnected';
  };

  return (
    <>
      <button 
        className={`${styles.connectButton} ${styles[getButtonState()]}`}
        onClick={connectionState === 'connected' ? () => setIsDropdownOpen(!isDropdownOpen) : handleConnectClick}
        disabled={connectionState === 'connecting'}
        aria-label={
          connectionState === 'connected'
            ? `Wallet connected: ${walletAddress}`
            : connectionState === 'connecting'
            ? 'Connecting...'
            : 'Connect wallet'
        }
        aria-busy={connectionState === 'connecting' ? true : undefined}
      >
        {connectionState === 'connecting' && (
          <span className={styles.spinner} aria-hidden="true" />
        )}
        {getButtonText()}
      </button>

      <WalletConnectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConnectFreighter={handleConnectFreighter}
        connectionState={connectionState}
        errorMessage={errorMessage}
        onRetry={handleRetry}
      />

      {connectionState === 'connected' && (
        <WalletDropdown
          isOpen={isDropdownOpen}
          address={walletAddress}
          onClose={() => setIsDropdownOpen(false)}
          onDisconnect={handleDisconnect}
        />
      )}
    </>
  );
};

export default ConnectButton;
