/**
 * Regression suite for ConnectionState failure handling in ConnectButton.
 * Tracks issue #752: exercise the explicit failure path at ConnectButton.tsx:57
 * and assert the full error contract, boundary inputs, and neighboring success path.
 *
 * Tests are deliberately separate from the existing ConnectButton.test.tsx suite
 * so a targeted failure here clearly signals a regression in the error contract.
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConnectButton from '../components/ConnectButton';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Find the enabled "Connect" button inside the modal dialog.
 * Mirrors the helper in the existing suite so both files stay in sync.
 */
const getModalConnectButton = (): HTMLButtonElement => {
  const modal = screen.getByRole('dialog');
  const buttons = within(modal).getAllByRole('button', { name: /^connect$/i });
  const enabled = buttons.find((b) => !(b as HTMLButtonElement).disabled) as HTMLButtonElement | undefined;
  if (!enabled) throw new Error('No enabled Connect button found in modal');
  return enabled;
};

/**
 * Render ConnectButton, open the modal, and click the Freighter "Connect" button.
 * Returns all the mocks passed in so callers can assert against them.
 */
const openAndConnect = (options: {
  randomFn: () => number;
  connectDelayMs?: number;
  onConnect?: ReturnType<typeof vi.fn>;
}) => {
  const { randomFn, connectDelayMs = 0, onConnect = vi.fn() } = options;

  render(
    <ConnectButton
      onConnect={onConnect}
      connectDelayMs={connectDelayMs}
      randomFn={randomFn}
    />
  );

  // Open modal
  fireEvent.click(screen.getByRole('button', { name: /connect wallet/i }));
  // Initiate connection
  fireEvent.click(getModalConnectButton());

  return { onConnect };
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('ConnectButton — ConnectionState failure regression (#752)', () => {
  beforeEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  // ── 1. Exact error message contract ───────────────────────────────────────

  it('sets errorMessage to the exact string thrown at line 57 on failure', async () => {
    // The literal "Connection rejected by user" is the observable contract.
    // Any rename of that string is a breaking change that should surface here.
    openAndConnect({ randomFn: () => 0.1 });

    await waitFor(() => {
      // Modal shows the exact string from the throw site
      expect(
        screen.getByText('Connection rejected by user')
      ).toBeInTheDocument();
    });
  });

  // ── 2. connectionState transitions to 'error' (not any other state) ───────

  it('transitions button className to "error" after a failed connection', async () => {
    openAndConnect({ randomFn: () => 0.1 });

    await waitFor(() => {
      // In error state the aria-label stays "Connect wallet" (no dedicated error label).
      // The observable contract is the className containing the ConnectionState value.
      const btn = screen.getByRole('button', { name: /connect wallet/i });
      expect(btn.className).toMatch(/\berror\b/);
    });
  });

  // ── 3. Error-state button attributes — not disabled, no aria-busy ─────────

  it('leaves the main button enabled and without aria-busy in error state', async () => {
    openAndConnect({ randomFn: () => 0.1 });

    await waitFor(() => {
      // After failure the button is clickable again (not disabled, no aria-busy).
      const btn = screen.getByRole('button', { name: /connect wallet/i });
      expect(btn.className).toMatch(/\berror\b/);
      expect(btn).not.toBeDisabled();
      expect(btn).not.toHaveAttribute('aria-busy');
    });
  });

  // ── 4. onConnect is NOT invoked when connection fails ─────────────────────

  it('does not call onConnect when the connection attempt throws', async () => {
    const { onConnect } = openAndConnect({ randomFn: () => 0.1 });

    await waitFor(() => {
      expect(screen.getByText('Connection rejected by user')).toBeInTheDocument();
    });

    expect(onConnect).not.toHaveBeenCalled();
  });

  // ── 5. Non-Error thrown value falls back to 'Connection failed' ───────────

  it('shows "Connection failed" fallback when a non-Error value is thrown', async () => {
    // The catch clause in ConnectButton reads:
    //   setErrorMessage(error instanceof Error ? error.message : 'Connection failed')
    //
    // To exercise the non-Error branch we have randomFn itself throw a plain string.
    // The component's try{} wraps the call to randomFn(), so any throw from it
    // lands in the same catch and exercises the else branch without any mocking.
    render(
      <ConnectButton
        connectDelayMs={0}
        randomFn={() => { throw 'non-Error failure'; }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /connect wallet/i }));
    fireEvent.click(getModalConnectButton());

    await waitFor(() => {
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });
  });

  // ── 6. Stale connection: superseded callback must be a no-op ─────────────

  it('ignores a stale connection callback when the connection was cancelled', async () => {
    vi.useFakeTimers();

    render(
      <ConnectButton
        connectDelayMs={500}
        randomFn={() => 0.9} // would succeed
      />
    );

    // Start first connection attempt
    fireEvent.click(screen.getByRole('button', { name: /connect wallet/i }));
    fireEvent.click(getModalConnectButton());

    // While "connecting", cancel via the modal close button
    const closeBtn = screen.getByLabelText(/close modal/i);
    fireEvent.click(closeBtn);

    // State must be reset to disconnected immediately
    expect(
      screen.getByRole('button', { name: /connect wallet/i })
    ).not.toBeDisabled();

    // Advance time so the stale callback fires
    vi.runAllTimers();

    // State must STILL be disconnected — the stale callback must not apply
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /connect wallet/i })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /wallet connected:/i })
      ).not.toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  // ── 7. Retry: clicking "Try Again" reopens the modal ──────────────────────

  it('reopens the modal when "Try Again" is clicked from the error state', async () => {
    openAndConnect({ randomFn: () => 0.1 });

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Connection rejected by user')).toBeInTheDocument();
    });

    const tryAgain = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(tryAgain);

    // Modal must be visible again, showing the "Connect your wallet" heading
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /connect your/i })
      ).toBeInTheDocument();
    });
  });

  // ── 8. Zero delay boundary: connectDelayMs=0 still resolves correctly ────

  it('resolves the failure path synchronously when connectDelayMs is 0', async () => {
    // connectDelayMs=0 → effectiveDelay=0 (skips Math.max guard).
    // The setTimeout fires with delay 0, still asynchronous but the shortest
    // possible path. This test pins that the component handles it without error.
    openAndConnect({ randomFn: () => 0.1, connectDelayMs: 0 });

    await waitFor(() => {
      expect(screen.getByText('Connection rejected by user')).toBeInTheDocument();
    });

    // Main button must reflect error state, not remain in connecting state
    expect(
      screen.queryByRole('button', { name: /connecting/i })
    ).not.toBeInTheDocument();
  });

  // ── 9. Zero delay — success path neighbour (boundary sanity) ─────────────

  it('resolves the success path synchronously when connectDelayMs is 0', async () => {
    const onConnect = vi.fn();
    openAndConnect({ randomFn: () => 0.9, connectDelayMs: 0, onConnect });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /wallet connected:/i })
      ).toBeInTheDocument();
    });

    expect(onConnect).toHaveBeenCalledTimes(1);
    expect(onConnect).toHaveBeenCalledWith(
      'GB3K4Y5QYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQ'
    );
  });

  // ── 10. randomFn threshold boundary — value at exactly 0.2 succeeds ──────

  it('treats randomFn() === 0.2 as a successful connection (boundary is exclusive)', async () => {
    // The guard is `randomFn() < 0.2` so 0.2 should not throw.
    const onConnect = vi.fn();
    openAndConnect({ randomFn: () => 0.2, connectDelayMs: 0, onConnect });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /wallet connected:/i })
      ).toBeInTheDocument();
    });

    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  it('treats randomFn() just below 0.2 as a failed connection (boundary is exclusive)', async () => {
    const onConnect = vi.fn();
    openAndConnect({ randomFn: () => 0.19999, connectDelayMs: 0, onConnect });

    await waitFor(() => {
      expect(screen.getByText('Connection rejected by user')).toBeInTheDocument();
    });

    expect(onConnect).not.toHaveBeenCalled();
  });
});
