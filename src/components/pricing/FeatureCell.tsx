import { FaCheck, FaMinus } from "react-icons/fa6";
import styles from "./FeatureComparison.module.css";

interface FeatureCellProps {
  value: string | boolean;
}

export default function FeatureCell({ value }: FeatureCellProps) {
  if (typeof value === "boolean") {
    if (value) {
      return (
        <div className={styles.checkmarkCell}>
          <FaCheck className={styles.checkmark} aria-label="Included" />
        </div>
      );
    }
    return (
      <div className={styles.dashCell}>
        <FaMinus className={styles.dash} aria-label="Not included" />
      </div>
    );
  }

  return <span className={styles.textValue}>{value}</span>;
}