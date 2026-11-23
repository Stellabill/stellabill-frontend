import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { explorerAccountUrl } from '../config/network';
import type { FreighterAdapter } from '../wallet/freighter';
import { WalletProvider } from '../wallet/WalletContext';
import Checkout, { type CheckoutProps } from './Checkout';

const PUBLIC_KEY = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

const createFakeAdapter = (overrides: Partial<FreighterAdapter> = {}): FreighterAdapter => ({
  isConnected: vi.fn().mockResolvedValue({ isConnected: true }),
  requestAccess: vi.fn().mockResolvedValue({ address: PUBLIC_KEY }),
  getAddress: vi.fn().mockResolvedValue({ address: PUBLIC_KEY }),
  getNetwork: vi.fn().mockResolvedValue({
    network: 'TESTNET',
    networkPassphrase: 'Test SDF Network ; September 2015',
  }),
  signTransaction: vi.fn().mockResolvedValue({
    signedTxXdr: 'AAAA_SIGNED_SUBSCRIPTION_XDR',
    signerAddress: PUBLIC_KEY,
  }),
  ...overrides,
});

function renderCheckout(
  planId: string,
  adapter: FreighterAdapter,
  checkoutOptions?: CheckoutProps['checkoutOptions'],
) {
  return render(
    <WalletProvider adapter={adapter}>
      <MemoryRouter initialEntries={['/checkout/' + planId]}>
        <Routes>
          <Route
            path="/checkout/:planId"
            element={<Checkout checkoutOptions={checkoutOptions} />}
          />
        </Routes>
      </MemoryRouter>
    </WalletProvider>,
  );
}

describe('Checkout page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders plan not found for an unknown planId', () => {
    const adapter = createFakeAdapter();
    renderCheckout('does-not-exist', adapter);

    expect(screen.getByRole('heading', { name: /plan not found/i })).toBeInTheDocument();
  });

  it('renders order summary with Amount and blocks checkout when wallet is disconnected', () => {
    const adapter = createFakeAdapter();
    renderCheckout('1', adapter, { expectedNetwork: 'Testnet' });

    expect(screen.getByText(/Premium Access/i)).toBeInTheDocument();
    expect(screen.getByTestId('checkout-plan-price')).toHaveTextContent('10.00 USDC');
    expect(screen.getByRole('alert')).toHaveTextContent(/wallet required/i);
    expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
  });

  it('completes a mocked purchase end to end with pending and confirmed states', async () => {
    let resolveSign!: (value: { signedTxXdr: string; signerAddress: string }) => void;
    const signPromise = new Promise<{ signedTxXdr: string; signerAddress: string }>((resolve) => {
      resolveSign = resolve;
    });

    const adapter = createFakeAdapter({
      signTransaction: vi.fn().mockReturnValue(signPromise),
    });

    renderCheckout('1', adapter, {
      expectedNetwork: 'Testnet',
      fetchBalance: vi.fn().mockResolvedValue(150),
    });

    fireEvent.click(screen.getByRole('button', { name: /connect wallet/i }));

    expect(await screen.findByTestId('checkout-wallet-balance')).toHaveTextContent('150.00 USDC');

    const confirmBtn = screen.getByRole('button', { name: /confirm subscription/i });
    expect(confirmBtn).toBeEnabled();
    fireEvent.click(confirmBtn);

    expect(await screen.findByTestId('checkout-pending')).toBeInTheDocument();
    expect(adapter.signTransaction).toHaveBeenCalledTimes(1);

    resolveSign({ signedTxXdr: 'AAAA_SIGNED_XDR_123', signerAddress: PUBLIC_KEY });

    expect(await screen.findByTestId('checkout-confirmed')).toBeInTheDocument();
    expect(screen.getByTestId('checkout-confirmed-amount')).toHaveTextContent('10.00 USDC');

    const explorerLink = screen.getByRole('link', { name: /view on stellar expert/i });
    expect(explorerLink).toHaveAttribute('href', explorerAccountUrl('TESTNET', PUBLIC_KEY));
  });

  it('blocks checkout with a clear message on network mismatch', async () => {
    const adapter = createFakeAdapter({
      getNetwork: vi.fn().mockResolvedValue({
        network: 'PUBLIC',
        networkPassphrase: 'Public Global Stellar Network ; September 2015',
      }),
    });

    renderCheckout('1', adapter, { expectedNetwork: 'Testnet' });

    fireEvent.click(screen.getByRole('button', { name: /connect wallet/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/network mismatch/i);
    });

    const confirmBtn = screen.getByRole('button', { name: /confirm subscription/i });
    expect(confirmBtn).toBeDisabled();
    expect(adapter.signTransaction).not.toHaveBeenCalled();
  });

  it('handles rejected signature and allows retrying', async () => {
    const signTransaction = vi
      .fn()
      .mockResolvedValueOnce({
        signedTxXdr: '',
        signerAddress: '',
        error: { code: 4001, message: 'User declined access' },
      })
      .mockResolvedValueOnce({
        signedTxXdr: 'AAAA_RETRY_SIGNED_XDR',
        signerAddress: PUBLIC_KEY,
      });

    const adapter = createFakeAdapter({ signTransaction });

    renderCheckout('1', adapter, {
      expectedNetwork: 'Testnet',
      fetchBalance: vi.fn().mockResolvedValue(200),
    });

    fireEvent.click(screen.getByRole('button', { name: /connect wallet/i }));
    await screen.findByTestId('checkout-wallet-balance');

    fireEvent.click(screen.getByRole('button', { name: /confirm subscription/i }));

    const failedBanner = await screen.findByTestId('checkout-failed');
    expect(failedBanner).toHaveTextContent(/signature was rejected/i);

    const retryButtons = screen.getAllByRole('button', { name: /retry/i });
    fireEvent.click(retryButtons[0]);

    expect(await screen.findByTestId('checkout-confirmed')).toBeInTheDocument();
    expect(signTransaction).toHaveBeenCalledTimes(2);
  });

  it('blocks checkout when available balance is insufficient', async () => {
    const adapter = createFakeAdapter();

    renderCheckout('2', adapter, {
      expectedNetwork: 'Testnet',
      fetchBalance: vi.fn().mockResolvedValue(5),
    });

    fireEvent.click(screen.getByRole('button', { name: /connect wallet/i }));

    expect(await screen.findByTestId('checkout-wallet-balance')).toHaveTextContent('5.00 USDC');
    expect(screen.getByText(/insufficient usdc balance/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm subscription/i })).toBeDisabled();
  });
});
