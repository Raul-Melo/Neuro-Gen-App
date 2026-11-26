import {
  CalendarDays, Timer, Heart, CheckCircle2, Clock,
  TrendingUp, Zap, Frown, Meh, Smile, SmilePlus,
  Sun, Sunset, Moon, ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, Badge, Spinner } from '@/shared/components/ui'
import { useAuthStore } from '@/shared/stores/auth.store'
import { agendaService } from '@/features/agenda/services/agenda.service'
import { emotionalService } from '@/features/emotional/services/emotional.service'
import { format, isToday, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { MoodLevel } from '@/shared/types/api.types'
import { moodConfig } from '@/features/emotional/types'
import { cn } from '@/shared/lib/cn'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function GreetingIcon() {
  const h = new Date().getHours()
  if (h < 12) return <Sun    size={20} className="text-vault-light"  aria-hidden />
  if (h < 18) return <Sunset size={20} className="text-vault"        aria-hidden />
  return               <Moon  size={20} className="text-link-light"   aria-hidden />
}

const quickActions = [
  { to: '/agenda',    label: 'Agenda',    description: 'Compromissos de hoje', icon: CalendarDays, color: '#6366f1', bg: 'bg-agenda-muted',    border: 'border-agenda/20' },
  { to: '/focus',     label: 'Foco',      description: 'Iniciar pomodoro',     icon: Timer,        color: '#7c3aed', bg: 'bg-focus-muted',     border: 'border-focus/20' },
  { to: '/emotional', label: 'Emocional', description: 'Como você está?',      icon: Heart,        color: '#0891b2', bg: 'bg-emotional-muted', border: 'border-emotional/20' },
]

const priorityConfig = {
  HIGH:   { label: 'Alta',    variant: 'danger'  as const },
  URGENT: { label: 'Urgente', variant: 'danger'  as const },
  MEDIUM: { label: 'Média',   variant: 'agenda'  as const },
  LOW:    { label: 'Baixa',   variant: 'neutral' as const },
}

const moodIcons: Record<MoodLevel, React.ElementType> = {
  1: Frown, 2: Frown, 3: Meh, 4: Smile, 5: SmilePlus,
}

function displayLevel(score: number): MoodLevel {
  return Math.min(5, Math.max(1, Math.round(score))) as MoodLevel
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const qc   = useQueryClient()
  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })

  const { data: taskData, isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn:  () => agendaService.getTasks(),
    staleTime: 2 * 60 * 1000,
  })

  const { data: trendData } = useQuery({
    queryKey: ['emotional-trend'],
    queryFn:  () => emotionalService.getTrend(),
    staleTime: 5 * 60 * 1000,
  })

  const { data: checkInsData } = useQuery({
    queryKey: ['check-ins'],
    queryFn:  () => emotionalService.getCheckIns(),
    staleTime: 2 * 60 * 1000,
  })

  const { data: eventData } = useQuery({
    queryKey: ['events'],
    queryFn:  () => agendaService.getEvents(),
    staleTime: 2 * 60 * 1000,
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => agendaService.updateTaskStatus(id, 'DONE'),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const tasks      = taskData ?? []
  const todayTasks = tasks.filter((t) => t.status !== 'CANCELLED').slice(0, 5)
  const todayDone  = todayTasks.filter((t) => t.status === 'DONE').length
  const pending    = todayTasks.filter((t) => t.status !== 'DONE').length

  const todayEvents = (Array.isArray(eventData) ? eventData : []).filter((e) => {
    try { return isToday(parseISO(e.startAt)) } catch { return false }
  })

  const history          = checkInsData ?? []
  const latestCheckIn    = history[0]
  const latestMoodScore  = latestCheckIn?.moodScore
  const latestMood       = latestMoodScore ? displayLevel(latestMoodScore) : undefined
  const trend7           = trendData ?? null
  const checkedInToday   = latestCheckIn
    ? (() => { try { return isToday(parseISO(latestCheckIn.checkInDate)) } catch { return false } })()
    : false

  return (
    <div className="page-container space-y-5 animate-fade-in pb-24 sm:pb-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-1">
        <p className="label-muted capitalize text-xs">{today}</p>
        <h1 className="font-display font-bold text-slate-100 text-2xl flex items-center gap-2">
          <GreetingIcon />
          {getGreeting()}{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h1>
        <p className="text-sm text-slate-500">
          {loadingTasks
            ? 'Carregando…'
            : pending > 0
              ? `${pending} tarefa${pending !== 1 ? 's' : ''} pendente${pending !== 1 ? 's' : ''} hoje`
              : todayTasks.length > 0
                ? '✓ Todas as tarefas concluídas!'
                : 'Nenhuma tarefa para hoje'}
        </p>
      </div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.to} to={action.to} className="block group">
              <div className={cn(
                'glass-card-hover p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3',
                action.bg, 'border', action.border,
              )}>
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${action.color}20` }}
                >
                  <Icon size={18} style={{ color: action.color }} aria-hidden />
                </div>
                <div className="min-w-0 text-center sm:text-left">
                  <p className="text-xs sm:text-sm font-medium text-slate-200 font-display">{action.label}</p>
                  <p className="text-[10px] sm:text-xs text-slate-500 hidden sm:block truncate">{action.description}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tasks */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Tarefas de hoje</CardTitle>
              <div className="flex items-center gap-3">
                {!loadingTasks && (
                  <span className="text-xs text-slate-500">{todayDone}/{todayTasks.length}</span>
                )}
                <Link to="/agenda" className="flex items-center gap-1 text-xs text-focus-light hover:text-focus transition-colors">
                  Ver todas <ArrowRight size={11} />
                </Link>
              </div>
            </CardHeader>

            {loadingTasks ? (
              <div className="flex justify-center py-8"><Spinner size="sm" /></div>
            ) : (
              <>
                <div
                  className="h-1.5 rounded-full bg-glass mb-4 overflow-hidden"
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
                    <p className="text-sm">Nenhuma tarefa por enquanto</p>
                    <Link to="/agenda" className="text-xs text-focus-light hover:text-focus mt-1 inline-block">
                      + Adicionar tarefa
                    </Link>
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
                            isDone
                              ? 'border-glass-border bg-glass opacity-60'
                              : 'border-glass-border bg-glass hover:bg-glass-hover',
                          )}
                        >
                          <button
                            onClick={() => !isDone && completeMutation.mutate(task.id)}
                            aria-label={isDone ? `${task.title} — concluída` : `Marcar ${task.title} como concluída`}
                            disabled={isDone || completeMutation.isPending}
                            className="flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
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
                              <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500">
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

          {/* Today events — compact strip */}
          {todayEvents.length > 0 && (
            <div className="mt-3 glass-card p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Eventos hoje</span>
                <Link to="/agenda" className="text-[10px] text-agenda-light hover:text-agenda transition-colors">
                  Agenda →
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {todayEvents.slice(0, 4).map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
                    style={{ background: `${ev.color ?? '#6366f1'}20`, borderLeft: `2px solid ${ev.color ?? '#6366f1'}` }}
                  >
                    <span className="text-slate-300 truncate max-w-[120px]">{ev.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Stats sidebar ── */}
        <div className="space-y-4">
          {/* Mood card */}
          <Card accentColor="#0891b2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emotional-muted flex items-center justify-center">
                <Heart size={16} className="text-emotional-light" aria-hidden />
              </div>
              <span className="text-sm font-medium text-slate-300">Humor</span>
              {checkedInToday && (
                <span className="ml-auto text-[10px] text-emotional bg-emotional-muted px-2 py-0.5 rounded-full">
                  Registrado hoje
                </span>
              )}
            </div>

            {latestMood ? (
              <div className="flex items-center gap-2 mb-2">
                {(() => {
                  const Icon = moodIcons[latestMood]
                  const cfg  = moodConfig[latestMood]
                  return (
                    <>
                      <Icon size={22} style={{ color: cfg.color }} aria-hidden />
                      <span className="text-sm text-slate-300">{cfg.label}</span>
                    </>
                  )
                })()}
              </div>
            ) : (
              <div className="flex gap-1 mb-2" role="group" aria-label="Níveis de humor">
                {([1, 2, 3, 4, 5] as MoodLevel[]).map((v) => {
                  const Icon = moodIcons[v]
                  return (
                    <div
                      key={v}
                      className="flex-1 h-8 rounded-lg flex items-center justify-center bg-glass border border-glass-border"
                    >
                      <Icon size={14} className="text-slate-700" aria-hidden />
                    </div>
                  )
                })}
              </div>
            )}

            <Link
              to="/emotional"
              className="text-xs text-emotional-light hover:text-emotional transition-colors flex items-center gap-1"
            >
              {checkedInToday ? 'Ver detalhes' : 'Registrar check-in'}
              <ArrowRight size={11} />
            </Link>
          </Card>

          {/* Focus stats */}
          <Card accentColor="#7c3aed">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-focus-muted flex items-center justify-center">
                <Zap size={16} className="text-focus-light" aria-hidden />
              </div>
              <span className="text-sm font-medium text-slate-300">Foco</span>
            </div>
            <Link
              to="/focus"
              className="flex items-center justify-between p-3 rounded-xl bg-focus-muted border border-focus/20 hover:border-focus/40 transition-all group"
            >
              <div>
                <p className="text-sm font-medium text-focus-light">Iniciar sessão</p>
                <p className="text-xs text-slate-500">Pomodoro 25 min</p>
              </div>
              <ArrowRight size={16} className="text-focus-light group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Card>

          {/* Weekly trend chart */}
          <Card accentColor="#6366f1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-agenda-muted flex items-center justify-center">
                <TrendingUp size={16} className="text-agenda-light" aria-hidden />
              </div>
              <span className="text-sm font-medium text-slate-300">Humor 7 dias</span>
            </div>

            {history.length > 0 ? (
              <>
                <div className="flex items-end gap-1 h-12" role="img" aria-label="Tendência emocional da semana">
                  {history.slice(0, 7).reverse().map((ci, i: number) => {
                    const score  = ci.moodScore ?? 0
                    const height = score ? (score / 5) * 100 : 8
                    const color  = moodConfig[displayLevel(score)].color
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm transition-all"
                        style={{ height: `${height}%`, background: `${color}70` }}
                        aria-hidden
                      />
                    )
                  })}
                </div>
                {trend7 && (
                  <p className="text-[10px] text-slate-500 mt-2">
                    Média: <span className="text-slate-300">{trend7.averageMood.toFixed(1)}/5</span>
                    {' · '}
                    <span className="text-slate-400">
                      {{ IMPROVING: '↑ Melhorando', STABLE: '→ Estável', DECLINING: '↓ Caindo' }[trend7.trend] ?? '—'}
                    </span>
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-end gap-1 h-12" role="img" aria-label="Sem dados">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex-1 rounded-t-sm bg-glass-border" style={{ height: '8%' }} aria-hidden />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
