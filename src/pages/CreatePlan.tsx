import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BillingTypeSection from "../components/create-plan/BillingTypeSection";

export default function CreatePlan() {
  const navigate = useNavigate();
  const [usageEnabled, setUsageEnabled] = useState(false);
  const [trialDays, setTrialDays] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      usage_enabled: usageEnabled,
      trial_period_days: trialDays === "" ? 0 : Number(trialDays),
    };
    console.log("Create plan payload:", payload);
    // Whatever handler function
  }

  return (
    <div style={{ padding: "2rem", background: "#0a0a0a", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", }}>
      <form onSubmit={handleSubmit} noValidate>
        <BillingTypeSection
          usageEnabled={usageEnabled}
          onUsageEnabledChange={setUsageEnabled}
          trialDays={trialDays}
          onTrialDaysChange={setTrialDays}
        />

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: "0.875rem",
            marginTop: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          {/* Create plan button*/}
          <button
            type="submit"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.6rem",
              background: "linear-gradient(135deg, #38bcd4 0%, #4dd8e1 100%)",
              border: "none",
              borderRadius: "8px",
              color: "#000",
              fontSize: "0.925rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.88";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Create plan
          </button>

          {/* Cancel button*/}
          <button
            type="button"
            onClick={() => navigate("/plans")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.75rem 1.6rem",
              background: "none",
              border: "1px solid #3a3a3a",
              borderRadius: "8px",
              color: "#e2e8f0",
              fontSize: "0.925rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#555";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#3a3a3a";
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
