import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/client.ts';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A 4xx will fail identically on retry, so only retry transport-level
      // and server-side failures — and give up quickly so the error state shows.
      retry: (failureCount, error) =>
        error instanceof ApiError ? error.isRetryable && failureCount < 2 : failureCount < 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
      refetchOnWindowFocus: false,
      gcTime: 5 * 60_000,
    },
  },
});
