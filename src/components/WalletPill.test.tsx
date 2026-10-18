import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
});
