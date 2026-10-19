import React, { useEffect, useRef, useState } from 'react';
import { Copy, ExternalLink, LogOut, Check, CreditCard } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

interface WalletDropdownProps {
  isOpen: boolean;
  address: string;
  onClose: () => void;
  onDisconnect: () => void;
  onOpenHistory?: () => void;
}

const WalletDropdown: React.FC<WalletDropdownProps> = ({ isOpen, address, onClose, onDisconnect, onOpenHistory }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    const succeeded = await copyToClipboard(address);
    setCopyStatus(succeeded ? 'copied' : 'error');
    resetTimerRef.current = setTimeout(() => {
      setCopyStatus('idle');
      resetTimerRef.current = null;
    }, 2000);
  };

  const handleDisconnect = () => {
    onDisconnect();
    onClose();
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
            onClick={() => window.open(`https://stellar.expert/explorer/public/account/${address}`, '_blank')}
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
            onClick={onClose}
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
                <CreditCard className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
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
