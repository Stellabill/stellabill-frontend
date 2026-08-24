import { FieldHelpPopover, FieldLabelWithHelp } from "../common/FieldHelpPopover";

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
          <span
            className="field-label-with-help"
            style={{
              color: "#e2e8f0",
              fontSize: "0.925rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              marginBottom: "0.25rem",
            }}
          >
            <label htmlFor="usage-based-toggle">
              Usage-based billing
            </label>
            <FieldHelpPopover title="Usage-based billing">
              <p>
                Turn this on when the plan has metered charges in addition to a recurring base price.
              </p>
            </FieldHelpPopover>
          </span>
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
        <FieldLabelWithHelp
          htmlFor="trial-period"
          optional
          helpTitle="Trial period"
          help={
            <p>
              Customers will not be charged until the trial ends. Use 0 or leave blank for no trial.
            </p>
          }
          style={{
            color: "#fff",
            fontSize: "0.825rem",
            fontWeight: 500,
            marginBottom: "0.45rem",
          }}
        >
          Trial period
        </FieldLabelWithHelp>

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
      </div>
    </div>
  );
}
