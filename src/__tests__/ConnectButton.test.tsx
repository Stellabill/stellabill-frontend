import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConnectButton, { ConnectionState } from '../components/ConnectButton';

const getModalConnectButton = () => {
  const modal = screen.getByRole('dialog');
  return within(modal)
    .getAllByRole('button', { name: /^connect$/i })
    .find((button) => !(button as HTMLButtonElement).disabled) as HTMLButtonElement;
};

describe('ConnectButton', () => {
  const onConnect = vi.fn();
  const onDisconnect = vi.fn();

  beforeEach(() => {
    onConnect.mockClear();
    onDisconnect.mockClear();
    document.body.innerHTML = '';
  });

  it('renders in disconnected state initially', () => {
    render(<ConnectButton />);
    
    const button = screen.getByRole('button', { name: /connect wallet/i });
    expect(button).toBeInTheDocument();
    expect(button.className).toMatch(/disconnected/);
    expect(button).not.toBeDisabled();
  });

  it('opens modal when clicked in disconnected state', () => {
    render(<ConnectButton />);
    
    const button = screen.getByRole('button', { name: /connect wallet/i });
    fireEvent.click(button);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /connect your/i })).toBeInTheDocument();
    expect(screen.getByText(/stellar wallet/i)).toBeInTheDocument();
  });

  it('shows connecting state with spinner during connection', async () => {
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
      expect(connectingButton).toBeInTheDocument();
      expect(connectingButton).toBeDisabled();
      expect(connectingButton.className).toMatch(/connecting/);
    });
  });

  it('shows connected state with wallet address after successful connection', async () => {
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
      expect(connectedButton).toBeInTheDocument();
      expect(connectedButton.className).toMatch(/connected/);
      expect(onConnect).toHaveBeenCalledWith(
        'GB3K4Y5QYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQ'
      );
    });
  });

  it('shows error state after failed connection', async () => {
    render(
      <ConnectButton
        onConnect={onConnect}
        connectDelayMs={0}
        randomFn={() => 0.1}
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
  });

  it('opens wallet dropdown when connected button is clicked', async () => {
    render(
      <ConnectButton
        onConnect={onConnect}
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
    
    // Then click to open dropdown
    const connectedButton = screen.getByRole('button', { name: /wallet connected:/i });
    fireEvent.click(connectedButton);
    
    expect(screen.getByText(/connected wallet/i)).toBeInTheDocument();
    expect(screen.getByText(/copy address/i)).toBeInTheDocument();
    expect(screen.getByText(/switch wallet/i)).toBeInTheDocument();
    expect(screen.getByText(/disconnect/i)).toBeInTheDocument();
  });

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
