import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, RefreshCw, X } from 'lucide-react';
import { ToastContainer, type ToastOptions } from '../TransactionToast';
import RetryTimeline from './RetryTimeline';
import './dunning.css';

interface RetryAttempt {
  id: string;
  when: string;
  status: 'past' | 'upcoming' | 'failed' | 'succeeded';
}

interface PaymentMethod {
  id: string;
  label: string;
}

interface PaymentFailedBannerProps {
  subscriptionId: string | undefined;
  failedAttempts: number;
  retrySchedule: RetryAttempt[];
  onFixPayment?: () => void;
}

const paymentMethods: PaymentMethod[] = [
  { id: 'prepaid', label: 'Prepaid balance' },
  { id: 'card', label: 'Credit card' },
  { id: 'usdc', label: 'USDC wallet' },
];

export default function PaymentFailedBanner({
  subscriptionId,
  failedAttempts,
  retrySchedule,
  onFixPayment,
}: PaymentFailedBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [toasts, setToasts] = useState<ToastOptions[]>([]);
  const methodPickerRef = useRef<HTMLDivElement>(null);
  const methodPickerId = useId();
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Close method picker on outside click
  useEffect(() => {
    if (!showMethodPicker) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (methodPickerRef.current && !methodPickerRef.current.contains(e.target as Node)) {
        setShowMethodPicker(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [showMethodPicker]);

  // Cleanup cooldown interval on unmount
  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (status: ToastOptions['status'], title: string, message?: string) => {
      const id = `retry-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setToasts((prev) => [...prev, { id, status, title, message }]);
    },
    [],
  );

  const startCooldown = useCallback(() => {
    setIsCooldown(true);
    setCooldownSeconds(30);
    cooldownIntervalRef.current = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
          cooldownIntervalRef.current = null;
          setIsCooldown(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleRetry = useCallback(
    (methodId: string) => {
      setShowMethodPicker(false);
      setSelectedMethod(methodId);
      setIsRetrying(true);
      addToast('pending', 'Retrying payment…', `Attempting with ${paymentMethods.find((m) => m.id === methodId)?.label ?? 'selected method'}`);

      // Simulate retry for demo purposes
      setTimeout(() => {
        setIsRetrying(false);
        const success = Math.random() > 0.4;
        if (success) {
          addToast('success', 'Payment succeeded!', 'The retry was processed successfully.');
        } else {
          addToast('error', 'Payment failed', 'The retry did not go through. Try a different method or try again later.');
          startCooldown();
        }
      }, 2000);
    },
    [addToast, startCooldown],
  );

  if (dismissed || failedAttempts === 0) return null;

  const methodLabel = selectedMethod ? paymentMethods.find((m) => m.id === selectedMethod)?.label : null;

  return (
    <div className="dunning-banner" role="region" aria-labelledby="dunning-title" aria-live="polite">
      <div className="dunning-banner-inner">
        <div className="dunning-content">
          <h2 id="dunning-title">Payment failed</h2>
          <p className="dunning-message">
            We weren't able to process the latest payment. We'll retry automatically — here's what to expect.
          </p>

          <div className="dunning-ctas">
            {/* Retry now button with popover */}
            <div ref={methodPickerRef} className="relative">
              <button
                type="button"
                className="dunning-retry"
                onClick={() => {
                  if (isCooldown) return;
                  setShowMethodPicker((prev) => !prev);
                }}
                disabled={isCooldown || isRetrying}
                aria-expanded={showMethodPicker}
                aria-haspopup="dialog"
                aria-controls={methodPickerId}
              >
                {isCooldown ? (
                  <>
                    <Clock size={16} aria-hidden="true" />
                    Retry in {cooldownSeconds}s
                  </>
                ) : isRetrying ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" aria-hidden="true" />
                    Retrying…
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} aria-hidden="true" />
                    Retry now{methodLabel ? ` (${methodLabel})` : ''}
                  </>
                )}
              </button>

              {/* Tooltip when cooldown active */}
              {isCooldown && (
                <div
                  role="tooltip"
                  className="absolute bottom-full left-0 mb-2 w-max max-w-[220px] rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-xs text-slate-300 shadow-xl"
                >
                  Rate limited. Please wait {cooldownSeconds}s before retrying.
                </div>
              )}

              {/* Method picker popover */}
              {showMethodPicker && !isCooldown && (
                <div
                  id={methodPickerId}
                  role="dialog"
                  aria-label="Select payment method"
                  className="absolute top-full left-0 mt-2 z-50 w-56 rounded-xl border border-white/10 bg-slate-900 shadow-2xl backdrop-blur-xl overflow-hidden"
                >
                  <div className="px-3 py-2 border-b border-white/5">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Payment method
                    </p>
                  </div>
                  <div className="py-1">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        className={`w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-white/5 flex items-center gap-2 ${
                          selectedMethod === method.id ? 'text-cyan-300' : 'text-slate-300'
                        }`}
                        onClick={() => handleRetry(method.id)}
                      >
                        {selectedMethod === method.id && (
                          <span className="h-2 w-2 rounded-full bg-cyan-400" aria-hidden="true" />
                        )}
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <a
              href={subscriptionId ? `/subscriptions/${subscriptionId}/payment-method` : '/subscriptions'}
              className="dunning-primary"
              onClick={(e) => {
                if (onFixPayment) {
                  e.preventDefault();
                  onFixPayment();
                }
              }}
            >
              Fix payment method
            </a>

            <button
              type="button"
              className="dunning-secondary"
              onClick={() => setDismissed(true)}
            >
              <X size={14} aria-hidden="true" />
              Dismiss
            </button>
          </div>

          {/* Status indicator */}
          {selectedMethod && !isRetrying && !isCooldown && (
            <div className="mt-3 flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 size={14} aria-hidden="true" />
              <span>Last retry with {methodLabel}</span>
            </div>
          )}

          {isCooldown && (
            <div className="mt-3 flex items-center gap-2 text-sm text-amber-400">
              <AlertTriangle size={14} aria-hidden="true" />
              <span>Rate limited. Next retry available in {cooldownSeconds}s.</span>
            </div>
          )}
        </div>

        <div className="dunning-timeline-wrapper">
          <RetryTimeline attempts={retrySchedule} />
        </div>
      </div>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
