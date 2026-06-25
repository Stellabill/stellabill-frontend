import { useState, useMemo } from "react";
import styles from "./PlanUpgradeWizard.module.css";
import FeatureDiffTable from "./FeatureDiffTable";
import ProrationPreview from "./ProrationPreview";

type FeatureValue = string | boolean;

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: Record<string, FeatureValue>;
}

interface PlanUpgradeWizardProps {
  currentPlan: Plan;
  availablePlans: Plan[];
  onComplete: (newPlanId: string) => void;
}

type WizardStep = "select" | "review" | "confirm";

const getFeatureDiffs = (currentPlan: Plan, newPlan: Plan) => {
  const allFeatureNames = Array.from(
    new Set([
      ...Object.keys(currentPlan.features),
      ...Object.keys(newPlan.features),
    ])
  ).sort();

  return allFeatureNames.map((name) => {
    const oldValue = currentPlan.features[name] ?? false;
    const newValue = newPlan.features[name] ?? false;
    let change: "added" | "removed" | "changed" | "same" = "same";

    if (oldValue !== newValue) {
      if (oldValue === false) change = "added";
      else if (newValue === false) change = "removed";
      else change = "changed";
    }

    return { name, oldValue, newValue, change };
  });
};

export default function PlanUpgradeWizard({
  currentPlan,
  availablePlans,
  onComplete,
}: PlanUpgradeWizardProps) {
  const [step, setStep] = useState<WizardStep>("select");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const selectedPlan = useMemo(
    () => availablePlans.find((p) => p.id === selectedPlanId) || null,
    [selectedPlanId, availablePlans]
  );

  const featureDiffs = useMemo(() => {
    if (!selectedPlan) return [];
    return getFeatureDiffs(currentPlan, selectedPlan);
  }, [currentPlan, selectedPlan]);

  const handleNext = () => {
    if (step === "select" && selectedPlanId) {
      setStep("review");
    } else if (step === "review") {
      setStep("confirm");
    } else if (step === "confirm" && selectedPlanId) {
      onComplete(selectedPlanId);
    }
  };

  const handleBack = () => {
    if (step === "review") {
      setStep("select");
    } else if (step === "confirm") {
      setStep("review");
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case "select":
        return (
          <div>
            <h3 className={styles.subtitle}>
              Choose a new plan to compare with your current plan.
            </h3>
            <div className={styles.planSelection}>
              {availablePlans
                .filter((plan) => plan.id !== currentPlan.id)
                .map((plan) => (
                  <div
                    key={plan.id}
                    role="radio"
                    aria-checked={selectedPlanId === plan.id}
                    tabIndex={0}
                    className={`${styles.planCard} ${
                      selectedPlanId === plan.id ? styles.planCardSelected : ""
                    }`}
                    onClick={() => setSelectedPlanId(plan.id)}
                    onKeyDown={(e) =>
                      e.key === "Enter" || e.key === " "
                        ? setSelectedPlanId(plan.id)
                        : null
                    }
                  >
                    <div className={styles.planName}>{plan.name}</div>
                    <div className={styles.planPrice}>
                      ${plan.price}/{plan.currency === "USD" ? "mo" : ""}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        );
      case "review":
        if (!selectedPlan) return null;
        return (
          <div>
            <h3 className={styles.subtitle}>
              Review the feature changes between your current plan and the new
              plan.
            </h3>
            <FeatureDiffTable
              diffs={featureDiffs}
              oldPlanName={currentPlan.name}
              newPlanName={selectedPlan.name}
            />
          </div>
        );
      case "confirm":
        if (!selectedPlan) return null;
        return (
          <div>
            <h3 className={styles.subtitle}>
              Confirm your plan change. The amount below will be charged or
              credited to your account immediately.
            </h3>
            <ProrationPreview
              oldPlanPrice={currentPlan.price}
              newPlanPrice={selectedPlan.price}
              currency={currentPlan.currency}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.wizardContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Change Your Plan</h2>
      </div>

      <div className={styles.stepContent}>{renderStepContent()}</div>

      <div className={styles.navigation}>
        <button
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={handleBack}
          disabled={step === "select"}
          style={{ visibility: step === "select" ? "hidden" : "visible" }}
        >
          Back
        </button>
        <button
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={handleNext}
          disabled={step === "select" && !selectedPlanId}
        >
          {step === "select" && "Review Changes"}
          {step === "review" && "Confirm Proration"}
          {step === "confirm" && "Confirm Plan Change"}
        </button>
      </div>
    </div>
  );
}