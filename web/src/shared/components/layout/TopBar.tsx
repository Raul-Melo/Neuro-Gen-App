import { useEffect, useState } from 'react'
import { Bell, Search, Layers, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { SearchOverlay } from '../ui/SearchOverlay'
import { useUIStore } from '@/shared/stores/ui.store'
import { useAuthStore } from '@/shared/stores/auth.store'
import { notificationsService } from '@/features/notifications/services/notifications.service'
import { cn } from '@/shared/lib/cn'

interface TopBarProps {
  title?: string
  actions?: React.ReactNode
}

export function TopBar({ title, actions }: TopBarProps) {
  const reducedDensity       = useUIStore((s) => s.reducedDensity)
  const toggleReducedDensity = useUIStore((s) => s.toggleReducedDensity)
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen)
  const user                 = useAuthStore((s) => s.user)

  const [searchOpen, setSearchOpen] = useState(false)

  // Unread notification count
  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => notificationsService.getAll(),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  })
  const unreadCount = notifData?.unreadCount ?? 0

  // Cmd/Ctrl+K opens search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <header className="h-[var(--topbar-height)] flex items-center px-3 sm:px-5 border-b border-glass-border bg-base-800/50 backdrop-blur-sm sticky top-0 z-40 gap-2">
        {/* Hamburger — mobile only */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Abrir menu"
          className="lg:hidden text-slate-500 hover:text-slate-200 flex-shrink-0 -ml-1 min-w-[44px] min-h-[44px]"
        >
          <Menu size={18} />
        </Button>

        {/* Page title */}
        {title && (
          <h1 className="font-display font-semibold text-slate-100 text-base truncate">
            {title}
          </h1>
        )}

        {/* Spacer */}
        <div className="ml-auto" />

        {actions}

        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          aria-label="Busca global (Ctrl+K)"
          title="Busca global (Ctrl K)"
          className={cn(
            'flex items-center gap-2 h-9 rounded-xl transition-all',
            'bg-glass border border-glass-border hover:bg-glass-hover',
            'pl-3 pr-2 text-slate-500 hover:text-slate-200',
            'min-w-[44px] justify-center sm:justify-start',
          )}
        >
          <Search size={15} aria-hidden />
          <span className="hidden sm:inline text-xs text-slate-600">Buscar…</span>
          <kbd className="hidden md:inline text-[9px] text-slate-700 border border-glass-border rounded px-1 py-0.5 ml-1">
            ⌘K
          </kbd>
        </button>

        {/* Visão — densidade */}
        <button
          onClick={toggleReducedDensity}
          aria-label={reducedDensity ? 'Desativar modo simplificado' : 'Ativar modo simplificado'}
          aria-pressed={reducedDensity}
          title={reducedDensity ? 'Modo compacto (clique para simplificado)' : 'Modo simplificado (clique para compacto)'}
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-xl border transition-all min-w-[44px] min-h-[44px]',
            reducedDensity
              ? 'bg-focus-muted border-focus/40 text-focus-light'
              : 'bg-glass border-glass-border text-slate-500 hover:text-slate-200 hover:bg-glass-hover',
          )}
        >
          <Layers size={15} aria-hidden />
        </button>

        {/* Notifications */}
        <Link
          to="/notifications"
          aria-label={unreadCount > 0 ? `Notificações — ${unreadCount} não lidas` : 'Notificações'}
          title="Notificações"
          className={cn(
            'relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all min-w-[44px] min-h-[44px]',
            'bg-glass border-glass-border text-slate-500 hover:text-slate-200 hover:bg-glass-hover',
          )}
        >
          <Bell size={15} aria-hidden />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-focus text-[9px] font-bold text-white flex items-center justify-center px-1 leading-none"
              aria-hidden
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Configurações — avatar */}
        {user && (
          <Link
            to="/settings"
            aria-label="Configurações e perfil"
            title="Configurações"
            className="flex-shrink-0 rounded-full ring-2 ring-transparent hover:ring-focus/40 transition-all"
          >
            <Avatar name={user.email} size="sm" />
          </Link>
        )}
      </header>

      {/* Search overlay — rendered outside header for correct z-index */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
