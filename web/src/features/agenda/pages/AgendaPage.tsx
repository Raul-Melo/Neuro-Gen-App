import { useState } from 'react'
import { Plus, CalendarDays, List, Columns, LayoutGrid, CheckCircle2, Circle, Clock, ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Badge, Spinner } from '@/shared/components/ui'
import { cn } from '@/shared/lib/cn'
import type { AgendaView, Task, Event } from '../types'
import { agendaService } from '../services/agenda.service'
import { format, addDays, startOfWeek, isSameDay, parseISO, getHours, getMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useUIStore } from '@/shared/stores/ui.store'

// ─── constants ──────────────────────────────────────────────────────────────
const views: { key: AgendaView; label: string; icon: React.ElementType }[] = [
  { key: 'day',    label: 'Dia',     icon: CalendarDays },
  { key: 'week',   label: 'Semana',  icon: LayoutGrid },
  { key: 'list',   label: 'Lista',   icon: List },
  { key: 'kanban', label: 'Kanban',  icon: Columns },
]

const priorityDot: Record<string, string> = {
  HIGH:   'bg-danger',
  URGENT: 'bg-danger animate-pulse',
  MEDIUM: 'bg-agenda',
  LOW:    'bg-slate-500',
}

const priorityBadge = {
  HIGH:   { label: 'Alta',    variant: 'danger'  as const },
  URGENT: { label: 'Urgente', variant: 'danger'  as const },
  MEDIUM: { label: 'Média',   variant: 'agenda'  as const },
  LOW:    { label: 'Baixa',   variant: 'neutral' as const },
}

const statusColumns = [
  { id: 'TODO',        label: 'A fazer',      color: '#94a3b8' },
  { id: 'IN_PROGRESS', label: 'Em andamento', color: '#6366f1' },
  { id: 'DONE',        label: 'Concluído',    color: '#10b981' },
]

const HOUR_START = 7
const HOUR_END   = 21
const HOUR_HEIGHT = 56 // px per hour

// ─── helpers ────────────────────────────────────────────────────────────────
function eventTopPct(startAt: string): number {
  const d = parseISO(startAt)
  return (getHours(d) - HOUR_START + getMinutes(d) / 60) * HOUR_HEIGHT
}
function eventHeightPx(startAt: string, endAt: string): number {
  const start = parseISO(startAt)
  const end   = parseISO(endAt)
  const diff  = (end.getTime() - start.getTime()) / 3_600_000
  return Math.max(diff * HOUR_HEIGHT, 32)
}

