import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { ToastContainer } from '../ui/Toast'
import { InstallPrompt } from '../pwa/InstallPrompt'
import { useUIStore } from '@/shared/stores/ui.store'
import { cn } from '@/shared/lib/cn'

function useIsPwa() {
  return typeof window !== 'undefined' &&
    window.matchMedia('(display-mode: standalone)').matches
}

interface AppShellProps {
  topBarTitle?: string
  topBarActions?: React.ReactNode
}

export function AppShell({ topBarTitle, topBarActions }: AppShellProps) {
  const collapsed            = useUIStore((s) => s.sidebarCollapsed)
  const fontScale            = useUIStore((s) => s.fontScale)
  const reducedDensity       = useUIStore((s) => s.reducedDensity)
  const mobileSidebarOpen    = useUIStore((s) => s.mobileSidebarOpen)
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen)
  const isPwa                = useIsPwa()

  return (
    <div
      className="flex h-dvh overflow-hidden bg-base-950 relative"
      style={{ fontSize: `${fontScale}rem` }}
    >
      {/* Background mesh decoration */}
      <div className="absolute inset-0 bg-mesh pointer-events-none" aria-hidden />

      {/* Sidebar — desktop inline (oculto em PWA standalone) */}
      {!isPwa && (
        <div className="hidden lg:flex relative flex-shrink-0 z-30">
          <Sidebar />
        </div>
      )}

      {/* Sidebar drawer — mobile (oculto em PWA standalone) */}
      {!isPwa && (
        <>
          <div
            className={cn(
              'lg:hidden fixed inset-y-0 left-0 z-50 flex',
              'transition-transform duration-250 ease-out',
              mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
            )}
          >
            <Sidebar onClose={() => setMobileSidebarOpen(false)} />
          </div>

          {mobileSidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 z-40 bg-base-950/70 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
              aria-hidden
            />
          )}
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopBar — oculta em PWA standalone */}
        {!isPwa && <TopBar title={topBarTitle} actions={topBarActions} />}

        <main
          id="main-content"
          className={cn(
            'flex-1 overflow-y-auto',
            reducedDensity ? 'p-4 sm:p-6' : 'p-0',
            collapsed ? 'transition-all duration-250' : '',
            'pb-[88px] lg:pb-0',
          )}
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>

      {/* Bottom navigation — mobile PWA */}
      <BottomNav />

      {/* PWA install prompt */}
      <InstallPrompt />

      {/* Toast notifications (aria-live) */}
      <ToastContainer />
    </div>
  )
}
