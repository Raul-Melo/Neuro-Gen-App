import { useState, useMemo } from 'react'
import {
  Plus, CalendarDays, List, Columns, LayoutGrid,
  CheckCircle2, Circle, Clock, ChevronLeft, ChevronRight,
  Trash2, X, Search, Pencil, Play, RotateCcw,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Badge, Spinner } from '@/shared/components/ui'
import { cn } from '@/shared/lib/cn'
import type { AgendaView, Task, Event } from '../types'
import type { TaskStatus } from '@/shared/types/api.types'
import { agendaService } from '../services/agenda.service'
import { format, addDays, startOfWeek, isSameDay, parseISO, getHours, getMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useUIStore } from '@/shared/stores/ui.store'

// ─── constants ──────────────────────────────────────────────────────────────
const views: { key: AgendaView; label: string; icon: React.ElementType }[] = [
  { key: 'day',    label: 'Dia',    icon: CalendarDays },
  { key: 'week',   label: 'Semana', icon: LayoutGrid },
  { key: 'list',   label: 'Lista',  icon: List },
  { key: 'kanban', label: 'Kanban', icon: Columns },
]

const priorityDot: Record<string, string> = {
  HIGH:   'bg-red-400',
  URGENT: 'bg-red-400 animate-pulse',
  MEDIUM: 'bg-agenda',
  LOW:    'bg-slate-500',
}

const priorityBadge = {
  HIGH:   { label: 'Alta',    variant: 'danger'  as const },
  URGENT: { label: 'Urgente', variant: 'danger'  as const },
  MEDIUM: { label: 'Média',   variant: 'agenda'  as const },
  LOW:    { label: 'Baixa',   variant: 'neutral' as const },
}

const statusColumns: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'PENDING',     label: 'A fazer',      color: '#94a3b8' },
  { id: 'IN_PROGRESS', label: 'Em andamento', color: '#6366f1' },
  { id: 'DONE',        label: 'Concluído',    color: '#10b981' },
]

const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
  PENDING:     { label: 'A fazer',      color: '#94a3b8' },
  IN_PROGRESS: { label: 'Em andamento', color: '#6366f1' },
  DONE:        { label: 'Concluído',    color: '#10b981' },
  CANCELLED:   { label: 'Cancelado',    color: '#ef4444' },
}

const HOUR_START  = 7
const HOUR_END    = 21
const HOUR_HEIGHT = 56

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

/** Próximo status na transição linear PENDING → IN_PROGRESS → DONE */
function nextStatus(current: TaskStatus): TaskStatus | null {
  if (current === 'PENDING')     return 'IN_PROGRESS'
  if (current === 'IN_PROGRESS') return 'DONE'
  return null
}
function prevStatus(current: TaskStatus): TaskStatus | null {
  if (current === 'IN_PROGRESS') return 'PENDING'
  if (current === 'DONE')        return 'IN_PROGRESS'
  return null
}

// ─── StatusChip ─────────────────────────────────────────────────────────────
function StatusChip({
  status, onChange, disabled,
}: { status: TaskStatus; onChange: (s: TaskStatus) => void; disabled?: boolean }) {
  const cfg = statusConfig[status]
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value as TaskStatus)}
      disabled={disabled}
      aria-label="Status da tarefa"
      style={{ color: cfg.color, borderColor: `${cfg.color}40` }}
      className="text-[10px] font-medium bg-glass border rounded-lg px-2 py-1 focus:outline-none cursor-pointer transition-all hover:opacity-80 disabled:opacity-40"
    >
      <option value="PENDING">A fazer</option>
      <option value="IN_PROGRESS">Em andamento</option>
      <option value="DONE">Concluído</option>
      <option value="CANCELLED">Cancelado</option>
    </select>
  )
}

