import { useRef, MouseEvent } from 'react';
import { useModalFocus } from '../hooks/useModalFocus';
import './PauseSubscriptionModal.css';

interface PauseSubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading?: boolean;
    error?: { message: string; technicalDetails?: string } | null;
}

export default function PauseSubscriptionModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false,
    error
}: PauseSubscriptionModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const initialFocusRef = useRef<HTMLButtonElement>(null);

    useModalFocus(modalRef, { isOpen, onClose, initialFocusRef, closeOnEscape: !isLoading });

    if (!isOpen) return null;

    return (
        <div
            className="pause-modal-overlay"
            onClick={(e: MouseEvent<HTMLDivElement>) => e.target === e.currentTarget && !isLoading && onClose()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pause-modal-title"
            aria-describedby="pause-modal-description"
            aria-busy={isLoading}
        >
            <div className="pause-modal-content" ref={modalRef}>
                <button
                    className="pause-close-btn"
                    onClick={onClose}
                    disabled={isLoading}
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
                <p id="pause-modal-description" className="pause-description">
                    You won't be charged until you resume. You can resume anytime.
                </p>

                {error && (
                    <div className="pause-action-error" role="alert">
                        <p>{error.message}</p>
                        {error.technicalDetails && (
                            <details>
                                <summary>Technical details</summary>
                                <p>{error.technicalDetails}</p>
                            </details>
                        )}
                    </div>
                )}

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
                        ref={initialFocusRef}
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
