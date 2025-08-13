import { QueryClient } from '@tanstack/react-query';

// Create a new QueryClient instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    }
  }
});