// ─── DayView ─────────────────────────────────────────────────────────────────
function DayView({
  events, tasks, date, onEdit, onDelete, onEditTask, onDeleteTask, onChangeTaskStatus,
}: {
  events: Event[]
  tasks: Task[]
  date: Date
  onEdit: (ev: Event) => void
  onDelete: (id: string) => void
  onEditTask: (t: Task) => void
  onDeleteTask: (id: string) => void
  onChangeTaskStatus: (id: string, s: TaskStatus) => void
}) {
  const todayEvents = events.filter((e) => {
    try { return isSameDay(parseISO(e.startAt), date) } catch { return false }
  })
  const todayTasks = tasks.filter((t) => t.dueDate && isSameDay(parseISO(t.dueDate), date))
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)

  return (
    <div className="space-y-3">
      {/* Time grid */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b border-glass-border flex items-center gap-2">
          <span className="text-sm font-medium text-slate-200 capitalize">
            {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </span>
          <span className="ml-auto text-xs text-slate-500 bg-glass px-2 py-0.5 rounded-full">
            {todayEvents.length} evento{todayEvents.length !== 1 ? 's' : ''}
          </span>
        </div>

        {todayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <CalendarDays size={24} className="text-slate-700" />
            <p className="text-xs text-slate-600">Nenhum evento neste dia</p>
          </div>
        ) : (
          <div className="relative overflow-y-auto" style={{ maxHeight: '480px' }}>
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

              {todayEvents.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => onEdit(ev)}
                  className="absolute left-14 right-3 rounded-lg px-2 py-1 overflow-hidden group text-left w-auto"
                  style={{
                    top:    `${eventTopPct(ev.startAt)}px`,
                    height: `${eventHeightPx(ev.startAt, ev.endAt)}px`,
                    background: ev.color ? `${ev.color}30` : '#6366f130',
                    borderLeft: `3px solid ${ev.color ?? '#6366f1'}`,
                  }}
                  aria-label={`Editar evento: ${ev.title}`}
                >
                  <div className="flex items-start justify-between gap-1 h-full">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-200 truncate">{ev.title}</p>
                      <p className="text-[10px] text-slate-400">
                        {format(parseISO(ev.startAt), 'HH:mm')} – {format(parseISO(ev.endAt), 'HH:mm')}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(ev.id) }}
                      aria-label={`Excluir ${ev.title}`}
                      className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tasks for the day */}
      {todayTasks.length > 0 && (
        <div className="glass-card p-4 space-y-2">
          <p className="label-muted text-xs mb-3">Tarefas do dia ({todayTasks.length})</p>
          {todayTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onChangeStatus={onChangeTaskStatus}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── WeekView ────────────────────────────────────────────────────────────────
function WeekView({
  events, tasks, weekStart, onEdit, onDelete, onEditTask, onDeleteTask, onChangeTaskStatus,
}: {
  events: Event[]
  tasks: Task[]
  weekStart: Date
  onEdit: (ev: Event) => void
  onDelete: (id: string) => void
  onEditTask: (t: Task) => void
  onDeleteTask: (id: string) => void
  onChangeTaskStatus: (id: string, s: TaskStatus) => void
}) {
  const days  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)

  return (
    <div className="space-y-3">
      <div className="glass-card overflow-x-auto">
        {/* Day headers */}
        <div
          className="grid border-b border-glass-border"
          style={{ gridTemplateColumns: '48px repeat(7, 1fr)', minWidth: '560px' }}
        >
          <div className="border-r border-glass-border" />
          {days.map((d) => {
            const isToday = isSameDay(d, new Date())
            const dayTasks = tasks.filter((t) => t.dueDate && isSameDay(parseISO(t.dueDate), d))
            return (
              <div
                key={d.toISOString()}
                className={cn('py-2 text-center border-r border-glass-border last:border-0', isToday && 'bg-focus-muted')}
              >
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                  {format(d, 'EEE', { locale: ptBR })}
                </p>
                <p className={cn('text-sm font-medium', isToday ? 'text-focus-light' : 'text-slate-300')}>
                  {format(d, 'd')}
                </p>
                {dayTasks.length > 0 && (
                  <span className="inline-block text-[9px] bg-agenda/20 text-agenda-light px-1.5 py-0.5 rounded-full mt-0.5">
                    {dayTasks.length}t
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Time grid — fixed height on relative container */}
        <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
          <div className="relative" style={{ minWidth: '560px', height: `${hours.length * HOUR_HEIGHT}px` }}>
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
                  <div
                    key={d.toISOString()}
                    className={cn('flex-1 border-l border-glass-border', isSameDay(d, new Date()) && 'bg-focus-muted/20')}
                  />
                ))}
              </div>
            ))}

            {events.map((ev) => {
              let evDay: Date
              try { evDay = parseISO(ev.startAt) } catch { return null }
              const colIdx = days.findIndex((d) => isSameDay(d, evDay))
              if (colIdx === -1) return null
              return (
                <button
                  key={ev.id}
                  onClick={() => onEdit(ev)}
                  className="absolute rounded-lg px-1.5 py-0.5 overflow-hidden hover:brightness-110 transition-all group text-left"
                  style={{
                    top:    `${eventTopPct(ev.startAt)}px`,
                    height: `${eventHeightPx(ev.startAt, ev.endAt)}px`,
                    left:   `calc(48px + ${colIdx} * (100% - 48px) / 7 + 2px)`,
                    width:  `calc((100% - 48px) / 7 - 4px)`,
                    background: ev.color ? `${ev.color}30` : '#6366f130',
                    borderLeft: `2px solid ${ev.color ?? '#6366f1'}`,
                  }}
                  aria-label={`Editar evento: ${ev.title}`}
                >
                  <p className="text-[10px] font-medium text-slate-200 truncate">{ev.title}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(ev.id) }}
                    aria-label={`Excluir ${ev.title}`}
                    className="absolute top-0.5 right-0.5 w-5 h-5 flex items-center justify-center rounded bg-black/40 text-slate-400 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={8} />
                  </button>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Task list for the week */}
      {tasks.filter((t) => t.dueDate && days.some((d) => isSameDay(parseISO(t.dueDate!), d))).length > 0 && (
        <div className="glass-card p-4 space-y-2">
          <p className="label-muted text-xs mb-3">Tarefas da semana</p>
          {tasks
            .filter((t) => t.dueDate && days.some((d) => isSameDay(parseISO(t.dueDate!), d)))
            .map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onChangeStatus={onChangeTaskStatus}
              />
            ))}
        </div>
      )}
    </div>
  )
}

// ─── TaskRow (shared between ListView and calendar views) ────────────────────
function TaskRow({
  task, onEdit, onDelete, onChangeStatus, dimmed,
}: {
  task: Task
  onEdit: (t: Task) => void
  onDelete: (id: string) => void
  onChangeStatus: (id: string, s: TaskStatus) => void
  dimmed?: boolean
}) {
  const isDone = task.status === 'DONE'
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border border-glass-border bg-glass hover:bg-glass-hover transition-all',
        dimmed && 'opacity-60',
      )}
    >
      {/* Quick-complete toggle */}
      <button
        onClick={() => onChangeStatus(task.id, isDone ? 'PENDING' : 'DONE')}
        aria-label={isDone ? `Reabrir ${task.title}` : `Concluir ${task.title}`}
        className="flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
      >
        {isDone
          ? <CheckCircle2 size={18} className="text-emotional" aria-hidden />
          : <Circle size={18} className="text-slate-700 hover:text-slate-400 transition-colors" aria-hidden />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm truncate', isDone ? 'line-through text-slate-500' : 'text-slate-200')}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {task.dueDate && (
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <Clock size={9} aria-hidden />
              {task.dueDate}
            </span>
          )}
          <StatusChip
            status={task.status}
            onChange={(s) => onChangeStatus(task.id, s)}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <Badge variant={priorityBadge[task.priority]?.variant ?? 'neutral'}>
          {priorityBadge[task.priority]?.label ?? task.priority}
        </Badge>
        <button
          onClick={() => onEdit(task)}
          aria-label={`Editar ${task.title}`}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600 hover:text-slate-200 transition-colors"
        >
          <Pencil size={13} aria-hidden />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          aria-label={`Excluir ${task.title}`}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors"
        >
          <Trash2 size={13} aria-hidden />
        </button>
      </div>
    </div>
  )
}

