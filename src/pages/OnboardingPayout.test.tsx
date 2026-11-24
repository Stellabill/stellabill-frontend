import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import OnboardingPayout from './OnboardingPayout';

const VALID_ADDRESS = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7';

function renderOnboardingPayout() {
  return render(
    <MemoryRouter initialEntries={['/onboarding/payout']}>
      <Routes>
        <Route path="/onboarding/payout" element={<OnboardingPayout />} />
        <Route path="/onboarding/review" element={<div>Review step</div>} />
        <Route path="/onboarding/business" element={<div>Business step</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('OnboardingPayout page', () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem(
      'onboardingBusiness',
      JSON.stringify({ name: 'Acme Corp', country: 'US' })
    );
  });

  it('renders the shell at step 2 with step 1 completed and title "Payout details"', () => {
    renderOnboardingPayout();

    expect(
      screen.getByRole('heading', { name: 'Payout details' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Add a Stellar wallet to receive your subscription payouts.')
    ).toBeInTheDocument();

    const stepItems = screen.getAllByRole('listitem');
    expect(stepItems).toHaveLength(3);

    // Step 1 (Business) is completed: renders a checkmark SVG instead of "1"
    expect(within(stepItems[0]).getByText('Business')).not.toHaveAttribute('aria-current');
    expect(stepItems[0].querySelector('svg')).toBeInTheDocument();
    expect(within(stepItems[0]).queryByText('1')).not.toBeInTheDocument();

    // Step 2 (Payout) is the current active step
    expect(within(stepItems[1]).getByText('Payout')).toHaveAttribute('aria-current', 'step');
    expect(within(stepItems[1]).getByText('2')).toBeInTheDocument();

    // Step 3 (Review) is neither active nor completed
    expect(within(stepItems[2]).getByText('Review')).not.toHaveAttribute('aria-current');
    expect(within(stepItems[2]).getByText('3')).toBeInTheDocument();
    expect(stepItems[2].querySelector('svg')).not.toBeInTheDocument();
  });

  it('stores the wallet address in sessionStorage and navigates to /onboarding/review on next', async () => {
    const user = userEvent.setup();
    renderOnboardingPayout();

    await user.type(screen.getByLabelText(/stellar wallet address/i), VALID_ADDRESS);
    await user.click(screen.getByRole('button', { name: /next/i }));

    expect(sessionStorage.getItem('onboardingPayout')).toBe(VALID_ADDRESS);
    expect(screen.getByText('Review step')).toBeInTheDocument();
  });

  it('navigates to /onboarding/business on back', async () => {
    const user = userEvent.setup();
    renderOnboardingPayout();

    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(screen.getByText('Business step')).toBeInTheDocument();
    expect(sessionStorage.getItem('onboardingPayout')).toBeNull();
  });
});
