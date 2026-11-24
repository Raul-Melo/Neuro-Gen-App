import { Bell, Search, Eye, EyeOff, Menu } from 'lucide-react'
import { Button } from '../ui/Button'
import { useUIStore } from '@/shared/stores/ui.store'
import { useAuthStore } from '@/shared/stores/auth.store'
import { Avatar } from '../ui/Avatar'
import { Link } from 'react-router-dom'

interface TopBarProps {
  title?: string
  actions?: React.ReactNode
}

export function TopBar({ title, actions }: TopBarProps) {
  const reducedDensity       = useUIStore((s) => s.reducedDensity)
  const toggleReducedDensity = useUIStore((s) => s.toggleReducedDensity)
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen)
  const user = useAuthStore((s) => s.user)

  return (
    <header className="h-[var(--topbar-height)] flex items-center px-4 sm:px-5 border-b border-glass-border bg-base-800/50 backdrop-blur-sm sticky top-0 z-40 gap-2">
      {/* Hamburger — mobile only */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Abrir menu"
        className="lg:hidden text-slate-500 hover:text-slate-200 flex-shrink-0 -ml-1"
      >
        <Menu size={18} />
      </Button>

      {title && (
        <h1 className="font-display font-semibold text-slate-100 text-base mr-auto truncate">
          {title}
        </h1>
      )}

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        {actions}

        {/* Search */}
        <Button
          variant="ghost"
          size="sm"
          aria-label="Busca global"
          className="text-slate-500 hover:text-slate-200"
        >
          <Search size={16} />
        </Button>

        {/* Reduced density toggle (RNF-USA.3) */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleReducedDensity}
          aria-label={reducedDensity ? 'Desativar modo simplificado' : 'Ativar modo simplificado'}
          aria-pressed={reducedDensity}
          title="Modo baixa densidade"
          className="hidden sm:flex text-slate-500 hover:text-slate-200"
        >
          {reducedDensity ? <EyeOff size={16} /> : <Eye size={16} />}
        </Button>

        {/* Notifications */}
        <Link to="/notifications" aria-label="Notificações">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-500 hover:text-slate-200 relative"
          >
            <Bell size={16} />
            <span
              className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-focus rounded-full"
              aria-hidden
            />
          </Button>
        </Link>

        {/* User avatar */}
        {user && (
          <Link to="/settings" aria-label="Perfil e configurações">
            <Avatar name={user.name} src={user.avatarUrl} size="sm" />
          </Link>
        )}
      </div>
    </header>
  )
}
