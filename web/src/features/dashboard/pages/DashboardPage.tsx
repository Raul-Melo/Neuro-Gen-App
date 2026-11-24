import { CalendarDays, Timer, Heart, CheckCircle2, Clock, TrendingUp, Zap, Frown, Meh, Smile, SmilePlus, Sun, Sunset, Moon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, Badge, Spinner } from '@/shared/components/ui'
import { useAuthStore } from '@/shared/stores/auth.store'
import { agendaService } from '@/features/agenda/services/agenda.service'
import { emotionalService } from '@/features/emotional/services/emotional.service'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { MoodLevel } from '@/shared/types/api.types'
import { cn } from '@/shared/lib/cn'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function GreetingIcon() {
  const h = new Date().getHours()
  if (h < 12) return <Sun size={18} className="text-vault-light" aria-hidden />
  if (h < 18) return <Sunset size={18} className="text-vault" aria-hidden />
  return <Moon size={18} className="text-link-light" aria-hidden />
}

const quickActions = [
  { to: '/agenda',    label: 'Agenda',       description: 'Ver compromissos de hoje', icon: CalendarDays, color: '#6366f1', bg: 'bg-agenda-muted',    border: 'border-agenda/20' },
  { to: '/focus',     label: 'Iniciar Foco', description: 'Pomodoro 25 min',          icon: Timer,        color: '#7c3aed', bg: 'bg-focus-muted',     border: 'border-focus/20' },
  { to: '/emotional', label: 'Check-in',     description: 'Como você está?',          icon: Heart,        color: '#0891b2', bg: 'bg-emotional-muted', border: 'border-emotional/20' },
]

const priorityConfig = {
  HIGH:   { label: 'Alta',    variant: 'danger' as const },
  URGENT: { label: 'Urgente', variant: 'danger' as const },
  MEDIUM: { label: 'Média',   variant: 'agenda' as const },
  LOW:    { label: 'Baixa',   variant: 'neutral' as const },
}

