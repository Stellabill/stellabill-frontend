import React from 'react';
import { LucideIcon } from 'lucide-react';
import './OfferCard.css';

interface OfferCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel: string;
    onAction: () => void;
    buttonRef?: React.RefObject<HTMLButtonElement>;
}

export const OfferCard: React.FC<OfferCardProps> = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    buttonRef
}) => {
    return (
        <article className="offer-card">
            <div className="offer-card-header">
                <div className="offer-card-icon-container">
                    <Icon size={20} strokeWidth={2.5} />
                </div>
                <h3 className="offer-card-title">{title}</h3>
            </div>
            <p className="offer-card-description">{description}</p>
            <button 
                ref={buttonRef}
                type="button" 
                className="offer-card-btn" 
                onClick={onAction}
                aria-label={`${actionLabel}: ${title}`}
            >
                {actionLabel}
            </button>
        </article>
    );
};
