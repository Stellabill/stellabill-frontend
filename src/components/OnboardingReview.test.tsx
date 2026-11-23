import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import OnboardingReview from './OnboardingReview';
import { SUPPORT_URL } from '../config/links';

const VALID_PAYOUT_ADDRESS = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7';

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
    sessionStorage.setItem(
      'onboardingBusiness',
      JSON.stringify({
        businessName: 'Test Business',
        website: 'example.com',
        country: 'US',
      })
    );
    sessionStorage.setItem('onboardingPayout', VALID_PAYOUT_ADDRESS);

    render(
      <MemoryRouter>
        <OnboardingReview />
      </MemoryRouter>
    );

    // US should be formatted as "United States"
    expect(screen.getByText(/United States/)).toBeInTheDocument();
    expect(screen.getByText(/Test Business/)).toBeInTheDocument();
    expect(screen.getByText(/GAAZI4TCR3\.\.\.VKOCCWN7/)).toBeInTheDocument();
  });

  it('falls back to raw country code when Intl.DisplayNames throws', () => {
    sessionStorage.setItem(
      'onboardingBusiness',
      JSON.stringify({
        businessName: 'Test Business',
        website: 'example.com',
        country: 'US',
      })
    );
    sessionStorage.setItem('onboardingPayout', VALID_PAYOUT_ADDRESS);

    // Force Intl.DisplayNames to throw
    Intl.DisplayNames = vi.fn().mockImplementation(() => {
      throw new Error('Intl not supported');
    }) as unknown as typeof Intl.DisplayNames;

    render(
      <MemoryRouter>
        <OnboardingReview />
      </MemoryRouter>
    );

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

    render(
      <MemoryRouter>
        <OnboardingReview />
      </MemoryRouter>
    );

    expect(screen.getByText(/No country selected/)).toBeInTheDocument();
  });

  it('redirects to business step when storage is empty or country is missing', async () => {
    render(
      <MemoryRouter initialEntries={['/onboarding/review']}>
        <Routes>
          <Route path="/onboarding/review" element={<OnboardingReview />} />
          <Route path="/onboarding/business" element={<div>Business Step</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Business Step')).toBeInTheDocument();
    });
  });

  it('redirects to payout step when business exists but payout is missing or invalid', async () => {
    sessionStorage.setItem(
      'onboardingBusiness',
      JSON.stringify({
        businessName: 'Test Business',
        website: 'example.com',
        country: 'US',
      })
    );

    render(
      <MemoryRouter initialEntries={['/onboarding/review']}>
        <Routes>
          <Route path="/onboarding/review" element={<OnboardingReview />} />
          <Route path="/onboarding/payout" element={<div>Payout Step</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Payout Step')).toBeInTheDocument();
    });
  });

  it('completes setup, clears sessionStorage, and navigates to onboarding-success', async () => {
    sessionStorage.setItem(
      'onboardingBusiness',
      JSON.stringify({
        businessName: 'Test Business',
        website: 'https://example.com',
        country: 'US',
      })
    );
    sessionStorage.setItem('onboardingPayout', VALID_PAYOUT_ADDRESS);

    render(
      <MemoryRouter initialEntries={['/onboarding/review']}>
        <Routes>
          <Route path="/onboarding/review" element={<OnboardingReview />} />
          <Route path="/onboarding-success" element={<div>Success Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    const completeButton = screen.getByRole('button', { name: /complete setup/i });
    expect(completeButton).toBeEnabled();
    fireEvent.click(completeButton);

    await waitFor(
      () => {
        expect(screen.getByText('Success Page')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(sessionStorage.getItem('onboardingBusiness')).toBeNull();
    expect(sessionStorage.getItem('onboardingPayout')).toBeNull();
  });

  it('opens contact support with noopener,noreferrer when clicked', () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <MemoryRouter>
        <OnboardingReview />
      </MemoryRouter>
    );

    const supportButton = screen.getByRole('button', { name: /questions\? contact support/i });
    expect(supportButton).toBeInTheDocument();

    fireEvent.click(supportButton);
    expect(windowOpenSpy).toHaveBeenCalledWith(SUPPORT_URL, '_blank', 'noopener,noreferrer');

    windowOpenSpy.mockRestore();
  });
});