// ─── ListView ────────────────────────────────────────────────────────────────
function ListView({
  tasks, events, onChangeStatus, onDelete, onEdit, onEditEvent, onDeleteEvent,
}: {
  tasks: Task[]
  events: Event[]
  onChangeStatus: (id: string, s: TaskStatus) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
  onEditEvent: (ev: Event) => void
  onDeleteEvent: (id: string) => void
}) {
  const active   = tasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS')
  const done     = tasks.filter((t) => t.status === 'DONE')
  const archived = tasks.filter((t) => t.status === 'CANCELLED')

  return (
    <div className="space-y-6">
      {events.length > 0 && (
        <div>
          <h2 className="label-muted mb-2">Eventos ({events.length})</h2>
          <ul className="space-y-2" role="list">
            {events.map((ev) => (
              <li
                key={ev.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-glass-border bg-glass hover:bg-glass-hover transition-all"
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ background: ev.color ?? '#6366f1' }}
                  aria-hidden
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{ev.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {format(parseISO(ev.startAt), "d MMM, HH:mm", { locale: ptBR })} – {format(parseISO(ev.endAt), 'HH:mm')}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => onEditEvent(ev)}
                    aria-label={`Editar ${ev.title}`}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600 hover:text-slate-200 transition-colors"
                  >
                    <Pencil size={13} aria-hidden />
                  </button>
                  <button
                    onClick={() => onDeleteEvent(ev.id)}
                    aria-label={`Excluir ${ev.title}`}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {active.length > 0 && (
        <div>
          <h2 className="label-muted mb-2">Pendentes / Em andamento ({active.length})</h2>
          <ul className="space-y-2" role="list">
            {active.map((task) => (
              <li key={task.id}>
                <TaskRow task={task} onEdit={onEdit} onDelete={onDelete} onChangeStatus={onChangeStatus} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {done.length > 0 && (
        <div>
          <h2 className="label-muted mb-2">Concluídas ({done.length})</h2>
          <ul className="space-y-2" role="list">
            {done.map((task) => (
              <li key={task.id}>
                <TaskRow task={task} onEdit={onEdit} onDelete={onDelete} onChangeStatus={onChangeStatus} dimmed />
              </li>
            ))}
          </ul>
        </div>
      )}

      {archived.length > 0 && (
        <div>
          <h2 className="label-muted mb-2">Canceladas ({archived.length})</h2>
          <ul className="space-y-2" role="list">
            {archived.map((task) => (
              <li key={task.id}>
                <TaskRow task={task} onEdit={onEdit} onDelete={onDelete} onChangeStatus={onChangeStatus} dimmed />
              </li>
            ))}
          </ul>
        </div>
      )}

      {tasks.length === 0 && events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <List size={28} className="text-slate-700" />
          <p className="text-sm text-slate-500">Nenhum item encontrado</p>
        </div>
      )}
    </div>
  )
}

// ─── KanbanCard ──────────────────────────────────────────────────────────────
function KanbanCard({
  task, onEdit, onDelete, onChangeStatus,
}: {
  task: Task
  onEdit: (t: Task) => void
  onDelete: (id: string) => void
  onChangeStatus: (id: string, s: TaskStatus) => void
}) {
  const next = nextStatus(task.status)
  const prev = prevStatus(task.status)

  return (
    <li className="glass-card-hover group relative">
      {/* Card body — clicável apenas na área de texto */}
      <button
        type="button"
        onClick={() => onEdit(task)}
        className="w-full text-left p-3 pb-2"
        aria-label={`Editar ${task.title}`}
      >
        <div className="flex items-start gap-2">
          <span
            className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', priorityDot[task.priority])}
            aria-hidden
          />
          <p className="text-sm text-slate-200 leading-snug flex-1 min-w-0 break-words">{task.title}</p>
        </div>
        {task.dueDate && (
          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-600">
            <Clock size={9} aria-hidden /> {task.dueDate}
          </div>
        )}
      </button>

      {/* Action bar — isolada do card body para evitar propagação */}
      <div
        className="flex items-center px-2 pb-2 pt-1 border-t border-glass-border/50 gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ← Voltar */}
        {prev && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChangeStatus(task.id, prev) }}
            aria-label={`Mover para ${statusConfig[prev].label}`}
            title={statusConfig[prev].label}
            className="flex items-center justify-center min-w-[32px] min-h-[32px] rounded-lg text-slate-500 hover:text-slate-200 hover:bg-glass-hover transition-all"
          >
            <ChevronLeft size={13} aria-hidden />
          </button>
        )}

        {/* Status label */}
        <span
          className="flex-1 text-[10px] font-medium truncate px-1 select-none"
          style={{ color: statusConfig[task.status].color }}
        >
          {statusConfig[task.status].label}
        </span>

        {/* → Avançar */}
        {next && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChangeStatus(task.id, next) }}
            aria-label={`Mover para ${statusConfig[next].label}`}
            className={cn(
              'flex items-center gap-1 text-[10px] px-2 min-h-[32px] rounded-lg font-medium transition-all',
              next === 'IN_PROGRESS'
                ? 'text-focus-light hover:bg-focus-muted'
                : 'text-emotional hover:bg-emotional-muted',
            )}
          >
            {next === 'IN_PROGRESS' ? <Play size={11} aria-hidden /> : <CheckCircle2 size={11} aria-hidden />}
            <span>{next === 'IN_PROGRESS' ? 'Iniciar' : 'Concluir'}</span>
          </button>
        )}

        {/* Reabrir (somente DONE) */}
        {task.status === 'DONE' && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChangeStatus(task.id, 'PENDING') }}
            aria-label="Reabrir tarefa"
            className="flex items-center gap-1 text-[10px] px-2 min-h-[32px] rounded-lg text-slate-500 hover:text-slate-200 hover:bg-glass-hover transition-all"
          >
            <RotateCcw size={11} aria-hidden />
            <span>Reabrir</span>
          </button>
        )}

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
          aria-label={`Excluir ${task.title}`}
          className="flex items-center justify-center min-w-[32px] min-h-[32px] text-slate-700 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10"
        >
          <Trash2 size={11} aria-hidden />
        </button>
      </div>
    </li>
  )
}

