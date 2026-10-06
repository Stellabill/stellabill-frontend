import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PricingCard from './PricingCard';

describe('PricingCard', () => {
  const defaultProps = {
    title: 'Basic',
    tagline: 'For starters',
    features: [{ text: 'Feature 1' }, { text: 'Feature 2' }],
    buttonText: 'Get Started',
  };

  it('renders flat pricing by default when price is provided', () => {
    render(<PricingCard {...defaultProps} price="$10" priceSubtext="Per month" />);
    
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('For starters')).toBeInTheDocument();
    expect(screen.getByText('$10')).toBeInTheDocument();
    expect(screen.getByText('Per month')).toBeInTheDocument();
    expect(screen.getByText('Feature 1')).toBeInTheDocument();
    expect(screen.getByText('Feature 2')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('renders per-seat pricing when mode is per-seat and basePricePerSeat is provided', () => {
    render(
      <PricingCard
        {...defaultProps}
        pricingMode="per-seat"
        basePricePerSeat={15}
        seats={3}
      />
    );
    
    expect(screen.getByText('$15')).toBeInTheDocument();
    expect(screen.getByText('/ seat / mo')).toBeInTheDocument();
    expect(screen.getByText('$45 / mo total for 3 seats')).toBeInTheDocument();
  });

  it('renders custom pricing when basePricePerSeat is null', () => {
    render(
      <PricingCard
        {...defaultProps}
        basePricePerSeat={null}
        priceLabel="Contact Us"
        priceSubtext="For enterprise teams"
      />
    );
    
    expect(screen.getByText('Contact Us')).toBeInTheDocument();
    expect(screen.getByText('For enterprise teams')).toBeInTheDocument();
  });

  it('handles button clicks', () => {
    const onButtonClick = vi.fn();
    render(<PricingCard {...defaultProps} onButtonClick={onButtonClick} />);
    
    const button = screen.getByRole('button', { name: /Get Started/i });
    fireEvent.click(button);
    
    expect(onButtonClick).toHaveBeenCalledTimes(1);
  });

  it('displays popular badge when isPopular is true', () => {
    render(<PricingCard {...defaultProps} isPopular={true} isPopularLabel="Most Popular" />);
    
    expect(screen.getByText('Most Popular')).toBeInTheDocument();
  });
});
