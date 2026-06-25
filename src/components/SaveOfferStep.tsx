import React from 'react';
import { PauseCircle, ArrowDownCircle, Tag } from 'lucide-react';
import { OfferCard } from './OfferCard';
import './SaveOfferStep.css';

interface SaveOfferStepProps {
    onSkip: () => void;
    onOfferSelected: (offerId: string) => void;
    initialFocusRef?: React.RefObject<HTMLButtonElement>;
}

export const SaveOfferStep: React.FC<SaveOfferStepProps> = ({
    onSkip,
    onOfferSelected,
    initialFocusRef
}) => {
    const offers = [
        {
            id: 'pause',
            icon: PauseCircle,
            title: 'Pause subscription',
            description: 'Taking a break? Pause your subscription instead of cancelling. You can resume anytime.',
            actionLabel: 'Pause instead'
        },
        {
            id: 'downgrade',
            icon: ArrowDownCircle,
            title: 'Downgrade plan',
            description: 'Switch to a more affordable plan that better fits your current needs.',
            actionLabel: 'See plans'
        },
        {
            id: 'discount',
            icon: Tag,
            title: 'Get 20% off',
            description: 'Stay with us and get a 20% discount on your next 3 months.',
            actionLabel: 'Apply discount'
        }
    ];

    if (offers.length === 0) {
        onSkip();
        return null;
    }

    return (
        <div className="save-offer-step">
            <h2 id="cancel-modal-title" className="cancel-title">Before you go...</h2>
            <p id="cancel-modal-description" className="cancel-description">
                We'd love to keep you. Here are some options that might work better for you than cancelling.
            </p>

            <div className="offers-grid">
                {offers.map((offer, index) => (
                    <OfferCard
                        key={offer.id}
                        icon={offer.icon}
                        title={offer.title}
                        description={offer.description}
                        actionLabel={offer.actionLabel}
                        onAction={() => onOfferSelected(offer.id)}
                        buttonRef={index === 0 ? initialFocusRef : undefined}
                    />
                ))}
            </div>

            <div className="save-offer-actions">
                <button
                    type="button"
                    className="cancel-btn cancel-btn-keep"
                    onClick={onSkip}
                >
                    Continue to cancel
                </button>
            </div>
        </div>
    );
};
