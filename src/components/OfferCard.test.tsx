import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Gift } from 'lucide-react';
import { OfferCard } from './OfferCard';

describe('OfferCard', () => {
  it('renders eligibility, countdown, and CTA for the new promotional pattern', () => {
    render(
      <OfferCard
        icon={Gift}
        title="Save 20%"
        description="Use this offer before your next renewal."
        actionLabel="Claim offer"
        onAction={() => undefined}
        eligibility="Available to active subscribers"
        expiresIn="Ends in 2 days"
        size="card"
      />,
    );

    expect(screen.getByText(/available to active subscribers/i)).toBeInTheDocument();
    expect(screen.getByText(/ends in 2 days/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /claim offer/i })).toBeInTheDocument();
  });
});
