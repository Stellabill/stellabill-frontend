import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BrowsePlans from './BrowsePlans';

const { walletState } = vi.hoisted(() => ({
  walletState: { status: 'disconnected' as 'connected' | 'disconnected' },
}));

vi.mock('../hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}));

vi.mock('../wallet/WalletContext', () => ({
  useWallet: () => ({
    status: walletState.status,
    error: null,
    connect: vi.fn().mockResolvedValue({ address: 'GTEST', network: 'testnet' }),
    clearError: vi.fn(),
    cancelConnect: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

vi.mock('../components/WalletConnectModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div role="dialog" aria-label="Connect wallet">Connect wallet modal</div> : null,
}));

vi.mock('../components/SortBySelect', () => ({
  default: ({
    value,
    onValueChange,
    options,
    ariaLabel,
  }: {
    value: string;
    onValueChange: (value: string) => void;
    options: { value: string; label: string }[];
    ariaLabel: string;
  }) => (
    <select aria-label={ariaLabel} value={value} onChange={(event) => onValueChange(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock('../components/GiftPurchaseModal', () => ({
  default: ({
    isOpen,
    plan,
    onPurchaseComplete,
  }: {
    isOpen: boolean;
    plan: { name: string } | null;
    onPurchaseComplete: (code: string) => void;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label="Purchase gift">
        <p>Gift plan: {plan?.name}</p>
        <button type="button" onClick={() => onPurchaseComplete('GIFT-CODE-123')}>
          Complete gift purchase
        </button>
      </div>
    ) : null,
}));

function RouterQuery() {
  const { search } = useLocation();
  return <span hidden data-testid="location-query">{search}</span>;
}

function Checkout() {
  const navigate = useNavigate();
  return (
    <>
      <h1>Checkout</h1>
      <button type="button" onClick={() => navigate(-1)}>Return to plans</button>
    </>
  );
}

function renderPage(search = '') {
  window.history.replaceState({}, '', '/browse-plans' + search);
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/browse-plans', search }]}>
      <Routes>
        <Route path="/browse-plans" element={<BrowsePlans />} />
        <Route path="/checkout/:planId" element={<Checkout />} />
      </Routes>
      <RouterQuery />
    </MemoryRouter>,
  );
}

function readQuery() {
  return new URLSearchParams(screen.getByTestId('location-query').textContent ?? '');
}

async function loadPlans() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(800);
  });
}

function getPlanNames() {
  const planList = screen.getByRole('list', { name: 'Available subscription plans' });
  return within(planList)
    .getAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent);
}

describe('BrowsePlans', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    walletState.status = 'disconnected';
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows loading before the catalog plans appear after the delay', async () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Loading plans...' })).toBeInTheDocument();

    await loadPlans();

    expect(screen.getByRole('heading', { name: 'Premium Access' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Available subscription plans' })).toBeInTheDocument();
  });

  it('shows the error state and fallback catalog when loading fails', async () => {
    renderPage('?simulate_error=true');

    expect(screen.getByRole('heading', { name: 'Loading plans...' })).toBeInTheDocument();
    await loadPlans();

    expect(screen.getByRole('heading', { name: 'Failed to load plans' })).toBeInTheDocument();
    expect(screen.getByText('Failed to load plans from catalog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Premium Access' })).toBeInTheDocument();
  });

  it('filters by plan name or merchant, filters by billing interval, and clears search on Escape', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();
    await loadPlans();

    const search = screen.getByRole('searchbox', { name: /search plans/i });
    await user.type(search, 'CloudFlow');
    expect(getPlanNames()).toEqual(['Enterprise', 'Pro Plan']);

    await user.clear(search);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter plans by billing interval' }), 'Yearly');
    expect(getPlanNames()).toEqual(['Annual Premium']);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter plans by billing interval' }), 'Monthly');
    await user.type(search, 'Premium');
    expect(getPlanNames()).toEqual(['Premium Access', 'Premium Coaching']);

    await user.keyboard('{Escape}');
    expect(search).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Filter plans by billing interval' })).toHaveValue('All');
    expect(getPlanNames()).toHaveLength(6);
  });

  it('sorts plans by name, price, and merchant', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();
    await loadPlans();

    const sort = screen.getByRole('combobox', { name: 'Sort plans' });

    await user.selectOptions(sort, 'name-asc');
    expect(getPlanNames()).toEqual([
      'Annual Premium',
      'Enterprise',
      'Premium Access',
      'Premium Coaching',
      'Pro Plan',
      'Starter',
    ]);

    await user.selectOptions(sort, 'price-desc');
    expect(getPlanNames()).toEqual([
      'Annual Premium',
      'Enterprise',
      'Premium Coaching',
      'Pro Plan',
      'Starter',
      'Premium Access',
    ]);

    await user.selectOptions(sort, 'merchant-asc');
    expect(getPlanNames()).toEqual([
      'Pro Plan',
      'Enterprise',
      'Starter',
      'Premium Coaching',
      'Premium Access',
      'Annual Premium',
    ]);
  });

  it('opens the wallet modal when subscribing while disconnected', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();
    await loadPlans();

    await user.click(screen.getByRole('button', { name: /subscribe to premium access plan/i }));

    expect(screen.getByRole('dialog', { name: 'Connect wallet' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Checkout' })).not.toBeInTheDocument();
  });

  it('navigates to checkout when subscribing while connected', async () => {
    walletState.status = 'connected';
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();
    await loadPlans();

    await user.click(screen.getByRole('button', { name: /subscribe to premium access plan/i }));

    expect(await screen.findByRole('heading', { name: 'Checkout' })).toBeInTheDocument();
  });

  it('opens the gift modal and handles a completed gift code', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();
    await loadPlans();

    await user.click(screen.getByRole('button', { name: 'Send Premium Access as a gift' }));

    expect(screen.getByRole('dialog', { name: 'Purchase gift' })).toBeInTheDocument();
    expect(screen.getByText('Gift plan: Premium Access')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Complete gift purchase' }));
    expect(console.log).toHaveBeenCalledWith('Gift purchased with code:', 'GIFT-CODE-123');
  });

  it('shows the no-match state and its reset action', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();
    await loadPlans();

    const search = screen.getByRole('searchbox', { name: /search plans/i });
    await user.type(search, 'no-such-plan');

    expect(screen.getByRole('status')).toHaveTextContent('No plans match your filters');
    await user.click(screen.getByRole('button', { name: 'Clear Filters' }));

    expect(search).toHaveValue('');
    expect(getPlanNames()).toHaveLength(6);
  });

  it('applies the search and billing interval from a deep link', async () => {
    renderPage('?interval=Yearly&q=news');
    await loadPlans();

    expect(screen.getByRole('searchbox')).toHaveValue('news');
    expect(screen.getByLabelText('Filter plans by billing interval')).toHaveValue('Yearly');
    expect(getPlanNames()).toEqual(['Annual Premium']);
  });

  it('uses all intervals for an unknown value while still applying the search', async () => {
    renderPage('?interval=weekly&q=news');
    await loadPlans();

    expect(screen.getByLabelText('Filter plans by billing interval')).toHaveValue('All');
    expect(getPlanNames()).toEqual(['Annual Premium', 'Premium Access']);
  });

  it('deletes an empty search and clears both filters on Escape', async () => {
    renderPage('?interval=Yearly&q=news&source=email');
    await loadPlans();
    const search = screen.getByRole('searchbox');

    fireEvent.change(search, { target: { value: '' } });
    expect(readQuery().has('q')).toBe(false);
    expect(readQuery().get('interval')).toBe('Yearly');

    fireEvent.change(search, { target: { value: 'news' } });
    expect(readQuery().get('q')).toBe('news');
    fireEvent.keyDown(search, { key: 'Escape' });

    expect(search).toHaveValue('');
    expect(screen.getByLabelText('Filter plans by billing interval')).toHaveValue('All');
    expect(Object.fromEntries(readQuery())).toEqual({ source: 'email' });
  });

  it('restores the chosen filters when returning from Checkout', async () => {
    walletState.status = 'connected';
    renderPage();
    await loadPlans();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'news' } });
    fireEvent.change(screen.getByLabelText('Filter plans by billing interval'), {
      target: { value: 'Yearly' },
    });
    fireEvent.click(screen.getByRole('button', { name: /subscribe to annual premium/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Return to plans' }));
    await loadPlans();

    expect(screen.getByRole('searchbox')).toHaveValue('news');
    expect(screen.getByLabelText('Filter plans by billing interval')).toHaveValue('Yearly');
    expect(getPlanNames()).toEqual(['Annual Premium']);
  });
});
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import styles from './BrowsePlans.module.css';
import { WalletProvider } from '../wallet/WalletContext';
const CATALOG_LOAD_TIMEOUT = 3000;
function renderPage() {
	return render(
		<MemoryRouter initialEntries={['/browse-plans']}>
			<WalletProvider>
				<BrowsePlans />
			</WalletProvider>
		</MemoryRouter>,
	);
async function findPlanCard(planName: string) {
	const title = await screen.findByRole(
		'heading',
		{ name: planName },
		{ timeout: CATALOG_LOAD_TIMEOUT },
	);
	const card = title.closest('article');
	if (!card) {
		throw new Error('Could not find the card for ' + planName);
	}
	return card;
	beforeEach(() => {
		localStorage.clear();
	});
	it('renders the page shell, loading state, and plan cards from the catalog', async () => {
		renderPage();
		expect(
			screen.getByRole('heading', { name: 'Browse Plans' }),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				'Discover subscription plans from verified merchants on Stellar',
			),
		).toBeInTheDocument();
		expect(screen.getByText('Loading plans...')).toBeInTheDocument();
		const card = await findPlanCard('Premium Access');
		expect(within(card).getByText('Stellar News')).toBeInTheDocument();
		expect(within(card).getByText('10')).toBeInTheDocument();
		expect(
			within(card).getByLabelText(/next charge preview for premium access/i),
		).toBeInTheDocument();
	});
	it('applies CSS module classes instead of static inline styles', async () => {
		renderPage();
		const card = await findPlanCard('Premium Access');
		const subscribe = within(card).getByRole('button', {
			name: /subscribe to premium access/i,
		});
		const gift = within(card).getByRole('button', {
			name: /send premium access as a gift/i,
		});
		const grid = screen.getByRole('list', {
			name: /available subscription plans/i,
		});
		expect(card).toHaveClass(styles.planCard);
		expect(subscribe).toHaveClass(styles.subscribeButton);
		expect(gift).toHaveClass(styles.giftButton);
		expect(grid).toHaveClass(styles.planGrid);
		expect(card).not.toHaveAttribute('style');
		expect(subscribe).not.toHaveAttribute('style');
		expect(gift).not.toHaveAttribute('style');
		expect(grid).not.toHaveAttribute('style');
	});
	it('does not mutate inline styles when a card or button is hovered or focused', async () => {
		renderPage();
		const card = await findPlanCard('Premium Access');
		const subscribe = within(card).getByRole('button', {
			name: /subscribe to premium access/i,
		});
		const gift = within(card).getByRole('button', {
			name: /send premium access as a gift/i,
		});
		fireEvent.mouseEnter(card);
		fireEvent.mouseEnter(subscribe);
		fireEvent.mouseEnter(gift);
		subscribe.focus();
		gift.focus();
		expect(card).not.toHaveAttribute('style');
		expect(subscribe).not.toHaveAttribute('style');
		expect(gift).not.toHaveAttribute('style');
		fireEvent.mouseLeave(card);
		fireEvent.mouseLeave(subscribe);
		fireEvent.mouseLeave(gift);
		subscribe.blur();
		gift.blur();
		expect(card).not.toHaveAttribute('style');
		expect(subscribe).not.toHaveAttribute('style');
		expect(gift).not.toHaveAttribute('style');
	});
	it('filters plans by search and renders a tokenized empty state', async () => {
		renderPage();
		await findPlanCard('Premium Access');
		const search = screen.getByRole('searchbox', {
			name: /search plans by name, merchant, or description/i,
		});
		fireEvent.change(search, { target: { value: 'no-plan-matches-this' } });
		const emptyState = await screen.findByRole('status');
		expect(
			within(emptyState).getByText('No plans match your filters'),
		).toBeInTheDocument();
		expect(emptyState).toHaveClass(styles.statePanel);
		expect(emptyState).not.toHaveAttribute('style');
		const clearButton = within(emptyState).getByRole('button', {
			name: /clear filters/i,
		});
		expect(clearButton).toHaveClass(styles.clearFiltersButton);
		expect(clearButton).not.toHaveAttribute('style');
		fireEvent.click(clearButton);
		expect(await screen.findByRole('heading', { name: 'Premium Access' })).toBeInTheDocument();
	});
	it('opens the wallet connection modal when subscribing while disconnected', async () => {
		renderPage();
		const card = await findPlanCard('Premium Access');
		fireEvent.click(
			within(card).getByRole('button', {
				name: /subscribe to premium access/i,
			}),
		);
		expect(await screen.findByRole('dialog')).toBeInTheDocument();
	});
	it('opens the gift modal from the send-as-gift action', async () => {
		renderPage();
		const card = await findPlanCard('Premium Access');
		fireEvent.click(
			within(card).getByRole('button', {
				name: /send premium access as a gift/i,
			}),
		);
		expect(await screen.findByRole('dialog')).toBeInTheDocument();
		expect(
			screen.getByRole('heading', { name: 'Send Premium Access as a gift' }),
		).toBeInTheDocument();
	});
