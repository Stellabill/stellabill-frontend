export const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <line x1="10" y1="4" x2="10" y2="16" stroke="#05DF72" strokeWidth="1.67" strokeLinecap="round"/>
    <line x1="4" y1="10" x2="16" y2="10" stroke="#05DF72" strokeWidth="1.67" strokeLinecap="round"/>
  </svg>
);

export const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M4 10.5L8.5 15L16 6" stroke="#00D3F2" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="7.5" stroke="#FDC700" strokeWidth="1.67"/>
    <path d="M10 6.5V10.5L12.5 12" stroke="#FDC700" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="7.5" stroke="#05DF72" strokeWidth="1.67"/>
    <path d="M8 7.5L13.5 10L8 12.5V7.5Z" fill="#05DF72"/>
  </svg>
);

export const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="7.5" stroke="#FF6467" strokeWidth="1.67"/>
    <path d="M7.5 7.5L12.5 12.5M12.5 7.5L7.5 12.5" stroke="#FF6467" strokeWidth="1.67" strokeLinecap="round"/>
  </svg>
);

export const ArrowUpRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4.5 11.5L11.5 4.5M11.5 4.5H6M11.5 4.5V10" stroke="#00D3F2" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const TYPE_CONFIG = {
  new_subscription: {
    icon: <PlusIcon />,
    label: "New subscription",
    iconBg: "rgba(5,223,114,0.12)",
    iconBorder: "rgba(5,223,114,0.25)",
    ariaLabel: "New subscription icon",
  },
  charge_succeeded: {
    icon: <CheckIcon />,
    label: "Charge succeeded",
    iconBg: "rgba(0,211,242,0.12)",
    iconBorder: "rgba(0,211,242,0.25)",
    ariaLabel: "Charge succeeded icon",
  },
  subscription_paused: {
    icon: <ClockIcon />,
    label: "Subscription paused",
    iconBg: "rgba(253,199,0,0.12)",
    iconBorder: "rgba(253,199,0,0.25)",
    ariaLabel: "Subscription paused icon",
  },
  subscription_resumed: {
    icon: <PlayIcon />,
    label: "Subscription resumed",
    iconBg: "rgba(5,223,114,0.12)",
    iconBorder: "rgba(5,223,114,0.25)",
    ariaLabel: "Subscription resumed icon",
  },
  subscription_cancelled: {
    icon: <XIcon />,
    label: "Subscription cancelled",
    iconBg: "rgba(255,100,103,0.12)",
    iconBorder: "rgba(255,100,103,0.25)",
    ariaLabel: "Subscription cancelled icon",
  },
};

const SkeletonItem = () => (
  <li
    style={{
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "0.875rem",
      padding: "1rem 1rem 0",
      display: "flex",
      gap: "1rem",
      alignItems: "flex-start",
      minHeight: "6.8125rem",
    }}
    aria-hidden="true"
  >
    <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem", paddingTop: "0.125rem" }}>
      <div style={{ height: "1rem", width: "45%", borderRadius: "0.25rem", background: "rgba(255,255,255,0.08)" }} />
      <div style={{ height: "0.875rem", width: "60%", borderRadius: "0.25rem", background: "rgba(255,255,255,0.05)" }} />
      <div style={{ height: "0.75rem", width: "25%", borderRadius: "0.25rem", background: "rgba(255,255,255,0.04)" }} />
    </div>
    <div style={{ height: "1rem", width: "4rem", borderRadius: "0.25rem", background: "rgba(255,255,255,0.08)", flexShrink: 0, marginTop: "0.125rem" }} />
  </li>
);
//  { id: "1", type: "new_subscription",      details: "Plan Pro — Customer GABC...XYZ9",      timestamp: "2 minutes ago",  amount: "10 USDC" },

const ActivityItem = ({ type, details, timestamp, amount, isNew }: {type: TYPE_CONFIG, details :string, timestamp:string, isNew: boolean, amount: string}) => {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.charge_succeeded;
  const showPlus = type === "new_subscription";
  const amountColor = showPlus ? "#05DF72" : "#FFFFFF";

  return (
    <li
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "0.875rem",
        padding: "1rem 1.2rem 0",
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: "1rem",
        transition: "background 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
    >
      <div
        role="img"
        aria-label={cfg.ariaLabel}
        style={{
          width: "2.5rem",
          height: "2.5rem",
          borderRadius: "50%",
          background: cfg.iconBg,
          border: `1px solid ${cfg.iconBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {cfg.icon}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: 0 }}>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                fontSize: "1.125rem",
                lineHeight: "1.6875rem",
                letterSpacing: "-0.027rem",
                color: "#FFFFFF",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {cfg.label}
            </span>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
                fontSize: "0.875rem",
                lineHeight: "1.25rem",
                letterSpacing: "-0.009rem",
                color: "#90A1B9",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {details}
            </span>
          </div>

          {amount != null && (
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                fontSize: "1rem",
                lineHeight: "1.5rem",
                letterSpacing: "-0.019rem",
                color: amountColor,
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              {showPlus ? `+${amount}` : amount}
            </span>
          )}
        </div>

        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            fontSize: "0.75rem",
            lineHeight: "1rem",
            color: "#62748E",
          }}
        >
          {timestamp}
        </span>
      </div>
    </li>
  );
};

export const RecentActivity = ({
  items = null,
  onViewAll,
  maxVisible = 8,
  title = "Recent activity",
}) => {
  const isLoading = items === null;
  const visible = isLoading ? [] : items.slice(0, maxVisible);
  const skeletonCount = 5;

  return (
    <div style={{ maxWidth: "1200px",  background: "#080b12", padding:"2rem" , borderRadius:"1rem", border: "1px solid #0f1626"}}>
        <section
        aria-label={title}
        style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            width: "100%",
        }}
        >
        <div
            style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            }}
        >
            <h2
            style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 700,
                fontSize: "1.25rem",
                lineHeight: "1.75rem",
                letterSpacing: "-0.028rem",
                color: "#FFFFFF",
                margin: 0,
            }}
            >
            {title}
            </h2>

            <button
            onClick={onViewAll}
            style={{
                display: "flex",
                alignItems: "center",
                gap: "0.2rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
                fontSize: "0.875rem",
                lineHeight: "1.25rem",
                letterSpacing: "-0.009rem",
                color: "#00D3F3",
                textDecoration: "none",
            }}
            aria-label="View all activity"
            >
            View all
            <ArrowUpRightIcon />
            </button>
        </div>

        <ul
            role="list"
            aria-busy={isLoading}
            aria-label="Activity items"
            style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            margin: 0,
            padding: 0,
            listStyle: "none",
            width: "100%",
            }}
        >
            {isLoading
            ? Array.from({ length: skeletonCount }).map((_, i) => (
                <SkeletonItem key={i} />
                ))
            : visible.map((item) => (
                <ActivityItem key={item.id} {...item} />
                ))}
        </ul>
        </section>
    </div>
  );
};