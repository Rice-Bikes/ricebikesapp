import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AllCommunityModule, ModuleRegistry, RowSelectionModule } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule, RowSelectionModule]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
