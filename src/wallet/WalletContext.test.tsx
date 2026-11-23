import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FreighterAdapter } from "./freighter";
import { useWallet, WalletProvider } from "./WalletContext";

const publicKey = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

const createAdapter = (): FreighterAdapter => ({
  isConnected: vi.fn().mockResolvedValue({ isConnected: true }),
  requestAccess: vi.fn().mockResolvedValue({ address: publicKey }),
  getAddress: vi.fn().mockResolvedValue({ address: publicKey }),
  getNetwork: vi.fn().mockResolvedValue({
    network: "PUBLIC",
    networkPassphrase: "Public Global Stellar Network ; September 2015",
  }),
  signTransaction: vi.fn().mockResolvedValue({
    signedTxXdr: "AAAA_SIGNED_XDR",
    signerAddress: publicKey,
  }),
});

function WalletConsumer() {
  const { status, address, isReconnecting, connect, disconnect } = useWallet();
  return (
    <div>
      <span>{`${status}:${address ?? ""}`}</span>
      <span data-testid="reconnecting">{String(isReconnecting)}</span>
      <button onClick={() => void connect()}>Connect</button>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}

describe("WalletProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("propagates connect and disconnect to every consumer", async () => {
    const adapter = createAdapter();
    render(
      <WalletProvider adapter={adapter}>
        <WalletConsumer />
        <WalletConsumer />
      </WalletProvider>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Connect" })[0]);
    await waitFor(() => {
      expect(screen.getAllByText(`connected:${publicKey}`)).toHaveLength(2);
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Disconnect" })[0]);
    expect(screen.getAllByText("disconnected:")).toHaveLength(2);
    expect(localStorage.getItem("stellabill.wallet.publicKey")).toBeNull();
  });

  it("rehydrates a saved public key after silently checking the wallet", async () => {
    const adapter = createAdapter();
    localStorage.setItem("stellabill.wallet.publicKey", publicKey);

    render(
      <WalletProvider adapter={adapter}>
        <WalletConsumer />
      </WalletProvider>,
    );

    expect(await screen.findByText(`connected:${publicKey}`)).toBeInTheDocument();
    expect(adapter.isConnected).toHaveBeenCalledOnce();
    expect(adapter.getAddress).toHaveBeenCalledOnce();
    expect(adapter.requestAccess).not.toHaveBeenCalled();
  });

  it("continues to connect when browser storage is unavailable", async () => {
    const adapter = createAdapter();
    const unavailableStorage = {
      getItem: vi.fn(() => {
        throw new Error("Storage unavailable");
      }),
      setItem: vi.fn(() => {
        throw new Error("Storage unavailable");
      }),
      removeItem: vi.fn(() => {
        throw new Error("Storage unavailable");
      }),
    };

    render(
      <WalletProvider adapter={adapter} storage={unavailableStorage}>
        <WalletConsumer />
      </WalletProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Connect" }));
    expect(await screen.findByText(`connected:${publicKey}`)).toBeInTheDocument();
    expect(unavailableStorage.setItem).toHaveBeenCalledOnce();
  });

  it("exposes isReconnecting while silently restoring a saved wallet", async () => {
    let resolveConnected!: (value: { isConnected: boolean }) => void;
    const adapter = createAdapter();
    adapter.isConnected = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveConnected = resolve;
        }),
    );
    localStorage.setItem("stellabill.wallet.publicKey", publicKey);

    render(
      <WalletProvider adapter={adapter}>
        <WalletConsumer />
      </WalletProvider>,
    );

    expect(screen.getByTestId("reconnecting")).toHaveTextContent("true");

    resolveConnected({ isConnected: true });

    expect(await screen.findByText(`connected:${publicKey}`)).toBeInTheDocument();
    expect(screen.getByTestId("reconnecting")).toHaveTextContent("false");
  });
});

describe("WalletProvider Freighter watch", () => {
  const nextPublicKey = "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBWHF";

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function WatchConsumer() {
    const { status, address, network, isNetworkMismatch } = useWallet();
    return (
      <div>
        <span data-testid="status">{status}</span>
        <span data-testid="address">{address ?? ""}</span>
        <span data-testid="network">{network ?? ""}</span>
        <span data-testid="mismatch">{String(isNetworkMismatch)}</span>
      </div>
    );
  }

  it("updates address and network when the account changes in Freighter within one poll", async () => {
    const adapter = createAdapter();
    localStorage.setItem("stellabill.wallet.publicKey", publicKey);

    render(
      <WalletProvider adapter={adapter}>
        <WatchConsumer />
      </WalletProvider>,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId("status").textContent).toBe("connected");
    expect(screen.getByTestId("address").textContent).toBe(publicKey);
    expect(screen.getByTestId("network").textContent).toBe("PUBLIC");

    (adapter.getAddress as ReturnType<typeof vi.fn>).mockResolvedValue({
      address: nextPublicKey,
    });
    (adapter.getNetwork as ReturnType<typeof vi.fn>).mockResolvedValue({
      network: "TESTNET",
      networkPassphrase: "Test SDF Network ; September 2015",
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(screen.getByTestId("status").textContent).toBe("connected");
    expect(screen.getByTestId("address").textContent).toBe(nextPublicKey);
    expect(screen.getByTestId("network").textContent).toBe("TESTNET");
  });

  it("cleans up watchers on unmount", async () => {
    const adapter = createAdapter();
    localStorage.setItem("stellabill.wallet.publicKey", publicKey);

    const { unmount } = render(
      <WalletProvider adapter={adapter}>
        <WatchConsumer />
      </WalletProvider>,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId("status").textContent).toBe("connected");
    const timersBeforeUnmount = vi.getTimerCount();
    expect(timersBeforeUnmount).toBeGreaterThan(0);

    unmount();

    expect(vi.getTimerCount()).toBe(timersBeforeUnmount - 1);
  });

  it("cleans up watchers on disconnect", async () => {
    const adapter = createAdapter();
    localStorage.setItem("stellabill.wallet.publicKey", publicKey);
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");

    function DisconnectConsumer() {
      const { status, disconnect } = useWallet();
      return (
        <div>
          <span data-testid="status">{status}</span>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      );
    }

    render(
      <WalletProvider adapter={adapter}>
        <DisconnectConsumer />
      </WalletProvider>,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId("status").textContent).toBe("connected");
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));

    expect(screen.getByTestId("status").textContent).toBe("disconnected");
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it("exposes network mismatch from context", async () => {
    const adapter = createAdapter();
    (adapter.getNetwork as ReturnType<typeof vi.fn>).mockResolvedValue({
      network: "TESTNET",
      networkPassphrase: "Test SDF Network ; September 2015",
    });
    localStorage.setItem("stellabill.wallet.publicKey", publicKey);

    render(
      <WalletProvider adapter={adapter}>
        <WatchConsumer />
      </WalletProvider>,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId("status").textContent).toBe("connected");
    expect(screen.getByTestId("network").textContent).toBe("TESTNET");
    expect(screen.getByTestId("mismatch").textContent).toBe("false");
  });
});
