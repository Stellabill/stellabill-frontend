import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { initializeTheme } from "./hooks/useTheme";
import { initializeDensity } from "./hooks/useDensity";
import "./index.css";
import "./i18n/config";

initializeTheme();
initializeDensity();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </StrictMode>,
);
