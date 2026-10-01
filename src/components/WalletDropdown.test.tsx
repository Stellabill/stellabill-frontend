import { render, screen, fireEvent, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WalletDropdown from './WalletDropdown';

const ADDRESS = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

type Overrides = Partial<{
  isOpen: boolean;
  address: string;
  onClose: ReturnType<typeof vi.fn>;
  onDisconnect: ReturnType<typeof vi.fn>;
  onOpenHistory: ReturnType<typeof vi.fn>;
}>;

function renderDropdown(overrides: Overrides = {}) {
  const onClose = overrides.onClose ?? vi.fn();
  const onDisconnect = overrides.onDisconnect ?? vi.fn();
  const props = {
    isOpen: overrides.isOpen ?? true,
    address: overrides.address ?? ADDRESS,
    onClose,
    onDisconnect,
    ...(overrides.onOpenHistory ? { onOpenHistory: overrides.onOpenHistory } : {}),
  };
  const utils = render(<WalletDropdown {...props} />);
  return { ...utils, props, onClose, onDisconnect };
}

describe('WalletDropdown', () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    writeText.mockClear();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    vi.useRealTimers();
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

    it('renders an address with a copy control', () => {
      renderDropdown();
      expect(screen.getByTitle('Copy address')).toBeInTheDocument();
    });
  });

  // ── Clipboard / copied-toast lifecycle ─────────────────────────────────────
  describe('copy address', () => {
    it('writes the address to the clipboard', () => {
      renderDropdown();
      fireEvent.click(screen.getByTitle('Copy address'));
      expect(writeText).toHaveBeenCalledTimes(1);
      expect(writeText).toHaveBeenCalledWith(ADDRESS);
    });

    it('shows the copied toast immediately after a copy', () => {
      renderDropdown();
      expect(screen.queryByText(/copied to clipboard/i)).not.toBeInTheDocument();
      fireEvent.click(screen.getByTitle('Copy address'));
      expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument();
    });

    it('hides the copied toast after the 2s window elapses', () => {
      vi.useFakeTimers();
      renderDropdown();
      fireEvent.click(screen.getByTitle('Copy address'));
      expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.queryByText(/copied to clipboard/i)).not.toBeInTheDocument();
    });

    it('keeps the toast visible before the 2s window elapses', () => {
      vi.useFakeTimers();
      renderDropdown();
      fireEvent.click(screen.getByTitle('Copy address'));

      act(() => {
        vi.advanceTimersByTime(1999);
      });
      expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument();
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
    it('opens the Stellar expert page for the wallet address in a new tab', () => {
      renderDropdown();
      fireEvent.click(screen.getByText(/view in explorer/i));
      expect(openSpy).toHaveBeenCalledTimes(1);
      const [url, target] = openSpy.mock.calls[0];
      expect(url).toBe(`https://stellar.expert/explorer/public/account/${ADDRESS}`);
      expect(target).toBe('_blank');
    });
  });

  // ── Switch wallet closes the dropdown ─────────────────────────────────────
  describe('switch wallet', () => {
    it('calls onClose when switch wallet is clicked', () => {
      const { onClose } = renderDropdown();
      fireEvent.click(screen.getByText(/switch wallet/i));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
