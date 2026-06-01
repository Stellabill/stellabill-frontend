import { ReactNode } from 'react'

export type CTACardVariant = 'primary' | 'secondary'

interface CTACardProps {
  icon?: ReactNode // Optional top card icon
  buttonLeadingIcon?: ReactNode // Optional leading icon inside the CTA button/link
  buttonTrailingIcon?: ReactNode // Optional trailing icon inside the CTA button/link (defaults to arrow)
  title: string
  description: string
  buttonLabel: string
  href?: string
  onClick?: () => void
  variant?: CTACardVariant
}

export default function CTACard({
  icon,
  buttonLeadingIcon,
  buttonTrailingIcon,
  title,
  description,
  buttonLabel,
  href,
  onClick,
  variant = 'secondary',
}: CTACardProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (!onClick) return
    if (!href) e.preventDefault()
    onClick()
  }

  const iconCircle = icon ? (
    <div className="cta-icon-container" aria-hidden="true">
      <div className="cta-icon-circle">
        {icon}
      </div>
    </div>
  ) : null

  const titleEl = (
    <h3 className="cta-title">
      {title}
    </h3>
  )

  const descEl = (
    <p className="cta-description">
      {description}
    </p>
  )

  const defaultArrow = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="cta-arrow"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )

  const trailingIcon = buttonTrailingIcon !== undefined ? buttonTrailingIcon : defaultArrow

  const buttonContent = (
    <>
      {buttonLeadingIcon && (
        <span className="cta-button-leading" aria-hidden="true">
          {buttonLeadingIcon}
        </span>
      )}
      <span className="cta-button-text">{buttonLabel}</span>
      {trailingIcon && (
        <span className="cta-button-trailing" aria-hidden="true">
          {trailingIcon}
        </span>
      )}
    </>
  )

  return (
    <article 
      className="cta-card" 
      data-variant={variant}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        position: 'relative',
        borderRadius: 'var(--radius-xl, 16px)',
        padding: 'var(--space-6, 1.5rem)',
        textAlign: 'left',
        height: '100%',
        boxSizing: 'border-box',
        willChange: 'transform, box-shadow, border-color',
      }}
    >
      {variant === 'primary' && (
        <span className="cta-badge-recommended">
          <span className="cta-badge-dot" />
          Recommended
        </span>
      )}
      
      {iconCircle}
      {titleEl}
      {descEl}

      {href ? (
        <a
          href={href}
          onClick={handleClick}
          className="cta-button"
          aria-label={`${buttonLabel}: ${title}`}
        >
          {buttonContent}
        </a>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="cta-button"
          aria-label={`${buttonLabel}: ${title}`}
        >
          {buttonContent}
        </button>
      )}
    </article>
  )
}

