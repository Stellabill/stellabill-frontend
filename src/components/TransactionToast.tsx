import { useEffect, useState } from 'react';
import './TransactionToast.css';

export type ToastStatus = 'pending' | 'success' | 'error';

export interface ToastOptions {
    id: string;
    status: ToastStatus;
    title: string;
    message?: string;
    actionText?: string;
    onAction?: () => void;
    autoClose?: boolean;
}

interface TransactionToastProps {
    toast: ToastOptions;
    onClose: (id: string) => void;
}

export function TransactionToast({ toast, onClose }: TransactionToastProps) {
    const [isRemoving, setIsRemoving] = useState(false);

    const handleClose = () => {
        setIsRemoving(true);
        // Wait for exit animation to complete before actually removing
        setTimeout(() => {
            onClose(toast.id);
        }, 300);
    };

    useEffect(() => {
        // If it's success or error, and autoClose isn't explicitly false, close it after 5s
        if ((toast.status === 'success' || toast.status === 'error') && toast.autoClose !== false) {
            const timer = setTimeout(() => {
                handleClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [toast.status, toast.autoClose]);

    const renderIcon = () => {
        switch (toast.status) {
            case 'pending':
                return (
                    <div className="toast-icon toast-icon-pending" aria-hidden="true">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                        </svg>
                    </div>
                );
            case 'success':
                return (
                    <div className="toast-icon toast-icon-success" aria-hidden="true">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                );
            case 'error':
                return (
                    <div className="toast-icon toast-icon-error" aria-hidden="true">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                    </div>
                );
        }
    };

    return (
        <div
            className={`toast toast-${toast.status} ${isRemoving ? 'removing' : ''}`}
            role="alert"
            aria-live={toast.status === 'error' ? 'assertive' : 'polite'}
        >
            {renderIcon()}
            <div className="toast-content">
                <h4 className="toast-title">{toast.title}</h4>
                {toast.message && <p className="toast-message">{toast.message}</p>}
                {toast.actionText && toast.onAction && (
                    <div className="toast-actions">
                        <button
                            className={`toast-action-btn ${toast.status === 'error' ? 'toast-action-danger' : 'toast-action-primary'}`}
                            onClick={toast.onAction}
                        >
                            {toast.actionText}
                        </button>
                    </div>
                )}
            </div>
            <button
                className="toast-close"
                onClick={handleClose}
                aria-label="Close notification"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    );
}

interface ToastContainerProps {
    toasts: ToastOptions[];
    removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
    return (
        <div className="toast-container" aria-live="polite">
            {toasts.map(toast => (
                <TransactionToast
                    key={toast.id}
                    toast={toast}
                    onClose={removeToast}
                />
            ))}
        </div>
    );
}
