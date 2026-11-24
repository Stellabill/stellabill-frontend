import { Trans, useTranslation } from "react-i18next";
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
    title: "pricing.plans.free.title",
    tagline: "pricing.plans.free.tagline",
    price: "$0",
    basePricePerSeat: 0,
    features: [
      { text: "pricing.features.subscriptionLimit" },
      { text: "pricing.features.basicBilling" },
      { text: "pricing.features.webhooks" },
      { text: "pricing.features.community" },
    ],
    buttonText: "pricing.plans.free.buttonText",
    useGradientButton: false,
    isPopular: false,
  },
  {
    title: "pricing.plans.pro.title",
    tagline: "pricing.plans.pro.tagline",
    price: "$49",
    basePricePerSeat: 49,
    features: [
      { text: "pricing.features.unlimited" },
      { text: "pricing.features.usage" },
      { text: "pricing.features.priority" },
      { text: "pricing.features.analytics" },
      { text: "pricing.features.customWebhooks" },
    ],
    buttonText: "pricing.plans.pro.buttonText",
    useGradientButton: true,
    isPopular: true,
  },
  {
    title: "pricing.plans.enterprise.title",
    tagline: "pricing.plans.enterprise.tagline",
    price: undefined,
    basePricePerSeat: null,   // custom
    priceLabel: "pricing.plans.enterprise.priceLabel",
    priceSubtext: "pricing.plans.enterprise.priceSubtext",
    features: [
      { text: "pricing.features.everythingPro" },
      { text: "pricing.features.slas" },
      { text: "pricing.features.volume" },
      { text: "pricing.features.whiteLabel" },
      { text: "pricing.features.dedicatedSupport" },
    ],
    buttonText: "pricing.plans.enterprise.buttonText",
    useGradientButton: false,
    isPopular: false,
  },
] as const;

export default function Pricing() {
  const { t } = useTranslation();
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
              {t('pricing.title')}
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
              {t('pricing.subtitle')}
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
                title={t(plan.title)}
                tagline={t(plan.tagline)}
                features={plan.features.map((feature) => ({ text: t(feature.text) }))}
                buttonText={t(plan.buttonText)}
                priceLabel={'priceLabel' in plan ? t(plan.priceLabel) : undefined}
                priceSubtext={'priceSubtext' in plan ? t(plan.priceSubtext) : undefined}
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
          <Trans t={t} i18nKey="pricing.printCta" components={[<strong />]} />
        </div>
      </main>
    </div>
  );
}
