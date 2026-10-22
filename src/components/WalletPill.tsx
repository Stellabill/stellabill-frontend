import React, { useState, useRef } from 'react';
import WalletDropdown from './WalletDropdown';
import { ChevronDown, Globe, AlertTriangle } from 'lucide-react';
import {
  getExpectedNetwork,
  isNetworkMismatch,
  normalizeNetwork,
  type StellarNetwork,
} from '../config/network';

interface WalletPillProps {
  address: string;
  onDisconnect: () => void;
  network?: StellarNetwork | 'testnet' | 'mainnet' | 'public' | (string & {});
  expectedNetwork?: StellarNetwork | 'testnet' | 'mainnet' | 'public' | (string & {});
}

const WalletPill: React.FC<WalletPillProps> = ({
  address,
  onDisconnect,
  network,
  expectedNetwork,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Truncate address: GABC...XYZ9
  const truncatedAddress = currentAddress.length > 10 
    ? `${currentAddress.slice(0, 4)}...${currentAddress.slice(-4)}`
    : currentAddress;

  return (
    <div className="relative inline-block">
      <button 
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls="wallet-dropdown"
        className={`
          flex items-center gap-3 px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-300
          ${isOpen 
            ? "bg-white/10 ring-2 ring-cyan-500/30 text-white" 
            : "bg-white/5 hover:bg-white/8 text-slate-300 hover:text-white border border-white/5 hover:border-white/10 shadow-sm"
          }
          cursor-pointer active:scale-95
        `}
      >
        {/* Network Indicator */}
        <div className="flex items-center gap-1.5 px-1.5 py-1 bg-black/20 rounded-lg">
           <span className={`w-2 h-2 rounded-full ${resolvedWalletNetwork === 'Mainnet' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]'}`} />
           <Globe className="w-3 h-3 text-slate-500" />
        </div>

        <span className="tracking-tight">{truncatedAddress}</span>

        {hasMismatch && (
          <span
            role="status"
            aria-label={`Network mismatch: wallet is on ${resolvedWalletNetwork}, expected ${resolvedExpectedNetwork}`}
            title={`Network mismatch: wallet is on ${resolvedWalletNetwork}, expected ${resolvedExpectedNetwork}`}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-300 uppercase tracking-wider"
          >
            <AlertTriangle className="w-3 h-3 text-amber-400" aria-hidden="true" />
            <span>Wrong network</span>
          </span>
        )}
        
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <WalletDropdown 
        isOpen={isOpen} 
        address={currentAddress} 
        onClose={() => setIsOpen(false)} 
        onDisconnect={onDisconnect}
        triggerRef={triggerRef}
      />
    </div>
  );
};

export default WalletPill;
