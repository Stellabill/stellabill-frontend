import React from 'react';

interface StepIndicatorProps {
    currentStep: number;
    completedSteps: number[];
}

export default function StepIndicator({ currentStep, completedSteps }: StepIndicatorProps) {
    const steps = [
        { id: 1, label: 'Business' },
        { id: 2, label: 'Payout' },
        { id: 3, label: 'Review' },
    ];

    const colors = {
        teal: '#22d3ee',
        tealBlue: '#14b8a6',
        darkGrey: '#4b5563',
        lightGrey: '#9ca3af',
        borderGrey: '#374151',
        lineGrey: '#9ca3af', // Match "light grey" requirement
        white: '#ffffff',
    };

    return (
        <div style={styles.container}>
            <div style={styles.stepsWrapper}>
                {steps.map((step, index) => {
                    const isCompleted = completedSteps.includes(step.id);
                    const isActive = currentStep === step.id;
                    const isLast = index === steps.length - 1;

                    return (
                        <React.Fragment key={step.id}>
                            {/* Step Circle & Label */}
                            <div style={styles.stepItem}>
                                <div
                                    style={{
                                        ...styles.circle,
                                        backgroundColor: isCompleted ? colors.teal : 'transparent',
                                        borderColor: isActive || isCompleted ? colors.teal : colors.darkGrey,
                                        borderWidth: isCompleted ? 0 : 2,
                                        borderStyle: 'solid',
                                    }}
                                >
                                    {isCompleted ? (
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke={colors.white}
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    ) : (
                                        <span
                                            style={{
                                                color: isActive ? colors.white : colors.darkGrey,
                                                fontSize: '14px',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {step.id}
                                        </span>
                                    )}
                                </div>
                                <span
                                    style={{
                                        ...styles.label,
                                        color: colors.darkGrey,
                                        fontWeight: isActive ? 600 : 400,
                                    }}
                                >
                                    {step.label}
                                </span>
                            </div>

                            {/* Connector Line */}
                            {!isLast && (
                                <div
                                    style={{
                                        ...styles.line,
                                        backgroundColor: isCompleted && (completedSteps.includes(steps[index + 1].id) || currentStep === steps[index + 1].id)
                                            ? colors.teal
                                            : colors.lineGrey,
                                    }}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '40px',
    },
    stepsWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    stepItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        width: '80px',
    },
    circle: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
    },
    label: {
        fontSize: '12px',
        textAlign: 'center',
        whiteSpace: 'nowrap',
    },
    line: {
        height: '2px',
        width: '60px',
        marginTop: '-20px', // Align with circles
        transition: 'all 0.3s ease',
    },
};
