import { useCallback, useState } from "react";
import { FaCheck, FaMinus, FaChevronDown } from "react-icons/fa6";
import styles from "./FeatureComparison.module.css";

type FeatureValue = string | boolean | number;

interface Feature {
  name: string;
  free: FeatureValue;
  pro: FeatureValue;
  enterprise: FeatureValue;
}

interface FeatureGroup {
  group: string;
  features: Feature[];
}

const PLANS = ["Free", "Pro", "Enterprise"] as const;

const FEATURE_GROUPS: FeatureGroup[] = [
  {
    group: "Billing",
    features: [
      { name: "Recurring billing", free: true, pro: true, enterprise: true },
      { name: "Usage-based billing", free: false, pro: true, enterprise: true },
      { name: "API access", free: "Basic", pro: true, enterprise: true },
    ],
  },
  {
    group: "Integrations",
    features: [
      { name: "Webhooks", free: true, pro: true, enterprise: true },
      { name: "Custom webhooks", free: false, pro: true, enterprise: true },
    ],
  },
  {
    group: "Support",
    features: [
      { name: "Community support", free: true, pro: true, enterprise: true },
      { name: "Priority support", free: false, pro: true, enterprise: true },
      { name: "Dedicated team", free: false, pro: false, enterprise: true },
    ],
  },
  {
    group: "Enterprise",
    features: [
      { name: "Custom SLAs", free: false, pro: false, enterprise: true },
      { name: "Volume pricing", free: false, pro: false, enterprise: true },
      { name: "White-label options", free: false, pro: false, enterprise: true },
    ],
  },
];

function FeatureCell({ value }: { value: FeatureValue }) {
  if (typeof value === "boolean") {
    return value ? (
      <span className={styles.cellIcon}>
        <FaCheck aria-label="Included" />
      </span>
    ) : (
      <span className={styles.cellIconDim}>
        <FaMinus aria-label="Not included" />
      </span>
    );
  }
  if (typeof value === "number") {
    return <span className={styles.cellLimit}>{value.toLocaleString()}</span>;
  }
  return <span className={styles.cellText}>{value}</span>;
}

export default function FeatureComparison() {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  const toggleGroup = useCallback((group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  }, []);

  const planKeys = ["free", "pro", "enterprise"] as const;

  return (
    <div className={styles.container} aria-labelledby="feature-matrix-heading">
      <h2 id="feature-matrix-heading" className={styles.title}>
        Feature comparison
      </h2>

      {/* Desktop table view */}
      <div className={styles.tableWrapper} role="region" aria-label="Feature comparison table">
        <table className={styles.table}>
          <caption className={styles.srOnly}>
            Side-by-side feature comparison of Free, Pro, and Enterprise plans
          </caption>
          <thead>
            <tr className={styles.headerRow}>
              <th className={styles.cornerHeader} scope="col">Features</th>
              {PLANS.map((plan) => (
                <th
                  key={plan}
                  scope="col"
                  className={`${styles.planHeader} ${plan === "Pro" ? styles.proHeader : ""} ${hoveredPlan === plan ? styles.colHover : ""}`}
                  onMouseEnter={() => setHoveredPlan(plan)}
                  onMouseLeave={() => setHoveredPlan(null)}
                >
                  {plan}
                </th>
              ))}
            </tr>
          </thead>
          {FEATURE_GROUPS.map((group) => {
            const isCollapsed = collapsedGroups.has(group.group);
            const groupId = `group-${group.group.replace(/\s+/g, "-")}`;
            return (
              <tbody key={group.group}>
                <tr className={styles.groupRow}>
                  <td className={styles.groupCell} colSpan={4}>
                    <button
                      className={styles.groupToggle}
                      onClick={() => toggleGroup(group.group)}
                      aria-expanded={!isCollapsed}
                      aria-controls={groupId}
                    >
                      <FaChevronDown
                        className={`${styles.groupArrow} ${isCollapsed ? styles.groupArrowCollapsed : ""}`}
                        aria-hidden="true"
                      />
                      {group.group}
                    </button>
                  </td>
                </tr>
                {group.features.map((feature) => (
                  <tr
                    key={feature.name}
                    id={`${groupId}-${feature.name.replace(/\s+/g, "-")}`}
                    className={`${styles.featureRow} ${isCollapsed ? styles.rowHidden : ""}`}
                  >
                    <th scope="row" className={styles.featureLabel}>
                      {feature.name}
                    </th>
                    {planKeys.map((key) => (
                      <td
                        key={key}
                        className={`${styles.dataCell} ${key === "pro" ? styles.proColumn : ""} ${hoveredPlan === PLANS[planKeys.indexOf(key)] ? styles.colHover : ""}`}
                      >
                        <FeatureCell value={feature[key]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            );
          })}
        </table>
      </div>

      {/* Mobile card-stack view under 720px */}
      <div className={styles.cardStack} role="list" aria-label="Plan feature cards">
        {PLANS.map((plan) => {
          const key = planKeys[PLANS.indexOf(plan)];
          return (
            <div key={plan} className={styles.planCard} role="listitem">
              <div className={`${styles.cardHeader} ${plan === "Pro" ? styles.cardHeaderPro : ""}`}>
                <h3 className={styles.cardPlanName}>{plan}</h3>
              </div>
              <ul className={styles.cardFeatureList}>
                {FEATURE_GROUPS.map((group) => (
                  <li key={group.group} className={styles.cardGroupSection}>
                    <p className={styles.cardGroupLabel}>{group.group}</p>
                    <ul className={styles.cardGroupFeatures}>
                      {group.features.map((feature) => (
                        <li key={feature.name} className={styles.cardFeature}>
                          <span className={styles.cardFeatureName}>{feature.name}</span>
                          <FeatureCell value={feature[key]} />
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
