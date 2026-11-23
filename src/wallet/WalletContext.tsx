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
import { isNetworkMismatch as checkNetworkMismatch } from "../config/network";
import {
  connectFreighter,
  getFreighterConnection,
  signFreighterTransaction,
  watchFreighter,
  type FreighterAdapter,
  type SignedTransactionResult,
  type SignTransactionOptions,
} from "./freighter";

const WALLET_STORAGE_KEY = "stellabill.wallet.publicKey";

export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

export interface WalletState {
  status: WalletStatus;
  address: string | null;
  network: string | null;
  error: Error | null;
  isReconnecting: boolean;
}

export interface WalletContextValue extends WalletState {
  isNetworkMismatch: boolean;
  connect: () => Promise<{ address: string; network: string } | undefined>;
  signTransaction: (
    transactionXdr: string,
    options?: SignTransactionOptions,
  ) => Promise<SignedTransactionResult>;
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

const readSavedAddress = (storage?: WalletStorage): string | null => {
  try {
    return storage?.getItem(WALLET_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
};

export function WalletProvider({
  children,
  adapter,
  storage,
}: WalletProviderProps) {
  const persistedStorage = storage ?? browserStorage();
  const [wallet, setWallet] = useState<WalletState>(() => ({
    status: "disconnected",
    address: null,
    network: null,
    error: null,
    isReconnecting: Boolean(readSavedAddress(persistedStorage)),
  }));
  const connectionId = useRef(0);

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
    const savedAddress = readSavedAddress(persistedStorage);

    if (!savedAddress) {
      setWallet((current) =>
        current.isReconnecting ? { ...current, isReconnecting: false } : current,
      );
      return () => {
        isCurrent = false;
      };
    }

    setWallet((current) =>
      current.status === "connected" || current.isReconnecting
        ? current
        : { ...current, isReconnecting: true },
    );

    void getFreighterConnection(adapter)
      .then(({ address, network }) => {
        if (!isCurrent || restoreConnectionId !== connectionId.current) return;
        if (address !== savedAddress) {
          removePersistedAddress();
          setWallet({
            status: "disconnected",
            address: null,
            network: null,
            error: null,
            isReconnecting: false,
          });
          return;
        }
        setWallet({
          status: "connected",
          address,
          network,
          error: null,
          isReconnecting: false,
        });
      })
      .catch(() => {
        if (isCurrent && restoreConnectionId === connectionId.current) {
          removePersistedAddress();
          setWallet({
            status: "disconnected",
            address: null,
            network: null,
            error: null,
            isReconnecting: false,
          });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [adapter, persistedStorage, removePersistedAddress]);

  useEffect(() => {
    if (wallet.status !== "connected" || !wallet.address || !wallet.network) {
      return;
    }

    return watchFreighter(
      adapter,
      { address: wallet.address, network: wallet.network },
      ({ address, network }) => {
        try {
          persistedStorage?.setItem(WALLET_STORAGE_KEY, address);
        } catch {
          // Wallet state remains usable when browser storage is unavailable.
        }
        setWallet((current) =>
          current.status === "connected"
            ? { ...current, address, network }
            : current,
        );
      },
    );
  }, [adapter, persistedStorage, wallet.address, wallet.network, wallet.status]);

  const connect = useCallback(async () => {
    const currentConnectionId = ++connectionId.current;
    setWallet((current) => ({
      ...current,
      status: "connecting",
      error: null,
      isReconnecting: false,
    }));
    try {
      const { address, network } = await connectFreighter(adapter);
      if (currentConnectionId !== connectionId.current) return;
      try {
        persistedStorage?.setItem(WALLET_STORAGE_KEY, address);
      } catch {
        // Connection state remains usable when browser storage is unavailable.
      }
      setWallet({
        status: "connected",
        address,
        network,
        error: null,
        isReconnecting: false,
      });
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
        isReconnecting: false,
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
      isReconnecting: false,
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
      isReconnecting: false,
    });
  }, [removePersistedAddress]);

  const signTransaction = useCallback(
    (transactionXdr: string, options?: SignTransactionOptions) =>
      signFreighterTransaction(transactionXdr, options, adapter),
    [adapter],
  );

  const value = useMemo(
    () => ({
      ...wallet,
      isNetworkMismatch: checkNetworkMismatch(wallet.network),
      connect,
      signTransaction,
      clearError,
      cancelConnect,
      disconnect,
    }),
    [wallet, connect, signTransaction, clearError, cancelConnect, disconnect],
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
