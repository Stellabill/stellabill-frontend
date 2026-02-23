import React, { useState } from "react";

export default function OnboardingReview() {
  // ✅ Dummy Data Inside Component
  const businessName = "Stella Coffee Co.";
  const website = "https://stellacoffee.com";
  const payoutAddress = "GDU4D7BPCGQKXJHGFHSKXMN30L50DR";

  const onBack = () => {
    alert("Going back to payout step");
  };

  const onComplete = async () => {
    // Simulate API delay
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        alert("Onboarding completed!");
        resolve();
      }, 1200);
    });
  };

  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const truncateAddress = (address: string) => {
    if (address.length <= 18) return address;
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  const handleComplete = async () => {
    if (!agreed) return;

    setLoading(true);
    try {
      await onComplete();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Step Labels */}
      <div style={styles.steps}>
        <span style={styles.stepInactive}>Business</span>
        <span style={styles.stepInactive}>Payout</span>
        <span style={styles.stepActive}>Review</span>
      </div>

      {/* Card */}
      <div style={styles.card}>
        <h2 style={styles.title}>Review and confirm</h2>
        <p style={styles.subtitle}>
          Please verify your information before completing setup
        </p>

        {/* Read Only Fields */}
        <Field label="Business name" value={businessName} />
        <Field label="Website" value={website} />
        <Field
          label="Payout address"
          value={truncateAddress(payoutAddress)}
        />

        {/* Checkbox */}
        <div style={styles.checkboxRow}>
          <input
            id="terms"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <label htmlFor="terms" style={styles.checkboxLabel}>
            I agree to the{" "}
            <a href="/terms" target="_blank" style={styles.link}>
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/merchant-agreement" target="_blank" style={styles.link}>
              Merchant Agreement
            </a>
          </label>
        </div>

        {/* Buttons */}
        <div style={styles.buttonRow}>
          <button style={styles.backButton} onClick={onBack}>
            Back
          </button>

          <button
            style={{
              ...styles.completeButton,
              opacity: agreed && !loading ? 1 : 0.5,
              cursor: agreed && !loading ? "pointer" : "not-allowed",
            }}
            disabled={!agreed || loading}
            onClick={handleComplete}
          >
            ✓ {loading ? "Completing..." : "Complete setup"}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        Need help? Contact us at{" "}
        <a href="mailto:support@stellabill.com" style={styles.link}>
          support@stellabill.com
        </a>
      </div>
    </div>
  );
}

/* Reusable Field Component */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.field}>
      <div style={styles.fieldLabel}>{label}</div>
      <div style={styles.fieldValue}>{value}</div>
    </div>
  );
}

/* Styles */
const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    minHeight: "100vh",
    backgroundColor: "#000000",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 16px",
    color: "#FFFFFF",
  },
  steps: {
    display: "flex",
    gap: "24px",
    marginBottom: "32px",
    fontSize: "14px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  stepInactive: {
    color: "#6B7280",
  },
  stepActive: {
    color: "#22D3EE",
    fontWeight: 600,
  },
  card: {
    width: "100%",
    maxWidth: "560px",
    background:
      "linear-gradient(135deg, rgba(0, 184, 219, 0.05) 0%, rgba(0, 187, 167, 0.05) 100%)",
    borderRadius: "24px",
    padding: "32px",
    boxShadow: "0 0 0 1px #FFFFFF33",
  },
  title: {
    fontSize: "20px",
    fontWeight: 700,
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#9CA3AF",
    marginBottom: "24px",
  },
  field: {
    backgroundColor: "#FFFFFF0D",
    padding: "14px 16px",
    borderRadius: "16px",
    border: "1px solid #FFFFFF1A",
    marginBottom: "16px",
  },
  fieldLabel: {
    fontSize: "12px",
    color: "#9CA3AF",
    marginBottom: "4px",
  },
  fieldValue: {
    fontSize: "14px",
    color: "#FFFFFF",
    wordBreak: "break-all",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    fontSize: "13px",
    marginTop: "8px",
    marginBottom: "24px",
  },
  checkboxLabel: {
    color: "#9CA3AF",
    lineHeight: 1.4,
  },
  link: {
    color: "#00D3F3",
    textDecoration: "none",
  },
  buttonRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  backButton: {
    flex: 1,
    padding: "12px",
    borderRadius: "8px",
    backgroundColor: "#1F2937",
    color: "#FFFFFF",
    border: "1px solid #374151",
    cursor: "pointer",
  },
  completeButton: {
    flex: 1,
    padding: "12px",
    borderRadius: "8px",
    background: "linear-gradient(90deg, #00B8DB 0%, #00BBA7 100%)",
    color: "#000000",
    border: "none",
    fontWeight: 600,
    transition: "0.2s ease",
  },
  footer: {
    marginTop: "32px",
    fontSize: "13px",
    color: "#6B7280",
    textAlign: "center",
  },
};