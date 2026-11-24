import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as freighterApi from '@stellar/freighter-api';
import ConnectButton from '../components/ConnectButton';
import { WalletProvider } from '../wallet/WalletContext';

vi.mock('@stellar/freighter-api', () => ({
  isConnected: vi.fn(),
  requestAccess: vi.fn(),
  getAddress: vi.fn(),
  getNetwork: vi.fn(),
}));

describe('ConnectButton failure regression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(freighterApi.isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(freighterApi.requestAccess).mockResolvedValue({ address: 'GTEST' });
    vi.mocked(freighterApi.getAddress).mockResolvedValue({ address: 'GTEST' });
    vi.mocked(freighterApi.getNetwork).mockResolvedValue({
      network: 'PUBLIC',
      networkPassphrase: 'Public Global Stellar Network ; September 2015',
    });
  });

  it('stays disconnected when a Freighter API call fails unexpectedly', async () => {
    vi.mocked(freighterApi.getNetwork).mockResolvedValue({
      network: '',
      networkPassphrase: '',
      error: { code: 500, message: 'Wallet API unavailable' },
    });
    const onConnect = vi.fn();
    render(<WalletProvider adapter={freighterApi}><ConnectButton onConnect={onConnect} /></WalletProvider>);

    fireEvent.click(screen.getByRole('button', { name: /connect wallet/i }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: /^connect$/i })
    );

    expect(
      await screen.findByText('Connection failed. Please try again.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /connect wallet/i })).toHaveClass('error');
    expect(onConnect).not.toHaveBeenCalled();
  });

  it('retries the wallet connection after a failure', async () => {
    vi.mocked(freighterApi.getAddress).mockResolvedValueOnce({ address: '' });
    const onConnect = vi.fn();
    render(<WalletProvider adapter={freighterApi}><ConnectButton onConnect={onConnect} /></WalletProvider>);

    fireEvent.click(screen.getByRole('button', { name: /connect wallet/i }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: /^connect$/i })
    );
    await screen.findByText('Connection failed. Please try again.');

    vi.mocked(freighterApi.getAddress).mockResolvedValueOnce({ address: 'GTEST' });
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: /^connect$/i })
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /wallet connected:/i })).toBeInTheDocument();
    });
    expect(onConnect).toHaveBeenCalledWith('GTEST');
  });
});
