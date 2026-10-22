import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WalletDropdown from './WalletDropdown';
import { copyToClipboard } from '../utils/clipboard';

vi.mock('../utils/clipboard', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/clipboard')>();
  return { ...actual, copyToClipboard: vi.fn(actual.copyToClipboard) };
});

const mockedCopyToClipboard = vi.mocked(copyToClipboard);

const ADDRESS = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

type Overrides = Partial<{
  isOpen: boolean;
  address: string;
  onClose: ReturnType<typeof vi.fn>;
  onDisconnect: ReturnType<typeof vi.fn>;
  onSwitchWallet: ReturnType<typeof vi.fn>;
  onOpenHistory: ReturnType<typeof vi.fn>;
  network: string;
  expectedNetwork: string;
}>;

function renderDropdown(overrides: Overrides = {}) {
  const onClose = overrides.onClose ?? vi.fn();
  const onDisconnect = overrides.onDisconnect ?? vi.fn();
  const props = {
    isOpen: overrides.isOpen ?? true,
    address: overrides.address ?? ADDRESS,
    onClose,
    onDisconnect,
    ...(overrides.onSwitchWallet ? { onSwitchWallet: overrides.onSwitchWallet } : {}),
    ...(overrides.onOpenHistory ? { onOpenHistory: overrides.onOpenHistory } : {}),
    ...(overrides.network ? { network: overrides.network } : {}),
    ...(overrides.expectedNetwork ? { expectedNetwork: overrides.expectedNetwork } : {}),
  };
  const utils = render(<WalletDropdown {...props} />);
  return { ...utils, props, onClose, onDisconnect };
}

