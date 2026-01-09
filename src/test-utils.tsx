import { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./app/queryClient";
import { mockUser, mockResponse, mockItem } from "./test-constants";
import { UserProvider } from "./contexts/UserContext";

export { mockUser, mockResponse, mockItem  };

export const AllTheProviders = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <BrowserRouter>{children}</BrowserRouter>
      </UserProvider>
    </QueryClientProvider>
  );
};

