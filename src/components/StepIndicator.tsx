import React from 'react';

interface Step {
  id: number;
  label: string;
  conditional?: boolean;
  revealed?: boolean;
}

interface StepIndicatorProps {
  currentStep: number;
  completedSteps: number[];
  steps?: Step[];
}

const DEFAULT_STEPS: Step[] = [
  { id: 1, label: 'Business' },
  { id: 2, label: 'Payout' },
  { id: 3, label: 'Review' },
];

export default function StepIndicator({ currentStep, completedSteps, steps = DEFAULT_STEPS }: StepIndicatorProps) {
  const colors = {
    teal: '#22d3ee',
    darkGrey: '#4b5563',
    lineGrey: '#9ca3af',
    white: '#ffffff',
  };

  const visibleSteps = steps.filter(s => s.revealed !== false);
  const hiddenCount = steps.length - visibleSteps.length;

  return (
    <div style={styles.container} aria-label="Onboarding progress">
      <div style={styles.stepsWrapper} role="list">
        {visibleSteps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isActive = currentStep === step.id;
          const isLast = index === visibleSteps.length - 1;

          return (
            <React.Fragment key={step.id}>
              <div style={styles.stepItem} role="listitem">
                <div
                  style={{
                    ...styles.circle,
                    backgroundColor: isCompleted ? colors.teal : 'transparent',
                    borderColor: isActive || isCompleted ? colors.teal : colors.darkGrey,
                    borderWidth: isCompleted ? 0 : 2,
                    borderStyle: step.conditional ? 'dashed' : 'solid',
                    opacity: step.conditional && !step.revealed ? 0.5 : 1,
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
                      aria-hidden="true"
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
                    color: isActive ? colors.white : colors.darkGrey,
                    fontWeight: isActive ? 600 : 400,
                  }}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {step.label}
                </span>
              </div>

              {!isLast && (
                <div
                  style={{
                    ...styles.line,
                    borderTop: `2px ${step.conditional ? 'dashed' : 'solid'} ${
                      isCompleted && (completedSteps.includes(visibleSteps[index + 1].id) || currentStep === visibleSteps[index + 1].id)
                        ? colors.teal
                        : colors.lineGrey
                    }`,
                    height: 0,
                    marginTop: '-20px',
                    transition: 'all 0.3s ease',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
        {hiddenCount > 0 && (
          <div style={{ fontSize: '12px', color: colors.lineGrey, marginTop: '-20px' }}>
            +{hiddenCount} optional step{hiddenCount > 1 ? 's' : ''}
          </div>
        )}
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
        marginTop: '-20px',
        transition: 'all 0.3s ease',
    },
};
