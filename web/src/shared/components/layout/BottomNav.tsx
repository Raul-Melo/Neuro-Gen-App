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
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { useAuthStore } from '@/shared/stores/auth.store'

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
  color: string
  glow: string
  roles?: ('TITULAR' | 'APOIO')[]
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Início',
    icon: LayoutDashboard,
    color: '#60a5fa',
    glow: 'rgba(96,165,250,0.45)',
  },
  {
    to: '/agenda',
    label: 'Agenda',
    icon: CalendarDays,
    color: '#a5b4fc',
    glow: 'rgba(165,180,252,0.45)',
  },
  {
    to: '/focus',
    label: 'Foco',
    icon: Timer,
    color: '#c084fc',
    glow: 'rgba(192,132,252,0.45)',
  },
  {
    to: '/emotional',
    label: 'Emocional',
    icon: Heart,
    color: '#22d3ee',
    glow: 'rgba(34,211,238,0.45)',
  },
  {
    to: '/vault',
    label: 'Cofre',
    icon: Lock,
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.45)',
    roles: ['TITULAR'],
  },
  {
    to: '/links',
    label: 'Vínculos',
    icon: Users,
    color: '#d8b4fe',
    glow: 'rgba(216,180,254,0.45)',
  },
  {
    to: '/notifications',
    label: 'Avisos',
    icon: Bell,
    color: '#60a5fa',
    glow: 'rgba(96,165,250,0.45)',
  },
  {
    to: '/settings',
    label: 'Config',
    icon: Settings,
    color: '#94a3b8',
    glow: 'rgba(148,163,184,0.35)',
  },
]

export function BottomNav() {
  const user     = useAuthStore((s) => s.user)
  const location = useLocation()

  const visible = NAV_ITEMS.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role)),
  )

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 pb-safe"
      aria-label="Navegação principal mobile"
    >
      {/* Fundo glass com blur */}
      <div className="relative mx-3 mb-3">
        <div
          className={cn(
            'flex items-end justify-around',
            'bg-base-800/90 backdrop-blur-xl',
            'border border-glass-border',
            'rounded-[28px] px-2 pt-2 pb-2',
            'shadow-[0_8px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)]',
          )}
        >
          {visible.map((item) => {
            const Icon     = item.icon
            const isActive = location.pathname.startsWith(item.to)

            return (
              <NavLink
                key={item.to}
                to={item.to}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className="flex-1 flex flex-col items-center"
              >
                {/* Botão circular — elevado quando ativo ou é o item central */}
                <span
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-0.5',
                    'transition-all duration-300 ease-out',
                    'min-w-[44px] min-h-[44px]',
                  )}
                >
                  {/* Halo circular de fundo quando ativo */}
                  <span
                    className={cn(
                      'absolute inset-0 rounded-full transition-all duration-300',
                      isActive
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 scale-75',
                    )}
                    style={
                      isActive
                        ? {
                            background: `radial-gradient(circle, ${item.glow} 0%, transparent 70%)`,
                            transform: 'scale(1.4)',
                          }
                        : undefined
                    }
                    aria-hidden
                  />

                  {/* Pílula circular elevada quando ativo */}
                  <span
                    className={cn(
                      'relative flex items-center justify-center',
                      'w-11 h-11 rounded-full',
                      'transition-all duration-300 ease-out',
                      isActive
                        ? '-translate-y-3 shadow-[0_6px_20px_var(--item-glow)]'
                        : 'translate-y-0',
                    )}
                    style={
                      isActive
                        ? ({
                            background: `linear-gradient(145deg, ${item.color}22, ${item.color}44)`,
                            border: `1.5px solid ${item.color}55`,
                            '--item-glow': item.glow,
                          } as React.CSSProperties)
                        : undefined
                    }
                  >
                    <Icon
                      size={isActive ? 22 : 20}
                      className="transition-all duration-300"
                      style={{ color: isActive ? item.color : 'rgba(148,163,184,0.7)' }}
                      aria-hidden
                    />

                    {/* Ponto indicador (ativo) */}
                    {isActive && (
                      <span
                        className="absolute -bottom-1.5 w-1 h-1 rounded-full"
                        style={{ background: item.color }}
                        aria-hidden
                      />
                    )}
                  </span>

                  {/* Label abaixo — aparece só quando ativo */}
                  <span
                    className={cn(
                      'text-[9px] font-medium tracking-wide leading-none',
                      'transition-all duration-300',
                      isActive
                        ? '-translate-y-2 opacity-100'
                        : 'opacity-0 translate-y-1 h-0 overflow-hidden',
                    )}
                    style={{ color: item.color }}
                    aria-hidden
                  >
                    {item.label}
                  </span>
                </span>
              </NavLink>
            )
          })}
        </div>

        {/* Linha de gradiente decorativa no topo do nav */}
        <div
          className="absolute top-0 left-6 right-6 h-px rounded-full opacity-30"
          style={{ background: 'linear-gradient(90deg, transparent, #7c3aed, #2563eb, transparent)' }}
          aria-hidden
        />
      </div>
    </nav>
  )
}
