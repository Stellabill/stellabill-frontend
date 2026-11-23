import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BrowsePlans from './BrowsePlans';
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
}

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
}

describe('BrowsePlans', () => {
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
});
