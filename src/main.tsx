import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { initializeTheme } from "./hooks/useTheme";
import { initializeDensity } from "./hooks/useDensity";
import { WalletProvider } from "./wallet/WalletContext";
import {
    consoleErrorAdapter,
    installGlobalErrorHandlers,
    setErrorReporterAdapter,
} from "./utils/errorReporter";
import "./index.css";
import "./i18n/config";

if (import.meta.env.DEV) {
    setErrorReporterAdapter(consoleErrorAdapter);
}
installGlobalErrorHandlers();

initializeTheme();
initializeDensity();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <WalletProvider>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </WalletProvider>
    </StrictMode>,
);

