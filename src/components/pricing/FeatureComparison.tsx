import { FaCheck, FaMinus } from "react-icons/fa6";
import styles from "./FeatureComparison.module.css";

interface Feature {
  name: string;
  free: string | boolean;
  pro: string | boolean;
  enterprise: string | boolean;
}

const features: Feature[] = [
  { name: "Recurring billing", free: true, pro: true, enterprise: true },
  { name: "API access", free: "Basic", pro: true, enterprise: true },
  { name: "Webhooks", free: true, pro: true, enterprise: true },
  { name: "Usage-based billing", free: false, pro: true, enterprise: true },
  { name: "Priority support", free: false, pro: true, enterprise: true },
  { name: "Custom SLAs", free: false, pro: false, enterprise: true },
  { name: "Volume pricing", free: false, pro: false, enterprise: true },
  { name: "White-label options", free: false, pro: false, enterprise: true },
  { name: "Dedicated support", free: false, pro: false, enterprise: true },
];

const FeatureCell = ({ value }: { value: string | boolean }) => {
  if (typeof value === "boolean") {
    if (value) {
      return (
        <div className={styles.checkmarkCell}>
          <FaCheck className={styles.checkmark} />
        </div>
      );
    } else {
      return (
        <div className={styles.dashCell}>
          <FaMinus className={styles.dash} />
        </div>
      );
    }
  }

  return <span className={styles.textValue}>{value}</span>;
};

export default function FeatureComparison() {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Feature comparison</h2>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <caption className={styles.srOnly}>
            Feature comparison table for Free, Pro, and Enterprise tiers
          </caption>
          <thead>
            <tr className={styles.headerRow}>
              <th className={styles.featureHeader} scope="col">
                Features
              </th>
              <th className={styles.columnHeader} scope="col">
                Free
              </th>
              <th
                className={`${styles.columnHeader} ${styles.proColumn}`}
                scope="col"
              >
                Pro
              </th>
              <th className={styles.columnHeader} scope="col">
                Enterprise
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature, index) => (
              <tr
                key={feature.name}
                className={`${styles.row} ${
                  index !== features.length - 1 ? styles.withDivider : ""
                }`}
              >
                <td className={styles.featureCell}>{feature.name}</td>
                <td className={styles.dataCell}>
                  <FeatureCell value={feature.free} />
                </td>
                <td className={`${styles.dataCell} ${styles.proColumn}`}>
                  <FeatureCell value={feature.pro} />
                </td>
                <td className={styles.dataCell}>
                  <FeatureCell value={feature.enterprise} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
