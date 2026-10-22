import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import WalletPill from './WalletPill';

const LONG_ADDRESS = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890XYZ9';

function openPill() {
  fireEvent.click(screen.getByRole('button', { expanded: false }));
}

describe('WalletPill', () => {
  const onDisconnect = vi.fn();

  beforeEach(() => {
    onDisconnect.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('address truncation', () => {
    it('truncates a long address to first-4 ... last-4', () => {
      render(<WalletPill address={LONG_ADDRESS} onDisconnect={onDisconnect} />);

      expect(screen.getByText('GABC...XYZ9')).toBeInTheDocument();
      expect(screen.queryByText(LONG_ADDRESS)).not.toBeInTheDocument();
    });

    it('leaves an address of exactly 10 characters intact (boundary)', () => {
      const ten = 'GABCDE1234';
      render(<WalletPill address={ten} onDisconnect={onDisconnect} />);

      expect(screen.getByText(ten)).toBeInTheDocument();
    });

    it('truncates at 11 characters (boundary)', () => {
      render(<WalletPill address="GABCDE12345" onDisconnect={onDisconnect} />);

      // slice(0,4) + "..." + slice(-4)
      expect(screen.getByText('GABC...2345')).toBeInTheDocument();
    });

    it('handles an empty address without throwing', () => {
      render(<WalletPill address="" onDisconnect={onDisconnect} />);
      expect(screen.getByRole('button', { expanded: false })).toBeInTheDocument();
    });
  });

  describe('network indicator', () => {
    it('defaults to Testnet (orange indicator)', () => {
      const { container } = render(
        <WalletPill address={LONG_ADDRESS} onDisconnect={onDisconnect} />,
      );

      expect(container.querySelector('.bg-orange-400')).not.toBeNull();
      expect(container.querySelector('.bg-green-400')).toBeNull();
    });

    it('renders a green indicator for Mainnet', () => {
      const { container } = render(
        <WalletPill address={LONG_ADDRESS} network="Mainnet" onDisconnect={onDisconnect} />,
      );

      expect(container.querySelector('.bg-green-400')).not.toBeNull();
      expect(container.querySelector('.bg-orange-400')).toBeNull();
    });
  });

  describe('explorer link and network mismatch', () => {
    it('opens the Testnet explorer URL when on Testnet by default', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      render(<WalletPill address={LONG_ADDRESS} onDisconnect={onDisconnect} />);

      openPill();
      fireEvent.click(screen.getByRole('button', { name: /view in explorer/i }));

      expect(openSpy).toHaveBeenCalledWith(
        `https://stellar.expert/explorer/testnet/account/${LONG_ADDRESS}`,
        '_blank',
      );
    });

    it('opens the public explorer URL when network is Mainnet', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      render(
        <WalletPill
          address={LONG_ADDRESS}
          network="Mainnet"
          expectedNetwork="Mainnet"
          onDisconnect={onDisconnect}
        />,
      );

      openPill();
      fireEvent.click(screen.getByRole('button', { name: /view in explorer/i }));

      expect(openSpy).toHaveBeenCalledWith(
        `https://stellar.expert/explorer/public/account/${LONG_ADDRESS}`,
        '_blank',
      );
    });

    it('renders an accessible network mismatch warning in pill and dropdown when wallet network differs from expected', () => {
      render(
        <WalletPill
          address={LONG_ADDRESS}
          network="Mainnet"
          expectedNetwork="Testnet"
          onDisconnect={onDisconnect}
        />,
      );

      const pillStatus = screen.getByRole('status');
      expect(pillStatus).toHaveAccessibleName(
        /network mismatch: wallet is on mainnet, expected testnet/i,
      );
      expect(pillStatus).toHaveTextContent(/wrong network/i);

      openPill();
      const dropdownAlert = screen.getByRole('alert');
      expect(dropdownAlert).toHaveTextContent(/network mismatch/i);
      expect(dropdownAlert).toHaveTextContent(/wallet is on mainnet, but expected testnet/i);
    });

    it('does not render a mismatch warning when wallet network matches expected network', () => {
      render(<WalletPill address={LONG_ADDRESS} network="Testnet" onDisconnect={onDisconnect} />);

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      openPill();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('dropdown open/close state transitions', () => {
    it('is closed initially and exposes aria-expanded=false', () => {
      render(<WalletPill address={LONG_ADDRESS} onDisconnect={onDisconnect} />);

      const trigger = screen.getByRole('button', { expanded: false });
      expect(trigger).toHaveAttribute('aria-haspopup', 'true');
      expect(screen.queryByText('Connected wallet')).not.toBeInTheDocument();
    });

    it('opens the dropdown on click and flips aria-expanded', () => {
      render(<WalletPill address={LONG_ADDRESS} onDisconnect={onDisconnect} />);
      openPill();

      expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument();
      expect(screen.getByText('Connected wallet')).toBeInTheDocument();
    });

    it('closes again when the pill is clicked a second time', () => {
      render(<WalletPill address={LONG_ADDRESS} onDisconnect={onDisconnect} />);
      openPill();

      fireEvent.click(screen.getByRole('button', { expanded: true }));

      expect(screen.getByRole('button', { expanded: false })).toBeInTheDocument();
      expect(screen.queryByText('Connected wallet')).not.toBeInTheDocument();
    });

    it('shows the full, untruncated address inside the dropdown', () => {
      render(<WalletPill address={LONG_ADDRESS} onDisconnect={onDisconnect} />);
      openPill();

      const dropdown = screen.getByText('Connected wallet').closest('div')!.parentElement!;
      expect(within(dropdown).getByText(LONG_ADDRESS)).toBeInTheDocument();
    });
  });

  describe('dismissal behaviour', () => {
    it('closes the dropdown on Escape', () => {
      render(<WalletPill address={LONG_ADDRESS} onDisconnect={onDisconnect} />);
      openPill();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.getByRole('button', { expanded: false })).toBeInTheDocument();
      expect(screen.queryByText('Connected wallet')).not.toBeInTheDocument();
    });

    it('ignores non-Escape key presses', () => {
      render(<WalletPill address={LONG_ADDRESS} onDisconnect={onDisconnect} />);
      openPill();

      fireEvent.keyDown(document, { key: 'Enter' });

      expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument();
    });

    it('closes the dropdown on an outside mousedown', () => {
      render(<WalletPill address={LONG_ADDRESS} onDisconnect={onDisconnect} />);
      openPill();

      fireEvent.mouseDown(document.body);

      expect(screen.getByRole('button', { expanded: false })).toBeInTheDocument();
    });

    it('stays open when the mousedown happens inside the pill', () => {
      render(<WalletPill address={LONG_ADDRESS} onDisconnect={onDisconnect} />);
      openPill();

      fireEvent.mouseDown(screen.getByText('Connected wallet'));

      expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument();
      expect(screen.getByText('Connected wallet')).toBeInTheDocument();
    });
  });

  describe('disconnect callback', () => {
    it('invokes onDisconnect exactly once when Disconnect is chosen', () => {
      render(<WalletPill address={LONG_ADDRESS} onDisconnect={onDisconnect} />);
      openPill();

      fireEvent.click(screen.getByRole('button', { name: /disconnect/i }));

      expect(onDisconnect).toHaveBeenCalledTimes(1);
    });

    it('does not invoke onDisconnect while the dropdown is closed', () => {
      render(<WalletPill address={LONG_ADDRESS} onDisconnect={onDisconnect} />);

      expect(onDisconnect).not.toHaveBeenCalled();
    });
  });

  describe('wallet history navigation', () => {
    it('navigates to /wallet when Wallet History is clicked inside a router', () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={<WalletPill address={LONG_ADDRESS} onDisconnect={onDisconnect} />}
            />
            <Route path="/wallet" element={<div data-testid="wallet-page">Wallet Page</div>} />
          </Routes>
        </MemoryRouter>,
      );

      openPill();
      fireEvent.click(screen.getByRole('button', { name: /wallet history/i }));

      expect(screen.getByTestId('wallet-page')).toBeInTheDocument();
    });

    it('renders WalletDetailView at /wallet route in App', async () => {
      const scrollSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
      const { default: App } = await import('../App');
      render(
        <MemoryRouter initialEntries={['/wallet']}>
          <App />
        </MemoryRouter>,
      );

      expect(
        await screen.findByRole('heading', { name: /wallet details & history/i }, { timeout: 5000 }),
      ).toBeInTheDocument();
      scrollSpy.mockRestore();
    });

    it('calls custom onOpenHistory handler when provided', () => {
      const onOpenHistory = vi.fn();
      render(
        <WalletPill
          address={LONG_ADDRESS}
          onDisconnect={onDisconnect}
          onOpenHistory={onOpenHistory}
        />,
      );

      openPill();
      fireEvent.click(screen.getByRole('button', { name: /wallet history/i }));

      expect(onOpenHistory).toHaveBeenCalledTimes(1);
    });
  });

  describe('switch wallet flow', () => {
    it('opens the connect modal in disconnected state and replaces the previous address after a new connection', () => {
      const onConnect = vi.fn();
      render(
        <WalletPill
          address={LONG_ADDRESS}
          onDisconnect={onDisconnect}
          onConnect={onConnect}
        />,
      );

      expect(screen.getByText('GABC...XYZ9')).toBeInTheDocument();

      openPill();
      fireEvent.click(screen.getByRole('button', { name: /switch wallet/i }));

      expect(screen.queryByText('GABC...XYZ9')).not.toBeInTheDocument();
      expect(screen.queryByText(LONG_ADDRESS)).not.toBeInTheDocument();

      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      expect(within(modal).getByRole('heading', { name: /connect your wallet/i })).toBeInTheDocument();

      const connectBtn = within(modal).getByRole('button', { name: /^connect$/i });
      fireEvent.click(connectBtn);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText('GABC...XYZ9')).not.toBeInTheDocument();
      expect(screen.getByText('GB3K...YQYQ')).toBeInTheDocument();
      expect(onConnect).toHaveBeenCalledWith('GB3K4Y5QYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQ');
    });

    it('invokes onDisconnect when the switch wallet modal is closed without connecting', () => {
      render(<WalletPill address={LONG_ADDRESS} onDisconnect={onDisconnect} />);

      openPill();
      fireEvent.click(screen.getByRole('button', { name: /switch wallet/i }));

      const modal = screen.getByRole('dialog');
      fireEvent.click(within(modal).getByRole('button', { name: /close modal/i }));

      expect(onDisconnect).toHaveBeenCalledTimes(1);
    });
  });
});
