import { useState } from 'react'
import { Play, Pause, RotateCcw, Coffee, Zap, ChevronDown, Timer } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Spinner } from '@/shared/components/ui'
import { agendaService } from '@/features/agenda/services/agenda.service'
import { useFocusTimer } from '../hooks/useFocusSession'
import { cn } from '@/shared/lib/cn'

const phaseConfig = {
  idle:         { label: 'Pronto para começar', color: '#7c3aed', bg: 'bg-focus-muted',     ring: '#7c3aed' },
  work:         { label: 'Foco ativo',          color: '#7c3aed', bg: 'bg-focus-muted',     ring: '#7c3aed' },
  break:        { label: 'Pausa curta',         color: '#10b981', bg: 'bg-emotional-muted', ring: '#10b981' },
  'long-break': { label: 'Pausa longa 🎉',      color: '#10b981', bg: 'bg-emotional-muted', ring: '#10b981' },
}

export function FocusPage() {
  const [taskLabel, setTaskLabel]     = useState('')
  const [showPicker, setShowPicker]   = useState(false)
  const [workMins, setWorkMins]       = useState(25)
  const [breakMins, setBreakMins]     = useState(5)

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn:  () => agendaService.getTasks(),
    staleTime: 2 * 60 * 1000,
  })

  const activeTasks = tasks?.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS') ?? []

  const { phase, display, progress, cycle, totalWorkSeconds, focusDisplay, isRunning, start, pause, reset } =
    useFocusTimer({ workMinutes: workMins, breakMinutes: breakMins })

  const cfg = phaseConfig[phase]
  const circumference = 2 * Math.PI * 76 // radius=76 no viewBox 200×200

  const sessionsToday = Math.max(cycle, 0)

  return (
    <div className="page-container animate-fade-in pb-24 sm:pb-6">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Header */}
        <div>
          <h1 className="section-header text-xl">Sessão de Foco</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pomodoro adaptativo — concentre-se em uma tarefa por vez
          </p>
        </div>

        {/* Task selector */}
        <div className="glass-card p-4 space-y-3">
          <label className="label-muted block">Trabalhando em…</label>

          {activeTasks.length > 0 ? (
            <div className="relative">
              <select
                value={taskLabel}
                onChange={(e) => setTaskLabel(e.target.value)}
                className="w-full h-11 rounded-xl bg-glass border border-glass-border px-3 pr-9 text-sm text-slate-200 focus:outline-none focus:border-focus/50 appearance-none transition-all"
              >
                <option value="">Selecionar tarefa (opcional)</option>
                {activeTasks.map((t) => (
                  <option key={t.id} value={t.title}>{t.title}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          ) : (
            <input
              type="text"
              value={taskLabel}
              onChange={(e) => setTaskLabel(e.target.value)}
              placeholder="Descreva no que vai focar…"
              className="w-full h-11 rounded-xl bg-glass border border-glass-border px-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-focus/50 transition-all"
            />
          )}

          {taskLabel && (
            <input
              type="text"
              value={taskLabel}
              onChange={(e) => setTaskLabel(e.target.value)}
              placeholder="Detalhe ou renomeie…"
              className="w-full h-9 rounded-xl bg-glass border border-glass-border px-3 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-focus/40 transition-all"
            />
          )}
        </div>

        {/* Timer card */}
        <div
          className="glass-card overflow-hidden"
          style={{ borderTopColor: cfg.ring, borderTopWidth: '2px' }}
        >
          <div className="p-5 sm:p-8 text-center">
            {/* Phase badge */}
            <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm mb-5', cfg.bg)}>
              {phase === 'work' || phase === 'idle'
                ? <Zap size={14} style={{ color: cfg.color }} aria-hidden />
                : <Coffee size={14} style={{ color: cfg.color }} aria-hidden />}
              <span style={{ color: cfg.color }} className="font-medium text-xs sm:text-sm">{cfg.label}</span>
            </div>

            {/* SVG ring — responsive via viewBox */}
            <div className="relative inline-flex items-center justify-center mb-5">
              <svg
                viewBox="0 0 200 200"
                className="w-40 h-40 sm:w-48 sm:h-48 -rotate-90"
                aria-hidden
              >
                <circle cx="100" cy="100" r="76" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle
                  cx="100" cy="100" r="76"
                  fill="none"
                  stroke={cfg.ring}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                  className="transition-all duration-1000 ease-linear"
                  style={{ filter: `drop-shadow(0 0 10px ${cfg.ring}80)` }}
                />
              </svg>

              <div
                className="absolute inset-0 flex flex-col items-center justify-center"
                aria-live="polite"
                aria-atomic="true"
                aria-label={`Tempo restante: ${display}`}
              >
                <span className="font-display font-bold text-4xl sm:text-5xl text-slate-100 tabular-nums tracking-tight">
                  {display}
                </span>
                {taskLabel && (
                  <span className="text-[10px] text-slate-500 mt-1 max-w-[90px] truncate px-1">{taskLabel}</span>
                )}
              </div>
            </div>

            {/* Cycle dots */}
            <div className="flex items-center justify-center gap-2 mb-6" aria-label={`${cycle % 4} de 4 ciclos`}>
              {Array.from({ length: 4 }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-300',
                    i < cycle % 4 ? 'bg-focus scale-125' : 'bg-glass border border-glass-border',
                  )}
                  aria-hidden
                />
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                aria-label="Reiniciar sessão"
                className="text-slate-500 min-w-[44px] min-h-[44px]"
              >
                <RotateCcw size={16} />
              </Button>

              <Button
                variant="primary"
                size="lg"
                onClick={isRunning ? pause : start}
                aria-label={isRunning ? 'Pausar timer' : 'Iniciar timer'}
                className="w-36"
              >
                {isRunning
                  ? <><Pause size={18} aria-hidden /> Pausar</>
                  : <><Play  size={18} aria-hidden /> {phase === 'idle' ? 'Começar' : 'Continuar'}</>}
              </Button>
            </div>
          </div>

          {/* Duration picker */}
          <div className="border-t border-glass-border px-5 py-3 flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowPicker((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <Timer size={12} aria-hidden />
              {workMins}min foco · {breakMins}min pausa
              <ChevronDown size={11} className={cn('transition-transform', showPicker && 'rotate-180')} />
            </button>
          </div>

          {showPicker && (
            <div className="border-t border-glass-border px-5 py-4 grid grid-cols-2 gap-4">
              <div>
                <label className="label-muted block mb-1 text-[10px]">Foco (min)</label>
                <input
                  type="number"
                  min={5} max={90} step={5}
                  value={workMins}
                  onChange={(e) => { reset(); setWorkMins(Number(e.target.value)) }}
                  className="w-full h-9 rounded-lg bg-glass border border-glass-border px-3 text-sm text-slate-200 focus:outline-none focus:border-focus/50"
                />
              </div>
              <div>
                <label className="label-muted block mb-1 text-[10px]">Pausa (min)</label>
                <input
                  type="number"
                  min={1} max={30} step={1}
                  value={breakMins}
                  onChange={(e) => { reset(); setBreakMins(Number(e.target.value)) }}
                  className="w-full h-9 rounded-lg bg-glass border border-glass-border px-3 text-sm text-slate-200 focus:outline-none focus:border-focus/50"
                />
              </div>
            </div>
          )}
        </div>

        {/* Session stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Ciclos',      value: String(cycle),                        unit: 'esta sessão' },
            { label: 'Tempo focado', value: totalWorkSeconds > 0 ? focusDisplay : '—', unit: 'acumulado' },
            { label: 'Próximo',     value: phase === 'work' ? `${breakMins}m`   : `${workMins}m`, unit: phase === 'work' ? 'pausa' : 'foco' },
          ].map((stat) => (
            <Card key={stat.label} padding="sm" className="text-center">
              <p className="font-display font-bold text-lg text-slate-100">{stat.value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{stat.label}</p>
              <p className="text-[9px] text-slate-600">{stat.unit}</p>
            </Card>
          ))}
        </div>

        {/* Tip */}
        <p className="text-center text-xs text-slate-600 pb-2">
          {phase === 'idle' && 'Dica: escolha uma única tarefa antes de começar.'}
          {phase === 'work' && isRunning && 'Feche notificações. Foco total por ' + workMins + ' minutos.'}
          {phase === 'work' && !isRunning && cycle > 0 && 'Pausado. Retome quando estiver pronto.'}
          {(phase === 'break' || phase === 'long-break') && 'Levante, respire. Você merece essa pausa. 🌱'}
        </p>

        {sessionsToday === 0 && phase === 'idle' && activeTasks.length === 0 && (
          <div className="text-center py-2">
            <Spinner size="sm" className="hidden" />
          </div>
        )}
      </div>
    </div>
  )
}
