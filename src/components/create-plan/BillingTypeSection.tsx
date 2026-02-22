// Toggle
function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        width: "48px",
        height: "26px",
        borderRadius: "9999px",
        border: "none",
        cursor: "pointer",
        background: checked ? "#4dd8e1" : "#3a3a3a",
        transition: "background 0.25s",
        flexShrink: 0,
        padding: 0,
        outline: "none",
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = "0 0 0 2px rgba(77,216,225,0.4)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <span
        style={{
          position: "absolute",
          left: checked ? "24px" : "3px",
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.25s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
        }}
      />
    </button>
  );
}

// Props
interface BillingTypeSectionProps {
  usageEnabled: boolean;
  onUsageEnabledChange: (v: boolean) => void;
  trialDays: string;
  onTrialDaysChange: (v: string) => void;
}

// BillingTypeSection
export default function BillingTypeSection({
  usageEnabled,
  onUsageEnabledChange,
  trialDays,
  onTrialDaysChange,
}: BillingTypeSectionProps) {
  return (
    <div
      style={{
        background: "#38bcd410",
        border: "1px solid #2a2a2a",
        borderRadius: "12px",
        padding: "1.75rem",
        maxWidth: "800px",
      }}
    >
      <h2
        style={{
          color: "#fff",
          fontSize: "1.05rem",
          fontWeight: 700,
          margin: "0 0 1.25rem 0",
        }}
      >
        Billing type
      </h2>

      {/* Usage-based billing row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "1rem",
          background: "#192121",
          border: "1px solid #2e2e2e",
          borderRadius: "10px",
          padding: "1rem 1.1rem",
          marginBottom: "1.4rem",
        }}
      >
        <Toggle
          id="usage-based-toggle"
          checked={usageEnabled}
          onChange={onUsageEnabledChange}
        />
        <div>
          <label
            htmlFor="usage-based-toggle"
            style={{
              color: "#e2e8f0",
              fontSize: "0.925rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "block",
              marginBottom: "0.25rem",
            }}
          >
            Usage-based billing
          </label>
          <p
            style={{
              color: "#64748b",
              fontSize: "0.825rem",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Charge customers based on their actual usage in addition to the base
            price.
          </p>
        </div>
      </div>

      {/* Trial period */}
      <div>
        <label
          htmlFor="trial-period"
          style={{
            color: "#fff",
            fontSize: "0.825rem",
            fontWeight: 500,
            display: "block",
            marginBottom: "0.45rem",
          }}
        >
          Trial period{" "}
          <span style={{ color: "#64748b", fontWeight: 400 }}>(optional)</span>
        </label>

        <div style={{ position: "relative", maxWidth: "320px" }}>
          <input
            id="trial-period"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={trialDays}
            onChange={(e) => onTrialDaysChange(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 3.5rem 0.75rem 1rem",
              background: "#192121",
              border: "1px solid #2e2e2e",
              borderRadius: "8px",
              color: "#e2e8f0",
              fontSize: "0.9rem",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#4dd8e1";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#2e2e2e";
            }}
          />
          <span
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#64748b",
              fontSize: "0.825rem",
              pointerEvents: "none",
            }}
          >
            days
          </span>
        </div>

        {/* Info message */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            marginTop: "0.6rem",
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#64748b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span style={{ color: "#64748b", fontSize: "0.82rem" }}>
            Customers won't be charged during the trial period.
          </span>
        </div>
      </div>
    </div>
  );
}
