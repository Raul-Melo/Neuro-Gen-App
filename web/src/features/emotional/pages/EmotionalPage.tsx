import { useState } from 'react'
import {
  Heart, TrendingUp, BookOpen, Frown, Meh, Smile, SmilePlus,
  BatteryWarning, BatteryLow, BatteryMedium, BatteryFull, Zap,
  CheckCircle2, Send, ChevronDown, ChevronUp,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Card, CardHeader, CardTitle, Spinner } from '@/shared/components/ui'
import { emotionalService } from '../services/emotional.service'
import type { MoodLevel, EnergyLevel } from '@/shared/types/api.types'
import { moodConfig, energyConfig } from '../types'
import { cn } from '@/shared/lib/cn'
import { useUIStore } from '@/shared/stores/ui.store'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const moodIcons: Record<MoodLevel, React.ElementType> = {
  1: Frown, 2: Frown, 3: Meh, 4: Smile, 5: SmilePlus,
}
const energyIcons: Record<EnergyLevel, React.ElementType> = {
  1: BatteryWarning, 2: BatteryLow, 3: BatteryMedium, 4: BatteryFull, 5: Zap,
}

const DISCLAIMER =
  'Este registro é apenas para autoconhecimento. Não substitui acompanhamento profissional de saúde mental.'

const trendLabel: Record<string, string> = {
  IMPROVING:        '↑ Melhorando',
  STABLE:           '→ Estável',
  DECLINING:        '↓ Caindo',
  INSUFFICIENT_DATA: '— Sem dados',
}

function displayLevel(score: number): MoodLevel {
  return Math.min(5, Math.max(1, Math.round(score))) as MoodLevel
}