// ─── sub-views ──────────────────────────────────────────────────────────────
function DayView({ events, date }: { events: Event[]; date: Date }) {
  const todayEvents = events.filter((e) => isSameDay(parseISO(e.startAt), date))
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 py-3 border-b border-glass-border flex items-center gap-2">
        <span className="text-sm font-medium text-slate-200 capitalize">
          {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </span>
        {todayEvents.length === 0 && (
          <span className="text-xs text-slate-500">Nenhum evento</span>
        )}
      </div>

      <div className="relative overflow-y-auto" style={{ maxHeight: '480px' }}>
        {/* Hour grid */}
        <div className="relative" style={{ height: `${hours.length * HOUR_HEIGHT}px` }}>
          {hours.map((h) => (
            <div
              key={h}
              className="absolute left-0 right-0 border-t border-glass-border flex items-start"
              style={{ top: `${(h - HOUR_START) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
            >
              <span className="text-[10px] text-slate-600 w-12 pl-3 pt-1 flex-shrink-0 font-mono">
                {String(h).padStart(2, '0')}:00
              </span>
            </div>
          ))}

          {/* Current time indicator */}
          {isSameDay(date, new Date()) && (() => {
            const now = new Date()
            const top = (getHours(now) - HOUR_START + getMinutes(now) / 60) * HOUR_HEIGHT
            if (top < 0 || top > hours.length * HOUR_HEIGHT) return null
            return (
              <div
                className="absolute left-12 right-0 flex items-center gap-1 z-10 pointer-events-none"
                style={{ top: `${top}px` }}
              >
                <div className="w-2 h-2 rounded-full bg-brand flex-shrink-0" />
                <div className="flex-1 h-px bg-brand" />
              </div>
            )
          })()}

          {/* Events */}
          {todayEvents.map((ev) => (
            <div
              key={ev.id}
              className="absolute left-14 right-3 rounded-lg px-2 py-1 overflow-hidden cursor-pointer hover:brightness-110 transition-all"
              style={{
                top: `${eventTopPct(ev.startAt)}px`,
                height: `${eventHeightPx(ev.startAt, ev.endAt)}px`,
                background: ev.color ? `${ev.color}30` : '#6366f130',
                borderLeft: `3px solid ${ev.color ?? '#6366f1'}`,
              }}
              role="button"
              tabIndex={0}
              aria-label={ev.title}
            >
              <p className="text-xs font-medium text-slate-200 truncate">{ev.title}</p>
              <p className="text-[10px] text-slate-400">
                {format(parseISO(ev.startAt), 'HH:mm')} – {format(parseISO(ev.endAt), 'HH:mm')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function WeekView({ events, weekStart }: { events: Event[]; weekStart: Date }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)

  return (
    <div className="glass-card overflow-x-auto">
      {/* Day headers */}
      <div className="grid border-b border-glass-border" style={{ gridTemplateColumns: '48px repeat(7, 1fr)', minWidth: '560px' }}>
        <div className="border-r border-glass-border" />
        {days.map((d) => {
          const isToday = isSameDay(d, new Date())
          return (
            <div key={d.toISOString()} className={cn('py-2 text-center border-r border-glass-border last:border-0', isToday && 'bg-focus-muted')}>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                {format(d, 'EEE', { locale: ptBR })}
              </p>
              <p className={cn('text-sm font-medium', isToday ? 'text-focus-light' : 'text-slate-300')}>
                {format(d, 'd')}
              </p>
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
        <div className="relative" style={{ gridTemplateColumns: '48px repeat(7, 1fr)', minWidth: '560px' }}>
          {hours.map((h) => (
            <div
              key={h}
              className="absolute left-0 right-0 border-t border-glass-border flex"
              style={{ top: `${(h - HOUR_START) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
            >
              <span className="text-[10px] text-slate-600 w-12 pl-2 pt-1 font-mono flex-shrink-0">
                {String(h).padStart(2, '0')}:00
              </span>
              {days.map((d) => (
                <div key={d.toISOString()} className={cn('flex-1 border-l border-glass-border', isSameDay(d, new Date()) && 'bg-focus-muted/20')} />
              ))}
            </div>
          ))}

          {/* Events positioned per column */}
          {events.map((ev) => {
            const evDay = parseISO(ev.startAt)
            const colIdx = days.findIndex((d) => isSameDay(d, evDay))
            if (colIdx === -1) return null
            const colWidth = `calc((100% - 48px) / 7)`
            const colLeft  = `calc(48px + ${colIdx} * (100% - 48px) / 7)`
            return (
              <div
                key={ev.id}
                className="absolute rounded-lg px-1.5 py-0.5 overflow-hidden cursor-pointer hover:brightness-110 transition-all"
                style={{
                  top:    `${eventTopPct(ev.startAt)}px`,
                  height: `${eventHeightPx(ev.startAt, ev.endAt)}px`,
                  left:   colLeft,
                  width:  colWidth,
                  background: ev.color ? `${ev.color}30` : '#6366f130',
                  borderLeft: `2px solid ${ev.color ?? '#6366f1'}`,
                }}
                role="button"
                tabIndex={0}
                aria-label={ev.title}
              >
                <p className="text-[10px] font-medium text-slate-200 truncate">{ev.title}</p>
              </div>
            )
          })}
        </div>
        <div style={{ height: `${hours.length * HOUR_HEIGHT}px` }} />
      </div>
    </div>
  )
}

function ListView({ tasks, onComplete, onDelete }: {
  tasks: Task[]
  onComplete: (id: string) => void
  onDelete: (id: string) => void
}) {
  const active   = tasks.filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS')
  const done     = tasks.filter((t) => t.status === 'DONE')
  const archived = tasks.filter((t) => t.status === 'ARCHIVED')

  const Section = ({ title, items, dimmed }: { title: string; items: Task[]; dimmed?: boolean }) => (
    <div>
      <h2 className="label-muted mb-2">{title} ({items.length})</h2>
      {items.length === 0 ? (
        <p className="text-xs text-slate-600 italic px-1">Nenhuma tarefa</p>
      ) : (
        <ul className="space-y-2" role="list">
          {items.map((task) => {
            const isDone = task.status === 'DONE'
            return (
              <li
                key={task.id}
                className={cn('flex items-center gap-3 p-3 rounded-xl border border-glass-border bg-glass hover:bg-glass-hover transition-all', dimmed && 'opacity-60')}
              >
                <button
                  onClick={() => !isDone && onComplete(task.id)}
                  aria-label={isDone ? `${task.title} concluída` : `Concluir ${task.title}`}
                  disabled={isDone}
                  className="flex-shrink-0"
                >
                  {isDone
                    ? <CheckCircle2 size={18} className="text-emotional" aria-hidden />
                    : <Circle size={18} className="text-slate-700 hover:text-slate-400 transition-colors" aria-hidden />}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm truncate', isDone ? 'line-through text-slate-500' : 'text-slate-200')}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {task.dueDate && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Clock size={9} aria-hidden />
                        {task.dueDate}{task.dueTime ? ` ${task.dueTime}` : ''}
                      </span>
                    )}
                    {task.tags?.map((tag) => (
                      <span key={tag} className="text-[10px] text-slate-500 bg-glass px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={priorityBadge[task.priority]?.variant ?? 'neutral'}>
                    {priorityBadge[task.priority]?.label ?? task.priority}
                  </Badge>
                  <button
                    onClick={() => onDelete(task.id)}
                    aria-label={`Excluir ${task.title}`}
                    className="text-slate-700 hover:text-danger transition-colors"
                  >
                    <Trash2 size={13} aria-hidden />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <Section title="Pendentes / Em andamento" items={active} />
      <Section title="Concluídas" items={done} dimmed />
      {archived.length > 0 && <Section title="Arquivadas" items={archived} dimmed />}
    </div>
  )
}

function KanbanView({ tasks, onComplete }: { tasks: Task[]; onComplete: (id: string) => void }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar" role="main" aria-label="Quadro Kanban">
      {statusColumns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id)
        return (
          <div key={col.id} className="flex-shrink-0 w-72 flex flex-col gap-3" aria-label={`Coluna: ${col.label}`}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col.color }} aria-hidden />
              <span className="text-sm font-medium text-slate-300">{col.label}</span>
              <span className="ml-auto text-xs text-slate-600 bg-glass px-2 py-0.5 rounded-full">{colTasks.length}</span>
            </div>

            <ul className="space-y-2" role="list">
              {colTasks.map((task) => (
                <li
                  key={task.id}
                  className="glass-card-hover p-3 cursor-grab active:cursor-grabbing group"
                  draggable
                  aria-label={task.title}
                >
                  <div className="flex items-start gap-2">
                    <span className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', priorityDot[task.priority])} aria-hidden />
                    <p className="text-sm text-slate-200 leading-snug flex-1">{task.title}</p>
                    {task.status !== 'DONE' && (
                      <button
                        onClick={() => onComplete(task.id)}
                        aria-label={`Concluir ${task.title}`}
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-slate-600 hover:text-emotional min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        <CheckCircle2 size={14} aria-hidden />
                      </button>
                    )}
                  </div>
                  {task.dueDate && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-600">
                      <Clock size={9} aria-hidden /> {task.dueDate}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <button
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-400 hover:bg-glass transition-all border border-dashed border-glass-border"
              aria-label={`Adicionar tarefa em ${col.label}`}
            >
              <Plus size={12} aria-hidden /> Adicionar tarefa
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ─── create modal ────────────────────────────────────────────────────────────
type CreateTab = 'task' | 'event'

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [tab, setTab]           = useState<CreateTab>('task')
  const [title, setTitle]       = useState('')
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM')
  const [dueDate, setDueDate]   = useState('')
  const [startAt, setStartAt]   = useState('')
  const [endAt, setEndAt]       = useState('')
  const [type, setType]         = useState<'APPOINTMENT' | 'TASK' | 'PERSONAL' | 'REMINDER'>('APPOINTMENT')
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState('')
  const addToast = useUIStore((s) => s.addToast)

  const save = async () => {
    if (!title.trim()) { setErr('Informe o título'); return }
    if (tab === 'event' && (!startAt || !endAt)) { setErr('Informe horário de início e fim'); return }
    setSaving(true); setErr('')
    try {
      if (tab === 'task') {
        await agendaService.createTask({ title: title.trim(), priority, dueDate: dueDate || undefined })
        addToast({ variant: 'success', message: 'Tarefa criada!' })
      } else {
        await agendaService.createEvent({ title: title.trim(), startAt, endAt, type })
        addToast({ variant: 'success', message: 'Evento criado!' })
      }
      onCreated()
      onClose()
    } catch {
      setErr('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Criar item">
      <div className="w-full max-w-sm glass-card p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-100 font-display">Novo item</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-slate-500 hover:text-slate-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        {/* Tab */}
        <div className="flex gap-1 p-1 bg-glass border border-glass-border rounded-xl mb-5" role="tablist">
          {(['task', 'event'] as CreateTab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn('flex-1 py-1.5 rounded-lg text-xs font-medium transition-all', tab === t ? 'bg-glass-hover text-slate-100' : 'text-slate-500')}
            >
              {t === 'task' ? 'Tarefa' : 'Evento'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="label-muted block mb-1" htmlFor="item-title">Título *</label>
            <input
              id="item-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              placeholder={tab === 'task' ? 'Ex: Preparar relatório' : 'Ex: Consulta médica'}
              className="w-full h-10 rounded-xl bg-glass border border-glass-border px-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-agenda/50 transition-all"
            />
          </div>

          {tab === 'task' ? (
            <>
              <div>
                <label className="label-muted block mb-1" htmlFor="item-priority">Prioridade</label>
                <select
                  id="item-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as typeof priority)}
                  className="w-full h-10 rounded-xl bg-glass border border-glass-border px-3 text-sm text-slate-200 focus:outline-none focus:border-agenda/50 transition-all"
                >
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>
              <div>
                <label className="label-muted block mb-1" htmlFor="item-due">Vencimento</label>
                <input
                  id="item-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-10 rounded-xl bg-glass border border-glass-border px-3 text-sm text-slate-200 focus:outline-none focus:border-agenda/50 transition-all"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="label-muted block mb-1" htmlFor="item-type">Tipo</label>
                <select
                  id="item-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as typeof type)}
                  className="w-full h-10 rounded-xl bg-glass border border-glass-border px-3 text-sm text-slate-200 focus:outline-none focus:border-agenda/50 transition-all"
                >
                  <option value="APPOINTMENT">Consulta/Compromisso</option>
                  <option value="PERSONAL">Pessoal</option>
                  <option value="REMINDER">Lembrete</option>
                  <option value="TASK">Tarefa</option>
                </select>
              </div>
              <div>
                <label className="label-muted block mb-1" htmlFor="item-start">Início *</label>
                <input
                  id="item-start"
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className="w-full h-10 rounded-xl bg-glass border border-glass-border px-3 text-sm text-slate-200 focus:outline-none focus:border-agenda/50 transition-all"
                />
              </div>
              <div>
                <label className="label-muted block mb-1" htmlFor="item-end">Fim *</label>
                <input
                  id="item-end"
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  className="w-full h-10 rounded-xl bg-glass border border-glass-border px-3 text-sm text-slate-200 focus:outline-none focus:border-agenda/50 transition-all"
                />
              </div>
            </>
          )}

          {err && <p className="text-xs text-danger">{err}</p>}

          <div className="flex gap-2 pt-1">
            <Button variant="ghost" fullWidth onClick={onClose}>Cancelar</Button>
            <Button variant="primary" fullWidth loading={saving} onClick={save}>Salvar</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── main page ───────────────────────────────────────────────────────────────
export function AgendaPage() {
  const [view, setView]           = useState<AgendaView>('kanban')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showCreate, setShowCreate]   = useState(false)
  const qc = useQueryClient()
  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })

  const { data: taskData, isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => agendaService.getTasks(),
  })

  const { data: eventData, isLoading: loadingEvents } = useQuery({
    queryKey: ['events'],
    queryFn: () => agendaService.getEvents(),
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => agendaService.updateTaskStatus(id, 'DONE'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => agendaService.deleteTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const tasks  = taskData ?? []
  const events = Array.isArray(eventData) ? eventData : []
  const isLoading = loadingTasks || loadingEvents

  return (
    <div className="page-container space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="label-muted capitalize">{today}</p>
          <h1 className="section-header text-xl mt-0.5">Agenda</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Date nav (day/week) */}
          {(view === 'day' || view === 'week') && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentDate((d) => view === 'day' ? addDays(d, -1) : addDays(d, -7))}
                aria-label="Anterior"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-glass border border-glass-border text-slate-500 hover:text-slate-200 transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200 bg-glass border border-glass-border rounded-lg transition-all"
              >
                Hoje
              </button>
              <button
                onClick={() => setCurrentDate((d) => view === 'day' ? addDays(d, 1) : addDays(d, 7))}
                aria-label="Próximo"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-glass border border-glass-border text-slate-500 hover:text-slate-200 transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* View switcher */}
          <div
            className="flex items-center gap-0.5 p-1 bg-glass border border-glass-border rounded-xl"
            role="tablist"
            aria-label="Visualização da agenda"
          >
            {views.map((v) => {
              const Icon = v.icon
              return (
                <button
                  key={v.key}
                  role="tab"
                  aria-selected={view === v.key}
                  onClick={() => setView(v.key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                    view === v.key ? 'bg-glass-hover text-slate-100' : 'text-slate-500 hover:text-slate-300',
                  )}
                >
                  <Icon size={14} aria-hidden />
                  <span className="hidden sm:inline">{v.label}</span>
                </button>
              )
            })}
          </div>

          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
            Novo
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          {view === 'day'    && <DayView  events={events} date={currentDate} />}
          {view === 'week'   && <WeekView events={events} weekStart={weekStart} />}
          {view === 'list'   && <ListView tasks={tasks} onComplete={(id) => completeMutation.mutate(id)} onDelete={(id) => deleteMutation.mutate(id)} />}
          {view === 'kanban' && <KanbanView tasks={tasks} onComplete={(id) => completeMutation.mutate(id)} />}
        </>
      )}

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            qc.invalidateQueries({ queryKey: ['tasks'] })
            qc.invalidateQueries({ queryKey: ['events'] })
          }}
        />
      )}
    </div>
  )
}
