import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LandingNavbar from '../LandingNavbar';
import { BrowserRouter } from 'react-router-dom';

// Helper to find the enabled Freighter "Connect" button in the modal
const getModalConnectButton = () => {
  const modal = screen.getByRole('dialog');
  return within(modal)
    .getAllByRole('button', { name: /^connect$/i })
    .find((button) => !(button as HTMLButtonElement).disabled) as HTMLButtonElement;
};

const renderNavbar = () =>
  render(
    <BrowserRouter>
      <LandingNavbar />
    </BrowserRouter>
  );

describe('LandingNavbar', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('renders logo and navigation links', () => {
    render(
      <BrowserRouter>
        <LandingNavbar />
      </BrowserRouter>
    );
    // Logo link should be in the document
    const logo = screen.getByRole('link', { name: /^stellabill$/i });
    expect(logo).toBeInTheDocument();

    // Navigation links should be present (Product, Pricing, Docs, Contact)
    const navLinks = ['Product', 'Pricing', 'Docs', 'Contact'];
    navLinks.forEach((label) => {
      expect(screen.getAllByText(label).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('mobile menu toggles open and close', async () => {
    render(
      <BrowserRouter>
        <LandingNavbar />
      </BrowserRouter>
    );
    const toggleButton = screen.getByRole('button', { name: /main menu/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    // Open menu
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

    // Close menu by clicking toggle again
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows connect wallet button when not connected', () => {
    render(
      <BrowserRouter>
        <LandingNavbar />
      </BrowserRouter>
    );
    const connectBtns = screen.getAllByRole('button', { name: /connect wallet/i });
    expect(connectBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('opens wallet modal when connect button is clicked', () => {
    render(
      <BrowserRouter>
        <LandingNavbar />
      </BrowserRouter>
    );
    const connectBtn = screen.getAllByRole('button', { name: /connect wallet/i })[0];
    fireEvent.click(connectBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /connect your wallet/i })).toBeInTheDocument();
  });

  it('shows connecting state in modal during connection', async () => {
    render(
      <BrowserRouter>
        <LandingNavbar connectDelayMs={100} randomFn={() => 0.9} />
      </BrowserRouter>
    );
    const connectBtn = screen.getAllByRole('button', { name: /connect wallet/i })[0];
    fireEvent.click(connectBtn);

    const freighterBtn = getModalConnectButton();
    fireEvent.click(freighterBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /connecting\.\.\./i })).toBeInTheDocument();
      expect(screen.getByText(/awaiting approval/i)).toBeInTheDocument();
    });
  });

  it('connects successfully, closes modal, and displays actual connected address in WalletPill', async () => {
    const onConnect = vi.fn();
    render(
      <BrowserRouter>
        <LandingNavbar
          connectDelayMs={0}
          randomFn={() => 0.9}
          onConnect={onConnect}
        />
      </BrowserRouter>
    );

    const connectBtn = screen.getAllByRole('button', { name: /connect wallet/i })[0];
    fireEvent.click(connectBtn);

    const freighterBtn = getModalConnectButton();
    fireEvent.click(freighterBtn);

    await waitFor(() => {
      // Modal should be closed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      // Actual connected address (GB3K4Y5QYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQ truncated to GB3K...YQYQ)
      const pills = screen.getAllByText('GB3K...YQYQ');
      expect(pills.length).toBeGreaterThanOrEqual(1);
      // Old fake address should NOT exist
      expect(screen.queryByText(/GABC\.\.\.XYZ9/i)).not.toBeInTheDocument();
      expect(onConnect).toHaveBeenCalledWith('GB3K4Y5QYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQ');
    });
  });

  it('handles connection failure and allows retry', async () => {
    const randomFn = vi.fn().mockReturnValueOnce(0.1).mockReturnValueOnce(0.9);
    render(
      <BrowserRouter>
        <LandingNavbar connectDelayMs={0} randomFn={randomFn} />
      </BrowserRouter>
    );

    const connectBtn = screen.getAllByRole('button', { name: /connect wallet/i })[0];
    fireEvent.click(connectBtn);

    const freighterBtn = getModalConnectButton();
    fireEvent.click(freighterBtn);

    // Should transition to error state
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /connection failed/i })).toBeInTheDocument();
      expect(screen.getByText('Connection rejected by user')).toBeInTheDocument();
    });

    // Modal stays open in error state
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click "Try Again"
    const retryBtn = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryBtn);

    // Modal resets back to initial connect state
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /connect your wallet/i })).toBeInTheDocument();
    });
  });

  it('allows disconnect and resets back to disconnected state', async () => {
    const onDisconnect = vi.fn();
    render(
      <BrowserRouter>
        <LandingNavbar
          connectDelayMs={0}
          randomFn={() => 0.9}
          onDisconnect={onDisconnect}
        />
      </BrowserRouter>
    );

    // Connect first
    fireEvent.click(screen.getAllByRole('button', { name: /connect wallet/i })[0]);
    fireEvent.click(getModalConnectButton());

    await waitFor(() => {
      expect(screen.getAllByText('GB3K...YQYQ').length).toBeGreaterThanOrEqual(1);
    });

    // Open WalletPill dropdown
    fireEvent.click(screen.getAllByText('GB3K...YQYQ')[0]);
    const disconnectBtn = screen.getByRole('button', { name: /^disconnect$/i });
    fireEvent.click(disconnectBtn);

    expect(onDisconnect).toHaveBeenCalledTimes(1);

    // Reset back to connect wallet
    await waitFor(() => {
      expect(screen.queryByText('GB3K...YQYQ')).not.toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /connect wallet/i }).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('mobile drawer shows Disconnect Wallet when connected', async () => {
    render(
      <BrowserRouter>
        <LandingNavbar connectDelayMs={0} randomFn={() => 0.9} />
      </BrowserRouter>
    );

    // Connect first
    fireEvent.click(screen.getAllByRole('button', { name: /connect wallet/i })[0]);
    fireEvent.click(getModalConnectButton());

    await waitFor(() => {
      expect(screen.getAllByText('GB3K...YQYQ').length).toBeGreaterThanOrEqual(1);
    });

    // Open mobile menu
    const toggleButton = screen.getByRole('button', { name: /main menu/i });
    fireEvent.click(toggleButton);

    // Mobile drawer should show "Disconnect Wallet"
    const drawerDisconnectBtn = screen.getByRole('button', { name: /disconnect wallet/i });
    expect(drawerDisconnectBtn).toBeInTheDocument();

    // Disconnect via drawer
    fireEvent.click(drawerDisconnectBtn);

    await waitFor(() => {
      expect(screen.queryByText('GB3K...YQYQ')).not.toBeInTheDocument();
    });
  });

  it('cancels pending connection if modal is closed while connecting', async () => {
    render(
      <BrowserRouter>
        <LandingNavbar connectDelayMs={500} randomFn={() => 0.9} />
      </BrowserRouter>
    );

    fireEvent.click(screen.getAllByRole('button', { name: /connect wallet/i })[0]);
    fireEvent.click(getModalConnectButton());

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /connecting\.\.\./i })).toBeInTheDocument();
    });

    // Close modal while connecting
    const closeBtn = screen.getByLabelText(/close modal/i);
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // Should still show connect button, not wallet pill
    expect(screen.queryByText('GB3K...YQYQ')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /connect wallet/i }).length).toBeGreaterThanOrEqual(1);
  });

  // A11y: closed drawer is inert — keyboard users cannot reach its contents
  test('a11y: closed drawer has inert attribute so it is removed from tab order', () => {
    renderNavbar();
    const drawer = screen.getByRole('dialog', { hidden: true });
    expect(drawer).toHaveAttribute('inert');
    expect(drawer).toHaveAttribute('aria-hidden', 'true');
  });

  // A11y: open drawer has dialog role and aria-modal
  test('a11y: open drawer has role="dialog" and aria-modal="true"', async () => {
    renderNavbar();
    const toggleButton = screen.getByRole('button', { name: /main menu/i });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-label', 'Main menu');
    });
  });

  // A11y: Escape key closes the drawer
  test('a11y: pressing Escape closes the open drawer', async () => {
    renderNavbar();
    const toggleButton = screen.getByRole('button', { name: /main menu/i });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).not.toHaveAttribute('inert');
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      const drawer = screen.getByRole('dialog', { hidden: true });
      expect(drawer).toHaveAttribute('inert');
    });
  });

  // A11y: close button has an accessible name
  test('a11y: drawer close button has accessible aria-label', async () => {
    renderNavbar();
    const toggleButton = screen.getByRole('button', { name: /main menu/i });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      const closeBtn = within(dialog).getByRole('button', { name: /close menu/i });
      expect(closeBtn).toBeInTheDocument();
    });
  });

  // A11y: toggle has aria-controls pointing to drawer id
  test('a11y: mobile toggle has aria-controls referencing the drawer', () => {
    renderNavbar();
    const toggleButton = screen.getByRole('button', { name: /main menu/i });
    const controlsId = toggleButton.getAttribute('aria-controls');
    expect(controlsId).toBeTruthy();
    const drawer = document.getElementById(controlsId!);
    expect(drawer).not.toBeNull();
    expect(drawer).toHaveAttribute('role', 'dialog');
  });
});
