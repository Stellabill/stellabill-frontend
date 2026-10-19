import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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

const publicKey = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

const clickConnect = () => {
  fireEvent.click(screen.getByRole('button', { name: /connect wallet/i }));
  fireEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: /^connect$/i })
  );
};

describe('ConnectButton', () => {
  const onConnect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    onConnect.mockClear();
    vi.mocked(freighterApi.isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(freighterApi.requestAccess).mockResolvedValue({ address: publicKey });
    vi.mocked(freighterApi.getAddress).mockResolvedValue({ address: publicKey });
    vi.mocked(freighterApi.getNetwork).mockResolvedValue({
      network: 'PUBLIC',
      networkPassphrase: 'Public Global Stellar Network ; September 2015',
    });
  });

  it('starts disconnected and opens the wallet modal', () => {
    render(<WalletProvider adapter={freighterApi}><ConnectButton /></WalletProvider>);

    const button = screen.getByRole('button', { name: /connect wallet/i });
    expect(button).toBeInTheDocument();
    expect(button.className).toMatch(/disconnected/);
    fireEvent.click(button);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /connect your/i })).toBeInTheDocument();
  });

  it("connects using Freighter's public key", async () => {
    render(<WalletProvider adapter={freighterApi}><ConnectButton onConnect={onConnect} /></WalletProvider>);

    clickConnect();

    const connectedButton = await screen.findByRole('button', { name: /wallet connected:/i });
    expect(connectedButton).toHaveAttribute('aria-label', `Wallet connected: ${publicKey}`);
    expect(onConnect).toHaveBeenCalledWith(publicKey);
    expect(freighterApi.isConnected).toHaveBeenCalledOnce();
    expect(freighterApi.requestAccess).toHaveBeenCalledOnce();
    expect(freighterApi.getAddress).toHaveBeenCalledOnce();
    expect(freighterApi.getNetwork).toHaveBeenCalledOnce();
  });

  it('shows an install prompt when Freighter is not installed', async () => {
    vi.mocked(freighterApi.isConnected).mockResolvedValue({ isConnected: false });
    render(<WalletProvider adapter={freighterApi}><ConnectButton onConnect={onConnect} /></WalletProvider>);

    clickConnect();

    expect(await screen.findByText('Freighter is not installed.')).toBeInTheDocument();
    const installLink = screen.getByRole('link', { name: /install freighter/i });
    expect(installLink).toHaveAttribute('href', 'https://www.freighter.app/');
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(onConnect).not.toHaveBeenCalled();
    expect(freighterApi.requestAccess).not.toHaveBeenCalled();
  });

  it('shows a retryable error when the user rejects access', async () => {
    vi.mocked(freighterApi.requestAccess).mockResolvedValue({
      address: '',
      error: { code: 4001, message: 'User declined access' },
    });
    render(<WalletProvider adapter={freighterApi}><ConnectButton onConnect={onConnect} /></WalletProvider>);

    clickConnect();

    expect(await screen.findByText('Connection rejected by user.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /connection failed/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(onConnect).not.toHaveBeenCalled();
    expect(freighterApi.getAddress).not.toHaveBeenCalled();
  });

  it('ignores a late wallet result after the modal is cancelled', async () => {
    let resolveAddress: ((value: { address: string }) => void) | undefined;
    vi.mocked(freighterApi.getAddress).mockReturnValue(
      new Promise((resolve) => {
        resolveAddress = resolve;
      })
    );
    render(<WalletProvider adapter={freighterApi}><ConnectButton onConnect={onConnect} /></WalletProvider>);

    clickConnect();
    await waitFor(() => expect(freighterApi.getAddress).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole('button', { name: /close modal/i }));
    resolveAddress?.({ address: publicKey });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /wallet connected:/i })).not.toBeInTheDocument();
    expect(onConnect).not.toHaveBeenCalled();
  });

  it('disconnects a successfully connected wallet', async () => {
    const onDisconnect = vi.fn();
    render(<WalletProvider adapter={freighterApi}><ConnectButton onConnect={onConnect} onDisconnect={onDisconnect} /></WalletProvider>);
    clickConnect();

    const connectedButton = await screen.findByRole('button', { name: /wallet connected:/i });
    fireEvent.click(connectedButton);
    fireEvent.click(screen.getByText(/disconnect/i));

    expect(onDisconnect).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
  });
});