export function EmotionalPage() {
  const [mood, setMood]         = useState<MoodLevel | null>(null)
  const [energy, setEnergy]     = useState<EnergyLevel | null>(null)
  const [note, setNote]         = useState('')
  const [journalText, setJournalText] = useState('')
  const [showJournal, setShowJournal] = useState(false)
  const [journalSent, setJournalSent] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const qc       = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)

  const { data: trend, isLoading: loadingTrend } = useQuery({
    queryKey: ['emotional-trend'],
    queryFn:  () => emotionalService.getTrend(),
    staleTime: 5 * 60 * 1000,
  })

  const { data: checkInsData, isLoading: loadingCi } = useQuery({
    queryKey: ['check-ins'],
    queryFn:  () => emotionalService.getCheckIns({ periodDays: 30 }),
    staleTime: 2 * 60 * 1000,
  })

  const saveMutation = useMutation({
    mutationFn: () => emotionalService.createCheckIn({
      moodScore:   mood!,
      energyLevel: energy!,
      notes:       note.trim() || undefined,
    }),
    onSuccess: () => {
      addToast({ variant: 'success', message: 'Check-in salvo! 💚' })
      setMood(null)
      setEnergy(null)
      setNote('')
      qc.invalidateQueries({ queryKey: ['emotional-trend'] })
      qc.invalidateQueries({ queryKey: ['check-ins'] })
    },
    onError: () => addToast({ variant: 'error', message: 'Erro ao salvar check-in. Tente novamente.' }),
  })

  const journalMutation = useMutation({
    mutationFn: () => emotionalService.createJournalEntry({ content: journalText.trim() }),
    onSuccess: () => {
      addToast({ variant: 'success', message: 'Entrada do diário salva! 📓' })
      setJournalText('')
      setJournalSent(true)
      setTimeout(() => setJournalSent(false), 3000)
    },
    onError: () => addToast({ variant: 'error', message: 'Erro ao salvar diário.' }),
  })

  const history = checkInsData ?? []
  const latestCheckIn = history[0]
  const trendObj = trend ?? null

  return (
    <div className="page-container space-y-5 animate-fade-in pb-24 sm:pb-6">
      <div>
        <h1 className="section-header text-xl">Regulação Emocional</h1>
        <p className="text-sm text-slate-500 mt-1">Registre como você está sentindo agora</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Check-in form ── */}
        <div className="lg:col-span-2 space-y-4">
          <Card accentColor="#0891b2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart size={16} className="text-emotional" aria-hidden />
                Check-in de hoje
              </CardTitle>
            </CardHeader>

            {/* Mood */}
            <fieldset className="mb-5">
              <legend className="label-muted mb-3 block">Como está seu humor?</legend>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {([1, 2, 3, 4, 5] as MoodLevel[]).map((level) => {
                  const Icon   = moodIcons[level]
                  const cfg    = moodConfig[level]
                  const active = mood === level
                  return (
                    <button
                      key={level}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setMood(level)}
                      aria-label={`Humor: ${cfg.label}`}
                      className={cn(
                        'flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all duration-150 min-h-[64px]',
                        active
                          ? 'border-emotional/50 bg-emotional-muted'
                          : 'border-glass-border bg-glass hover:bg-glass-hover',
                      )}
                    >
                      <Icon
                        size={22}
                        style={{ color: active ? cfg.color : undefined }}
                        className={active ? '' : 'text-slate-600'}
                        aria-hidden
                      />
                      <span className={cn('text-[10px] sm:text-xs text-center leading-tight', active ? 'text-slate-300' : 'text-slate-500')}>
                        {cfg.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            {/* Energy */}
            <fieldset className="mb-5">
              <legend className="label-muted mb-3 block">Como está sua energia?</legend>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {([1, 2, 3, 4, 5] as EnergyLevel[]).map((level) => {
                  const Icon   = energyIcons[level]
                  const cfg    = energyConfig[level]
                  const active = energy === level
                  return (
                    <button
                      key={level}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setEnergy(level)}
                      aria-label={`Energia: ${cfg.label}`}
                      className={cn(
                        'flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all duration-150 min-h-[64px]',
                        active
                          ? 'border-emotional/50 bg-emotional-muted'
                          : 'border-glass-border bg-glass hover:bg-glass-hover',
                      )}
                    >
                      <Icon
                        size={22}
                        style={{ color: active ? cfg.color : undefined }}
                        className={active ? '' : 'text-slate-600'}
                        aria-hidden
                      />
                      <span className={cn('text-[10px] sm:text-xs text-center leading-tight', active ? 'text-slate-300' : 'text-slate-500')}>
                        {cfg.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            {/* Note */}
            <div className="mb-4">
              <label htmlFor="mood-note" className="label-muted block mb-2">
                Nota (opcional)
              </label>
              <textarea
                id="mood-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Como foi o seu dia? O que está pesando ou alegra você?"
                className="w-full bg-glass border border-glass-border rounded-xl p-3 text-sm text-slate-200 placeholder:text-slate-600 resize-none focus:outline-none focus:border-emotional/50 transition-all"
              />
              <p className="text-xs text-slate-600 text-right mt-1">{note.length}/500</p>
            </div>

            <p className="text-xs text-slate-600 italic mb-4" role="note">{DISCLAIMER}</p>

            <Button
              variant="primary"
              onClick={() => saveMutation.mutate()}
              disabled={!mood || !energy || saveMutation.isPending}
              loading={saveMutation.isPending}
              className="bg-emotional hover:bg-emotional-dark w-full sm:w-auto"
            >
              {saveMutation.isSuccess
                ? <><CheckCircle2 size={16} /> Salvo!</>
                : 'Salvar check-in'}
            </Button>
          </Card>

          {/* Journal card */}
          <Card accentColor="#0891b2">
            <button
              onClick={() => setShowJournal((v) => !v)}
              className="w-full flex items-center gap-3"
              aria-expanded={showJournal}
            >
              <div className="w-9 h-9 rounded-xl bg-emotional-muted flex items-center justify-center flex-shrink-0">
                <BookOpen size={16} className="text-emotional-light" aria-hidden />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-slate-200">Diário Emocional</p>
                <p className="text-xs text-slate-500">Escrita livre, criptografada</p>
              </div>
              {showJournal ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
            </button>

            {showJournal && (
              <div className="mt-4 space-y-3">
                <textarea
                  value={journalText}
                  onChange={(e) => setJournalText(e.target.value)}
                  rows={5}
                  maxLength={2000}
                  placeholder="Escreva livremente sobre seus pensamentos e sentimentos de hoje…"
                  className="w-full bg-glass border border-glass-border rounded-xl p-3 text-sm text-slate-200 placeholder:text-slate-600 resize-none focus:outline-none focus:border-emotional/50 transition-all"
                  aria-label="Entrada do diário emocional"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-600">{journalText.length}/2000</p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => journalMutation.mutate()}
                    disabled={!journalText.trim() || journalMutation.isPending}
                    loading={journalMutation.isPending}
                    className="bg-emotional hover:bg-emotional-dark"
                  >
                    {journalSent
                      ? <><CheckCircle2 size={14} /> Salvo!</>
                      : <><Send size={14} /> Salvar entrada</>}
                  </Button>
                </div>
                <p className="text-[10px] text-slate-600 italic">{DISCLAIMER}</p>
              </div>
            )}
          </Card>

          {/* History */}
          {!loadingCi && history.length > 0 && (
            <Card>
              <button
                onClick={() => setShowHistory((v) => !v)}
                className="w-full flex items-center justify-between mb-1"
                aria-expanded={showHistory}
              >
                <CardTitle className="text-base">Registros recentes</CardTitle>
                {showHistory ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
              </button>

              {showHistory && (
                <ul className="space-y-2 mt-3" role="list">
                  {history.slice(0, 7).map((ci) => {
                    const dm = displayLevel(ci.moodScore)
                    const de = displayLevel(ci.energyLevel)
                    const MoodIcon   = moodIcons[dm]
                    const EnergyIcon = energyIcons[de]
                    const moodCfg    = moodConfig[dm]
                    const energyCfg  = energyConfig[de]
                    return (
                      <li key={ci.id} className="flex items-center gap-3 p-3 rounded-xl bg-glass border border-glass-border">
                        <MoodIcon   size={18} style={{ color: moodCfg.color }}   aria-label={`Humor: ${moodCfg.label}`} />
                        <EnergyIcon size={18} style={{ color: energyCfg.color }} aria-label={`Energia: ${energyCfg.label}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-300 truncate">{moodCfg.label} · {energyCfg.label}</p>
                          <p className="text-[10px] text-slate-600">
                            {ci.checkInDate
                              ? (() => { try { return format(parseISO(ci.checkInDate), "d MMM", { locale: ptBR }) } catch { return ci.checkInDate } })()
                              : '—'}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}

              {!showHistory && (
                <button
                  onClick={() => setShowHistory(true)}
                  className="text-xs text-emotional-light hover:text-emotional transition-colors mt-1"
                >
                  Ver {history.length} registro{history.length !== 1 ? 's' : ''}
                </button>
              )}
            </Card>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          {/* Trend */}
          <Card accentColor="#0891b2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp size={15} className="text-emotional" aria-hidden />
                Tendência 30 dias
              </CardTitle>
            </CardHeader>

            {loadingTrend ? (
              <div className="flex justify-center py-6"><Spinner size="sm" /></div>
            ) : trendObj ? (
              <div className="space-y-3">
                {[
                  { label: 'Humor médio',   value: trendObj.averageMood,   color: trendObj.averageMood >= 4 ? '#10b981' : trendObj.averageMood >= 3 ? '#eab308' : '#ef4444' },
                  { label: 'Energia média', value: trendObj.averageEnergy, color: '#0891b2' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">{item.label}</span>
                      <span className="text-slate-200 font-medium font-mono">
                        {item.value > 0 ? item.value.toFixed(1) : '—'}
                        <span className="text-slate-600">/5</span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-glass-border overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(item.value / 5) * 100}%`, background: item.color }}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                  <span>Tendência: <span className="text-slate-300">{trendLabel[trendObj.trend] ?? '—'}</span></span>
                  <span>{trendObj.dataPoints?.length ?? 0} registros</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 text-center py-4">Sem dados ainda</p>
            )}

            <p className="text-[10px] text-slate-600 italic mt-3 text-center">
              {trendObj?.disclaimer ?? 'Período: últimos 30 dias'}
            </p>
          </Card>

          {/* Latest check-in */}
          {latestCheckIn && (
            <Card accentColor="#0891b2">
              <p className="label-muted mb-3">Último registro</p>
              {(() => {
                const dm = displayLevel(latestCheckIn.moodScore)
                const de = displayLevel(latestCheckIn.energyLevel)
                const MoodIcon   = moodIcons[dm]
                const EnergyIcon = energyIcons[de]
                const moodCfg    = moodConfig[dm]
                const energyCfg  = energyConfig[de]
                return (
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <MoodIcon size={22} style={{ color: moodCfg.color }} aria-hidden />
                      <span className="text-[10px] text-slate-500">{moodCfg.label}</span>
                    </div>
                    <div className="w-px h-10 bg-glass-border" />
                    <div className="flex flex-col items-center gap-1">
                      <EnergyIcon size={22} style={{ color: energyCfg.color }} aria-hidden />
                      <span className="text-[10px] text-slate-500">{energyCfg.label}</span>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-[10px] text-slate-600">
                        {latestCheckIn.checkInDate
                          ? (() => { try { return format(parseISO(latestCheckIn.checkInDate), "d MMM", { locale: ptBR }) } catch { return latestCheckIn.checkInDate } })()
                          : '—'}
                      </p>
                    </div>
                  </div>
                )
              })()}
            </Card>
          )}

          {/* Mini bar chart */}
          {history.length >= 3 && (
            <Card>
              <p className="label-muted mb-3">Humor recente</p>
              <div className="flex items-end gap-1 h-12" role="img" aria-label="Histórico de humor">
                {history.slice(0, 7).reverse().map((ci, i) => {
                  const h = (ci.moodScore / 5) * 100
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm transition-all"
                      style={{ height: `${Math.max(h, 8)}%`, background: `${moodConfig[displayLevel(ci.moodScore)].color}80` }}
                      aria-hidden
                    />
                  )
                })}
              </div>
              <p className="text-[9px] text-slate-600 mt-1 text-center">últimos registros →</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