// ─── KanbanView ──────────────────────────────────────────────────────────────
function KanbanView({
  tasks, onDelete, onEdit, onChangeStatus,
}: {
  tasks: Task[]
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
  onChangeStatus: (id: string, s: TaskStatus) => void
}) {
  return (
    <div
      className="flex gap-3 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory"
      role="main"
      aria-label="Quadro Kanban"
    >
      {statusColumns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id)
        return (
          <div
            key={col.id}
            className="flex-shrink-0 w-[280px] sm:w-72 flex flex-col gap-3 snap-start"
            aria-label={`Coluna: ${col.label}`}
          >
            <div className="flex items-center gap-2 px-1">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col.color }} aria-hidden />
              <span className="text-sm font-medium text-slate-300">{col.label}</span>
              <span className="ml-auto text-xs text-slate-600 bg-glass px-2 py-0.5 rounded-full">
                {colTasks.length}
              </span>
            </div>

            <ul className="space-y-2" role="list">
              {colTasks.map((task) => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onChangeStatus={onChangeStatus}
                />
              ))}
              {colTasks.length === 0 && (
                <li className="border-2 border-dashed border-glass-border rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-700">Vazio</p>
                </li>
              )}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

// ─── ItemModal ───────────────────────────────────────────────────────────────
type ModalTab = 'task' | 'event'

