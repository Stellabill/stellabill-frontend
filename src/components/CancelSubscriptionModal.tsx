import { useRef, MouseEvent, useState, useEffect } from 'react';
import { useModalFocus } from '../hooks/useModalFocus';
import { SaveOfferStep } from './SaveOfferStep';
import './CancelSubscriptionModal.css';

interface CancelSubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    onOfferSelected?: (offerId: string) => void;
    isLoading?: boolean;
    balance: string;
    endDate: string;
}

type CancelStep = 'offer' | 'confirm';

export default function CancelSubscriptionModal({
    isOpen,
    onClose,
    onConfirm,
    onOfferSelected,
    isLoading = false,
    balance,
    endDate
}: CancelSubscriptionModalProps) {
    const [step, setStep] = useState<CancelStep>('offer');
    const modalRef = useRef<HTMLDivElement>(null);
    const initialFocusRef = useRef<HTMLButtonElement>(null);

    // Reset step when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep('offer');
        }
    }, [isOpen]);

    // Handle focus when step changes
    useEffect(() => {
        if (isOpen && step === 'confirm') {
            const timer = setTimeout(() => {
                initialFocusRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [step, isOpen]);

    useModalFocus(modalRef, { isOpen, onClose, initialFocusRef });

    if (!isOpen) return null;

    const handleOfferSelected = (offerId: string) => {
        onOfferSelected?.(offerId);
        onClose();
    };

    const isOfferStep = step === 'offer';

    return (
        <div
            className="cancel-modal-overlay"
            onClick={(e: MouseEvent<HTMLDivElement>) => e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-modal-title"
            aria-describedby="cancel-modal-description"
        >
            <div 
                className={`cancel-modal-content ${isOfferStep ? 'cancel-modal-content-wide' : ''}`} 
                ref={modalRef}
            >
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

                {isOfferStep ? (
                    <SaveOfferStep 
                        onSkip={() => setStep('confirm')}
                        onOfferSelected={handleOfferSelected}
                        initialFocusRef={initialFocusRef}
                    />
                ) : (
                    <>
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
                        <p id="cancel-modal-description" className="cancel-description">
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
                                ref={initialFocusRef}
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
                    </>
                )}
            </div>
        </div>
    );
}
