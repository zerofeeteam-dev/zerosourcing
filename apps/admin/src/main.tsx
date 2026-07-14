import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../../../design-system.css";
import "./App.css";
import { App } from "./App";
import { initializeAdminHistoryIndex } from "./lib/router";
import { PendingAssetNavigationProvider } from "./navigation/PendingAssetNavigation";

initializeAdminHistoryIndex();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PendingAssetNavigationProvider>
      <App />
    </PendingAssetNavigationProvider>
  </StrictMode>,
);
