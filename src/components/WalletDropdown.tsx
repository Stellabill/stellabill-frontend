import React, { useState } from 'react';
import { Copy, ExternalLink, LogOut, Check, CreditCard, AlertTriangle } from 'lucide-react';
import {
  explorerAccountUrl,
  getExpectedNetwork,
  isNetworkMismatch,
  normalizeNetwork,
  type StellarNetwork,
} from '../config/network';

interface WalletDropdownProps {
  isOpen: boolean;
  address: string;
  onClose: () => void;
  onDisconnect: () => void;
  onSwitchWallet?: () => void;
  onOpenHistory?: () => void;
  network?: StellarNetwork | 'testnet' | 'mainnet' | 'public' | (string & {});
  expectedNetwork?: StellarNetwork | 'testnet' | 'mainnet' | 'public' | (string & {});
}

const WalletDropdown: React.FC<WalletDropdownProps> = ({
  isOpen,
  address,
  onClose,
  onDisconnect,
  onOpenHistory,
  network,
  expectedNetwork,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const resolvedExpectedNetwork = expectedNetwork
    ? normalizeNetwork(expectedNetwork)
    : getExpectedNetwork();
  const resolvedWalletNetwork = network
    ? normalizeNetwork(network)
    : resolvedExpectedNetwork;
  const hasMismatch = isNetworkMismatch(resolvedWalletNetwork, resolvedExpectedNetwork);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = () => {
    onDisconnect();
    onClose();
  };

  const handleSwitchWallet = () => {
    onClose();
    if (onSwitchWallet) {
      onSwitchWallet();
    } else {
      onDisconnect();
    }
  };

  return (
    <div 
      className="absolute right-0 mt-3 w-72 bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Connected wallet</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 rounded-full border border-green-500/20">
             <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
             <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Connected</span>
          </div>
        </div>

        {hasMismatch && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <div className="font-bold text-amber-300">Network mismatch</div>
              <div className="text-[11px] text-amber-200/90 leading-snug">
                Wallet is on {resolvedWalletNetwork}, but expected {resolvedExpectedNetwork}. Please switch your wallet network.
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5 mb-6 group relative">
          <div className="text-[10px] font-medium text-slate-500 mb-1">Stellar Address</div>
          <div className="text-xs font-mono text-slate-300 break-all leading-relaxed">
            {address}
          </div>
          <span className="sr-only" role="status" aria-live="polite">
            {copyStatus === 'copied'
              ? 'Wallet address copied to clipboard'
              : copyStatus === 'error'
                ? 'Copy failed — select and copy manually'
                : ''}
          </span>
          <button
            onClick={handleCopy}
            className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all"
            title="Copy address"
          >
            {copyStatus === 'copied' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="sr-only">Copy address</span>
          </button>
        </div>

        <div className="space-y-1">
          <button 
            className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all group"
            onClick={() => window.open(explorerAccountUrl(resolvedWalletNetwork, address), '_blank')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-cyan-500/10 transition-colors">
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
              </div>
              View in Explorer
            </div>
          </button>

          <button
            className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all group"
            onClick={handleSwitchWallet}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-cyan-500/10 transition-colors">
                <CreditCard className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
              </div>
              Switch wallet
            </div>
          </button>

          <button 
            className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all group"
            onClick={() => {
              onClose();
              if (onOpenHistory) onOpenHistory();
            }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-cyan-500/10 transition-colors">
                <Clock className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
              </div>
              Wallet History
            </div>
          </button>

          <div className="h-px bg-white/5 my-2" />

          <button 
            className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all group"
            onClick={handleDisconnect}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
                <LogOut className="w-4 h-4" />
              </div>
              Disconnect
            </div>
          </button>
        </div>
      </div>
      
      {copyStatus !== 'idle' && (
        <div
          className={`absolute bottom-0 left-0 right-0 py-2 text-[10px] font-bold text-center uppercase tracking-widest animate-in slide-in-from-bottom-full duration-300 ${
            copyStatus === 'copied' ? 'bg-cyan-500 text-black' : 'bg-red-500 text-white'
          }`}
        >
          {copyStatus === 'copied' ? 'Copied to clipboard' : 'Copy failed — select and copy manually'}
        </div>
      )}
    </div>
  );
};

export default WalletDropdown;
