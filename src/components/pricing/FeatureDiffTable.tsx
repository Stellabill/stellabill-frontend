import { FaArrowDown, FaArrowUp, FaEquals, FaPlus, FaMinus } from "react-icons/fa6";
import styles from "./FeatureDiffTable.module.css";

type FeatureValue = string | boolean;

interface FeatureDiff {
  name: string;
  oldValue: FeatureValue;
  newValue: FeatureValue;
  change: "added" | "removed" | "changed" | "same";
}

interface FeatureDiffTableProps {
  diffs: FeatureDiff[];
  oldPlanName: string;
  newPlanName: string;
}

const DiffCell = ({ value, changeType }: { value: FeatureValue; changeType: FeatureDiff["change"] }) => {
  const renderValue = (val: FeatureValue) => {
    if (typeof val === "boolean") {
      return val ? (
        <FaPlus aria-label="Included" />
      ) : (
        <FaMinus aria-label="Not Included" />
      );
    }
    return val;
  };

  return (
    <span className={`${styles.diffCell} ${styles[changeType]}`}>
      {renderValue(value)}
    </span>
  );
};

const ChangeIndicator = ({ change }: { change: FeatureDiff["change"] }) => {
  const icons = {
    added: <FaArrowUp className={styles.added} aria-label="Feature added" />,
    removed: <FaArrowDown className={styles.removed} aria-label="Feature removed" />,
    changed: <FaEquals className={styles.changed} aria-label="Feature changed" />,
    same: <span className={styles.same}>-</span>,
  };
  return <div className={styles.indicatorCell}>{icons[change]}</div>;
};

export default function FeatureDiffTable({
  diffs,
  oldPlanName,
  newPlanName,
}: FeatureDiffTableProps) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <caption className={styles.srOnly}>
          Feature comparison between {oldPlanName} and {newPlanName} plans.
        </caption>
        <thead>
          <tr>
            <th scope="col" className={styles.featureHeader}>Feature</th>
            <th scope="col" className={styles.planHeader}>{oldPlanName} (Current)</th>
            <th scope="col" className={styles.changeHeader}>Change</th>
            <th scope="col" className={styles.planHeader}>{newPlanName}</th>
          </tr>
        </thead>
        <tbody>
          {diffs.map((diff) => (
            <tr key={diff.name} className={styles.row}>
              <td className={styles.featureCell}>{diff.name}</td>
              <td className={styles.dataCell}>
                <DiffCell value={diff.oldValue} changeType={diff.change} />
              </td>
              <td className={styles.dataCell}>
                <ChangeIndicator change={diff.change} />
              </td>
              <td className={styles.dataCell}>
                <DiffCell value={diff.newValue} changeType={diff.change} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}