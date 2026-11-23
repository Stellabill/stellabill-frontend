import { describe, expect, it, vi } from "vitest";
import {
  connectFreighter,
  FreighterConnectionError,
  getFreighterConnection,
  type FreighterAdapter,
} from "./freighter";

vi.mock("@stellar/freighter-api", () => ({}));

const PUBLIC_KEY = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
const NETWORK = "PUBLIC";
const NETWORK_PASSPHRASE = "Public Global Stellar Network ; September 2015";

const createAdapter = (overrides: Partial<FreighterAdapter> = {}): FreighterAdapter => ({
  isConnected: vi.fn().mockResolvedValue({ isConnected: true }),
  requestAccess: vi.fn().mockResolvedValue({ address: PUBLIC_KEY }),
  getAddress: vi.fn().mockResolvedValue({ address: PUBLIC_KEY }),
  getNetwork: vi.fn().mockResolvedValue({
    network: NETWORK,
    networkPassphrase: NETWORK_PASSPHRASE,
  }),
  ...overrides,
});

describe("connectFreighter", () => {
  it("returns address and network on the happy path", async () => {
    const adapter = createAdapter();

    const result = await connectFreighter(adapter);

    expect(result).toEqual({ address: PUBLIC_KEY, network: NETWORK });
    expect(adapter.isConnected).toHaveBeenCalledOnce();
    expect(adapter.requestAccess).toHaveBeenCalledOnce();
    expect(adapter.getAddress).toHaveBeenCalledOnce();
    expect(adapter.getNetwork).toHaveBeenCalledOnce();
  });

  it("throws not-installed when isConnected returns false", async () => {
    const adapter = createAdapter({
      isConnected: vi.fn().mockResolvedValue({ isConnected: false }),
    });

    await expect(connectFreighter(adapter)).rejects.toThrowError(FreighterConnectionError);
    await expect(connectFreighter(adapter)).rejects.toMatchObject({
      name: "FreighterConnectionError",
      type: "not-installed",
      message: "Freighter is not installed.",
    });
    expect(adapter.requestAccess).not.toHaveBeenCalled();
  });

  it("throws user-rejected when requestAccess returns a rejection API error", async () => {
    const adapterByCode = createAdapter({
      requestAccess: vi.fn().mockResolvedValue({
        address: "",
        error: { code: 4001, message: "Denied" },
      }),
    });

    await expect(connectFreighter(adapterByCode)).rejects.toMatchObject({
      type: "user-rejected",
      message: "Connection rejected by user.",
    });

    const adapterByMessage = createAdapter({
      requestAccess: vi.fn().mockResolvedValue({
        address: "",
        error: { code: -1, message: "User declined access" },
      }),
    });

    await expect(connectFreighter(adapterByMessage)).rejects.toMatchObject({
      type: "user-rejected",
    });
  });

  it("throws unknown when requestAccess returns a non-rejection API error", async () => {
    const adapter = createAdapter({
      requestAccess: vi.fn().mockResolvedValue({
        address: "",
        error: { code: 500, message: "Internal extension error" },
      }),
    });

    await expect(connectFreighter(adapter)).rejects.toMatchObject({
      type: "unknown",
      message: "Connection failed. Please try again.",
    });
  });

  it("maps a thrown object with a rejection-like message or code to user-rejected", async () => {
    const adapterWithCode = createAdapter({
      requestAccess: vi.fn().mockRejectedValue({ code: 4001, message: "Blocked" }),
    });

    await expect(connectFreighter(adapterWithCode)).rejects.toMatchObject({
      type: "user-rejected",
    });

    const adapterWithMessage = createAdapter({
      requestAccess: vi.fn().mockRejectedValue(new Error("User cancelled the prompt")),
    });

    await expect(connectFreighter(adapterWithMessage)).rejects.toMatchObject({
      type: "user-rejected",
    });
  });

  it("maps unexpected thrown values to unknown", async () => {
    const adapterWithError = createAdapter({
      requestAccess: vi.fn().mockRejectedValue(new Error("RPC timeout")),
    });

    await expect(connectFreighter(adapterWithError)).rejects.toMatchObject({
      type: "unknown",
    });

    const adapterWithPrimitive = createAdapter({
      requestAccess: vi.fn().mockRejectedValue("unexpected failure"),
    });

    await expect(connectFreighter(adapterWithPrimitive)).rejects.toMatchObject({
      type: "unknown",
    });
  });

  it("throws unknown when getAddress returns a missing address", async () => {
    const adapter = createAdapter({
      getAddress: vi.fn().mockResolvedValue({ address: "" }),
    });

    await expect(connectFreighter(adapter)).rejects.toMatchObject({
      type: "unknown",
    });
  });

  it("throws unknown when getNetwork returns a missing network", async () => {
    const adapter = createAdapter({
      getNetwork: vi.fn().mockResolvedValue({
        network: "",
        networkPassphrase: "",
      }),
    });

    await expect(connectFreighter(adapter)).rejects.toMatchObject({
      type: "unknown",
    });
  });
});

describe("getFreighterConnection", () => {
  it("returns address and network without ever calling requestAccess", async () => {
    const adapter = createAdapter();

    const result = await getFreighterConnection(adapter);

    expect(result).toEqual({ address: PUBLIC_KEY, network: NETWORK });
    expect(adapter.isConnected).toHaveBeenCalledOnce();
    expect(adapter.requestAccess).not.toHaveBeenCalled();
    expect(adapter.getAddress).toHaveBeenCalledOnce();
    expect(adapter.getNetwork).toHaveBeenCalledOnce();
  });

  it("throws not-installed when isConnected returns false", async () => {
    const adapter = createAdapter({
      isConnected: vi.fn().mockResolvedValue({ isConnected: false }),
    });

    await expect(getFreighterConnection(adapter)).rejects.toMatchObject({
      type: "not-installed",
    });
    expect(adapter.requestAccess).not.toHaveBeenCalled();
  });

  it("throws unknown when address or network is missing", async () => {
    const missingAddress = createAdapter({
      getAddress: vi.fn().mockResolvedValue({ address: "" }),
    });
    await expect(getFreighterConnection(missingAddress)).rejects.toMatchObject({
      type: "unknown",
    });

    const missingNetwork = createAdapter({
      getNetwork: vi.fn().mockResolvedValue({
        network: "",
        networkPassphrase: "",
      }),
    });
    await expect(getFreighterConnection(missingNetwork)).rejects.toMatchObject({
      type: "unknown",
    });
  });

  it("maps unexpected thrown errors to unknown", async () => {
    const adapter = createAdapter({
      getAddress: vi.fn().mockRejectedValue(new Error("Extension crashed")),
    });

    await expect(getFreighterConnection(adapter)).rejects.toMatchObject({
      type: "unknown",
    });
    expect(adapter.requestAccess).not.toHaveBeenCalled();
  });
});
