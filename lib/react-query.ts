import { QueryClient } from '@tanstack/react-query'

/**
 * React Query Client Configuration
 *
 * This QueryClient is configured with sensible defaults:
 * - 5 minute stale time for queries
 * - Retry once on failure
 * - Refetch on window focus disabled for better UX
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }
        // Retry up to 1 time for other errors
        return failureCount < 1
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
})
