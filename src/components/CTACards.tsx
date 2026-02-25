import CTACard from './CTACard.tsx'

const DollarIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

const BuildingIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18" />
    <path d="M9 8h1" />
    <path d="M9 12h1" />
    <path d="M9 16h1" />
    <path d="M14 8h1" />
    <path d="M14 12h1" />
    <path d="M14 16h1" />
    <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
  </svg>
)

const DocumentIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
    <path d="M10 9H8" />
  </svg>
)

const EnvelopeIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)

const ctaCardsData = [
  {
    icon: <DollarIcon />,
    title: 'View Pricing',
    description: 'Transparent, usage-based pricing. Pay only for active subscriptions with no hidden fees.',
    buttonLabel: 'See pricing plans',
    href: '#pricing'
  },
  {
    icon: <BuildingIcon />,
    title: 'Become a Merchant',
    description: 'Start accepting recurring payments. Join Stellabill and offer subscription plans to your customers.',
    buttonLabel: 'Get started',
    href: '/dashboard'
  },
  {
    icon: <DocumentIcon />,
    title: 'Read Documentation',
    description: 'Complete API reference, integration guides, and smart contract documentation for developers.',
    buttonLabel: 'Browse docs',
    href: '#docs'
  },
  {
    icon: <EnvelopeIcon />,
    title: 'Contact Sales',
    description: 'Custom enterprise solutions with dedicated support, SLAs, and volume pricing.',
    buttonLabel: 'Get in touch',
    href: '#contact'
  }
]

export default function CTACards() {
  return (
    <section style={{ padding: '4rem 0' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          maxWidth: '1280px',
          margin: '0 auto'
        }}
        className="cta-cards-grid"
      >
        {ctaCardsData.map((card) => (
          <CTACard
            key={card.title}
            icon={card.icon}
            title={card.title}
            description={card.description}
            buttonLabel={card.buttonLabel}
            href={card.href}
          />
        ))}
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .cta-cards-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
        
        @media (min-width: 768px) and (max-width: 1023px) {
          .cta-cards-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        
        @media (max-width: 767px) {
          .cta-cards-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
