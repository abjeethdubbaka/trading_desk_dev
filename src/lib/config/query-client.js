import { QueryClient } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,   // 5 min — data shared across pages stays fresh during a session
      gcTime: 1000 * 60 * 30,     // 30 min — keep cache alive across page navigation
    },
  },
});


