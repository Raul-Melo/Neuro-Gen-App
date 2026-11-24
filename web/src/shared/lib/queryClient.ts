import { QueryClient } from '@tanstack/react-query'
import { type AxiosError } from 'axios'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,       // 2 min
      gcTime: 1000 * 60 * 10,          // 10 min
      retry: (failureCount, error) => {
        const axiosError = error as AxiosError
        if (axiosError.response?.status === 401) return false
        if (axiosError.response?.status === 403) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: false,
    },
  },
})
