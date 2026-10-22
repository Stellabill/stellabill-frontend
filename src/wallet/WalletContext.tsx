import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  connectFreighter,
  getFreighterConnection,
  type FreighterAdapter,
} from "./freighter";

const WALLET_STORAGE_KEY = "stellabill.wallet.publicKey";

export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

export interface WalletState {
  status: WalletStatus;
  address: string | null;
  network: string | null;
  error: Error | null;
}

export interface WalletContextValue extends WalletState {
  connect: () => Promise<{ address: string; network: string } | undefined>;
  clearError: () => void;
  cancelConnect: () => void;
  disconnect: () => void;
}

type WalletStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

interface WalletProviderProps {
  children: ReactNode;
  adapter?: FreighterAdapter;
  storage?: WalletStorage;
}

const WalletContext = createContext<WalletContextValue | null>(null);

const browserStorage = (): WalletStorage | undefined => {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

export function WalletProvider({
  children,
  adapter,
  storage,
}: WalletProviderProps) {
  const [wallet, setWallet] = useState<WalletState>({
    status: "disconnected",
    address: null,
    network: null,
    error: null,
  });
  const connectionId = useRef(0);
  const persistedStorage = storage ?? browserStorage();

  const removePersistedAddress = useCallback(() => {
    try {
      persistedStorage?.removeItem(WALLET_STORAGE_KEY);
    } catch {
      // Wallet state remains usable when browser storage is unavailable.
    }
  }, [persistedStorage]);

  useEffect(() => {
    let isCurrent = true;
    const restoreConnectionId = ++connectionId.current;
    let savedAddress: string | null = null;
    try {
      savedAddress = persistedStorage?.getItem(WALLET_STORAGE_KEY) ?? null;
    } catch {
      return () => {
        isCurrent = false;
      };
    }

    if (!savedAddress) {
      return () => {
        isCurrent = false;
      };
    }

    void getFreighterConnection(adapter)
      .then(({ address, network }) => {
        if (!isCurrent || restoreConnectionId !== connectionId.current) return;
        if (address !== savedAddress) {
          removePersistedAddress();
          return;
        }
        setWallet({ status: "connected", address, network, error: null });
      })
      .catch(() => {
        if (isCurrent && restoreConnectionId === connectionId.current) {
          removePersistedAddress();
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [adapter, persistedStorage, removePersistedAddress]);

  const connect = useCallback(async () => {
    const currentConnectionId = ++connectionId.current;
    setWallet((current) => ({ ...current, status: "connecting", error: null }));
    try {
      const { address, network } = await connectFreighter(adapter);
      if (currentConnectionId !== connectionId.current) return;
      try {
        persistedStorage?.setItem(WALLET_STORAGE_KEY, address);
      } catch {
        // Connection state remains usable when browser storage is unavailable.
      }
      setWallet({ status: "connected", address, network, error: null });
      return { address, network };
    } catch (error) {
      if (currentConnectionId !== connectionId.current) return;
      const connectionError =
        error instanceof Error ? error : new Error("Wallet connection failed.");
      setWallet({
        status: "error",
        address: null,
        network: null,
        error: connectionError,
      });
      throw connectionError;
    }
  }, [adapter, persistedStorage]);

  const cancelConnect = useCallback(() => {
    if (wallet.status !== "connecting") return;
    connectionId.current += 1;
    setWallet({
      status: "disconnected",
      address: null,
      network: null,
      error: null,
    });
  }, [wallet.status]);

  const clearError = useCallback(() => {
    setWallet((current) =>
      current.status === "error"
        ? { ...current, status: "disconnected", error: null }
        : current,
    );
  }, []);

  const disconnect = useCallback(() => {
    connectionId.current += 1;
    removePersistedAddress();
    setWallet({
      status: "disconnected",
      address: null,
      network: null,
      error: null,
    });
  }, [removePersistedAddress]);

  const value = useMemo(
    () => ({ ...wallet, connect, clearError, cancelConnect, disconnect }),
    [wallet, connect, clearError, cancelConnect, disconnect],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider.");
  }
  return context;
}
