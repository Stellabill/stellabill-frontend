import { useEffect, useRef, MouseEvent } from 'react';
import './PauseSubscriptionModal.css';

interface PauseSubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading?: boolean;
}

export default function PauseSubscriptionModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false
}: PauseSubscriptionModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (isOpen) {
            previousFocusRef.current = document.activeElement as HTMLElement;
            // Small delay to let the modal animate in before focusing
            const timer = setTimeout(() => {
                const firstBtn = modalRef.current?.querySelector('.pause-btn-cancel') as HTMLButtonElement;
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
            className="pause-modal-overlay"
            onClick={(e: MouseEvent<HTMLDivElement>) => e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pause-modal-title"
        >
            <div className="pause-modal-content" ref={modalRef}>
                <button
                    className="pause-close-btn"
                    onClick={onClose}
                    aria-label="Close"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="pause-icon-header">
                    <div className="pause-icon-circle-main">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF8A00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 8v8M14 8v8" />
                        </svg>
                    </div>
                </div>

                <h2 id="pause-modal-title" className="pause-title">Pause subscription?</h2>
                <p className="pause-description">
                    You won't be charged until you resume. You can resume anytime.
                </p>

                <div className="pause-checklist-container">
                    <div className="pause-checklist-item">
                        <div className="checklist-icon-circle icon-orange">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 8v8M14 8v8" />
                            </svg>
                        </div>
                        <div className="checklist-text">
                            <h4>No charges while paused</h4>
                            <p>Your subscription will be inactive</p>
                        </div>
                    </div>

                    <div className="pause-checklist-item">
                        <div className="checklist-icon-circle icon-teal">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <div className="checklist-text">
                            <h4>Resume anytime</h4>
                            <p>Reactivate when you're ready</p>
                        </div>
                    </div>

                    <div className="pause-checklist-item">
                        <div className="checklist-icon-circle icon-teal">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <div className="checklist-text">
                            <h4>Balance remains available</h4>
                            <p>Your funds are safe in the prepaid vault</p>
                        </div>
                    </div>
                </div>

                <div className="pause-actions">
                    <button
                        className="pause-btn pause-btn-cancel"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Keep active
                    </button>
                    <button
                        className="pause-btn pause-btn-confirm"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Pausing...' : 'Pause subscription'}
                    </button>
                </div>
            </div>
        </div>
    );
}
