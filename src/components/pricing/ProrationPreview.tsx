import styles from "./PlanUpgradeWizard.module.css";

interface ProrationPreviewProps {
  oldPlanPrice: number;
  newPlanPrice: number;
  currency: string;
  billingCycleDays?: number;
  daysRemainingInCycle?: number;
}

export default function ProrationPreview({
  oldPlanPrice,
  newPlanPrice,
  currency,
  billingCycleDays = 30,
  daysRemainingInCycle = 15,
}: ProrationPreviewProps) {
  if (daysRemainingInCycle <= 0 || billingCycleDays <= 0) {
    return (
      <div className={styles.prorationCard}>
        <p>Not applicable for immediate change at end of cycle.</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const unusedAmount = (oldPlanPrice / billingCycleDays) * daysRemainingInCycle;
  const newPlanCostForRestOfCycle = (newPlanPrice / billingCycleDays) * daysRemainingInCycle;
  const proratedAmountDue = newPlanCostForRestOfCycle - unusedAmount;

  return (
    <div className={styles.prorationCard}>
      <h3 className={styles.prorationTitle}>Proration Preview</h3>
      <div className={styles.prorationLine}>
        <span>Credit for unused time on current plan</span>
        <span>-{formatCurrency(unusedAmount)}</span>
      </div>
      <div className={styles.prorationLine}>
        <span>Cost of new plan for rest of cycle</span>
        <span>{formatCurrency(newPlanCostForRestOfCycle)}</span>
      </div>
      <div className={`${styles.prorationLine} ${styles.prorationTotal}`}>
        <span>
          {proratedAmountDue >= 0
            ? "Amount due today"
            : "Credit to your account"}
        </span>
        <span>
          {proratedAmountDue >= 0
            ? formatCurrency(proratedAmountDue)
            : `-${formatCurrency(Math.abs(proratedAmountDue))}`}
        </span>
      </div>
    </div>
  );
}