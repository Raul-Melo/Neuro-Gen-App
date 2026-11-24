import { useState } from 'react'
import { Heart, TrendingUp, BookOpen, Frown, Meh, Smile, SmilePlus, BatteryWarning, BatteryLow, BatteryMedium, BatteryFull, Zap, CheckCircle2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Card, CardHeader, CardTitle, Spinner } from '@/shared/components/ui'
import { emotionalService } from '../services/emotional.service'
import type { MoodLevel, EnergyLevel } from '@/shared/types/api.types'
import { moodConfig, energyConfig } from '../types'
import { cn } from '@/shared/lib/cn'
import { useUIStore } from '@/shared/stores/ui.store'

const moodIcons: Record<MoodLevel, React.ElementType> = {
  1: Frown, 2: Frown, 3: Meh, 4: Smile, 5: SmilePlus,
  6: SmilePlus, 7: SmilePlus, 8: SmilePlus, 9: SmilePlus, 10: SmilePlus,
}

const energyIcons: Record<EnergyLevel, React.ElementType> = {
  1: BatteryWarning, 2: BatteryLow, 3: BatteryMedium, 4: BatteryFull, 5: Zap,
  6: Zap, 7: Zap, 8: Zap, 9: Zap, 10: Zap,
}

const DISCLAIMER =
  'Este registro é apenas para autoconhecimento. Não substitui acompanhamento profissional de saúde mental.'

