import { useEffect, useRef, MouseEvent } from 'react';
import './CancelSubscriptionModal.css';

interface CancelSubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading?: boolean;
    balance: string;
    endDate: string;
}

export default function CancelSubscriptionModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false,
    balance,
    endDate
}: CancelSubscriptionModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (isOpen) {
            previousFocusRef.current = document.activeElement as HTMLElement;
            const timer = setTimeout(() => {
                const firstBtn = modalRef.current?.querySelector('.cancel-btn-keep') as HTMLButtonElement;
                firstBtn?.focus();
            }, 50);
            return () => clearTimeout(timer);
        } else if (previousFocusRef.current) {
            previousFocusRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }

            if (e.key === 'Tab') {
                const focusable = modalRef.current?.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (!focusable || focusable.length === 0) return;

                const first = focusable[0] as HTMLElement;
                const last = focusable[focusable.length - 1] as HTMLElement;

                if (e.shiftKey && document.activeElement === first) {
                    last.focus();
                    e.preventDefault();
                } else if (!e.shiftKey && document.activeElement === last) {
                    first.focus();
                    e.preventDefault();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="cancel-modal-overlay"
            onClick={(e: MouseEvent<HTMLDivElement>) => e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-modal-title"
        >
            <div className="cancel-modal-content" ref={modalRef}>
                <button
                    className="cancel-close-btn"
                    onClick={onClose}
                    aria-label="Close"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="cancel-icon-header">
                    <div className="cancel-icon-circle-main">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                </div>

                <h2 id="cancel-modal-title" className="cancel-title">Cancel subscription?</h2>
                <p className="cancel-description">
                    You will no longer be charged. Your remaining prepaid balance ({balance} USDC) can be withdrawn to your wallet.
                </p>

                <div className="cancel-checklist-container">
                    <div className="cancel-checklist-item">
                        <div className="cancel-checklist-icon-circle icon-red">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </div>
                        <div className="cancel-checklist-text">
                            <h4>No more charges</h4>
                            <p>Your subscription will not renew</p>
                        </div>
                    </div>

                    <div className="cancel-checklist-item">
                        <div className="cancel-checklist-icon-circle icon-blue">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <div className="cancel-checklist-text">
                            <h4>Access until period end</h4>
                            <p>You can use the service until {endDate}</p>
                        </div>
                    </div>

                    <div className="cancel-checklist-item">
                        <div className="cancel-checklist-icon-circle icon-blue">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <div className="cancel-checklist-text">
                            <h4>Balance refundable</h4>
                            <p>Withdraw {balance} USDC anytime</p>
                        </div>
                    </div>
                </div>

                <div className="cancel-actions">
                    <button
                        className="cancel-btn cancel-btn-keep"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Keep subscription
                    </button>
                    <button
                        className="cancel-btn cancel-btn-confirm"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Cancelling...' : 'Cancel subscription'}
                    </button>
                </div>
            </div>
        </div>
    );
}
