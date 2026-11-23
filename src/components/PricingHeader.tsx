import { useState, KeyboardEvent } from "react";

type Props = {
  onToggleChange?: (value: "merchants" | "subscribers") => void;
};

export default function PricingHeader({ onToggleChange }: Props) {
  const [selected, setSelected] = useState<"merchants" | "subscribers">(
    "merchants"
  );

  const handleChange = (value: "merchants" | "subscribers") => {
    setSelected(value);
    onToggleChange?.(value);
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLDivElement>,
    value: "merchants" | "subscribers"
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleChange(value);
    }
  };

  return (
    <section style={styles.section}>
      <div style={styles.glow} />

      <div style={styles.container}>
        {/* Heading */}
        <h1 style={styles.heading}>
          <span style={{ color: "var(--color-text-primary)" }}>
            Simple, transparent
          </span>
          <br />
          <span style={styles.gradientText}>pricing</span>
        </h1>

        {/* Subtext */}
        <p style={styles.subtext}>
          USDC-based plans with no hidden fees. Pay only for what you use.
        </p>

        {/* Toggle */}
        <div style={styles.toggleWrapper}>
          <div style={styles.toggleContainer}>
            {/* Merchants */}
            <div
              role="button"
              tabIndex={0}
              aria-pressed={selected === "merchants"}
              onClick={() => handleChange("merchants")}
              onKeyDown={(e) => handleKeyDown(e, "merchants")}
              style={{
                ...styles.segment,
                ...(selected === "merchants"
                  ? styles.activeSegment
                  : styles.inactiveSegment),
              }}
            >
              For merchants
            </div>

            {/* Subscribers */}
            <div
              role="button"
              tabIndex={0}
              aria-pressed={selected === "subscribers"}
              onClick={() => handleChange("subscribers")}
              onKeyDown={(e) => handleKeyDown(e, "subscribers")}
              style={{
                ...styles.segment,
                ...(selected === "subscribers"
                  ? styles.activeSegment
                  : styles.inactiveSegment),
              }}
            >
              For subscribers
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  section: {
    position: "relative",
    backgroundColor: "var(--color-surface-canvas)",
    padding: "120px 20px 80px",
    textAlign: "center",
    overflow: "hidden",
  },

  glow: {
    position: "absolute",
    top: "-200px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "900px",
    height: "600px",
    background:
      "radial-gradient(circle at center, var(--color-brand-glow), transparent 70%)",
    pointerEvents: "none",
  },

  container: {
    maxWidth: "900px",
    margin: "0 auto",
    position: "relative",
    zIndex: 2,
  },

  heading: {
    fontSize: "clamp(40px, 6vw, 72px)",
    fontWeight: 700,
    lineHeight: 1.1,
    marginBottom: "24px",
  },

  gradientText: {
    background: "var(--color-brand-gradient)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  subtext: {
    fontSize: "clamp(16px, 2vw, 20px)",
    color: "var(--color-text-muted)",
    maxWidth: "600px",
    margin: "0 auto 48px",
  },

  toggleWrapper: {
    display: "flex",
    justifyContent: "center",
  },

  toggleContainer: {
    display: "flex",
    background: "var(--color-surface-control)",
    borderRadius: "var(--radius-full)",
    padding: "6px",
    border: "1px solid var(--color-border-subtle)",
    gap: "6px",
    flexWrap: "wrap",
  },

  segment: {
    padding: "12px 24px",
    borderRadius: "var(--radius-full)",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    outline: "none",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  },

  activeSegment: {
    background: "var(--color-brand-gradient)",
    color: "var(--color-brand-on)",
    boxShadow: "var(--shadow-brand)",
  },

  inactiveSegment: {
    background: "transparent",
    color: "var(--color-text-primary)",
  },
};