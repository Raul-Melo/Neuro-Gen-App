import { Play, Pause, RotateCcw, Coffee, Zap } from 'lucide-react'
import { Button, Card } from '@/shared/components/ui'
import { useFocusTimer } from '../hooks/useFocusSession'
import { cn } from '@/shared/lib/cn'

const phaseConfig = {
  idle: { label: 'Pronto para começar', color: '#7c3aed', bg: 'bg-focus-muted' },
  work: { label: 'Foco ativo', color: '#7c3aed', bg: 'bg-focus-muted' },
  break: { label: 'Pausa curta', color: '#10b981', bg: 'bg-emotional-muted' },
  'long-break': { label: 'Pausa longa', color: '#10b981', bg: 'bg-emotional-muted' },
}

export function FocusPage() {
  const { phase, display, progress, cycle, isRunning, start, pause, reset } = useFocusTimer()
  const cfg = phaseConfig[phase]

  const circumference = 2 * Math.PI * 88

  return (
    <div className="page-container animate-fade-in">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="section-header text-xl">Sessão de Foco</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pomodoro adaptativo — concentre-se em uma tarefa por vez
          </p>
        </div>

        {/* Timer card */}
        <Card className="p-8 text-center" accentColor={cfg.color}>
          {/* Phase indicator */}
          <div className={cn('inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm mb-6', cfg.bg)}>
            {phase === 'work' || phase === 'idle'
              ? <Zap size={14} style={{ color: cfg.color }} aria-hidden />
              : <Coffee size={14} style={{ color: cfg.color }} aria-hidden />
            }
            <span style={{ color: cfg.color }} className="font-medium">{cfg.label}</span>
          </div>

          {/* SVG ring timer */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <svg
              className="rotate-[-90deg]"
              width="200"
              height="200"
              viewBox="0 0 200 200"
              aria-hidden
            >
              {/* Track */}
              <circle
                cx="100" cy="100" r="88"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="6"
              />
              {/* Progress */}
              <circle
                cx="100" cy="100" r="88"
                fill="none"
                stroke={cfg.color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                className="transition-all duration-1000 ease-linear"
                style={{ filter: `drop-shadow(0 0 8px ${cfg.color}60)` }}
              />
            </svg>

            {/* Time display */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
              aria-live="polite"
              aria-atomic="true"
              aria-label={`Tempo restante: ${display}`}
            >
              <span className="font-display font-bold text-5xl text-slate-100 tabular-nums tracking-tight">
                {display}
              </span>
              {cycle > 0 && (
                <span className="text-xs text-slate-500 mt-1">Ciclo {cycle}</span>
              )}
            </div>
          </div>

          {/* Cycle dots */}
          <div className="flex items-center justify-center gap-2 mb-8" aria-label={`${cycle} ciclos completados`}>
            {Array.from({ length: 4 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-300',
                  i < cycle % 4
                    ? 'bg-focus scale-125'
                    : 'bg-glass border border-glass-border',
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
              className="text-slate-500"
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
              {isRunning ? (
                <><Pause size={18} /> Pausar</>
              ) : (
                <><Play size={18} /> {phase === 'idle' ? 'Começar' : 'Continuar'}</>
              )}
            </Button>
          </div>
        </Card>

        {/* Settings hint */}
        <p className="text-center text-xs text-slate-600">
          Padrão: 25 min foco · 5 min pausa · pausa longa a cada 4 ciclos
        </p>

        {/* Today stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Sessões hoje', value: '3', unit: '' },
            { label: 'Tempo focado', value: '1h 25m', unit: '' },
            { label: 'Ciclos', value: '6', unit: 'total' },
          ].map((stat) => (
            <Card key={stat.label} padding="sm" className="text-center">
              <p className="font-display font-bold text-lg text-slate-100">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
