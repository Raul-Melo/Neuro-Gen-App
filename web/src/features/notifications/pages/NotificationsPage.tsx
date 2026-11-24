import { Bell, BellOff, CalendarDays, Link2, Heart, Info, CheckCheck } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Spinner } from '@/shared/components/ui'
import { notificationsService, type Notification } from '../services/notifications.service'
import { useUIStore } from '@/shared/stores/ui.store'
import { cn } from '@/shared/lib/cn'

const typeConfig: Record<Notification['type'], { icon: React.ElementType; color: string }> = {
  REMINDER:    { icon: Bell,         color: '#6366f1' },
  LINK_ACCESS: { icon: Link2,        color: '#a855f7' },
  CHECKIN:     { icon: Heart,        color: '#0891b2' },
  SYSTEM:      { icon: Info,         color: '#94a3b8' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'agora'
  if (mins < 60) return `${mins} min atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h atrás`
  return `${Math.floor(hrs / 24)}d atrás`
}

export function NotificationsPage() {
  const qc = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => notificationsService.getAll(),
    refetchInterval: 30_000,
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      addToast({ variant: 'success', message: 'Todas as notificações lidas' })
    },
  })

  const notifications = data?.content ?? []
  const unread = data?.unreadCount ?? 0

  return (
    <div className="page-container space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-header text-xl flex items-center gap-2">
            <Bell size={18} className="text-brand-light" aria-hidden />
            Notificações
            {unread > 0 && (
              <span className="text-xs bg-danger text-white px-2 py-0.5 rounded-full font-medium">
                {unread}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">Lembretes, acessos e alertas do sistema</p>
        </div>

        {unread > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            loading={markAllMutation.isPending}
            aria-label="Marcar todas como lidas"
            className="text-slate-500"
          >
            <CheckCheck size={15} /> Marcar todas
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : notifications.length === 0 ? (
        <div className="glass-card p-16 text-center text-slate-500">
          <BellOff size={28} className="mx-auto mb-3 opacity-30" aria-hidden />
          <p className="text-sm">Nenhuma notificação</p>
        </div>
      ) : (
        <ul className="space-y-2" role="list">
          {notifications.map((n) => {
            const cfg  = typeConfig[n.type] ?? typeConfig.SYSTEM
            const Icon = cfg.icon
            return (
              <li key={n.id}>
                <button
                  className={cn(
                    'w-full text-left flex items-start gap-4 p-4 rounded-xl border transition-all duration-150',
                    n.read
                      ? 'border-glass-border bg-glass opacity-70'
                      : 'border-glass-border bg-glass-hover hover:brightness-105',
                  )}
                  onClick={() => !n.read && markReadMutation.mutate(n.id)}
                  aria-label={n.read ? n.title : `${n.title} — marcar como lida`}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${cfg.color}18` }}
                  >
                    <Icon size={16} style={{ color: cfg.color }} aria-hidden />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm font-medium truncate', n.read ? 'text-slate-500' : 'text-slate-200')}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-brand flex-shrink-0 mt-1" aria-label="Não lida" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                    <p className="text-[10px] text-slate-600 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
