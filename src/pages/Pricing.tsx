import { useNavigate } from "react-router-dom";
import LandingNavbar from "../components/LandingNavbar";
import FeatureComparison from "../components/pricing/FeatureComparison";

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh" }}>
      <LandingNavbar />

      <main
        style={{ padding: "4rem 1.5rem", maxWidth: "1280px", margin: "0 auto" }}
      >

        {/* Feature Comparison Component */}
        <section style={{ marginBottom: "6rem" }}>
          <FeatureComparison />
        </section>

       
      </main>
    </div>
  );
}