interface ItemModalProps {
  onClose: () => void
  onSaved: () => void
  defaultTab?: ModalTab
  editTask?: Task
  editEvent?: Event
}

function ItemModal({ onClose, onSaved, defaultTab = 'task', editTask, editEvent }: ItemModalProps) {
  const isEdit = !!(editTask || editEvent)
  const initialTab: ModalTab = editEvent ? 'event' : editTask ? 'task' : defaultTab

  const [tab, setTab]           = useState<ModalTab>(initialTab)
  const [title, setTitle]       = useState(editTask?.title ?? editEvent?.title ?? '')
  const [priority, setPriority] = useState<Task['priority']>(editTask?.priority ?? 'MEDIUM')
  const [status, setStatus]     = useState<TaskStatus>(editTask?.status ?? 'PENDING')
  const [dueDate, setDueDate]   = useState(editTask?.dueDate ?? '')
  const [startAt, setStartAt]   = useState(editEvent?.startAt ? editEvent.startAt.slice(0, 16) : '')
  const [endAt, setEndAt]       = useState(editEvent?.endAt   ? editEvent.endAt.slice(0, 16)   : '')
  const [eventType, setEventType] = useState<'APPOINTMENT' | 'PERSONAL' | 'ROUTINE'>(editEvent?.type ?? 'APPOINTMENT')
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState('')
  const addToast = useUIStore((s) => s.addToast)
  const qc       = useQueryClient()

  /** Converte "2026-11-26T14:00" (datetime-local) para "2026-11-26T14:00:00Z" */
  const toIso = (dt: string) => {
    if (!dt) return ''
    // já tem fuso — retorna direto
    if (dt.endsWith('Z') || dt.includes('+')) return dt
    // acrescenta segundos se faltar e adiciona Z (trata como UTC)
    const base = dt.length === 16 ? `${dt}:00` : dt
    return `${base}Z`
  }

  const save = async () => {
    if (!title.trim()) { setErr('Informe o título'); return }
    if (tab === 'event' && (!startAt || !endAt)) { setErr('Informe horário de início e fim'); return }
    setSaving(true); setErr('')
    try {
      if (tab === 'task') {
        if (isEdit && editTask) {
          await agendaService.updateTask(editTask.id, { title: title.trim(), priority, dueDate: dueDate || undefined })
          // Status: atualiza só no cache local (endpoint /status retorna 404)
          if (status !== editTask.status) {
            qc.setQueryData<Task[]>(['tasks'], (prev) =>
              prev?.map((t) => t.id === editTask.id ? { ...t, status } : t) ?? []
            )
          }
          addToast({ variant: 'success', message: 'Tarefa atualizada!' })
        } else {
          await agendaService.createTask({ title: title.trim(), priority, dueDate: dueDate || undefined })
          addToast({ variant: 'success', message: 'Tarefa criada!' })
        }
      } else {
        const startIso = toIso(startAt)
        const endIso   = toIso(endAt)
        if (isEdit && editEvent) {
          // PUT /events/{id} só aceita título/tipo/descrição
          await agendaService.updateEvent(editEvent.id, { title: title.trim(), type: eventType })
          // Se as datas mudaram, chama reschedule separado
          const origStart = editEvent.startAt.slice(0, 16)
          const origEnd   = editEvent.endAt.slice(0, 16)
          if (startAt !== origStart || endAt !== origEnd) {
            await agendaService.rescheduleEvent(editEvent.id, { startAt: startIso, endAt: endIso })
          }
          addToast({ variant: 'success', message: 'Evento atualizado!' })
        } else {
          await agendaService.createEvent({ title: title.trim(), startAt: startIso, endAt: endIso, type: eventType })
          addToast({ variant: 'success', message: 'Evento criado!' })
        }
      }
      onSaved()
      onClose()
    } catch {
      setErr('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Editar item' : 'Criar item'}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full sm:max-w-sm glass-card p-5 sm:p-6 animate-slide-up rounded-t-2xl sm:rounded-2xl max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-100 font-display">
            {isEdit ? 'Editar' : 'Novo item'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-slate-500 hover:text-slate-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        {!isEdit && (
          <div className="flex gap-1 p-1 bg-glass border border-glass-border rounded-xl mb-5" role="tablist">
            {(['task', 'event'] as ModalTab[]).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-xs font-medium transition-all',
                  tab === t ? 'bg-glass-hover text-slate-100' : 'text-slate-500',
                )}
              >
                {t === 'task' ? 'Tarefa' : 'Evento'}
              </button>
            ))}
          </div>
        )}

        {isEdit && (
          <div className="mb-4">
            <span className="text-xs text-slate-500 bg-glass border border-glass-border px-3 py-1.5 rounded-lg">
              {tab === 'task' ? 'Tarefa' : 'Evento'}
            </span>
          </div>
        )}

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
              className="w-full h-11 rounded-xl bg-glass border border-glass-border px-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-agenda/50 transition-all"
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
                  className="w-full h-11 rounded-xl bg-glass border border-glass-border px-3 text-sm text-slate-200 focus:outline-none focus:border-agenda/50 transition-all"
                >
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>

              {isEdit && (
                <div>
                  <label className="label-muted block mb-1" htmlFor="item-status">Status</label>
                  <select
                    id="item-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full h-11 rounded-xl bg-glass border border-glass-border px-3 text-sm text-slate-200 focus:outline-none focus:border-agenda/50 transition-all"
                  >
                    <option value="PENDING">A fazer</option>
                    <option value="IN_PROGRESS">Em andamento</option>
                    <option value="DONE">Concluído</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>
              )}

              <div>
                <label className="label-muted block mb-1" htmlFor="item-due">Vencimento</label>
                <input
                  id="item-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-11 rounded-xl bg-glass border border-glass-border px-3 text-sm text-slate-200 focus:outline-none focus:border-agenda/50 transition-all"
                />
              </div>
            </>
          ) : (
            <>
              {!isEdit && (
                <div>
                  <label className="label-muted block mb-1" htmlFor="item-type">Tipo</label>
                  <select
                    id="item-type"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as typeof eventType)}
                    className="w-full h-11 rounded-xl bg-glass border border-glass-border px-3 text-sm text-slate-200 focus:outline-none focus:border-agenda/50 transition-all"
                  >
                    <option value="APPOINTMENT">Consulta/Compromisso</option>
                    <option value="PERSONAL">Pessoal</option>
                    <option value="ROUTINE">Rotina</option>
                  </select>
                </div>
              )}
              <div>
                <label className="label-muted block mb-1" htmlFor="item-start">Início *</label>
                <input
                  id="item-start"
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className="w-full h-11 rounded-xl bg-glass border border-glass-border px-3 text-sm text-slate-200 focus:outline-none focus:border-agenda/50 transition-all"
                />
              </div>
              <div>
                <label className="label-muted block mb-1" htmlFor="item-end">Fim *</label>
                <input
                  id="item-end"
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  className="w-full h-11 rounded-xl bg-glass border border-glass-border px-3 text-sm text-slate-200 focus:outline-none focus:border-agenda/50 transition-all"
                />
              </div>
            </>
          )}

          {err && <p className="text-xs text-red-400" role="alert">{err}</p>}

          <div className="flex gap-2 pt-1">
            <Button variant="ghost" fullWidth onClick={onClose}>Cancelar</Button>
            <Button variant="primary" fullWidth loading={saving} onClick={save}>
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── EmptyState ──────────────────────────────────────────────────────────────
function EmptyState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Search size={28} className="text-slate-700" />
      <p className="text-sm text-slate-500">
        Nenhum resultado para <span className="text-slate-300">"{query}"</span>
      </p>
      <button onClick={onClear} className="text-xs text-agenda hover:underline">
        Limpar busca
      </button>
    </div>
  )
}

