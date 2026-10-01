import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PlanRecommendationBanner from './PlanRecommendationBanner';

const dismissKey = 'stellabill:plan-recommendation-dismissed:Starter';

const defaultProps = {
  currentPlan: 'Starter',
  currentLimit: 100000,
  recommendedPlan: 'Scale Tier',
  recommendedLimit: 150000,
  costDelta: '+$29/mo',
  currency: 'USDC',
};

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('PlanRecommendationBanner', () => {
  it('returns no banner when this plan was previously dismissed', () => {
    window.localStorage.setItem(dismissKey, 'true');

    render(<PlanRecommendationBanner {...defaultProps} />);

    expect(screen.queryByRole('region', { name: 'Plan upgrade recommendation' })).toBeNull();
  });

  it.each(['false', '', 'dismissed'])('remains visible for a non-dismissed storage value: %s', (storedValue) => {
    window.localStorage.setItem(dismissKey, storedValue);

    render(<PlanRecommendationBanner {...defaultProps} />);

    expect(screen.getByRole('region', { name: 'Plan upgrade recommendation' })).toBeInTheDocument();
  });

  it('renders the recommendation and formatted limits by default', () => {
    render(<PlanRecommendationBanner {...defaultProps} />);

    expect(screen.getByText('Recommended Upgrade: Scale Tier')).toBeInTheDocument();
    expect(screen.getByText('+$29/mo')).toBeInTheDocument();
    expect(screen.getByText(/Increase your monthly limit from/)).toHaveTextContent('from 100,000 to 150,000 API calls.');
  });

  it('keeps zero-valued boundaries instead of applying defaults', () => {
    render(
      <PlanRecommendationBanner
        {...defaultProps}
        currentLimit={0}
        recommendedLimit={0}
        thresholdPct={0}
        consecutiveMonthsOverThreshold={0}
      />
    );

    expect(screen.getByText(/Increase your monthly limit from/)).toHaveTextContent('from 0 to 0 API calls.');
    fireEvent.click(screen.getByRole('button', { name: 'Why am I seeing this?' }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('over 0% of your Starter limit for 0 consecutive months');
  });

  it('stays visible if reading the dismissal state fails', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });

    render(<PlanRecommendationBanner {...defaultProps} />);

    expect(screen.getByRole('region', { name: 'Plan upgrade recommendation' })).toBeInTheDocument();
  });

  it('dismisses the banner and persists the dismissal', () => {
    render(<PlanRecommendationBanner {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss recommendation banner' }));

    expect(screen.queryByRole('region', { name: 'Plan upgrade recommendation' })).toBeNull();
    expect(window.localStorage.getItem(dismissKey)).toBe('true');
  });

  it('dismisses the banner even if persisting the dismissal fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    render(<PlanRecommendationBanner {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss recommendation banner' }));

    expect(screen.queryByRole('region', { name: 'Plan upgrade recommendation' })).toBeNull();
  });

  it('toggles the usage explanation popover', () => {
    render(<PlanRecommendationBanner {...defaultProps} thresholdPct={80} consecutiveMonthsOverThreshold={2} />);
    const toggle = screen.getByRole('button', { name: 'Why am I seeing this?' });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('tooltip')).toHaveTextContent('over 80% of your Starter limit for 2 consecutive months');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('transitions the upgrade action from pending to complete', () => {
    const onUpgrade = vi.fn();
    vi.useFakeTimers();
    render(<PlanRecommendationBanner {...defaultProps} onUpgrade={onUpgrade} />);

    fireEvent.click(screen.getByRole('button', { name: 'One-Click Switch' }));

    const pendingButton = screen.getByRole('button', { name: 'Switching...' });
    expect(pendingButton).toBeDisabled();
    expect(onUpgrade).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByRole('button', { name: 'Upgraded!' })).toBeDisabled();
    expect(onUpgrade).toHaveBeenCalledTimes(1);
  });
});