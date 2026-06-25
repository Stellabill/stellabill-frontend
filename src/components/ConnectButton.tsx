import React, { useRef, useState } from 'react';
import WalletConnectModal from './WalletConnectModal';
import WalletDropdown from './WalletDropdown';
import { Loader2, AlertCircle, ChevronDown } from 'lucide-react';

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

  const handleConnectFreighter = () => {
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
        setWalletAddress(mockAddress);
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
    setIsModalOpen(true);
  };

  const truncatedAddress = walletAddress 
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : '';

  return (
    <>
      <div className="relative inline-block">
        <button 
          onClick={connectionState === 'connected' ? () => setIsDropdownOpen(!isDropdownOpen) : handleConnectClick}
          disabled={connectionState === 'connecting'}
          className={`
            ${connectionState} flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
            ${connectionState === 'connected' 
              ? "bg-white/5 hover:bg-white/10 text-white border border-white/10" 
              : connectionState === 'error'
              ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
              : "bg-linear-to-r from-cyan-400 to-teal-500 hover:from-cyan-300 hover:to-teal-400 text-black shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:scale-105"
            }
            ${connectionState === 'connecting' ? "opacity-90 cursor-not-allowed" : "cursor-pointer active:scale-95"}
          `}
          aria-label={
            connectionState === 'connected'
              ? `Wallet connected: ${walletAddress}`
              : connectionState === 'connecting'
                ? 'Connecting'
                : 'Connect wallet'
          }
          aria-busy={connectionState === 'connecting' ? 'true' : undefined}
          aria-haspopup={connectionState === 'connected' ? "true" : "false"}
        >
          {connectionState === 'connecting' && (
            <Loader2 className="w-4 h-4 animate-spin text-black/70" aria-hidden="true" />
          )}
          
          {connectionState === 'error' && (
             <AlertCircle className="w-4 h-4 text-red-400" aria-hidden="true" />
          )}

          {connectionState === 'connected' && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
              <span className="text-slate-100">{truncatedAddress}</span>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
          )}

          {connectionState !== 'connected' && (
            <span>{connectionState === 'connecting' ? 'Connecting...' : connectionState === 'error' ? 'Connection Error' : 'Connect wallet'}</span>
          )}
        </button>

        {connectionState === 'connected' && (
          <WalletDropdown
            isOpen={isDropdownOpen}
            address={walletAddress}
            onClose={() => setIsDropdownOpen(false)}
            onDisconnect={handleDisconnect}
          />
        )}
      </div>

      <WalletConnectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConnectFreighter={handleConnectFreighter}
        connectionState={connectionState}
        errorMessage={errorMessage}
        onRetry={handleRetry}
      />
    </>
  );
};

export default ConnectButton;
