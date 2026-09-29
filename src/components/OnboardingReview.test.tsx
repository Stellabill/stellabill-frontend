import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import OnboardingReview from './OnboardingReview';

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

    render(
      <MemoryRouter>
        <OnboardingReview />
      </MemoryRouter>
    );

    // US should be formatted as "United States"
    expect(screen.getByText(/United States/)).toBeInTheDocument();
    expect(screen.getByText(/Test Business/)).toBeInTheDocument();
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

    // Force Intl.DisplayNames to throw
    Intl.DisplayNames = vi.fn().mockImplementation(() => {
      throw new Error('Intl not supported');
    }) as any;

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
});
