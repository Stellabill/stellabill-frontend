import React from 'react';
import { Clock3, Gift, Sparkles, type LucideIcon } from 'lucide-react';
import './OfferCard.css';

export type OfferCardSize = 'banner' | 'card' | 'tile';

interface OfferCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel: string;
    onAction: () => void;
    buttonRef?: React.RefObject<HTMLButtonElement>;
    eligibility?: string;
    expiresIn?: string;
    size?: OfferCardSize;
}

export const OfferCard: React.FC<OfferCardProps> = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    buttonRef,
    eligibility = 'Eligible on your next renewal',
    expiresIn = 'Ends soon',
    size = 'card'
}) => {
    const sizeClass = `offer-card--${size}`;

    return (
        <article className={`offer-card ${sizeClass}`}>
            <div className="offer-card-header">
                <div className="offer-card-icon-container" aria-hidden="true">
                    <Icon size={20} strokeWidth={2.5} />
                </div>
                <div className="offer-card-heading">
                    <div className="offer-card-badge">
                        <Sparkles size={12} />
                        Limited time
                    </div>
                    <h3 className="offer-card-title">{title}</h3>
                </div>
            </div>

            <p className="offer-card-description">{description}</p>

            <div className="offer-card-meta" aria-label="Offer details">
                <div className="offer-card-meta-item">
                    <span className="offer-card-meta-label">Eligibility</span>
                    <span className="offer-card-meta-value">{eligibility}</span>
                </div>
                <div className="offer-card-meta-item offer-card-meta-item--countdown">
                    <span className="offer-card-meta-label">Expires</span>
                    <span className="offer-card-meta-value offer-card-countdown" aria-live="polite">
                        <Clock3 size={14} />
                        <span>{expiresIn}</span>
                    </span>
                </div>
            </div>

            <button
                ref={buttonRef}
                type="button"
                className="offer-card-btn"
                onClick={onAction}
                aria-label={`${actionLabel}: ${title}`}
            >
                <Gift size={16} aria-hidden="true" />
                {actionLabel}
            </button>
        </article>
    );
};
