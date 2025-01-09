import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import {
  AllCommunityModule,
  ModuleRegistry,
  RowSelectionModule,
} from "ag-grid-community";
import {RepairsProvider} from '../components/RepairItem/RepairItem';
import {PartsProvider} from '../components/PartItem/PartItem';
import { BrowserRouter as Router } from "react-router-dom";

ModuleRegistry.registerModules([AllCommunityModule, RowSelectionModule]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
    <RepairsProvider>
    <PartsProvider>
      <App />
    </PartsProvider>
    </RepairsProvider>
    </Router>
  </StrictMode>
);
