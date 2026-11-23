import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { WalletProvider, useWallet } from './wallet/WalletContext';
import type { FreighterAdapter } from './wallet/freighter';

const TEST_PUBLIC_KEY = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
const WALLET_STORAGE_KEY = 'stellabill.wallet.publicKey';

function createMockAdapter(overrides?: Partial<FreighterAdapter>): FreighterAdapter {
  return {
    isConnected: vi.fn().mockResolvedValue({ isConnected: true }),
    requestAccess: vi.fn().mockResolvedValue({ address: TEST_PUBLIC_KEY }),
    getAddress: vi.fn().mockResolvedValue({ address: TEST_PUBLIC_KEY }),
    getNetwork: vi.fn().mockResolvedValue({
      network: 'PUBLIC',
      networkPassphrase: 'Public Global Stellar Network ; September 2015',
    }),
    ...overrides,
  };
}

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
vi.mock('./pages/Landing', () => ({
  default: function MockLanding() {
    const { connect } = useWallet();
    return (
      <div data-testid="page-landing">
        <button type="button" onClick={() => void connect()}>
          Connect Wallet
        </button>
      </div>
    );
  },
}));
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

function LocationDisplay() {
  const location = useLocation();
  return (
    <div data-testid="location-display">
      {`${location.pathname}${location.search}${location.hash}`}
    </div>
  );
}

interface RenderAtOptions {
  connected?: boolean;
  adapter?: FreighterAdapter;
}

function renderAt(path: string, options: RenderAtOptions = {}) {
  const { connected = false, adapter = createMockAdapter() } = options;
  if (connected) {
    localStorage.setItem(WALLET_STORAGE_KEY, TEST_PUBLIC_KEY);
  } else {
    localStorage.removeItem(WALLET_STORAGE_KEY);
  }

  return render(
    <WalletProvider adapter={adapter}>
      <MemoryRouter initialEntries={[path]}>
        <App />
        <LocationDisplay />
      </MemoryRouter>
    </WalletProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.scrollTo = vi.fn();
});

describe('App – module contract', () => {
  it('has a default export that is a function (React component)', async () => {
    const mod = await import('./App');
    expect(typeof mod.default).toBe('function');
  });
});

describe('App – RequireWallet guard', () => {
  it.each(['/dashboard', '/subscriptions', '/wallet', '/settings'])(
    'redirects unauthenticated visit to "%s" to "/" without rendering Layout',
    async (protectedPath) => {
      renderAt(protectedPath, { connected: false });

      expect(await screen.findByTestId('page-landing')).toBeInTheDocument();
      expect(screen.queryByTestId('layout')).not.toBeInTheDocument();
      expect(screen.getByTestId('location-display')).toHaveTextContent('/');
    },
  );

  it('preserves intended destination (including search and hash) and returns after connecting', async () => {
    renderAt('/subscriptions?tab=active#top', { connected: false });

    expect(await screen.findByTestId('page-landing')).toBeInTheDocument();
    expect(screen.getByTestId('location-display')).toHaveTextContent('/');

    fireEvent.click(screen.getByRole('button', { name: 'Connect Wallet' }));

    expect(await screen.findByTestId('page-subscriptions')).toBeInTheDocument();
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByTestId('location-display')).toHaveTextContent(
      '/subscriptions?tab=active#top',
    );
  });

  it('shows a loading state while the wallet reconnects and renders the route once restored', async () => {
    let resolveConnection!: (value: { isConnected: boolean }) => void;
    const adapter = createMockAdapter({
      isConnected: vi.fn(
        () =>
          new Promise((resolve) => {
            resolveConnection = resolve;
          }),
      ),
    });

    renderAt('/subscriptions', { connected: true, adapter });

    expect(screen.getByRole('status', { name: 'Reconnecting wallet' })).toBeInTheDocument();
    expect(screen.queryByTestId('page-landing')).not.toBeInTheDocument();
    expect(screen.queryByTestId('page-subscriptions')).not.toBeInTheDocument();

    resolveConnection({ isConnected: true });

    expect(await screen.findByTestId('page-subscriptions')).toBeInTheDocument();
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });

  it('redirects to "/" if wallet reconnection fails', async () => {
    const adapter = createMockAdapter({
      isConnected: vi.fn().mockRejectedValue(new Error('Extension unavailable')),
    });

    renderAt('/subscriptions', { connected: true, adapter });

    await waitFor(() => {
      expect(screen.getByTestId('page-landing')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('layout')).not.toBeInTheDocument();
  });
});

describe('App – public routes (unauthenticated)', () => {
  const publicRoutes: Array<{ path: string; testId: string }> = [
    { path: '/', testId: 'page-landing' },
    { path: '/landing', testId: 'page-landing' },
    { path: '/pricing', testId: 'page-pricing' },
    { path: '/about-prepaid-balances', testId: 'page-about-prepaid-balances' },
    { path: '/onboarding', testId: 'page-onboarding-business' },
    { path: '/onboarding/business', testId: 'page-onboarding-business' },
    { path: '/onboarding/review', testId: 'page-onboarding-review' },
    { path: '/onboarding-success', testId: 'page-onboarding-success' },
    { path: '/redeem-gift', testId: 'page-redeem-gift' },
    { path: '/gift-redeem-success', testId: 'page-gift-redeem-success' },
  ];

  publicRoutes.forEach(({ path, testId }) => {
    it(`renders "${path}" without a connected wallet and without Layout`, async () => {
      renderAt(path, { connected: false });
      expect(await screen.findByTestId(testId)).toBeInTheDocument();
      expect(screen.queryByTestId('layout')).not.toBeInTheDocument();
    });
  });

  it('renders "/onboarding/payout" without a wallet when business onboarding data exists', async () => {
    sessionStorage.setItem('onboardingBusiness', JSON.stringify({ name: 'Acme' }));
    renderAt('/onboarding/payout', { connected: false });
    expect(await screen.findByTestId('page-onboarding-payout')).toBeInTheDocument();
    expect(screen.queryByTestId('layout')).not.toBeInTheDocument();
  });
});

describe('App – authenticated (Layout-wrapped) routes when connected', () => {
  const authRoutes: Array<{ path: string; testId: string; label?: string }> = [
    { path: '/dashboard', testId: 'page-dashboard' },
    { path: '/browse-plans', testId: 'page-browse-plans' },
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
    it(`renders "${label ?? path}" inside Layout when wallet is connected`, async () => {
      renderAt(path, { connected: true });
      expect(await screen.findByTestId(testId)).toBeInTheDocument();
      expect(screen.getByTestId('layout')).toBeInTheDocument();
    });
  });
});

describe('App – catch-all route', () => {
  it('renders NotFound for unknown paths', async () => {
    renderAt('/this-route-does-not-exist', { connected: false });
    expect(await screen.findByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });
});
