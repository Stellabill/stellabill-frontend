import PricingCard from '@/components/PricingCard'
import LandingNavbar from '../components/LandingNavbar'
import { useEffect, useState } from 'react'
import Hero from '../components/Landing/Hero'
import FlowDiagram from '../components/Landing/FlowDiagram'
import TechBadges from "../components/landing/TechBadges";
import SubscriptionActions from "@/components/SubscriptionActions";

export default function Landing() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleGetStartedFree = () => {
    console.log('Get started clicked - Free plan')
    // Route to signup or trial
  }

  const handleStartFreeTrial = () => {
    console.log('Start free trial clicked - Pro plan')
    // Route to signup with Pro plan
  }

  const handleContactSales = () => {
    console.log('Contact sales clicked - Enterprise plan')
    // Route to contact form or open modal
  }

  return (
    <div style={{ background: "#020b0d", minHeight: "100vh" }}>
      <LandingNavbar />

      <main>
        <Hero />
        <TechBadges />

        {/* Technology Badges */}
        <TechBadges />

        {/* Sections for anchor links */}
        <div
          style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem" }}
        >
          <section
            id="product"
            style={{ padding: "6rem 0", minHeight: "400px" }}
          >
            <h2
              style={{
                color: "#ffffff",
                fontSize: "2rem",
                marginBottom: "1rem",
              }}
            >
              Product
            </h2>
            <p style={{ color: "#94a3b8" }}>Product information goes here...</p>
          </section>

        <section id="pricing" style={{ padding: '6rem 0', minHeight: '400px' }}>
          {/* <h2 style={{ color: '#ffffff', fontSize: '2rem', marginBottom: '1rem' }}>Pricing</h2>
          <p style={{ color: '#94a3b8' }}>Pricing information goes here...</p> */}
          <div style={{
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '2rem' : '2.5rem',
            alignItems: isMobile ? 'stretch' : 'flex-start',
            justifyContent: 'center', flexWrap: 'wrap',
            paddingTop: isMobile ? 0 : '1rem',
          }}>
            {/* Free Plan */}
            <PricingCard
              title="Free"
              tagline="Perfect for testing and small projects"
              price="$0"
              priceSubtext="/ forever"
              features={[
                { text: 'Up to 100 subscriptions' },
                { text: 'Basic API access' },
                { text: 'Community support' },
                { text: 'Standard webhooks' },
                { text: 'Test mode included' },
                { text: '99.9% uptime SLA' },
              ]}
              buttonText="Get started"
              onButtonClick={handleGetStartedFree}
              useGradientButton={false}
            />

            {/* Pro Plan - Most Popular */}
            <PricingCard
              title="Pro"
              tagline="For growing businesses and startups"
              price="$49"
              priceSubtext="/ per month"
              features={[
                { text: 'Unlimited subscriptions' },
                { text: 'Full API access' },
                { text: 'Priority support' },
                { text: 'Advanced webhooks' },
                { text: 'Usage-based billing' },
                { text: 'Custom billing intervals' },
              ]}
              buttonText="Start free trial"
              onButtonClick={handleStartFreeTrial}
              isPopular={true}
              isPopularLabel="Most popular"
              useGradientButton={true}
            />

            {/* Enterprise Plan */}
            <PricingCard
              title="Enterprise"
              tagline="Custom solutions for large organizations"
              priceLabel="Custom"
              priceSubtext="contact sales"
              features={[
                { text: 'Everything in Pro' },
                { text: 'Dedicated support team' },
                { text: 'Custom SLAs' },
                { text: 'Volume pricing' },
                { text: 'White-label options' },
                { text: 'Onboarding assistance' },
              ]}
              buttonText="Contact sales"
              onButtonClick={handleContactSales}
              useGradientButton={false}
            />
          </div>
        </section>

          <section id="docs" style={{ padding: "6rem 0", minHeight: "400px" }}>
            <h2
              style={{
                color: "#ffffff",
                fontSize: "2rem",
                marginBottom: "1rem",
              }}
            >
              Documentation
            </h2>
            <p style={{ color: "#94a3b8" }}>Documentation goes here...</p>
          </section>

          <section
            id="contact"
            style={{ padding: "6rem 0", minHeight: "400px" }}
          >
            <h2
              style={{
                color: "#ffffff",
                fontSize: "2rem",
                marginBottom: "1rem",
              }}
            >
              Contact
            </h2>
            <p style={{ color: "#94a3b8" }}>Contact information goes here...</p>
          </section>
        </div>
      </main>
    </div>
  );
}
