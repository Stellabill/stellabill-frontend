import { useTranslation } from "react-i18next";
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
    group: "pricing.groups.billing",
    features: [
      { name: "pricing.features.recurring", free: true, pro: true, enterprise: true },
      { name: "pricing.features.usage", free: false, pro: true, enterprise: true },
      { name: "pricing.features.api", free: "pricing.comparison.basic", pro: true, enterprise: true },
    ],
  },
  {
    group: "pricing.groups.integrations",
    features: [
      { name: "pricing.features.webhooks", free: true, pro: true, enterprise: true },
      { name: "pricing.features.customWebhooks", free: false, pro: true, enterprise: true },
    ],
  },
  {
    group: "pricing.groups.support",
    features: [
      { name: "pricing.features.community", free: true, pro: true, enterprise: true },
      { name: "pricing.features.priority", free: false, pro: true, enterprise: true },
      { name: "pricing.features.dedicated", free: false, pro: false, enterprise: true },
    ],
  },
  {
    group: "pricing.groups.enterprise",
    features: [
      { name: "pricing.features.slas", free: false, pro: false, enterprise: true },
      { name: "pricing.features.volume", free: false, pro: false, enterprise: true },
      { name: "pricing.features.whiteLabel", free: false, pro: false, enterprise: true },
    ],
  },
];

function FeatureCell({ value }: { value: FeatureValue }) {
  const { t } = useTranslation();
  if (typeof value === "boolean") {
    return value ? (
      <span className={styles.cellIcon}>
        <FaCheck aria-label={t('pricing.comparison.included')} />
      </span>
    ) : (
      <span className={styles.cellIconDim}>
        <FaMinus aria-label={t('pricing.comparison.excluded')} />
      </span>
    );
  }
  if (typeof value === "number") {
    return <span className={styles.cellLimit}>{value.toLocaleString()}</span>;
  }
  return <span className={styles.cellText}>{t(value)}</span>;
}

export default function FeatureComparison() {
  const { t } = useTranslation();
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
        {t('pricing.comparison.title')}
      </h2>

      {/* Desktop table view */}
      <div className={styles.tableWrapper} role="region" aria-label={t('pricing.comparison.label')}>
        <table className={styles.table}>
          <caption className={styles.srOnly}>
            {t('pricing.comparison.caption')}
          </caption>
          <thead>
            <tr className={styles.headerRow}>
              <th className={styles.cornerHeader} scope="col">{t('pricing.comparison.features')}</th>
              {PLANS.map((plan) => (
                <th
                  key={plan}
                  scope="col"
                  className={`${styles.planHeader} ${plan === "Pro" ? styles.proHeader : ""} ${hoveredPlan === plan ? styles.colHover : ""}`}
                  onMouseEnter={() => setHoveredPlan(plan)}
                  onMouseLeave={() => setHoveredPlan(null)}
                >
                  {t(`pricing.plans.${plan.toLowerCase()}.title`)}
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
                      {t(group.group)}
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
                      {t(feature.name)}
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
      <div className={styles.cardStack} role="list" aria-label={t('pricing.comparison.cardsLabel')}>
        {PLANS.map((plan) => {
          const key = planKeys[PLANS.indexOf(plan)];
          return (
            <div key={plan} className={styles.planCard} role="listitem">
              <div className={`${styles.cardHeader} ${plan === "Pro" ? styles.cardHeaderPro : ""}`}>
                <h3 className={styles.cardPlanName}>{t(`pricing.plans.${plan.toLowerCase()}.title`)}</h3>
              </div>
              <ul className={styles.cardFeatureList}>
                {FEATURE_GROUPS.map((group) => (
                  <li key={group.group} className={styles.cardGroupSection}>
                    <p className={styles.cardGroupLabel}>{t(group.group)}</p>
                    <ul className={styles.cardGroupFeatures}>
                      {group.features.map((feature) => (
                        <li key={feature.name} className={styles.cardFeature}>
                          <span className={styles.cardFeatureName}>{t(feature.name)}</span>
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
