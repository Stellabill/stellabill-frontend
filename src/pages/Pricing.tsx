import { useCallback, useState } from "react";
import LandingNavbar from "../components/LandingNavbar";
import FeatureComparison from "../components/pricing/FeatureComparison";
import PricingSeatToggle, {
  type PricingMode,
} from "../components/pricing/PricingSeatToggle";
import PricingCard from "../components/PricingCard";

// ── Plan definitions ──────────────────────────────────────────────────────────
// basePricePerSeat: number  → flat price reused as the per-seat rate
// basePricePerSeat: null    → custom / contact sales
const PLANS = [
  {
    title: "Free",
    tagline: "For individuals and side projects getting started.",
    price: "$0",
    basePricePerSeat: 0,
    features: [
      { text: "Up to 50 active subscriptions" },
      { text: "Basic recurring billing" },
      { text: "Webhooks" },
      { text: "Community support" },
    ],
    buttonText: "Get started free",
    useGradientButton: false,
    isPopular: false,
  },
  {
    title: "Pro",
    tagline: "For growing teams that need advanced billing and analytics.",
    price: "$49",
    basePricePerSeat: 49,
    features: [
      { text: "Unlimited subscriptions" },
      { text: "Usage-based billing" },
      { text: "Priority support" },
      { text: "Advanced analytics" },
      { text: "Custom webhooks" },
    ],
    buttonText: "Start free trial",
    useGradientButton: true,
    isPopular: true,
  },
  {
    title: "Enterprise",
    tagline: "For large organizations with custom compliance needs.",
    price: undefined,
    basePricePerSeat: null,   // custom
    priceLabel: "Custom",
    priceSubtext: "Volume discounts & dedicated SLAs",
    features: [
      { text: "Everything in Pro" },
      { text: "Custom SLAs" },
      { text: "Volume pricing" },
      { text: "White-label options" },
      { text: "Dedicated support team" },
    ],
    buttonText: "Contact sales",
    useGradientButton: false,
    isPopular: false,
  },
] as const;

export default function Pricing() {
  const [pricingMode, setPricingMode] = useState<PricingMode>("flat");
  const [seats, setSeats] = useState<number>(5);

  const handleToggleChange = useCallback(
    (mode: PricingMode, seatCount: number) => {
      setPricingMode(mode);
      setSeats(seatCount);
    },
    []
  );

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh" }}>
      <LandingNavbar />

      <main
        style={{ padding: "4rem 1.5rem", maxWidth: "1280px", margin: "0 auto" }}
      >
        {/* ── Pricing cards section ───────────────────────────────────── */}
        <section
          style={{ marginBottom: "6rem" }}
          aria-labelledby="pricing-heading"
        >
          {/* Section heading */}
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <h2
              id="pricing-heading"
              style={{
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                fontWeight: 700,
                color: "#fff",
                marginBottom: "0.75rem",
              }}
            >
              Plans &amp; pricing
            </h2>
            <p
              style={{
                color: "#94a3b8",
                fontSize: "1rem",
                maxWidth: "500px",
                margin: "0 auto 2rem",
                lineHeight: 1.6,
              }}
            >
              USDC-based plans with no hidden fees.
            </p>

            {/* Toggle */}
            <PricingSeatToggle onChange={handleToggleChange} />
          </div>

          {/* Cards grid */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1.5rem",
              justifyContent: "center",
              alignItems: "stretch",
            }}
          >
            {PLANS.map((plan) => (
              <PricingCard
                key={plan.title}
                {...plan}
                pricingMode={pricingMode}
                seats={seats}
              />
            ))}
          </div>
        </section>

        {/* Feature Comparison Component */}
        <section style={{ marginBottom: "6rem" }}>
          <FeatureComparison />
        </section>

        {/* Print CTA under matrix */}
        <div className="hidden print:block text-center pt-8 text-black text-lg font-medium">
          Ready to get started? Visit <strong>stellabill.com/pricing</strong>
        </div>
      </main>
    </div>
  );
}