describe('WalletDropdown', () => {
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockedCopyToClipboard.mockClear();
    mockedCopyToClipboard.mockResolvedValue(true);
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    openSpy.mockRestore();
  });

  // ── The `if (!isOpen) return null` failure/empty-result path ────────────────
  describe('closed state (explicit empty-result branch)', () => {
    it('renders nothing at all when isOpen is false', () => {
      const { container } = renderDropdown({ isOpen: false });
      expect(container).toBeEmptyDOMElement();
    });

    it('does not render the wallet address when closed', () => {
      renderDropdown({ isOpen: false });
      expect(screen.queryByText(ADDRESS)).not.toBeInTheDocument();
    });

    it('does not render any action buttons when closed', () => {
      renderDropdown({ isOpen: false });
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('ignores clicks on the document while closed (no handlers mounted)', () => {
      const onClose = vi.fn();
      renderDropdown({ isOpen: false, onClose });
      fireEvent.click(document.body);
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // ── Neighboring normal path ────────────────────────────────────────────────
  describe('open state', () => {
    it('renders the connected wallet address', () => {
      renderDropdown();
      expect(screen.getByText(ADDRESS)).toBeInTheDocument();
    });

    it('shows the connected status affordance', () => {
      renderDropdown();
      expect(screen.getByText(/connected wallet/i)).toBeInTheDocument();
      expect(screen.getByText(/^connected$/i)).toBeInTheDocument();
    });

    it('renders explorer, switch wallet, history and disconnect actions', () => {
      renderDropdown();
      expect(screen.getByText(/view in explorer/i)).toBeInTheDocument();
      expect(screen.getByText(/switch wallet/i)).toBeInTheDocument();
      expect(screen.getByText(/wallet history/i)).toBeInTheDocument();
      expect(screen.getByText(/disconnect/i)).toBeInTheDocument();
    });

    it('uses distinct icons for Switch wallet and Wallet History', () => {
      renderDropdown();
      const switchBtn = screen.getByRole('button', { name: /switch wallet/i });
      const historyBtn = screen.getByRole('button', { name: /wallet history/i });
      const switchSvg = switchBtn.querySelector('svg');
      const historySvg = historyBtn.querySelector('svg');
      expect(switchSvg).not.toBeNull();
      expect(historySvg).not.toBeNull();
      expect(switchSvg?.innerHTML).not.toEqual(historySvg?.innerHTML);
    });

    it('renders an address with a copy control', () => {
      renderDropdown();
      expect(screen.getByTitle('Copy address')).toBeInTheDocument();
    });
  });

  // ── Clipboard / copied-toast lifecycle ─────────────────────────────────────
  describe('copy address', () => {
    it('writes the address through copyToClipboard', () => {
      renderDropdown();
      fireEvent.click(screen.getByTitle('Copy address'));
      expect(mockedCopyToClipboard).toHaveBeenCalledTimes(1);
      expect(mockedCopyToClipboard).toHaveBeenCalledWith(ADDRESS);
    });

    it('shows the copied toast after a successful copy', async () => {
      renderDropdown();
      expect(screen.queryAllByText(/copied to clipboard/i)).toHaveLength(0);
      fireEvent.click(screen.getByTitle('Copy address'));
      expect((await screen.findAllByText(/copied to clipboard/i)).length).toBeGreaterThan(0);
      expect(screen.getByRole('status')).toHaveTextContent(/wallet address copied to clipboard/i);
    });

    it('does not show success and announces failure when copy fails', async () => {
      mockedCopyToClipboard.mockResolvedValueOnce(false);
      renderDropdown();
      fireEvent.click(screen.getByTitle('Copy address'));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/copy failed — select and copy manually/i);
      });
      expect(screen.queryByText(/copied to clipboard/i)).not.toBeInTheDocument();
      expect(screen.getAllByText(/copy failed — select and copy manually/i).length).toBeGreaterThan(0);
    });

    it('hides the copied toast after the 2s window elapses', async () => {
      vi.useFakeTimers();
      renderDropdown();
      await act(async () => {
        fireEvent.click(screen.getByTitle('Copy address'));
      });
      expect(screen.getAllByText(/copied to clipboard/i).length).toBeGreaterThan(0);

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.queryAllByText(/copied to clipboard/i)).toHaveLength(0);
    });

    it('keeps the toast visible before the 2s window elapses', async () => {
      vi.useFakeTimers();
      renderDropdown();
      await act(async () => {
        fireEvent.click(screen.getByTitle('Copy address'));
      });

      act(() => {
        vi.advanceTimersByTime(1999);
      });
      expect(screen.getAllByText(/copied to clipboard/i).length).toBeGreaterThan(0);
    });
  });

  // ── Disconnect path (calls both disconnect + close) ────────────────────────
  describe('disconnect', () => {
    it('calls onDisconnect and onClose exactly once each', () => {
      const onDisconnect = vi.fn();
      const { onClose } = renderDropdown({ onDisconnect });
      fireEvent.click(screen.getByText(/disconnect/i));
      expect(onDisconnect).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('disconnects before closing the dropdown', () => {
      const order: string[] = [];
      const onDisconnect = vi.fn(() => order.push('disconnect'));
      const onClose = vi.fn(() => order.push('close'));
      renderDropdown({ onDisconnect, onClose });
      fireEvent.click(screen.getByText(/disconnect/i));
      expect(order).toEqual(['disconnect', 'close']);
    });
  });

  // ── Wallet history optional callback ──────────────────────────────────────
  describe('wallet history', () => {
    it('closes and opens history when the handler is provided', () => {
      const onOpenHistory = vi.fn();
      const { onClose } = renderDropdown({ onOpenHistory });
      fireEvent.click(screen.getByText(/wallet history/i));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onOpenHistory).toHaveBeenCalledTimes(1);
    });

    it('still closes when no history handler is provided (optional prop boundary)', () => {
      const { onClose } = renderDropdown();
      expect(() => fireEvent.click(screen.getByText(/wallet history/i))).not.toThrow();
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ── Explorer link ─────────────────────────────────────────────────────────
  describe('view in explorer', () => {
    it('defaults to the Testnet Stellar Expert page for the wallet address in a new tab', () => {
      renderDropdown();
      fireEvent.click(screen.getByText(/view in explorer/i));
      expect(openSpy).toHaveBeenCalledTimes(1);
      const [url, target] = openSpy.mock.calls[0];
      expect(url).toBe(`https://stellar.expert/explorer/testnet/account/${ADDRESS}`);
      expect(target).toBe('_blank');
    });

    it('opens the public (Mainnet) Stellar Expert page when network is Mainnet', () => {
      renderDropdown({ network: 'Mainnet' });
      fireEvent.click(screen.getByText(/view in explorer/i));
      expect(openSpy).toHaveBeenCalledTimes(1);
      const [url, target] = openSpy.mock.calls[0];
      expect(url).toBe(`https://stellar.expert/explorer/public/account/${ADDRESS}`);
      expect(target).toBe('_blank');
      expect(features).toBe('noopener,noreferrer');
    });
  });

  // ── Network mismatch warning ──────────────────────────────────────────────
  describe('network mismatch warning', () => {
    it('does not show a warning when wallet network matches expected network', () => {
      renderDropdown({ network: 'Testnet' });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('renders an accessible alert warning when wallet network differs from expected network', () => {
      renderDropdown({ network: 'Mainnet', expectedNetwork: 'Testnet' });
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/network mismatch/i);
      expect(alert).toHaveTextContent(/wallet is on mainnet, but expected testnet/i);
    });

    it('detects mismatch against VITE_STELLAR_NETWORK env configuration', () => {
      vi.stubEnv('VITE_STELLAR_NETWORK', 'mainnet');
      renderDropdown({ network: 'Testnet' });
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/wallet is on testnet, but expected mainnet/i);
    });
  });

  // ── Switch wallet closes the dropdown ─────────────────────────────────────
  describe('switch wallet', () => {
    it('calls onClose and onSwitchWallet when provided', () => {
      const onSwitchWallet = vi.fn();
      const { onClose, onDisconnect } = renderDropdown({ onSwitchWallet });
      fireEvent.click(screen.getByText(/switch wallet/i));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onSwitchWallet).toHaveBeenCalledTimes(1);
      expect(onDisconnect).not.toHaveBeenCalled();
    });

    it('falls back to onDisconnect and onClose when onSwitchWallet is not provided', () => {
      const { onClose, onDisconnect } = renderDropdown();
      fireEvent.click(screen.getByText(/switch wallet/i));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onDisconnect).toHaveBeenCalledTimes(1);
    });
  });
});
