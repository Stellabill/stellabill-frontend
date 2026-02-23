import { ArrowRightIcon } from "lucide-react"

interface Feature {
  text: string
}

interface PricingCardProps {
  title: string
  tagline: string
  price?: string
  priceLabel?: string
  priceSubtext?: string
  features: Feature[]
  buttonText: string
  buttonArrow?: boolean
  onButtonClick?: () => void
  isPopular?: boolean
  isPopularLabel?: string
  useGradientButton?: boolean
}

export default function PricingCard({
  title,
  tagline,
  price,
  priceLabel,
  priceSubtext,
  features,
  buttonText,
  buttonArrow = true,
  onButtonClick,
  isPopular = false,
  isPopularLabel = 'Most popular',
  useGradientButton = false,
}: PricingCardProps) {
  return (
    <div
      style={{
        position: 'relative',
        flex: '1',
        minWidth: '300px',
        maxWidth: '380px',
      }}
    >
      {/* Most popular tag */}
      {isPopular && (
        <div
          style={{
            position: 'absolute',
            top: '-16px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #22d3ee 0%, #14b8a6 100%)',
            color: '#ffffff',
            padding: '0.375rem 0.875rem',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            zIndex: 10,
            boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)',
          }}
        >
          {isPopularLabel}
        </div>
      )}

      {/* Card container */}
      <div
        style={{
          background: '#00000099',
          borderRadius: '16px',
          border: '1px solid #FFFFFF1A',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          boxShadow: isPopular
            ? '0 0 30px rgba(34, 211, 238, 0.2), 0 20px 40px rgba(34, 211, 238, 0.1)'
            : '0 0 20px rgba(34, 211, 238, 0.05)',
          ...(isPopular && {
            borderColor: '#FFFFFF33',
            boxShadow: '0 0 40px rgba(34, 211, 238, 0.3), 0 20px 50px rgba(34, 211, 238, 0.15)',
          }),
        }}
      >
        {/* Glowing background effect for Pro card */}
        {isPopular && (
          <div
            style={{
              position: 'absolute',
              top: '-50%',
              right: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(34, 211, 238, 0.1) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Content wrapper */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Title */}
          <h3
            style={{
              margin: '0 0 0.5rem 0',
              color: '#ffffff',
              fontSize: '1.5rem',
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </h3>

          {/* Tagline */}
          <p
            style={{
              margin: '0 0 1.5rem 0',
              color: '#9ca3af',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              minHeight: '2.4rem',
            }}
          >
            {tagline}
          </p>

          {/* Price Section */}
          {price !== undefined && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '3rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    lineHeight: 1,
                  }}
                >
                  {price}
                </span>
              </div>
              {priceSubtext && (
                <p
                  style={{
                    margin: 0,
                    color: '#9ca3af',
                    fontSize: '0.875rem',
                  }}
                >
                  {priceSubtext}
                </p>
              )}
            </div>
          )}

          {/* Price Label (for Enterprise custom pricing) */}
          {priceLabel && !price && (
            <div style={{ marginBottom: '2rem' }}>
              <p
                style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '2.25rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  lineHeight: 1,
                }}
              >
                {priceLabel}
              </p>
              {priceSubtext && (
                <p
                  style={{
                    margin: 0,
                    color: '#9ca3af',
                    fontSize: '0.875rem',
                  }}
                >
                  {priceSubtext}
                </p>
              )}
            </div>
          )}

          {/* Features List */}
          <ul
            style={{
              listStyle: 'none',
              margin: '0 0 2rem 0',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            {features.map((feature, index) => (
              <li
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  color: '#d1d5db',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                }}
              >
                {/* Checkmark */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  style={{
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <circle cx="10" cy="10" r="9.5" fill="#22d3ee" opacity="0.15" />
                  <path
                    d="M7 10L9 12L13 8"
                    stroke="#22d3ee"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{feature.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Button */}
        <button
          onClick={onButtonClick}
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            padding: '0.875rem 1.5rem',
            borderRadius: '8px',
            fontSize: '0.9375rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: useGradientButton ? 'none' : '1px solid #4b5563',
            background: useGradientButton
              ? 'linear-gradient(135deg, #22d3ee 0%, #14b8a6 100%)'
              : '#ffffff',
            color: '#000000',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            ...(useGradientButton && {
              boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)',
              '&:hover': {
                boxShadow: '0 0 30px rgba(34, 211, 238, 0.5)',
              },
            }),
            ...(!useGradientButton && {
              '&:hover': {
                borderColor: '#22d3ee',
                boxShadow: '0 0 10px rgba(34, 211, 238, 0.2)',
              },
            }),
          }}
        >
          {buttonText}
          {buttonArrow && (
            <ArrowRightIcon size={16} color="#000000" style={{ marginLeft: '0.25rem' }} />
          )}
        </button>
      </div>
    </div>
  )
}
import { MouseEvent as ReactMouseEvent } from 'react'

interface PricingCardProps {
  title: string
  subtitle: string
  price: string
  priceSuffix: string
  features: string[]
  buttonLabel: string
  href?: string
  onClick?: () => void
  isPopular?: boolean
}

const CheckIcon = () => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="#22d3ee" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
)

const ArrowIcon = () => (
  <svg 
    width="18" 
    height="18" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

export default function PricingCard({
  title,
  subtitle,
  price,
  priceSuffix,
  features,
  buttonLabel,
  href,
  onClick,
  isPopular = false,
}: PricingCardProps) {
  const cardStyle = {
    background: isPopular ? 'rgba(20, 20, 20, 0.8)' : 'rgba(20, 20, 20, 0.6)',
    borderRadius: '24px',
    padding: '2.5rem 2rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2rem',
    border: isPopular 
      ? '2px solid rgba(34, 211, 238, 0.5)' 
      : '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: isPopular
      ? '0 0 40px rgba(34, 211, 238, 0.3), 0 0 80px rgba(34, 211, 238, 0.15), 0 8px 32px rgba(0, 0, 0, 0.6)'
      : '0 4px 24px rgba(0, 0, 0, 0.4)',
    position: 'relative' as const,
    height: '100%',
    transition: 'all 0.3s ease',
  }

  const buttonStyle = {
    background: isPopular ? 'linear-gradient(135deg, #22d3ee 0%, #14b8a6 100%)' : '#ffffff',
    color: isPopular ? '#000000' : '#000000',
    border: 'none',
    borderRadius: '12px',
    padding: '1rem 2rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    width: '100%',
    boxShadow: isPopular 
      ? '0 0 20px rgba(34, 211, 238, 0.4)' 
      : '0 2px 8px rgba(0, 0, 0, 0.2)',
  }

  const handleClick = (e: ReactMouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    if (onClick) {
      e.preventDefault()
      onClick()
    }
  }

  const buttonContent = (
    <>
      <span>{buttonLabel}</span>
      <ArrowIcon />
    </>
  )

  return (
    <div style={{ position: 'relative' }}>
      {isPopular && (
        <div style={{
          position: 'absolute',
          top: '-16px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #22d3ee 0%, #14b8a6 100%)',
          color: '#000000',
          padding: '0.5rem 1.5rem',
          borderRadius: '20px',
          fontSize: '0.875rem',
          fontWeight: 700,
          boxShadow: '0 0 20px rgba(34, 211, 238, 0.5)',
          zIndex: 1,
          whiteSpace: 'nowrap',
        }}>
          Most popular
        </div>
      )}
      
      <div style={cardStyle}>
        <div>
          <h3 style={{
            color: '#ffffff',
            fontSize: '1.75rem',
            fontWeight: 700,
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.02em',
          }}>
            {title}
          </h3>
          <p style={{
            color: '#94a3b8',
            fontSize: '0.9375rem',
            margin: 0,
            lineHeight: 1.5,
          }}>
            {subtitle}
          </p>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{
              color: '#ffffff',
              fontSize: price === 'Custom' ? '2.5rem' : '3.5rem',
              fontWeight: 700,
              letterSpacing: '-0.03em',
            }}>
              {price}
            </span>
            <span style={{
              color: '#64748b',
              fontSize: '1.125rem',
              fontWeight: 400,
            }}>
              {priceSuffix}
            </span>
          </div>
          {price === 'Custom' && (
            <p style={{
              color: '#64748b',
              fontSize: '0.9375rem',
              margin: '0.5rem 0 0 0',
            }}>
              contact sales
            </p>
          )}
        </div>

        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          flex: 1,
        }}>
          {features.map((feature, index) => (
            <li key={index} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              color: '#e2e8f0',
              fontSize: '0.9375rem',
              lineHeight: 1.6,
            }}>
              <CheckIcon />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {href ? (
          <a 
            href={href} 
            style={buttonStyle}
            onClick={handleClick}
          >
            {buttonContent}
          </a>
        ) : (
          <button 
            style={buttonStyle}
            onClick={handleClick}
          >
            {buttonContent}
          </button>
        )}
      </div>
    </div>
  )
}
