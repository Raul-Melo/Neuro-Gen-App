import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  Timer,
  Heart,
  Lock,
  Users,
  Bell,
  Settings,
  ChevronLeft,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { useUIStore } from '@/shared/stores/ui.store'
import { useAuthStore } from '@/shared/stores/auth.store'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
  accentColor: string
  roles?: ('TITULAR' | 'APOIO')[]
}

const navItems: NavItem[] = [
  { to: '/dashboard',     label: 'Início',         icon: LayoutDashboard, accentColor: '#60a5fa' },
  { to: '/agenda',        label: 'Agenda',          icon: CalendarDays,    accentColor: '#a5b4fc' },
  { to: '/focus',         label: 'Foco',            icon: Timer,           accentColor: '#c084fc' },
  { to: '/emotional',     label: 'Emocional',       icon: Heart,           accentColor: '#22d3ee' },
  { to: '/vault',         label: 'Cofre',           icon: Lock,            accentColor: '#fbbf24', roles: ['TITULAR'] },
  { to: '/links',         label: 'Vínculos',        icon: Users,           accentColor: '#d8b4fe' },
  { to: '/notifications', label: 'Notificações',    icon: Bell,            accentColor: '#60a5fa' },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps = {}) {
  const collapsed  = useUIStore((s) => s.sidebarCollapsed)
  const toggle     = useUIStore((s) => s.toggleSidebar)
  const user       = useAuthStore((s) => s.user)
  const location   = useLocation()

  const visible = navItems.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role)),
  )

  return (
    <aside
      className={cn(
        'relative flex flex-col h-full bg-base-800/80 backdrop-blur-md border-r border-glass-border',
        'transition-all duration-250 ease-out',
        collapsed ? 'w-16' : 'w-[var(--sidebar-width)]',
      )}
      aria-label="Navegação principal"
    >
      {/* ── Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-[18px] border-b border-glass-border',
        collapsed && 'justify-center px-0',
      )}>
        <img
          src="/logo-64.webp"
          alt="Neuro-Gen"
          width={32}
          height={32}
          className="w-8 h-8 flex-shrink-0 drop-shadow-[0_0_8px_rgba(124,58,237,0.45)]"
        />
        {!collapsed && (
          <span className="font-display font-bold text-base tracking-tight text-brand-gradient select-none">
            Neuro-Gen
          </span>
        )}
      </div>

      {/* ── Nav items */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto no-scrollbar" aria-label="Menu principal">
        <ul className="space-y-0.5" role="list">
          {visible.map((item) => {
            const Icon    = item.icon
            const isActive = location.pathname.startsWith(item.to)

            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  aria-label={collapsed ? item.label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                    'transition-all duration-150',
                    collapsed && 'justify-center',
                    isActive
                      ? 'bg-glass-hover text-slate-100'
                      : 'text-slate-500 hover:text-slate-200 hover:bg-glass',
                  )}
                >
                  <Icon
                    size={18}
                    className="flex-shrink-0"
                    style={{ color: isActive ? item.accentColor : undefined }}
                    aria-hidden
                  />
                  {!collapsed && <span className="flex-1">{item.label}</span>}
                  {!collapsed && isActive && (
                    <span
                      className="w-1 h-5 rounded-full flex-shrink-0"
                      style={{ background: item.accentColor }}
                      aria-hidden
                    />
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ── Bottom: settings + user */}
      <div className="px-2 pb-3 border-t border-glass-border pt-2 space-y-0.5">
        <NavLink
          to="/settings"
          onClick={onClose}
          aria-label={collapsed ? 'Configurações' : undefined}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              collapsed && 'justify-center',
              isActive
                ? 'bg-glass-hover text-slate-100'
                : 'text-slate-500 hover:text-slate-200 hover:bg-glass',
            )
          }
        >
          <Settings size={18} aria-hidden />
          {!collapsed && 'Configurações'}
        </NavLink>

        {user && (
          <div className={cn(
            'flex items-center gap-3 px-3 py-2 mt-1 rounded-xl',
            collapsed && 'justify-center',
          )}>
            <Avatar name={user.name} size="sm" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{user.name}</p>
                <p className="text-xs text-slate-500">
                  {user.role === 'TITULAR' ? 'Titular' : 'Apoio'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Collapse toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggle}
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        className={cn(
          'absolute -right-3 top-[72px] w-6 h-6 p-0 rounded-full z-10',
          'bg-base-800 border border-glass-border shadow-glass text-slate-500 hover:text-slate-200',
          collapsed && 'rotate-180',
        )}
      >
        <ChevronLeft size={12} />
      </Button>
    </aside>
  )
}
