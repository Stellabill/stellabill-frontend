import { RiMedalLine } from "react-icons/ri";
import { FaRegStar } from "react-icons/fa";

export default function TechBadges() {
  const badgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1rem 1.8rem 1rem 1rem",
    borderRadius: "1rem",
    background: "none",
    border: "1px solid rgba(255,255,255,0.18)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    boxShadow: `
      0 0 20px rgba(255,255,255,0.04), 
      0 0 40px rgba(124,58,237,0.08),
      inset 0 1px 0 rgba(255,255,255,0.15)
    `,
    textDecoration: "none",
    cursor: "pointer",
    transition: "all 0.3s ease",
  };

  return (
    <section
      aria-label="Technologies used"
      style={{
        padding: "3rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1.75rem",
          justifyContent: "center",
          alignItems: "center",
          width: "fit-content",
          padding: "1.5rem",
        }}
      >
        {/* Stellar Badge */}
        <a
          href="https://stellar.org"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Powered by Stellar — visit stellar.org"
          style={{
            ...badgeStyle,
            boxShadow: `
              0 0 20px rgba(255,255,255,0.04),
              0 0 40px rgba(124,58,237,0.12),
              inset 0 1px 0 rgba(255,255,255,0.15)
            `,
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "#7C3AED",
              flexShrink: 0,
              boxShadow: "0 0 20px rgba(124,58,237,0.35)", // subtle icon glow
            }}
          >
            <FaRegStar size={28} color="white" />
          </span>

          <span
            style={{
              display: "flex",
              flexDirection: "column",
              lineHeight: 1.2,
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Powered by
            </span>
            <span
              style={{
                color: "#ffffff",
                fontSize: "1.25rem",
                fontWeight: 700,
              }}
            >
              Stellar
            </span>
          </span>
        </a>

        {/* Soroban Badge */}
        <a
          href="https://soroban.stellar.org"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Built with Soroban — visit soroban.stellar.org"
          style={{
            ...badgeStyle,
            boxShadow: `
              0 0 20px rgba(255,255,255,0.04),
              0 0 40px rgba(13,148,136,0.12),
              inset 0 1px 0 rgba(255,255,255,0.15)
            `,
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "#0d9488",
              flexShrink: 0,
              boxShadow: "0 0 20px rgba(13,148,136,0.35)",
            }}
          >
            <RiMedalLine size={28} color="white" />
          </span>

          <span
            style={{
              display: "flex",
              flexDirection: "column",
              lineHeight: 1.2,
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Built with
            </span>
            <span
              style={{
                color: "#ffffff",
                fontSize: "1.25rem",
                fontWeight: 700,
              }}
            >
              Soroban
            </span>
          </span>
        </a>
      </div>
    </section>
  );
}