// ─── AgendaPage ───────────────────────────────────────────────────────────────
export function AgendaPage() {
  const [view, setView]               = useState<AgendaView>('kanban')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [search, setSearch]           = useState('')
  const [modal, setModal]             = useState<
    | { mode: 'create' }
    | { mode: 'editTask';  task: Task }
    | { mode: 'editEvent'; event: Event }
    | null
  >(null)

  const qc       = useQueryClient()
  const today    = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })

  const { data: taskData,  isLoading: loadingTasks  } = useQuery({
    queryKey: ['tasks'],
    queryFn:  () => agendaService.getTasks(),
    staleTime: 2 * 60 * 1000,
  })
  const { data: eventData, isLoading: loadingEvents } = useQuery({
    queryKey: ['events'],
    queryFn:  () => agendaService.getEvents(),
    staleTime: 2 * 60 * 1000,
  })

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => {
      // Atualiza só o cache local — sem chamada à API
      qc.setQueryData<Task[]>(['tasks'], (prev) =>
        prev?.map((t) => t.id === id ? { ...t, status } : t) ?? []
      )
      return Promise.resolve()
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => agendaService.deleteTask(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => agendaService.deleteEvent(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['events'] }),
  })

  const rawTasks  = taskData  ?? []
  const rawEvents = Array.isArray(eventData) ? eventData : []

  const q = search.toLowerCase().trim()
  const tasks  = useMemo(() => q ? rawTasks.filter((t)  => t.title.toLowerCase().includes(q)) : rawTasks,  [rawTasks,  q])
  const events = useMemo(() => q ? rawEvents.filter((e) => e.title.toLowerCase().includes(q)) : rawEvents, [rawEvents, q])

  const isLoading = loadingTasks || loadingEvents
  const noResults = q && tasks.length === 0 && events.length === 0

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['tasks'] })
    qc.invalidateQueries({ queryKey: ['events'] })
  }

  const handleChangeStatus = (id: string, status: TaskStatus) =>
    changeStatusMutation.mutate({ id, status })

  const isCalendarView = view === 'day' || view === 'week'

  return (
    <div className="page-container space-y-4 animate-fade-in pb-24 sm:pb-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="label-muted capitalize text-xs">{today}</p>
            <h1 className="section-header text-xl mt-0.5">Agenda</h1>
          </div>

          <div className="flex items-center gap-2">
            {isCalendarView && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentDate((d) => view === 'day' ? addDays(d, -1) : addDays(d, -7))}
                  aria-label="Anterior"
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-glass border border-glass-border text-slate-500 hover:text-slate-200 transition-all"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-glass border border-glass-border rounded-lg transition-all"
                >
                  Hoje
                </button>
                <button
                  onClick={() => setCurrentDate((d) => view === 'day' ? addDays(d, 1) : addDays(d, 7))}
                  aria-label="Próximo"
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-glass border border-glass-border text-slate-500 hover:text-slate-200 transition-all"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => setModal({ mode: 'create' })}
              aria-label="Criar novo item"
            >
              <span className="hidden sm:inline">Novo</span>
            </Button>
          </div>
        </div>

        {/* Search + view switcher */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isCalendarView ? 'Buscar eventos…' : 'Buscar tarefas e eventos…'}
              aria-label="Buscar"
              className="w-full h-9 rounded-xl bg-glass border border-glass-border pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-agenda/50 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Limpar busca"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div
            className="flex items-center gap-0.5 p-1 bg-glass border border-glass-border rounded-xl flex-shrink-0"
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
                  title={v.label}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                    view === v.key ? 'bg-glass-hover text-slate-100' : 'text-slate-500 hover:text-slate-300',
                  )}
                >
                  <Icon size={14} aria-hidden />
                  <span className="hidden md:inline">{v.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="flex justify-center py-16" aria-live="polite" aria-label="Carregando agenda">
          <Spinner />
        </div>
      ) : noResults ? (
        <EmptyState query={q} onClear={() => setSearch('')} />
      ) : (
        <>
          {view === 'day' && (
            <DayView
              events={events}
              tasks={tasks}
              date={currentDate}
              onEdit={(ev) => setModal({ mode: 'editEvent', event: ev })}
              onDelete={(id) => deleteEventMutation.mutate(id)}
              onEditTask={(t) => setModal({ mode: 'editTask', task: t })}
              onDeleteTask={(id) => deleteTaskMutation.mutate(id)}
              onChangeTaskStatus={handleChangeStatus}
            />
          )}
          {view === 'week' && (
            <WeekView
              events={events}
              tasks={tasks}
              weekStart={weekStart}
              onEdit={(ev) => setModal({ mode: 'editEvent', event: ev })}
              onDelete={(id) => deleteEventMutation.mutate(id)}
              onEditTask={(t) => setModal({ mode: 'editTask', task: t })}
              onDeleteTask={(id) => deleteTaskMutation.mutate(id)}
              onChangeTaskStatus={handleChangeStatus}
            />
          )}
          {view === 'list' && (
            <ListView
              tasks={tasks}
              events={events}
              onChangeStatus={handleChangeStatus}
              onDelete={(id) => deleteTaskMutation.mutate(id)}
              onEdit={(task) => setModal({ mode: 'editTask', task })}
              onEditEvent={(ev) => setModal({ mode: 'editEvent', event: ev })}
              onDeleteEvent={(id) => deleteEventMutation.mutate(id)}
            />
          )}
          {view === 'kanban' && (
            <KanbanView
              tasks={tasks}
              onDelete={(id) => deleteTaskMutation.mutate(id)}
              onEdit={(task) => setModal({ mode: 'editTask', task })}
              onChangeStatus={handleChangeStatus}
            />
          )}
        </>
      )}

      {/* ── Modals ── */}
      {modal?.mode === 'create' && (
        <ItemModal
          defaultTab={isCalendarView ? 'event' : 'task'}
          onClose={() => setModal(null)}
          onSaved={invalidateAll}
        />
      )}
      {modal?.mode === 'editTask' && (
        <ItemModal
          editTask={modal.task}
          onClose={() => setModal(null)}
          onSaved={invalidateAll}
        />
      )}
      {modal?.mode === 'editEvent' && (
        <ItemModal
          editEvent={modal.event}
          onClose={() => setModal(null)}
          onSaved={invalidateAll}
        />
      )}
    </div>
  )
}
