import PricingCard from './PricingCard'

const pricingData = [
  {
    title: 'Free',
    subtitle: 'Perfect for testing and small projects',
    price: '$0',
    priceSuffix: '/ forever',
    features: [
      'Up to 100 subscriptions',
      'Basic API access',
      'Community support',
      'Standard webhooks',
      'Test mode included',
      '99.9% uptime SLA',
    ],
    buttonLabel: 'Get started',
    href: '/dashboard',
    isPopular: false,
  },
  {
    title: 'Pro',
    subtitle: 'For growing businesses and startups',
    price: '$49',
    priceSuffix: '/ per month',
    features: [
      'Unlimited subscriptions',
      'Full API access',
      'Priority support',
      'Advanced webhooks',
      'Usage-based billing',
      'Custom billing intervals',
    ],
    buttonLabel: 'Start free trial',
    href: '/dashboard',
    isPopular: true,
  },
  {
    title: 'Enterprise',
    subtitle: 'Custom solutions for large organizations',
    price: 'Custom',
    priceSuffix: '',
    features: [
      'Everything in Pro',
      'Dedicated support team',
      'Custom SLAs',
      'Volume pricing',
      'White-label options',
      'Onboarding assistance',
    ],
    buttonLabel: 'Contact sales',
    href: '#contact',
    isPopular: false,
  },
]

export default function PricingCards() {
  return (
    <section 
      id="pricing-cards"
      style={{ 
        padding: '8rem 0',
        maxWidth: '1280px',
        margin: '0 auto',
      }}
    >
      <div style={{
        textAlign: 'center',
        marginBottom: '4rem',
      }}>
        <h2 style={{
          color: '#ffffff',
          fontSize: '2.5rem',
          fontWeight: 700,
          marginBottom: '1rem',
          letterSpacing: '-0.02em',
        }}>
          Simple, transparent pricing
        </h2>
        <p style={{
          color: '#94a3b8',
          fontSize: '1.125rem',
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          Choose the plan that fits your needs. All plans include our core features.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        alignItems: 'stretch',
      }}>
        {pricingData.map((plan) => (
          <PricingCard
            key={plan.title}
            title={plan.title}
            subtitle={plan.subtitle}
            price={plan.price}
            priceSuffix={plan.priceSuffix}
            features={plan.features}
            buttonLabel={plan.buttonLabel}
            href={plan.href}
            isPopular={plan.isPopular}
          />
        ))}
      </div>

      <style>{`
        @media (min-width: 1024px) {
          #pricing-cards > div:last-child {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 2rem !important;
          }
        }
        
        @media (min-width: 768px) and (max-width: 1023px) {
          #pricing-cards > div:last-child {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 2rem !important;
          }
          #pricing-cards > div:last-child > div:last-child {
            grid-column: 1 / -1;
            max-width: 500px;
            margin: 0 auto;
            width: 100%;
          }
        }
        
        @media (max-width: 767px) {
          #pricing-cards {
            padding: 5rem 0 !important;
          }
          #pricing-cards > div:last-child {
            grid-template-columns: 1fr !important;
            gap: 3rem !important;
          }
        }
      `}</style>
    </section>
  )
}
