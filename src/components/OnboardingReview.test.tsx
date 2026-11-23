import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import OnboardingReview from './OnboardingReview';
import { SUPPORT_URL } from '../config/links';

const VALID_ADDRESS = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7';

function CurrentPath() {
  const { pathname } = useLocation();
  return <output data-testid="current-path">{pathname}</output>;
}

function renderReview(client = { submit: vi.fn().mockResolvedValue(undefined) }) {
  return render(
    <MemoryRouter initialEntries={['/onboarding/review']}>
      <OnboardingReview client={client} />
      <CurrentPath />
    </MemoryRouter>
  );
}

function seedValidOnboarding() {
  sessionStorage.setItem(
    'onboardingBusiness',
    JSON.stringify({ businessName: 'Test Business', website: 'example.com', country: 'US' })
  );
  sessionStorage.setItem('onboardingPayout', VALID_ADDRESS);
}

describe('OnboardingReview', () => {
  const originalDisplayNames = Intl.DisplayNames;

  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Intl.DisplayNames = originalDisplayNames;
  });

  it('renders correctly with normal Intl.DisplayNames behavior', () => {
    seedValidOnboarding();
    renderReview();

    // US should be formatted as "United States"
    expect(screen.getByText(/United States/)).toBeInTheDocument();
    expect(screen.getByText(/Test Business/)).toBeInTheDocument();
  });

  it('falls back to raw country code when Intl.DisplayNames throws', () => {
    seedValidOnboarding();

    // Force Intl.DisplayNames to throw
    Intl.DisplayNames = vi.fn().mockImplementation(() => {
      throw new Error('Intl not supported');
    }) as any;

    renderReview();

    // Should fall back to "US"
    expect(screen.getByText(/US/)).toBeInTheDocument();
    expect(screen.queryByText(/United States/)).not.toBeInTheDocument();
  });

  it('handles missing country', () => {
    sessionStorage.setItem(
      'onboardingBusiness',
      JSON.stringify({
        businessName: 'Test Business',
        website: 'example.com',
        country: '',
      })
    );

    sessionStorage.setItem('onboardingPayout', VALID_ADDRESS);
    renderReview();

    expect(screen.getByText(/No country selected/)).toBeInTheDocument();
  });

  it('opens contact support with noopener,noreferrer when clicked', () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    seedValidOnboarding();
    renderReview();

    const supportButton = screen.getByRole('button', { name: /questions\? contact support/i });
    expect(supportButton).toBeInTheDocument();

    fireEvent.click(supportButton);
    expect(windowOpenSpy).toHaveBeenCalledWith(SUPPORT_URL, '_blank', 'noopener,noreferrer');

    windowOpenSpy.mockRestore();
  });

  it('submits onboarding data, clears storage, and navigates on success', async () => {
    seedValidOnboarding();
    const submit = vi.fn().mockResolvedValue(undefined);

    renderReview({ submit });
    fireEvent.click(screen.getByRole('button', { name: /complete setup/i }));

    await waitFor(() => expect(screen.getByTestId('current-path')).toHaveTextContent('/onboarding-success'));
    expect(submit).toHaveBeenCalledWith({
      business: { businessName: 'Test Business', website: 'example.com', country: 'US' },
      payout: VALID_ADDRESS,
    });
    expect(sessionStorage.getItem('onboardingBusiness')).toBeNull();
    expect(sessionStorage.getItem('onboardingPayout')).toBeNull();
  });

  it('shows an error and allows retry when submission fails', async () => {
    seedValidOnboarding();
    const submit = vi.fn()
      .mockRejectedValueOnce(new Error('Request failed'))
      .mockResolvedValueOnce(undefined);

    renderReview({ submit });
    fireEvent.click(screen.getByRole('button', { name: /complete setup/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong while completing setup. Please try again.'
    );
    expect(screen.getByTestId('current-path')).toHaveTextContent('/onboarding/review');
    expect(sessionStorage.getItem('onboardingBusiness')).not.toBeNull();
    expect(sessionStorage.getItem('onboardingPayout')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /complete setup/i }));
    await waitFor(() => expect(screen.getByTestId('current-path')).toHaveTextContent('/onboarding-success'));
    expect(submit).toHaveBeenCalledTimes(2);
  });
});