const moodIcons: Record<MoodLevel, React.ElementType> = {
  1: Frown, 2: Frown, 3: Meh, 4: Smile, 5: SmilePlus,
}
const moodColors: Record<MoodLevel, string> = {
  1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#22c55e', 5: '#10b981',
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })

  const { data: taskData, isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => agendaService.getTasks(),
  })

  const { data: trendData } = useQuery({
    queryKey: ['emotional-trend'],
    queryFn: () => emotionalService.getTrend(),
  })

  const { data: checkInsData } = useQuery({
    queryKey: ['check-ins'],
    queryFn: () => emotionalService.getCheckIns(),
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => agendaService.updateTaskStatus(id, 'DONE'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const tasks = taskData ?? []
  const todayTasks = tasks.filter((t) => t.status !== 'ARCHIVED').slice(0, 5)
  const todayDone = todayTasks.filter((t) => t.status === 'DONE').length
  const latestMoodScore = checkInsData?.content?.[0]?.moodScore
  const latestMood = latestMoodScore ? (Math.ceil(latestMoodScore / 2) as MoodLevel) : undefined
  const trend7 = trendData ?? null

  return (
    <div className="page-container space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="label-muted capitalize">{today}</p>
        <h1 className="font-display font-bold text-slate-100 text-2xl flex items-center gap-2">
          <GreetingIcon />
          {getGreeting()}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-slate-500">
          {loadingTasks
            ? 'Carregando...'
            : `Você tem ${todayTasks.filter((t) => t.status !== 'DONE').length} tarefas pendentes hoje`}
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.to} to={action.to} className="block group">
              <div className={`glass-card-hover p-4 flex items-center gap-4 ${action.bg} border ${action.border}`}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${action.color}20` }}>
                  <Icon size={20} style={{ color: action.color }} aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-200 font-display">{action.label}</p>
                  <p className="text-xs text-slate-500 truncate">{action.description}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today tasks */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Tarefas de hoje</CardTitle>
              <div className="flex items-center gap-2">
                {!loadingTasks && (
                  <span className="text-xs text-slate-500">{todayDone}/{todayTasks.length} concluídas</span>
                )}
                <Link to="/agenda" className="text-xs text-focus-light hover:text-focus transition-colors">
                  Ver todas
                </Link>
              </div>
            </CardHeader>

            {loadingTasks ? (
              <div className="flex justify-center py-8"><Spinner size="sm" /></div>
            ) : (
              <>
                <div
                  className="h-1.5 rounded-full bg-glass mb-4"
                  role="progressbar"
                  aria-valuenow={todayDone}
                  aria-valuemin={0}
                  aria-valuemax={Math.max(todayTasks.length, 1)}
                  aria-label={`${todayDone} de ${todayTasks.length} tarefas concluídas`}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-focus to-agenda transition-all duration-500"
                    style={{ width: `${todayTasks.length ? (todayDone / todayTasks.length) * 100 : 0}%` }}
                  />
                </div>

                {todayTasks.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <CalendarDays size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhuma tarefa para hoje</p>
                    <Link to="/agenda" className="text-xs text-focus-light hover:text-focus mt-1 block">Adicionar tarefa</Link>
                  </div>
                ) : (
                  <ul className="space-y-2" role="list">
                    {todayTasks.map((task) => {
                      const isDone = task.status === 'DONE'
                      return (
                        <li
                          key={task.id}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-xl border transition-all duration-150',
                            isDone ? 'border-glass-border bg-glass opacity-60' : 'border-glass-border bg-glass hover:bg-glass-hover',
                          )}
                        >
                          <button
                            onClick={() => !isDone && completeMutation.mutate(task.id)}
                            aria-label={isDone ? `${task.title} — concluída` : `Marcar ${task.title} como concluída`}
                            disabled={isDone || completeMutation.isPending}
                            className="flex-shrink-0"
                          >
                            <CheckCircle2
                              size={18}
                              className={isDone ? 'text-emotional' : 'text-slate-700 hover:text-slate-500 transition-colors'}
                              aria-hidden
                            />
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm truncate', isDone ? 'line-through text-slate-500' : 'text-slate-200')}>
                              {task.title}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {task.dueTime && (
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Clock size={11} aria-hidden /> {task.dueTime}
                              </span>
                            )}
                            <Badge variant={priorityConfig[task.priority]?.variant ?? 'neutral'}>
                              {priorityConfig[task.priority]?.label ?? task.priority}
                            </Badge>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </>
            )}
          </Card>
        </div>

        {/* Stats sidebar */}
        <div className="space-y-4">
          {/* Focus today */}
          <Card accentColor="#7c3aed">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-focus-muted flex items-center justify-center">
                <Zap size={16} className="text-focus-light" aria-hidden />
              </div>
              <span className="text-sm font-medium text-slate-300">Foco hoje</span>
            </div>
            <p className="font-display font-bold text-2xl text-slate-100">1h 25m</p>
            <p className="text-xs text-slate-500 mt-1">3 sessões completadas</p>
          </Card>

          {/* Mood */}
          <Card accentColor="#0891b2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emotional-muted flex items-center justify-center">
                <Heart size={16} className="text-emotional-light" aria-hidden />
              </div>
              <span className="text-sm font-medium text-slate-300">Humor atual</span>
            </div>
            <div className="flex gap-1.5" role="group" aria-label="Selecionar humor rápido">
              {([1, 2, 3, 4, 5] as MoodLevel[]).map((v) => {
                const Icon = moodIcons[v]
                const isActive = latestMood === v
                return (
                  <button
                    key={v}
                    aria-label={`Nível de humor ${v}`}
                    aria-pressed={isActive}
                    className={cn(
                      'flex-1 h-8 rounded-lg flex items-center justify-center transition-all duration-150',
                      isActive ? 'bg-emotional-muted border border-emotional/40' : 'bg-glass border border-glass-border hover:bg-glass-hover',
                    )}
                  >
                    <Icon size={14} style={{ color: isActive ? moodColors[v] : undefined }} aria-hidden />
                  </button>
                )
              })}
            </div>
            <Link to="/emotional" className="text-xs text-emotional-light hover:text-emotional mt-2 block transition-colors">
              Registrar check-in
            </Link>
          </Card>

          {/* Weekly trend */}
          <Card accentColor="#6366f1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-agenda-muted flex items-center justify-center">
                <TrendingUp size={16} className="text-agenda-light" aria-hidden />
              </div>
              <span className="text-sm font-medium text-slate-300">Humor 7 dias</span>
            </div>
            <div className="flex items-end gap-1 h-16" role="img" aria-label="Tendência emocional da semana">
              {Array.from({ length: 7 }, (_, i) => {
                const score = trend7?.avgMoodScore ?? 0
                const height = score ? (score / 10) * 100 : 8
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm transition-all"
                    style={{
                      height: `${height}%`,
                      background: score ? '#0891b2' : 'rgba(8,145,178,0.15)',
                    }}
                    aria-hidden
                  />
                )
              })}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].join(' · ')}
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
