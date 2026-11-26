import { useState, useEffect, useRef, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, X, CalendarDays, CheckSquare, Clock, ArrowRight } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Task  { id: string; title: string; status: string; priority: string; dueDate?: string | null }
interface Event { id: string; title: string; startAt: string; color?: string }

interface ResultItem {
  id: string
  type: 'task' | 'event'
  title: string
  meta?: string
  color?: string
}

const priorityLabel: Record<string, string> = {
  HIGH: 'Alta', URGENT: 'Urgente', MEDIUM: 'Média', LOW: 'Baixa',
}

function useCachedSearch(query: string) {
  const qc = useQueryClient()

  // Lê do cache (sem re-fetch se já existir)
  const tasks  = (qc.getQueryData<Task[]>(['tasks'])  ?? []) as Task[]
  const events = (qc.getQueryData<Event[]>(['events']) ?? []) as Event[]

  return useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return { tasks: [], events: [] }

    const matchTasks  = tasks.filter((t) => t.title.toLowerCase().includes(q) && t.status !== 'ARCHIVED')
    const matchEvents = events.filter((e) => e.title.toLowerCase().includes(q))

    const taskResults: ResultItem[] = matchTasks.slice(0, 5).map((t) => ({
      id:    t.id,
      type:  'task',
      title: t.title,
      meta:  `${t.status === 'DONE' ? '✓ Concluída' : priorityLabel[t.priority] ?? t.priority}${t.dueDate ? ` · ${t.dueDate}` : ''}`,
    }))

    const eventResults: ResultItem[] = matchEvents.slice(0, 5).map((e) => ({
      id:    e.id,
      type:  'event',
      title: e.title,
      color: e.color,
      meta: (() => {
        try { return format(parseISO(e.startAt), "d MMM, HH:mm", { locale: ptBR }) } catch { return '' }
      })(),
    }))

    return { tasks: taskResults, events: eventResults }
  }, [tasks, events, query])
}

interface SearchOverlayProps {
  open: boolean
  onClose: () => void
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery]       = useState('')
  const [cursor, setCursor]     = useState(-1)
  const inputRef                = useRef<HTMLInputElement>(null)
  const navigate                = useNavigate()
  const { tasks, events }       = useCachedSearch(query)
  const all: ResultItem[]       = [...tasks, ...events]

  // O cache já é preenchido pelas páginas — sem prefetch adicional aqui

  useEffect(() => {
    if (open) {
      setQuery('')
      setCursor(-1)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    setCursor(-1)
  }, [query])

  const go = (item: ResultItem) => {
    navigate(`/agenda${item.type === 'task' ? '?view=list' : '?view=day'}`)
    onClose()
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((c) => Math.min(c + 1, all.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => Math.max(c - 1, -1))
    } else if (e.key === 'Enter' && cursor >= 0 && all[cursor]) {
      go(all[cursor])
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh] p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Busca global"
    >
      <div className="w-full max-w-lg glass-card overflow-hidden animate-slide-up">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-glass-border">
          <Search size={16} className="text-slate-500 flex-shrink-0" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Buscar tarefas, eventos…"
            aria-label="Busca global"
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Limpar busca"
              className="text-slate-500 hover:text-slate-200 transition-colors"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline text-[10px] text-slate-600 border border-glass-border rounded px-1.5 py-0.5">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!query && (
            <div className="px-4 py-8 text-center">
              <Search size={24} className="mx-auto mb-2 text-slate-700" />
              <p className="text-sm text-slate-500">Digite para buscar tarefas e eventos</p>
              <p className="text-xs text-slate-700 mt-1">↑↓ navegar · Enter abrir · Esc fechar</p>
            </div>
          )}

          {query && tasks.length === 0 && events.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-slate-500">
                Sem resultados para <span className="text-slate-300">"{query}"</span>
              </p>
            </div>
          )}

          {tasks.length > 0 && (
            <div className="py-2">
              <p className="px-4 py-1 text-[10px] text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare size={10} aria-hidden /> Tarefas
              </p>
              {tasks.map((item, i) => {
                const idx     = i
                const focused = cursor === idx
                return (
                  <button
                    key={item.id}
                    onClick={() => go(item)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                      focused ? 'bg-glass-hover' : 'hover:bg-glass',
                    )}
                    aria-selected={focused}
                  >
                    <CheckSquare size={14} className="text-agenda flex-shrink-0" aria-hidden />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{item.title}</p>
                      {item.meta && <p className="text-[10px] text-slate-500">{item.meta}</p>}
                    </div>
                    <ArrowRight size={12} className="text-slate-700 flex-shrink-0" aria-hidden />
                  </button>
                )
              })}
            </div>
          )}

          {events.length > 0 && (
            <div className="py-2 border-t border-glass-border">
              <p className="px-4 py-1 text-[10px] text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarDays size={10} aria-hidden /> Eventos
              </p>
              {events.map((item, i) => {
                const idx     = tasks.length + i
                const focused = cursor === idx
                return (
                  <button
                    key={item.id}
                    onClick={() => go(item)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                      focused ? 'bg-glass-hover' : 'hover:bg-glass',
                    )}
                    aria-selected={focused}
                  >
                    <span
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ background: item.color ?? '#6366f1' }}
                      aria-hidden
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{item.title}</p>
                      {item.meta && <p className="text-[10px] text-slate-500">{item.meta}</p>}
                    </div>
                    <div className="flex items-center gap-1 text-slate-700 flex-shrink-0">
                      <Clock size={10} aria-hidden />
                      <ArrowRight size={12} aria-hidden />
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Quick links — sem query */}
          {!query && (
            <div className="px-4 py-3 border-t border-glass-border flex flex-wrap gap-2">
              {[
                { label: '→ Agenda', to: '/agenda' },
                { label: '→ Foco',   to: '/focus' },
                { label: '→ Cofre',  to: '/vault' },
              ].map((l) => (
                <button
                  key={l.to}
                  onClick={() => { navigate(l.to); onClose() }}
                  className="text-xs text-slate-500 hover:text-slate-200 bg-glass border border-glass-border rounded-lg px-3 py-1.5 transition-all"
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
