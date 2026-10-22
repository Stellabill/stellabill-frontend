import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Copy, ExternalLink, LogOut, Check, CreditCard } from 'lucide-react';

interface WalletDropdownProps {
  isOpen: boolean;
  address: string;
  onClose: () => void;
  onDisconnect: () => void;
  onSwitchWallet?: () => void;
  onOpenHistory?: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  id?: string;
}

const WalletDropdown: React.FC<WalletDropdownProps> = ({
  isOpen,
  address,
  onClose,
  onDisconnect,
  onOpenHistory,
  triggerRef,
  id = 'wallet-dropdown',
}) => {
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const getMenuItems = useCallback((): HTMLElement[] => {
    if (!menuRef.current) return [];
    return Array.from(menuRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]'));
  }, []);

  // Focus first item on open
  useEffect(() => {
    if (!isOpen) return;
    const items = getMenuItems();
    if (items.length > 0) {
      items[0].focus();
    }
  }, [isOpen, getMenuItems]);

  // Escape + outside pointerdown
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        triggerRef?.current?.focus();
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menuRef.current && menuRef.current.contains(target)) return;
      if (triggerRef?.current && triggerRef.current.contains(target)) return;
      onClose();
      triggerRef?.current?.focus();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen, onClose, triggerRef]);

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

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const items = getMenuItems();
    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const next = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
        items[next].focus();
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const prev = currentIndex < 0 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length;
        items[prev].focus();
        break;
      }
      case 'Home': {
        event.preventDefault();
        items[0].focus();
        break;
      }
      case 'End': {
        event.preventDefault();
        items[items.length - 1].focus();
        break;
      }
      default:
        break;
    }
  };

  return (
    <div 
      ref={menuRef}
      id={id}
      role="menu"
      aria-label="Wallet menu"
      className="absolute right-0 mt-3 w-72 bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={handleMenuKeyDown}
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
            role="menuitem"
            tabIndex={-1}
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
            role="menuitem"
            tabIndex={-1}
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
            role="menuitem"
            tabIndex={-1}
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
            role="menuitem"
            tabIndex={-1}
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
