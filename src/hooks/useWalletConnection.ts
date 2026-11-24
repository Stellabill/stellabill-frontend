import { useState, useRef } from 'react';
import type { ConnectionState } from '../components/ConnectButton';

export interface UseWalletConnectionOptions {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  connectDelayMs?: number;
  randomFn?: () => number;
}

export function useWalletConnection({
  onConnect,
  onDisconnect,
  connectDelayMs = 1500,
  randomFn = Math.random,
}: UseWalletConnectionOptions = {}) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const activeConnectionId = useRef(0);

  const openModal = () => {
    setConnectionState('disconnected');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    if (connectionState === 'connecting') {
      activeConnectionId.current += 1;
      setConnectionState('disconnected');
      setErrorMessage('');
    }
  };

  const connectFreighter = () => {
    const connectionId = ++activeConnectionId.current;
    setConnectionState('connecting');
    setErrorMessage('');

    // Simulate wallet connection process. Keep non-zero delays visible long enough for assistive UI/tests.
    const effectiveDelay = connectDelayMs > 0 ? Math.max(connectDelayMs, 500) : 0;

    window.setTimeout(() => {
      if (connectionId !== activeConnectionId.current) return;

      try {
        if (randomFn() < 0.2) {
          throw new Error('Connection rejected by user');
        }

        // Simulate success for demo
        const mockAddress = 'GB3K4Y5QYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQ';
        setAddress(mockAddress);
        setConnectionState('connected');
        setIsModalOpen(false);
        onConnect?.(mockAddress);
      } catch (error) {
        if (connectionId !== activeConnectionId.current) return;
        setConnectionState('error');
        setErrorMessage(error instanceof Error ? error.message : 'Connection failed');
      }
    }, effectiveDelay);
  };

  const disconnect = () => {
    activeConnectionId.current += 1;
    setConnectionState('disconnected');
    setAddress('');
    onDisconnect?.();
  };

  const retry = () => {
    setConnectionState('disconnected');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  return {
    connectionState,
    isConnected: connectionState === 'connected',
    address,
    errorMessage,
    isModalOpen,
    openModal,
    closeModal,
    connectFreighter,
    disconnect,
    retry,
  };
}
