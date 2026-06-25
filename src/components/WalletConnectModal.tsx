import { useRef } from "react";
import { useModalFocus } from "../hooks/useModalFocus";
import type { ConnectionState } from "./ConnectButton";
import { X, ShieldCheck, Info, RotateCcw, HelpCircle, AlertCircle, Loader2 } from "lucide-react";

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectFreighter?: () => void;
  onConnected?: () => void;
  connectionState?: ConnectionState;
  initialState?: ConnectionState | "list" | "failed";
  errorMessage?: string;
  onRetry?: () => void;
}

export default function WalletConnectModal({
  isOpen,
  onClose,
  onConnectFreighter,
  onConnected,
  connectionState,
  initialState,
  errorMessage,
  onRetry,
}: WalletConnectModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const mappedInitialState: ConnectionState = initialState === 'list'
    ? 'disconnected'
    : initialState === 'failed'
      ? 'error'
      : initialState ?? 'disconnected';
  const resolvedConnectionState = connectionState ?? mappedInitialState;

  useModalFocus(modalRef, { isOpen, onClose });

  const handleFreighterConnect = () => {
    onConnectFreighter?.();
    onConnected?.();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={resolvedConnectionState === 'disconnected' ? 'modal-description' : undefined}
      aria-busy={resolvedConnectionState === 'connecting' ? 'true' : undefined}
      onClick={(event) => {
        if (event.target === event.currentTarget && resolvedConnectionState !== 'connecting') {
          onClose();
        }
      }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300" 
        onClick={() => resolvedConnectionState !== 'connecting' && onClose()}
      />

      {/* Modal Content */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95 duration-300 overflow-hidden"
      >
        {/* Decorative Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/10 blur-[80px] pointer-events-none" />

        {/* Close Button */}
        <button 
          className="absolute top-6 right-6 p-2 rounded-full text-slate-500 hover:text-white hover:bg-white/5 transition-colors z-10"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex justify-center mb-8">
           <div className="w-16 h-16 rounded-3xl bg-cyan-500/5 flex items-center justify-center border border-cyan-500/10 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
              <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <ShieldCheck className="w-6 h-6 text-black" />
              </div>
           </div>
        </div>

        {/* Content */}
        <div className="text-center mb-10">
          <h2 id="modal-title" className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">
            {resolvedConnectionState === 'disconnected' && "Connect your wallet"}
            {resolvedConnectionState === 'connecting' && "Connecting..."}
            {resolvedConnectionState === 'error' && "Connection Failed"}
          </h2>
          <p
            id={resolvedConnectionState === 'disconnected' ? 'modal-description' : undefined}
            className="text-slate-400 text-sm leading-relaxed max-w-[280px] mx-auto"
          >
            {resolvedConnectionState === 'disconnected' && "Sign in with your wallet to manage Stellar wallet subscriptions and payments securely."}
            {resolvedConnectionState === 'connecting' && "Confirm in Freighter and accept the signature request to continue."}
            {resolvedConnectionState === 'error' && (errorMessage || "The connection request was rejected or failed. Please try again.")}
          </p>
        </div>

        {resolvedConnectionState === 'disconnected' && (
          <div className="space-y-4">
            {/* Wallet Option: Freighter */}
            <button 
              onClick={handleFreighterConnect}
              aria-label="Connect"
              className="w-full flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/5 hover:border-cyan-500/30 hover:bg-white/10 transition-all duration-300 group text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 group-hover:scale-110 transition-transform">
                 <img src="/freighter-logo.svg" alt="Freighter" className="w-7 h-7" onError={(e) => (e.currentTarget.style.display = 'none')} />
                 <RotateCcw className="w-6 h-6 text-orange-400 absolute opacity-0 group-hover:opacity-0" /> {/* Fallback icon if img fails */}
              </div>
              <div className="flex-1">
                <div className="text-white font-bold tracking-tight">Freighter</div>
                <div className="text-slate-500 text-xs font-medium">Browser Extension</div>
              </div>
              <div className="text-cyan-400 text-xs font-bold px-3 py-1 bg-cyan-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                Connect
              </div>
            </button>

            {/* Wallet Option: Lobstr (Coming Soon) */}
            <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/5 opacity-50 cursor-not-allowed text-left grayscale">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                 <RotateCcw className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold tracking-tight text-slate-400">Lobstr</span>
                  <span className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Soon</span>
                </div>
                <div className="text-slate-500 text-xs font-medium">Mobile & Web Wallet</div>
              </div>
            </div>

            {/* Trust Footer */}
            <div className="mt-8 flex items-center justify-center gap-2 text-slate-500 text-xs font-medium">
              <Info className="w-3.5 h-3.5 text-cyan-500/50" />
              <span>We never hold your keys. Powered by Soroban.</span>
            </div>
          </div>
        )}

        {resolvedConnectionState === 'connecting' && (
          <div className="py-12 flex flex-col items-center">
            <div className="relative mb-8">
              <Loader2 className="spinner w-16 h-16 text-cyan-400 animate-spin opacity-20" />
              <Loader2 className="w-16 h-16 text-cyan-400 animate-spin absolute inset-0 [animation-delay:150ms]" />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-cyan-400/10 rounded-full border border-cyan-400/20">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </span>
              <span className="text-cyan-400 text-xs font-bold uppercase tracking-widest">Awaiting Approval</span>
            </div>
          </div>
        )}

        {resolvedConnectionState === 'error' && (
          <div className="py-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-8">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <div className="flex flex-col gap-3 w-full max-w-[280px]">
              <button 
                onClick={onRetry}
                className="w-full flex items-center justify-center gap-2 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all border border-white/5 hover:border-white/10"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
              <button 
                onClick={() => window.open('https://docs.stellar.org/wallets', '_blank')}
                className="w-full flex items-center justify-center gap-2 py-4 text-slate-400 hover:text-white transition-colors text-sm font-medium"
              >
                <HelpCircle className="w-4 h-4" />
                Get Help
              </button>
              <button 
                onClick={onClose}
                className="w-full py-3 text-slate-500 hover:text-slate-400 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}