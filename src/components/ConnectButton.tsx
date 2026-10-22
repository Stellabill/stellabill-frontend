import React, { useState } from 'react';
import WalletConnectModal from './WalletConnectModal';
import WalletDropdown from './WalletDropdown';
import { Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import {
  FreighterConnectionError,
} from '../wallet/freighter';
import { useWallet } from '../wallet/WalletContext';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

interface ConnectButtonProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

const ConnectButton: React.FC<ConnectButtonProps> = ({
  onConnect,
  onDisconnect,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const {
    status,
    address,
    error,
    connect,
    disconnect: disconnectWallet,
    clearError,
    cancelConnect,
  } = useWallet();
  const connectionState: ConnectionState = status;
  const walletAddress = address ?? '';
  const errorMessage = error?.message ?? '';
  const connectionErrorType =
    error instanceof FreighterConnectionError ? error.type : undefined;

  const handleConnectClick = () => {
    clearError();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    cancelConnect();
    setIsModalOpen(false);
  };

  const handleConnectFreighter = async () => {
    try {
      const result = await connect();
      if (!result) return;
      setIsModalOpen(false);
      onConnect?.(result.address);
    } catch {
      // The provider exposes the connection error to this button and modal.
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setIsDropdownOpen(false);
    setConnectionErrorType(undefined);
    onDisconnect?.();
  };

  const handleRetry = () => {
    clearError();
    setIsModalOpen(true);
  };

  const handleOpenHistory = () => {
    if (onOpenHistory) {
      onOpenHistory();
    } else if (navigationContext?.navigator) {
      navigationContext.navigator.push('/wallet');
    } else {
      window.location.assign('/wallet');
    }
  };

  const handleRetry = () => {
    clearError();
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
            onSwitchWallet={handleSwitchWallet}
            onOpenHistory={handleOpenHistory}
          />
        )}
      </div>

      <WalletConnectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConnectFreighter={handleConnectFreighter}
        connectionState={connectionState}
        errorMessage={errorMessage}
        errorType={connectionErrorType}
        onRetry={handleRetry}
      />
    </>
  );
};

export default ConnectButton;
