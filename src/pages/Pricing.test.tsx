import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pricing from './Pricing';
import PricingHeader from '../components/PricingHeader';

// The navbar owns wallet/router state and the feature matrix is unrelated to
// the pricing-card branches exercised here.
vi.mock('../components/LandingNavbar', () => ({
  default: () => <nav aria-label="Landing navigation" />,
}));

vi.mock('../components/pricing/FeatureComparison', () => ({
  default: () => <section aria-label="Feature comparison" />,
}));

const PLANS = [
  {
    title: 'Free',
    tagline: 'For individuals and side projects getting started.',
    cta: 'Get started free',
    feature: 'Up to 50 active subscriptions',
  },
  {
    title: 'Pro',
    tagline: 'For growing teams that need advanced billing and analytics.',
    cta: 'Start free trial',
    feature: 'Unlimited subscriptions',
  },
  {
    title: 'Enterprise',
    tagline: 'For large organizations with custom compliance needs.',
    cta: 'Contact sales',
    feature: 'Custom SLAs',
  },
] as const;

function renderPricing() {
  return render(<Pricing />);
}

/** Scope queries to the card whose heading matches `title`. */
function pricingCard(title: string) {
  const heading = screen.getByRole('heading', { level: 3, name: title });
  const card = heading.closest('.group');
  if (!(card instanceof HTMLElement)) {
    throw new Error(`Could not find the pricing card root for ${title}`);
  }
  return within(card);
}

beforeEach(() => {
  // PricingSeatToggle seeds its state from the URL, so start each test clean.
  window.history.replaceState({}, '', '/pricing');
});

describe('Pricing page', () => {
  it('renders every plan from PLANS with its tagline, feature and CTA', () => {
    renderPricing();

    for (const plan of PLANS) {
      expect(
        screen.getByRole('heading', { level: 3, name: plan.title })
      ).toBeInTheDocument();
      expect(screen.getByText(plan.tagline)).toBeInTheDocument();
      expect(pricingCard(plan.title).getByText(plan.feature)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: new RegExp(plan.cta, 'i') })
      ).toBeInTheDocument();
    }
  });

  it('marks only the popular plan', () => {
    renderPricing();

    expect(pricingCard('Pro').getByText('Most popular')).toBeInTheDocument();
    expect(screen.getAllByText('Most popular')).toHaveLength(1);
    expect(pricingCard('Free').queryByText('Most popular')).toBeNull();
    expect(pricingCard('Enterprise').queryByText('Most popular')).toBeNull();
  });

  it('shows flat prices by default', () => {
    renderPricing();

    expect(screen.getByRole('radio', { name: 'Flat rate' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(pricingCard('Free').getByText('$0')).toBeInTheDocument();
    expect(pricingCard('Pro').getByText('$49')).toBeInTheDocument();
    expect(pricingCard('Pro').getByText('/mo')).toBeInTheDocument();
    expect(pricingCard('Enterprise').getByText('Custom')).toBeInTheDocument();
    expect(screen.queryByText(/mo total for/)).toBeNull();
  });

  it('switches the header toggle between flat and per-seat modes', async () => {
    const user = userEvent.setup();
    renderPricing();

    const flat = screen.getByRole('radio', { name: 'Flat rate' });
    const perSeat = screen.getByRole('radio', { name: 'Per seat' });

    await user.click(perSeat);

    expect(perSeat).toHaveAttribute('aria-checked', 'true');
    expect(flat).toHaveAttribute('aria-checked', 'false');
    expect(pricingCard('Pro').getByText('/ seat / mo')).toBeInTheDocument();
    expect(
      pricingCard('Pro').getByText('$245 / mo total for 5 seats')
    ).toBeInTheDocument();
    expect(pricingCard('Pro').queryByText('/mo')).toBeNull();

    await user.click(flat);

    expect(flat).toHaveAttribute('aria-checked', 'true');
    expect(perSeat).toHaveAttribute('aria-checked', 'false');
    expect(pricingCard('Pro').getByText('/mo')).toBeInTheDocument();
    expect(pricingCard('Pro').queryByText('/ seat / mo')).toBeNull();
    expect(screen.queryByText('$245 / mo total for 5 seats')).toBeNull();
  });

  it('recalculates per-seat totals when the seat count changes', async () => {
    const user = userEvent.setup();
    renderPricing();

    await user.click(screen.getByRole('radio', { name: 'Per seat' }));

    const seatCount = screen.getByLabelText('Number of seats');
    expect(seatCount).toHaveValue(5);
    expect(
      pricingCard('Pro').getByText('$245 / mo total for 5 seats')
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove one seat' }));
    await user.click(screen.getByRole('button', { name: 'Remove one seat' }));

    expect(seatCount).toHaveValue(3);
    expect(pricingCard('Pro').getByText('$49')).toBeInTheDocument();
    expect(
      pricingCard('Pro').getByText('$147 / mo total for 3 seats')
    ).toBeInTheDocument();
  });

  it('shows no numeric price for the custom plan in either mode', async () => {
    const user = userEvent.setup();
    renderPricing();

    expect(pricingCard('Enterprise').getByText('Custom')).toBeInTheDocument();
    expect(pricingCard('Enterprise').queryByText(/\$\d/)).toBeNull();

    await user.click(screen.getByRole('radio', { name: 'Per seat' }));

    const enterprise = pricingCard('Enterprise');
    expect(enterprise.getByText('Custom')).toBeInTheDocument();
    expect(
      enterprise.getByText('Volume discounts & dedicated SLAs')
    ).toBeInTheDocument();
    expect(enterprise.queryByText(/\$\d/)).toBeNull();
    expect(enterprise.queryByText('/ seat / mo')).toBeNull();
  });
});

describe('PricingHeader toggle', () => {
  it('switches the header selection between merchants and subscribers', async () => {
    const user = userEvent.setup();
    const onToggleChange = vi.fn();
    render(<PricingHeader onToggleChange={onToggleChange} />);

    const merchants = screen.getByRole('button', { name: /for merchants/i });
    const subscribers = screen.getByRole('button', { name: /for subscribers/i });

    expect(merchants).toHaveAttribute('aria-pressed', 'true');
    expect(subscribers).toHaveAttribute('aria-pressed', 'false');

    await user.click(subscribers);

    expect(merchants).toHaveAttribute('aria-pressed', 'false');
    expect(subscribers).toHaveAttribute('aria-pressed', 'true');
    expect(onToggleChange).toHaveBeenLastCalledWith('subscribers');

    await user.click(merchants);

    expect(merchants).toHaveAttribute('aria-pressed', 'true');
    expect(subscribers).toHaveAttribute('aria-pressed', 'false');
    expect(onToggleChange).toHaveBeenLastCalledWith('merchants');
  });
});
