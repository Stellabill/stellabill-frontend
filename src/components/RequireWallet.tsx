import { useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useWallet } from "../wallet/WalletContext";

export interface RequireWalletLocationState {
  from?: {
    pathname: string;
    search?: string;
    hash?: string;
  };
}

function getReturnDestination(state: unknown): string | null {
  if (!state || typeof state !== "object" || !("from" in state)) {
    return null;
  }
  const { from } = state as RequireWalletLocationState;
  if (!from || typeof from.pathname !== "string") {
    return null;
  }
  const { pathname, search = "", hash = "" } = from;
  if (!pathname.startsWith("/") || pathname.startsWith("//") || pathname === "/") {
    return null;
  }
  return `${pathname}${search}${hash}`;
}

export function WalletReturnRedirect() {
  const { status } = useWallet();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (status !== "connected") return;
    const destination = getReturnDestination(location.state);
    if (!destination) return;
    navigate(destination, { replace: true });
  }, [status, location.state, navigate]);

  return null;
}

export default function RequireWallet() {
  const { status, isReconnecting } = useWallet();
  const location = useLocation();

  if (isReconnecting || status === "connecting") {
    return (
      <div
        role="status"
        aria-label="Reconnecting wallet"
        aria-live="polite"
        className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center gap-3"
      >
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" aria-hidden="true" />
        <p className="text-sm text-slate-400">Reconnecting wallet...</p>
      </div>
    );
  }

  if (status !== "connected") {
    return (
      <Navigate
        to="/"
        replace
        state={{
          from: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          },
        }}
      />
    );
  }

  return <Outlet />;
}
