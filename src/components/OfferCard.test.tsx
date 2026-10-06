import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Gift } from 'lucide-react';
import { OfferCard, type OfferCardSize } from './OfferCard';

function renderOfferCard(
  props: Partial<React.ComponentProps<typeof OfferCard>> = {},
) {
  const defaultProps: React.ComponentProps<typeof OfferCard> = {
    icon: Gift,
    title: 'Save 20%',
    description: 'Use this offer before your next renewal.',
    actionLabel: 'Claim offer',
    onAction: () => undefined,
  };
  return render(<OfferCard {...defaultProps} {...props} />);
}

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

  it.each(['banner', 'card', 'tile'] as OfferCardSize[])(
    'applies offer-card--%s class for size="%s"',
    (size) => {
      const { container } = renderOfferCard({ size });

      const article = container.querySelector('article.offer-card');
      expect(article).toBeInTheDocument();
      expect(article).toHaveClass('offer-card--' + size);
    },
  );

  it('defaults omitted size to offer-card--card', () => {
    const { container } = renderOfferCard({ size: undefined });

    expect(container.querySelector('article.offer-card')).toHaveClass('offer-card--card');
  });

  it('renders default eligibility and expiry strings when omitted', () => {
    renderOfferCard({});

    expect(screen.getByText('Eligible on your next renewal')).toBeInTheDocument();
    expect(screen.getByText('Ends soon')).toBeInTheDocument();
  });

  it('renders custom eligibility and expiry overrides', () => {
    renderOfferCard({
      eligibility: 'Available to active subscribers',
      expiresIn: 'Ends in 2 days',
    });

    expect(screen.getByText('Available to active subscribers')).toBeInTheDocument();
    expect(screen.getByText('Ends in 2 days')).toBeInTheDocument();
    expect(screen.queryByText('Eligible on your next renewal')).not.toBeInTheDocument();
    expect(screen.queryByText('Ends soon')).not.toBeInTheDocument();
  });

  it('fires onAction when the CTA button is clicked', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    renderOfferCard({ onAction });

    await user.click(screen.getByRole('button', { name: /claim offer: save 20%/i }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('forwards buttonRef to the CTA button', () => {
    const buttonRef = React.createRef<HTMLButtonElement>();
    renderOfferCard({ buttonRef });

    const button = screen.getByRole('button', { name: /claim offer/i });
    expect(buttonRef.current).toBe(button);
    expect(buttonRef.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('labels the CTA button with action and title for assistive technology', () => {
    renderOfferCard({ actionLabel: 'Claim offer', title: 'Save 20%' });

    expect(screen.getByRole('button', { name: 'Claim offer: Save 20%' })).toBeInTheDocument();
  });

  it('exposes offer details region with polite countdown announcements', () => {
    renderOfferCard({ expiresIn: 'Ends in 2 days' });

    expect(screen.getByLabelText('Offer details')).toBeInTheDocument();
    const countdown = screen.getByText('Ends in 2 days').closest('[aria-live]');
    expect(countdown).toHaveAttribute('aria-live', 'polite');
  });

  it('updates size class dynamically on rerender from card to banner', () => {
    const { container, rerender } = renderOfferCard({ size: 'card' });
    const article = () => container.querySelector('article.offer-card');

    expect(article()).toHaveClass('offer-card--card');

    rerender(
      <OfferCard
        icon={Gift}
        title="Save 20%"
        description="Use this offer before your next renewal."
        actionLabel="Claim offer"
        onAction={() => undefined}
        size="banner"
      />,
    );

    expect(article()).toHaveClass('offer-card--banner');
    expect(article()).not.toHaveClass('offer-card--card');
  });

  it('updates content props dynamically on rerender', () => {
    const { rerender } = renderOfferCard({
      title: 'Save 20%',
      description: 'Use this offer before your next renewal.',
      eligibility: 'Eligible on your next renewal',
      expiresIn: 'Ends soon',
    });

    rerender(
      <OfferCard
        icon={Gift}
        title="Get 20% off"
        description="Stay with us and save."
        actionLabel="Apply discount"
        onAction={() => undefined}
        eligibility="Available to active subscribers"
        expiresIn="Ends in 2 days"
      />,
    );

    expect(screen.getByText('Get 20% off')).toBeInTheDocument();
    expect(screen.getByText('Stay with us and save.')).toBeInTheDocument();
    expect(screen.getByText('Available to active subscribers')).toBeInTheDocument();
    expect(screen.getByText('Ends in 2 days')).toBeInTheDocument();
  });

  it('renders deterministically with empty strings without throwing', () => {
    const { container } = renderOfferCard({ title: '', description: '', actionLabel: '' });

    expect(container.querySelector('article.offer-card')).toBeInTheDocument();
    expect(screen.getByText('Eligible on your next renewal')).toBeInTheDocument();
  });
});