export function EmotionalPage() {
  const [mood, setMood]     = useState<MoodLevel | null>(null)
  const [energy, setEnergy] = useState<EnergyLevel | null>(null)
  const [note, setNote]     = useState('')
  const qc = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)

  const { data: trend, isLoading: loadingTrend } = useQuery({
    queryKey: ['emotional-trend'],
    queryFn:  () => emotionalService.getTrend(),
  })

  const { data: checkIns, isLoading: loadingCi } = useQuery({
    queryKey: ['check-ins'],
    queryFn:  () => emotionalService.getCheckIns(),
  })

  const saveMutation = useMutation({
    mutationFn: () => emotionalService.createCheckIn({
      moodScore:   mood!,
      energyLevel: energy!,
      notes:       note.trim() || undefined,
    }),
    onSuccess: () => {
      addToast({ variant: 'success', message: 'Check-in salvo!' })
      setMood(null)
      setEnergy(null)
      setNote('')
      qc.invalidateQueries({ queryKey: ['emotional-trend'] })
      qc.invalidateQueries({ queryKey: ['check-ins'] })
    },
    onError: () => addToast({ variant: 'error', message: 'Erro ao salvar check-in. Tente novamente.' }),
  })

  // trend é objeto agregado, não array de dias — sem pontos individuais
  const trendObj    = trend ?? null
  const latestCheckIn = checkIns?.content?.[0]

  return (
    <div className="page-container space-y-6 animate-fade-in">
      <div>
        <h1 className="section-header text-xl">Regulação Emocional</h1>
        <p className="text-sm text-slate-500 mt-1">Registre como você está sentindo agora</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Check-in form */}
        <div className="lg:col-span-2 space-y-4">
          <Card accentColor="#0891b2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart size={16} className="text-emotional" aria-hidden />
                Check-in de hoje
              </CardTitle>
            </CardHeader>

            {/* Mood selector */}
            <fieldset className="mb-5">
              <legend className="label-muted mb-3">Como está seu humor?</legend>
              <div className="flex gap-2">
                {([1, 2, 3, 4, 5] as MoodLevel[]).map((level) => {
                  const Icon  = moodIcons[level]
                  const cfg   = moodConfig[level]
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
                        'flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all duration-150',
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
                      <span className={cn('text-xs', active ? 'text-slate-300' : 'text-slate-500')}>
                        {cfg.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            {/* Energy selector */}
            <fieldset className="mb-5">
              <legend className="label-muted mb-3">Como está sua energia?</legend>
              <div className="flex gap-2">
                {([1, 2, 3, 4, 5] as EnergyLevel[]).map((level) => {
                  const Icon  = energyIcons[level]
                  const cfg   = energyConfig[level]
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
                        'flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all duration-150',
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
                      <span className={cn('text-xs text-center leading-tight', active ? 'text-slate-300' : 'text-slate-500')}>
                        {cfg.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            {/* Optional note */}
            <div className="mb-5">
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
                className="w-full bg-glass border border-glass-border rounded-xl p-3 text-sm text-slate-200 placeholder:text-slate-600 resize-none focus:outline-none focus:border-emotional/50 focus:ring-1 focus:ring-emotional/20 transition-all"
              />
              <p className="text-xs text-slate-600 text-right mt-1">{note.length}/500</p>
            </div>

            {/* LGPD disclaimer */}
            <p className="text-xs text-slate-600 italic mb-4" role="note">{DISCLAIMER}</p>

            <Button
              variant="primary"
              onClick={() => saveMutation.mutate()}
              disabled={!mood || !energy || saveMutation.isPending}
              loading={saveMutation.isPending}
              className="bg-emotional hover:bg-emotional-dark"
            >
              {saveMutation.isSuccess ? (
                <><CheckCircle2 size={16} /> Salvo!</>
              ) : (
                'Salvar check-in'
              )}
            </Button>
          </Card>

          {/* Recent check-ins */}
          {!loadingCi && checkIns && checkIns.content.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Registros recentes</CardTitle>
              </CardHeader>
              <ul className="space-y-2" role="list">
                {checkIns.content.slice(0, 5).map((ci) => {
                  const displayMood   = Math.min(5, Math.max(1, Math.ceil(ci.moodScore / 2))) as 1|2|3|4|5
                  const displayEnergy = Math.min(5, Math.max(1, Math.ceil(ci.energyLevel / 2))) as 1|2|3|4|5
                  const MoodIcon   = moodIcons[displayMood]
                  const EnergyIcon = energyIcons[displayEnergy]
                  const moodCfg    = moodConfig[displayMood]
                  const energyCfg  = energyConfig[displayEnergy]
                  return (
                    <li key={ci.id} className="flex items-center gap-3 p-3 rounded-xl bg-glass border border-glass-border">
                      <MoodIcon   size={18} style={{ color: moodCfg.color }}   aria-label={`Humor: ${moodCfg.label}`}   />
                      <EnergyIcon size={18} style={{ color: energyCfg.color }} aria-label={`Energia: ${energyCfg.label}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 truncate">{moodCfg.label} · {energyCfg.label}</p>
                        <p className="text-[10px] text-slate-600">{ci.checkInDate}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}
        </div>

        {/* Trend sidebar */}
        <div className="space-y-4">
          <Card accentColor="#0891b2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp size={15} className="text-emotional" aria-hidden />
                Últimos 7 dias
              </CardTitle>
            </CardHeader>

            {loadingTrend ? (
              <div className="flex justify-center py-6"><Spinner size="sm" /></div>
            ) : trendObj ? (
              <div className="space-y-3">
                {(() => {
                  const mood   = trendObj.avgMoodScore   ?? 0
                  const energy = trendObj.avgEnergyLevel ?? 0
                  return (
                    <>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Humor médio</span>
                        <span className="text-slate-200 font-medium font-mono">
                          {mood > 0 ? mood.toFixed(1) : '—'}<span className="text-slate-600">/10</span>
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-glass-border overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${(mood / 10) * 100}%`, background: mood >= 7 ? '#10b981' : mood >= 5 ? '#eab308' : mood > 0 ? '#ef4444' : 'transparent' }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Energia média</span>
                        <span className="text-slate-200 font-medium font-mono">
                          {energy > 0 ? energy.toFixed(1) : '—'}<span className="text-slate-600">/10</span>
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-glass-border overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${(energy / 10) * 100}%`, background: '#0891b2' }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                        <span>Tendência: <span className="text-slate-300">{
                          { IMPROVING: '↑ Melhorando', STABLE: '→ Estável', DECLINING: '↓ Caindo', INSUFFICIENT_DATA: '— Sem dados' }[trendObj.moodTrend]
                        }</span></span>
                        <span>{trendObj.totalCheckIns ?? 0} registros</span>
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : (
              <p className="text-xs text-slate-600 text-center py-4">Sem dados de tendência</p>
            )}

            <p className="text-[10px] text-slate-600 italic mt-3 text-center">
              {trendObj?.disclaimer ?? 'Período: últimos 30 dias'}
            </p>
          </Card>

          {/* Latest summary */}
          {latestCheckIn && (
            <Card accentColor="#0891b2">
              <p className="label-muted mb-2">Último registro</p>
              {(() => {
                const dm = Math.min(5, Math.max(1, Math.ceil(latestCheckIn.moodScore / 2))) as 1|2|3|4|5
                const de = Math.min(5, Math.max(1, Math.ceil(latestCheckIn.energyLevel / 2))) as 1|2|3|4|5
                const MoodIcon   = moodIcons[dm]
                const EnergyIcon = energyIcons[de]
                const moodCfg    = moodConfig[dm]
                const energyCfg  = energyConfig[de]
                return (
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <MoodIcon size={20} style={{ color: moodCfg.color }} aria-hidden />
                      <span className="text-[10px] text-slate-500">{moodCfg.label}</span>
                    </div>
                    <div className="w-px h-8 bg-glass-border" />
                    <div className="flex flex-col items-center gap-1">
                      <EnergyIcon size={20} style={{ color: energyCfg.color }} aria-hidden />
                      <span className="text-[10px] text-slate-500">{energyCfg.label}</span>
                    </div>
                  </div>
                )
              })()}
              <p className="text-[10px] text-slate-600 mt-2">{latestCheckIn.checkInDate}</p>
            </Card>
          )}

          {/* Journal shortcut */}
          <Card hover accentColor="#0891b2" className="cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emotional-muted flex items-center justify-center">
                <BookOpen size={18} className="text-emotional-light" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Diário Emocional</p>
                <p className="text-xs text-slate-500">Escrita livre, criptografada</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
