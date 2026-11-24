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

  it('disconnects wallet when disconnect button is clicked', async () => {
    render(
      <ConnectButton
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        connectDelayMs={0}
        randomFn={() => 0.9}
      />
    );
    
    // First connect
    const button = screen.getByRole('button', { name: /connect wallet/i });
    fireEvent.click(button);
    
    const connectButton = getModalConnectButton();
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      const connectedButton = screen.getByRole('button', { name: /wallet connected:/i });
      expect(connectedButton).toBeInTheDocument();
    });
    
    // Open dropdown and disconnect
    const connectedButton = screen.getByRole('button', { name: /wallet connected:/i });
    fireEvent.click(connectedButton);
    
    const disconnectButton = screen.getByText(/disconnect/i);
    fireEvent.click(disconnectButton);
    
    expect(onDisconnect).toHaveBeenCalled();
    
    // Should return to disconnected state
    await waitFor(() => {
      const resetButton = screen.getByRole('button', { name: /connect wallet/i });
      expect(resetButton).toBeInTheDocument();
      expect(resetButton.className).toMatch(/disconnected/);
    });
  });

  it('has proper accessibility attributes', () => {
    render(<ConnectButton />);
    
    const button = screen.getByRole('button', { name: /connect wallet/i });
    expect(button).toHaveAttribute('aria-label', 'Connect wallet');
    expect(button).not.toHaveAttribute('aria-busy');
  });

  it('toggles aria-expanded on the connected trigger', async () => {
    render(
      <ConnectButton
        onConnect={onConnect}
        connectDelayMs={0}
        randomFn={() => 0.9}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /connect wallet/i }));
    fireEvent.click(getModalConnectButton());

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /wallet connected:/i })).toBeInTheDocument();
    });

    const connectedButton = screen.getByRole('button', { name: /wallet connected:/i });
    expect(connectedButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(connectedButton);
    expect(connectedButton).toHaveAttribute('aria-expanded', 'true');
    expect(connectedButton).toHaveAttribute('aria-controls');

    fireEvent.click(connectedButton);
    expect(connectedButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the dropdown with Escape and returns focus to the trigger', async () => {
    render(
      <ConnectButton
        onConnect={onConnect}
        connectDelayMs={0}
        randomFn={() => 0.9}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /connect wallet/i }));
    fireEvent.click(getModalConnectButton());

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /wallet connected:/i })).toBeInTheDocument();
    });

    const connectedButton = screen.getByRole('button', { name: /wallet connected:/i });
    fireEvent.click(connectedButton);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
    expect(connectedButton).toHaveFocus();
  });

  it('closes the dropdown on outside pointerdown', async () => {
    render(
      <ConnectButton
        onConnect={onConnect}
        connectDelayMs={0}
        randomFn={() => 0.9}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /connect wallet/i }));
    fireEvent.click(getModalConnectButton());

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /wallet connected:/i })).toBeInTheDocument();
    });

    const connectedButton = screen.getByRole('button', { name: /wallet connected:/i });
    fireEvent.click(connectedButton);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.pointerDown(document.body);

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('navigates menu items with arrow keys', async () => {
    render(
      <ConnectButton
        onConnect={onConnect}
        connectDelayMs={0}
        randomFn={() => 0.9}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /connect wallet/i }));
    fireEvent.click(getModalConnectButton());

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /wallet connected:/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /wallet connected:/i }));

    const menu = screen.getByRole('menu');
    const items = within(menu).getAllByRole('menuitem');
    expect(items.length).toBeGreaterThan(1);
    expect(items[0]).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(items[1]).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(items[0]).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'End' });
    expect(items[items.length - 1]).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'Home' });
    expect(items[0]).toHaveFocus();
  });

  it('shows aria-busy during connection', async () => {
    render(
      <ConnectButton
        onConnect={onConnect}
        connectDelayMs={100}
        randomFn={() => 0.9}
      />
    );
    
    const button = screen.getByRole('button', { name: /connect wallet/i });
    fireEvent.click(button);
    
    const connectButton = getModalConnectButton();
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      const connectingButton = screen.getByRole('button', { name: /connecting/i });
      expect(connectingButton).toHaveAttribute('aria-busy', 'true');
    });
  });

  it('shows wallet address in aria-label when connected', async () => {
    render(
      <ConnectButton
        onConnect={onConnect}
        connectDelayMs={0}
        randomFn={() => 0.9}
      />
    );
    
    const button = screen.getByRole('button', { name: /connect wallet/i });
    fireEvent.click(button);
    
    const connectButton = getModalConnectButton();
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      const connectedButton = screen.getByRole('button', { name: /wallet connected:/i });
      expect(connectedButton).toHaveAttribute(
        'aria-label',
        'Wallet connected: GB3K4Y5QYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQ'
      );
    });
  });
});

describe('ConnectButton Edge Cases', () => {
  it('handles repeated connect attempts', async () => {
    const onConnect = vi.fn();
    render(
      <ConnectButton
        onConnect={onConnect}
        connectDelayMs={100}
        randomFn={() => 0.9}
      />
    );
    
    const button = screen.getByRole('button', { name: /connect wallet/i });
    
    // First attempt
    fireEvent.click(button);
    const connectButton1 = getModalConnectButton();
    fireEvent.click(connectButton1);
    
    // Second attempt while first is still connecting should be ignored
    fireEvent.click(button);
    expect(button).toBeDisabled();
    
    await waitFor(() => {
      expect(onConnect).toHaveBeenCalledTimes(1);
    });
  });

  it('handles modal cancellation during connection', async () => {
    render(
      <ConnectButton
        connectDelayMs={100}
        randomFn={() => 0.9}
      />
    );
    
    const button = screen.getByRole('button', { name: /connect wallet/i });
    fireEvent.click(button);
    
    const connectButton = getModalConnectButton();
    fireEvent.click(connectButton);
    
    // Close modal while connecting
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const closeButton = screen.getByLabelText(/close modal/i);
    fireEvent.click(closeButton);
    
    // Should reset to disconnected state
    await waitFor(() => {
      const resetButton = screen.getByRole('button', { name: /connect wallet/i });
      expect(resetButton).toBeInTheDocument();
      expect(resetButton.className).toMatch(/disconnected/);
      expect(resetButton).not.toBeDisabled();
    });
  });

  it('handles retry after error', async () => {
    const randomFn = vi.fn().mockReturnValueOnce(0.1).mockReturnValueOnce(0.9);
    render(
      <ConnectButton
        connectDelayMs={0}
        randomFn={randomFn}
      />
    );
    
    const button = screen.getByRole('button', { name: /connect wallet/i });
    fireEvent.click(button);
    
    const connectButton = getModalConnectButton();
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /connection failed/i })).toBeInTheDocument();
      expect(screen.getByText(/connection rejected by user/i)).toBeInTheDocument();
    });
    
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      const resetButton = screen.getByRole('button', { name: /connect wallet/i });
      expect(resetButton).toBeInTheDocument();
      expect(resetButton.className).toMatch(/disconnected/);
    });
  });
});
