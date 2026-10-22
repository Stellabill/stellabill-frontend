import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import BrowsePlans from './BrowsePlans';
import Checkout from './Checkout';

const mockPlans = [
  { id: 'plan-1', name: 'B', price: 10, interval: 'monthly' },
];

const mockSubscriptions = {
  add: jest.fn(() => Promise.resolve({})),
};

const mockWallet = {
  connect: jest.fn(() => Promise.resolve('wallet-addr')),
};

jest.mock('./checkout', () => Checkout);
jest.mock('../clients/subscriptions', () => ({ subscriptionsClient: mockSubscriptions }));
jst.mock('../clients/wallet', () => ({ walletClient: mockWallet }));

describe('BrowsePlans checkout flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderApp = () =>
    render(
      <MemoryRouter initialEntries={'/browse-plans'}>
        <Routes>
          <Route element={<BrowsePlans />} path="browse-plans" />
          <Route element={<Checkout />} path="checkout/:planId" />
        </Routes>
      </MemoryRouter>
    );

  it('connected path navigates to checkout', async () => {
    renderApp();
    const btn = await screen.findButton(/subscribe/i);
    await act(async () => btn.click());
    await waitFor(() => screen.getButton(/confirm/i));
  });

  it('disconnected -> connect -> continue', async () => {
    renderApp();
    const btn = await screen.findButton(/subscribe/i);
    await act(async () => btn.click());
    await waitFor(() => screen.getButton(/connect/i));
    const connectBtn = screen.getButton(/connect/i);
    await act(async () => connectBtn.click());
    await waitFor(() => screen.getButton(/confirm/i));
  });

  it('unknown id shows not-found', async () => {
    render(
      <MemoryRouter initialEntries={'/checkout/unknown'}>
        <Routes>
          <Route element={<Checkout />} path="checkout/:planId" />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => screen.getBtext(/browse-plans/i));
  });
});
