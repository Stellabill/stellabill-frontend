import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
});

function WalletConsumer() {
  const { status, address, connect, disconnect } = useWallet();
  return (
    <div>
      <span>{`${status}:${address ?? ""}`}</span>
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
});
