import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import {
  ClientSideRowModelModule,
  AllCommunityModule,
  ModuleRegistry,
  RowSelectionModule,
  TooltipModule,
  NumberFilterModule,
  TextFilterModule,
  ValidationModule,
  ColumnApiModule,
} from "ag-grid-community";
// import {RepairsProvider} from '../components/RepairItem/RepairItem';
// import {PartsProvider} from '../components/PartItem/PartItem';
import { BrowserRouter as Router } from "react-router-dom";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  AllCommunityModule,
  RowSelectionModule,
  TooltipModule,
  NumberFilterModule,
  TextFilterModule,
  ValidationModule,
  ColumnApiModule,
]);

export const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <Router>
        <App />
      </Router>
    </QueryClientProvider>
  </StrictMode>
);
