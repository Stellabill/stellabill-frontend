import { useState } from 'react';
import WalletConnectModal from '../components/WalletConnectModal';
import TopUpModal from '../components/TopUpModal';
import { ToastContainer, ToastOptions } from '../components/TransactionToast';

export default function UIMockups() {
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
    const [walletModalState, setWalletModalState] = useState<'list' | 'connecting' | 'failed'>('list');
    const [toasts, setToasts] = useState<ToastOptions[]>([]);
    const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);

    const openWalletModal = (state: 'list' | 'connecting' | 'failed') => {
        setWalletModalState(state);
        setIsWalletModalOpen(true);
    };

    const addToast = (toastOptions: Omit<ToastOptions, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { ...toastOptions, id }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', color: '#1a1a2e' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>UI Components Mockup</h1>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                Preview: Wallet Connection Modal and Transaction Feedback UX.
            </p>

            <section style={{ marginBottom: '3rem', padding: '2rem', background: '#fff', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    Wallet Connect Modal
                </h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => openWalletModal('list')}
                        style={btnStyle}
                    >
                        Open Standard Flow (List)
                    </button>
                    <button
                        onClick={() => openWalletModal('connecting')}
                        style={{ ...btnStyle, background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1' }}
                    >
                        Preview: Connecting State
                    </button>
                    <button
                        onClick={() => openWalletModal('failed')}
                        style={{ ...btnStyle, background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
                    >
                        Preview: Failed State
                    </button>
                </div>
            </section>

            <section style={{ marginBottom: '3rem', padding: '2rem', background: '#fff', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    Top Up Modal (Issue #66)
                </h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setIsTopUpModalOpen(true)}
                        style={{ ...btnStyle, background: '#0d9488' }}
                    >
                        Open Top Up Modal
                    </button>
                </div>
            </section>

            <section style={{ padding: '2rem', background: '#fff', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>

                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    Transaction Feedback
                </h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => addToast({
                            status: 'pending',
                            title: 'Transaction Submitted',
                            message: 'Confirming in your wallet...',
                            autoClose: false // pending shouldn't auto close usually
                        })}
                        style={{ ...btnStyle, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
                    >
                        Show Pending Toast
                    </button>

                    <button
                        onClick={() => addToast({
                            status: 'success',
                            title: 'Transaction Confirmed',
                            message: 'Subscription created successfully.',
                            actionText: 'View in Explorer',
                            onAction: () => alert('Opening block explorer...')
                        })}
                        style={{ ...btnStyle, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}
                    >
                        Show Success Toast
                    </button>

                    <button
                        onClick={() => addToast({
                            status: 'error',
                            title: 'Transaction Failed',
                            message: 'Insufficient funds for gas calculation.',
                            actionText: 'Try Again',
                            onAction: () => alert('Retrying transaction...')
                        })}
                        style={{ ...btnStyle, background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
                    >
                        Show Failure Toast
                    </button>
                </div>
            </section>

            {/* Renders the modal conditionally based on state */}
            <WalletConnectModal
                isOpen={isWalletModalOpen}
                onClose={() => setIsWalletModalOpen(false)}
                initialState={walletModalState}
            />

            <TopUpModal
                isOpen={isTopUpModalOpen}
                onClose={() => setIsTopUpModalOpen(false)}
            />

            {/* Renders fixed toast notifications container */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}

const btnStyle = {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: 8,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
};
