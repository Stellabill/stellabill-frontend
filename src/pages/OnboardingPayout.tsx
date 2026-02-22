import React, { useState } from 'react';
import StepIndicator from '../components/StepIndicator';

export default function OnboardingPayout() {
    const [payoutAddress, setPayoutAddress] = useState('');
    const [loading, setLoading] = useState(false);

    const handleContinue = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            window.location.href = '/onboarding/review';
        }, 1000);
    };

    return (
        <div style={styles.wrapper}>
            {/* Header Section */}
            <div style={styles.header}>
                <h1 style={styles.title}>Welcome to Stellabill</h1>
                <p style={styles.subtitle}>Let’s get your merchant account set up in just a few steps</p>
            </div>

            {/* Step Indicator */}
            <StepIndicator currentStep={2} completedSteps={[1]} />

            {/* Form Card */}
            <div style={styles.card}>
                <h2 style={styles.cardTitle}>Payout details</h2>
                <p style={styles.cardSubtitle}>Where should we send your subscription earnings?</p>

                <div style={styles.inputGroup}>
                    <label style={styles.label}>Stellar Payout Address</label>
                    <input
                        type="text"
                        placeholder="G..."
                        value={payoutAddress}
                        onChange={(e) => setPayoutAddress(e.target.value)}
                        style={styles.input}
                    />
                    <p style={styles.inputHint}>We support any Stellar wallet (Lobstr, Albedo, Freighter, etc.)</p>
                </div>

                <div style={styles.buttonRow}>
                    <button
                        style={styles.backButton}
                        onClick={() => window.history.back()}
                    >
                        Back
                    </button>
                    <button
                        style={{
                            ...styles.continueButton,
                            opacity: payoutAddress.startsWith('G') && payoutAddress.length >= 56 ? 1 : 0.5,
                            cursor: payoutAddress.startsWith('G') && payoutAddress.length >= 56 ? 'pointer' : 'not-allowed'
                        }}
                        disabled={!payoutAddress.startsWith('G') || payoutAddress.length < 56 || loading}
                        onClick={handleContinue}
                    >
                        {loading ? 'Processing...' : 'Continue to review'}
                    </button>
                </div>
            </div>

            <div style={styles.footer}>
                Need help? Contact us at <a href="mailto:support@stellabill.com" style={styles.link}>support@stellabill.com</a>
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    wrapper: {
        minHeight: '100vh',
        backgroundColor: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '60px 20px',
        color: '#FFFFFF',
        fontFamily: 'Inter, system-ui, sans-serif',
    },
    header: {
        textAlign: 'center',
        marginBottom: '40px',
    },
    title: {
        fontSize: '32px',
        fontWeight: 700,
        marginBottom: '12px',
        background: 'linear-gradient(135deg, #22d3ee 0%, #14b8a6 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    subtitle: {
        fontSize: '16px',
        color: '#94a3b8',
    },
    card: {
        width: '100%',
        maxWidth: '520px',
        backgroundColor: '#0f172a',
        borderRadius: '24px',
        padding: '40px',
        border: '1px solid #1e293b',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
    cardTitle: {
        fontSize: '24px',
        fontWeight: 600,
        marginBottom: '8px',
    },
    cardSubtitle: {
        fontSize: '14px',
        color: '#94a3b8',
        marginBottom: '32px',
    },
    inputGroup: {
        marginBottom: '32px',
    },
    label: {
        display: 'block',
        fontSize: '14px',
        fontWeight: 500,
        color: '#e2e8f0',
        marginBottom: '10px',
    },
    input: {
        width: '100%',
        padding: '14px 16px',
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '12px',
        color: '#FFFFFF',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.2s',
    },
    inputHint: {
        fontSize: '12px',
        color: '#64748b',
        marginTop: '8px',
    },
    buttonRow: {
        display: 'flex',
        gap: '16px',
    },
    backButton: {
        flex: 1,
        padding: '14px',
        backgroundColor: 'transparent',
        border: '1px solid #334155',
        borderRadius: '12px',
        color: '#FFFFFF',
        fontWeight: 600,
        cursor: 'pointer',
    },
    continueButton: {
        flex: 2,
        padding: '14px',
        background: 'linear-gradient(90deg, #22d3ee 0%, #14b8a6 100%)',
        border: 'none',
        borderRadius: '12px',
        color: '#000000',
        fontWeight: 600,
        cursor: 'pointer',
    },
    footer: {
        marginTop: '40px',
        fontSize: '14px',
        color: '#64748b',
    },
    link: {
        color: '#22d3ee',
        textDecoration: 'none',
    },
};
