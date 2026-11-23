/**
 * Test suite for src/App.tsx
 *
 * Covers:
 *  - Default export is a valid React component
 *  - Root "/" renders Landing and "/landing" redirects to "/"
 *  - "/onboarding" redirects to "/onboarding/business"
 *  - "/onboarding/payout" redirects to "/onboarding/business" without stored business data
 *  - Catch-all unknown paths render the 404 NotFound page
 *  - Every public route renders its page stub (no Layout wrapper)
 *  - Every Layout-wrapped authenticated route renders inside the Layout
 *  - Both "/plans/create" and "/plans/new" resolve to the CreatePlan page
 *  - Parameterised routes ("/checkout/:planId", "/subscriptions/:id" and "/subscriptions/:id/usage")
 *    accept arbitrary id values
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

// ---------------------------------------------------------------------------
// Stub every page / layout component so the tests stay fast and isolated.
// Each stub renders a unique, easily queryable data-testid.
// ---------------------------------------------------------------------------

vi.mock('./components/Layout', async () => {
  const { Outlet } = await import('react-router-dom');
  return {
    default: () => (
      <div data-testid="layout">
        <Outlet />
      </div>
    ),
  };
});

vi.mock('./components/TransitionLayout', async () => {
  const { Outlet } = await import('react-router-dom');
  return {
    default: () => (
      <div data-testid="transition-layout">
        <Outlet />
      </div>
    ),
  };
});

// Pages – public
vi.mock('./pages/Landing', () => ({ default: () => <div data-testid="page-landing" /> }));
vi.mock('./pages/Pricing', () => ({ default: () => <div data-testid="page-pricing" /> }));
vi.mock('./components/AboutPrepaidBalances', () => ({ default: () => <div data-testid="page-about-prepaid-balances" /> }));
vi.mock('./pages/OnboardingBusiness', () => ({ default: () => <div data-testid="page-onboarding-business" /> }));
vi.mock('./pages/OnboardingPayout', () => ({ default: () => <div data-testid="page-onboarding-payout" /> }));
vi.mock('./components/OnboardingReview', () => ({ default: () => <div data-testid="page-onboarding-review" /> }));
vi.mock('./pages/OnboardingSuccess', () => ({ default: () => <div data-testid="page-onboarding-success" /> }));
vi.mock('./pages/RedeemGift', () => ({ default: () => <div data-testid="page-redeem-gift" /> }));
vi.mock('./pages/GiftRedeemSuccess', () => ({ default: () => <div data-testid="page-gift-redeem-success" /> }));

// Pages – authenticated (Layout-wrapped)
vi.mock('./pages/Dashboard', () => ({ default: () => <div data-testid="page-dashboard" /> }));
vi.mock('./pages/BrowsePlans', () => ({ default: () => <div data-testid="page-browse-plans" /> }));
vi.mock('./pages/Checkout', () => ({ default: () => <div data-testid="page-checkout" /> }));
vi.mock('./pages/Plans', () => ({ default: () => <div data-testid="page-plans" /> }));
vi.mock('./pages/CreatePlan', () => ({ default: () => <div data-testid="page-create-plan" /> }));
vi.mock('./pages/Subscriptions', () => ({ default: () => <div data-testid="page-subscriptions" /> }));
vi.mock('./pages/SubscriptionDetail', () => ({ default: () => <div data-testid="page-subscription-detail" /> }));
vi.mock('./pages/UsageBilling', () => ({ default: () => <div data-testid="page-usage-billing" /> }));
vi.mock('./pages/WalletDetailView', () => ({ default: () => <div data-testid="page-wallet" /> }));
vi.mock('./pages/Settings', () => ({ default: () => <div data-testid="page-settings" /> }));
vi.mock('./pages/BrandPack', () => ({ default: () => <div data-testid="page-brand-pack" /> }));
vi.mock('./pages/DesignTokens', () => ({ default: () => <div data-testid="page-design-tokens" /> }));

// ---------------------------------------------------------------------------
// Helper: render App wrapped in a MemoryRouter at a given path.
// ---------------------------------------------------------------------------
function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  sessionStorage.clear();
  window.scrollTo = vi.fn();
});

// ---------------------------------------------------------------------------
// Exported contract
// ---------------------------------------------------------------------------
describe('App – module contract', () => {
  it('has a default export that is a function (React component)', async () => {
    const mod = await import('./App');
    expect(typeof mod.default).toBe('function');
  });

  it('renders without throwing', async () => {
    renderAt('/dashboard');
    expect(await screen.findByTestId('page-dashboard')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Redirect & catch-all behaviour
// ---------------------------------------------------------------------------
describe('App – redirects', () => {
  it('renders Landing at "/" and redirects "/landing" to "/"', async () => {
    const { unmount } = renderAt('/');
    expect(await screen.findByTestId('page-landing')).toBeInTheDocument();
    unmount();

    renderAt('/landing');
    expect(await screen.findByTestId('page-landing')).toBeInTheDocument();
  });

  it('redirects "/onboarding" to "/onboarding/business"', async () => {
    renderAt('/onboarding');
    expect(await screen.findByTestId('page-onboarding-business')).toBeInTheDocument();
  });

  it('redirects "/onboarding/payout" to "/onboarding/business" when business data is missing', async () => {
    renderAt('/onboarding/payout');
    expect(await screen.findByTestId('page-onboarding-business')).toBeInTheDocument();
  });

  it('renders NotFound for an unknown path', async () => {
    renderAt('/this-route-does-not-exist');
    expect(await screen.findByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });

  it('renders NotFound for deeply nested unknown paths', async () => {
    renderAt('/a/b/c/d/e');
    expect(await screen.findByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Public routes (no Layout wrapper expected)
// ---------------------------------------------------------------------------
describe('App – public routes', () => {
  const publicRoutes: Array<{ path: string; testId: string; setup?: () => void }> = [
    { path: '/landing', testId: 'page-landing' },
    { path: '/pricing', testId: 'page-pricing' },
    { path: '/about-prepaid-balances', testId: 'page-about-prepaid-balances' },
    { path: '/onboarding/business', testId: 'page-onboarding-business' },
    {
      path: '/onboarding/payout',
      testId: 'page-onboarding-payout',
      setup: () => {
        sessionStorage.setItem(
          'onboardingBusiness',
          JSON.stringify({ businessName: 'Acme Inc.', website: 'https://acme.example', country: 'US' }),
        );
      },
    },
    { path: '/onboarding/review', testId: 'page-onboarding-review' },
    { path: '/onboarding-success', testId: 'page-onboarding-success' },
    { path: '/redeem-gift', testId: 'page-redeem-gift' },
    { path: '/gift-redeem-success', testId: 'page-gift-redeem-success' },
  ];

  publicRoutes.forEach(({ path, testId, setup }) => {
    it(`renders "${path}" and does NOT wrap it in the authenticated Layout`, async () => {
      setup?.();
      renderAt(path);
      expect(await screen.findByTestId(testId)).toBeInTheDocument();
      // Public routes must not render inside the authenticated Layout
      expect(screen.queryByTestId('layout')).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Authenticated routes (must render inside Layout)
// ---------------------------------------------------------------------------
describe('App – authenticated (Layout-wrapped) routes', () => {
  const authRoutes: Array<{ path: string; testId: string; label?: string }> = [
    { path: '/dashboard', testId: 'page-dashboard' },
    { path: '/browse-plans', testId: 'page-browse-plans' },
    { path: '/checkout/1', testId: 'page-checkout' },
    { path: '/plans', testId: 'page-plans' },
    { path: '/plans/create', testId: 'page-create-plan' },
    { path: '/plans/new', testId: 'page-create-plan', label: '/plans/new (alias for create)' },
    { path: '/subscriptions', testId: 'page-subscriptions' },
    { path: '/subscriptions/sub_123', testId: 'page-subscription-detail' },
    { path: '/subscriptions/sub_abc/usage', testId: 'page-usage-billing' },
    { path: '/wallet', testId: 'page-wallet' },
    { path: '/settings', testId: 'page-settings' },
    { path: '/brand', testId: 'page-brand-pack' },
    { path: '/design-tokens', testId: 'page-design-tokens' },
  ];

  authRoutes.forEach(({ path, testId, label }) => {
    it(`renders "${label ?? path}" inside the Layout`, async () => {
      renderAt(path);
      expect(await screen.findByTestId(testId)).toBeInTheDocument();
      expect(screen.getByTestId('layout')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Parameterised routes
// ---------------------------------------------------------------------------
describe('App – parameterised routes', () => {
  it('mounts SubscriptionDetail for any :id value', async () => {
    renderAt('/subscriptions/ARBITRARY-ID-99');
    expect(await screen.findByTestId('page-subscription-detail')).toBeInTheDocument();
  });

  it('mounts UsageBilling for any :id value with /usage suffix', async () => {
    renderAt('/subscriptions/ARBITRARY-ID-99/usage');
    expect(await screen.findByTestId('page-usage-billing')).toBeInTheDocument();
  });

  it('does NOT render UsageBilling at the plain subscription-detail path', async () => {
    renderAt('/subscriptions/some-id');
    expect(await screen.findByTestId('page-subscription-detail')).toBeInTheDocument();
    expect(screen.queryByTestId('page-usage-billing')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Route aliasing
// ---------------------------------------------------------------------------
describe('App – route aliases', () => {
  it('renders the same CreatePlan component at /plans/create and /plans/new', async () => {
    const { unmount } = renderAt('/plans/create');
    expect(await screen.findByTestId('page-create-plan')).toBeInTheDocument();
    unmount();

    renderAt('/plans/new');
    expect(await screen.findByTestId('page-create-plan')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Boundary / invalid input behaviour
// ---------------------------------------------------------------------------
describe('App – boundary and invalid-input behaviour', () => {
  it('handles an empty string path by resolving to the root Landing route', async () => {
    // MemoryRouter treats '' as '/'
    renderAt('');
    expect(await screen.findByTestId('page-landing')).toBeInTheDocument();
  });

  it('handles an unknown path with a trailing slash by rendering NotFound', async () => {
    renderAt('/unknown/');
    expect(await screen.findByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });

  it('does not leak Layout into public pages even when rendered multiple times', async () => {
    const { unmount } = renderAt('/landing');
    expect(await screen.findByTestId('page-landing')).toBeInTheDocument();
    expect(screen.queryByTestId('layout')).not.toBeInTheDocument();
    unmount();

    renderAt('/pricing');
    expect(await screen.findByTestId('page-pricing')).toBeInTheDocument();
    expect(screen.queryByTestId('layout')).not.toBeInTheDocument();
  });
});
