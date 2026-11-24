import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/shared/lib/queryClient'
import { useUIStore } from '@/shared/stores/ui.store'
import { useEffect } from 'react'

function ReducedMotionSync() {
  const reducedMotion = useUIStore((s) => s.reducedMotion)

  useEffect(() => {
    // Sync to <html> for CSS media query override
    if (reducedMotion) {
      document.documentElement.setAttribute('data-reduced-motion', 'true')
    } else {
      document.documentElement.removeAttribute('data-reduced-motion')
    }
  }, [reducedMotion])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ReducedMotionSync />
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
