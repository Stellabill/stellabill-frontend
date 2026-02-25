import { ReactNode } from 'react'

interface CTACardProps {
  icon: ReactNode
  title: string
  description: string
  buttonLabel: string
  href?: string
  onClick?: () => void
}

export default function CTACard({ icon, title, description, buttonLabel, href, onClick }: CTACardProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      onClick()
    }
  }

  const cardContent = (
    <>
      {/* Icon with cyan glow */}
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
          boxShadow: '0 0 30px rgba(34, 211, 238, 0.5), 0 0 60px rgba(34, 211, 238, 0.25)',
          transition: 'box-shadow 0.3s ease'
        }}
        className="cta-icon-circle"
      >
        <div style={{ color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
      </div>

      {/* Title */}
      <h3
        style={{
          color: '#ffffff',
          fontSize: '1.25rem',
          fontWeight: 700,
          marginBottom: '0.75rem',
          lineHeight: 1.3
        }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        style={{
          color: '#94a3b8',
          fontSize: '0.9375rem',
          lineHeight: 1.6,
          marginBottom: '1.5rem',
          flex: 1
        }}
      >
        {description}
      </p>

      {/* Button */}
      <button
        style={{
          background: '#ffffff',
          color: '#000000',
          border: 'none',
          borderRadius: '10px',
          padding: '0.75rem 1.5rem',
          fontSize: '0.9375rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          transition: 'all 0.2s ease',
          width: '100%',
          justifyContent: 'center',
          minHeight: '44px'
        }}
        className="cta-button"
        onClick={handleClick}
      >
        {buttonLabel}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </>
  )

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '16px',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(34, 211, 238, 0.15)',
        boxShadow: '0 0 20px rgba(34, 211, 238, 0.08)',
        transition: 'all 0.3s ease',
        textAlign: 'left'
      }}
      className="cta-card"
    >
      {href ? (
        <a
          href={href}
          style={{
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            flex: 1
          }}
          onClick={handleClick}
        >
          {cardContent}
        </a>
      ) : (
        cardContent
      )}

      <style>{`
        .cta-card:hover {
          border-color: rgba(34, 211, 238, 0.3);
          box-shadow: 0 0 30px rgba(34, 211, 238, 0.15);
          transform: translateY(-2px);
        }
        
        .cta-card:hover .cta-icon-circle {
          box-shadow: 0 0 40px rgba(34, 211, 238, 0.7), 0 0 80px rgba(34, 211, 238, 0.35);
        }
        
        .cta-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        .cta-button:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  )
}
