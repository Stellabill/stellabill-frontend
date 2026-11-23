import styles from "./recentActivity.module.css";

export const PlusIcon = () => (
  <svg className={`${styles.iconGlyph} ${styles.successIcon}`} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <line x1="10" y1="4" x2="10" y2="16" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" />
    <line x1="4" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" />
  </svg>
);

export const CheckIcon = () => (
  <svg className={`${styles.iconGlyph} ${styles.infoIcon}`} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M4 10.5L8.5 15L16 6" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ClockIcon = () => (
  <svg className={`${styles.iconGlyph} ${styles.warningIcon}`} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.67" />
    <path d="M10 6.5V10.5L12.5 12" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const PlayIcon = () => (
  <svg className={`${styles.iconGlyph} ${styles.successIcon}`} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.67" />
    <path d="M8 7.5L13.5 10L8 12.5V7.5Z" fill="currentColor" />
  </svg>
);

export const XIcon = () => (
  <svg className={`${styles.iconGlyph} ${styles.dangerIcon}`} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.67" />
    <path d="M7.5 7.5L12.5 12.5M12.5 7.5L7.5 12.5" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" />
  </svg>
);

export const ArrowUpRightIcon = () => (
  <svg className={`${styles.iconGlyph} ${styles.arrowGlyph} ${styles.infoIcon}`} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4.5 11.5L11.5 4.5M11.5 4.5H6M11.5 4.5V10" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const TYPE_CONFIG = {
  new_subscription: {
    icon: <PlusIcon />,
    label: "New subscription",
    ariaLabel: "New subscription icon",
    iconClass: styles.successIcon,
    iconBg: "var(--color-success-bg)",
    iconBorder: "var(--color-success-border)",
  },
  charge_succeeded: {
    icon: <CheckIcon />,
    label: "Charge succeeded",
    ariaLabel: "Charge succeeded icon",
    iconClass: styles.infoIcon,
    iconBg: "var(--color-info-bg)",
    iconBorder: "var(--color-info-border)",
  },
  subscription_paused: {
    icon: <ClockIcon />,
    label: "Subscription paused",
    ariaLabel: "Subscription paused icon",
    iconClass: styles.warningIcon,
    iconBg: "var(--color-warning-bg)",
    iconBorder: "var(--color-warning-border)",
  },
  subscription_resumed: {
    icon: <PlayIcon />,
    label: "Subscription resumed",
    ariaLabel: "Subscription resumed icon",
    iconClass: styles.successIcon,
    iconBg: "var(--color-success-bg)",
    iconBorder: "var(--color-success-border)",
  },
  subscription_cancelled: {
    icon: <XIcon />,
    label: "Subscription cancelled",
    ariaLabel: "Subscription cancelled icon",
    iconClass: styles.dangerIcon,
    iconBg: "var(--color-danger-bg)",
    iconBorder: "var(--color-danger-border)",
  },
};

const SkeletonItem = () => (
  <li className={styles.skeletonItem} aria-hidden="true">
    <div className={styles.skeletonAvatar} />
    <div className={styles.skeletonContent}>
      <div className={`${styles.skeletonBar} ${styles.skeletonTitle}`} />
      <div className={`${styles.skeletonBar} ${styles.skeletonDetail}`} />
      <div className={`${styles.skeletonBar} ${styles.skeletonTimestamp}`} />
    </div>
    <div className={`${styles.skeletonBar} ${styles.skeletonAmount}`} />
  </li>
);

type ActivityType = keyof typeof TYPE_CONFIG;

const ActivityItem = ({
  type,
  details,
  timestamp,
  amount,
}: {
  type: ActivityType;
  details: string;
  timestamp: string;
  amount: string;
}) => {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.charge_succeeded;
  const showPlus = type === "new_subscription";

  return (
    <li className={styles.activityItem} tabIndex={0}>
      <div
        className={`${styles.activityIcon} ${cfg.iconClass}`}
        role="img"
        aria-label={cfg.ariaLabel}
      >
        {cfg.icon}
      </div>

      <div className={styles.activityContent}>
        <div className={styles.activityHeading}>
          <div className={styles.activityLabels}>
            <span className={styles.activityTitle}>{cfg.label}</span>
            <span className={styles.activityDetails}>{details}</span>
          </div>

          {amount != null && (
            <span className={`${styles.activityAmount} ${showPlus ? styles.positiveAmount : styles.neutralAmount}`}>
              {showPlus ? `+${amount}` : amount}
            </span>
          )}
        </div>

        <span className={styles.activityTimestamp}>{timestamp}</span>
      </div>
    </li>
  );
};

interface RecentActivityProps {
  items?: Array<{
    id: string;
    type: ActivityType;
    details: string;
    timestamp: string;
    amount: string;
  }> | null;
  onViewAll?: () => void;
  maxVisible?: number;
  title?: string;
}

export const RecentActivity = ({
  items = null,
  onViewAll,
  maxVisible = 8,
  title = "Recent activity",
}: RecentActivityProps) => {
  const isLoading = items === null;
  const visible = isLoading ? [] : items.slice(0, maxVisible);
  const skeletonCount = 5;

  return (
    <div className={styles.container}>
      <section className={styles.section} aria-label={title}>
        <div className={styles.header}>
          <h2 className={styles.heading}>{title}</h2>

          <button
            className={styles.viewAllButton}
            onClick={onViewAll}
            aria-label="View all activity"
            type="button"
          >
            View all
            <ArrowUpRightIcon />
          </button>
        </div>

        <ul
          className={styles.activityList}
          role="list"
          aria-busy={isLoading}
          aria-label="Activity items"
        >
          {isLoading
            ? Array.from({ length: skeletonCount }).map((_, i) => <SkeletonItem key={i} />)
            : visible.map((item) => <ActivityItem key={item.id} {...item} />)}
        </ul>
      </section>
    </div>
  );
};
