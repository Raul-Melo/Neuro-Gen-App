import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, ChevronRight, ChevronLeft, X, Zap, Star, Target, Sparkles, Puzzle, EyeOff, CalendarDays, Timer, Heart, CheckCircle2 } from 'lucide-react'
import { Button } from '@/shared/components/ui'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useUIStore } from '@/shared/stores/ui.store'
import { cn } from '@/shared/lib/cn'

type Profile = 'ADHD' | 'ASD' | 'GIFTED' | 'DOUBLE_EXCEPTIONAL' | 'OTHER' | 'PREFER_NOT'

interface ProfileOption {
  id: Profile
  label: string
  description: string
  icon: React.ElementType
  color: string
}

const profileOptions: ProfileOption[] = [
  { id: 'ADHD',             label: 'TDAH',               description: 'Déficit de atenção e/ou hiperatividade', icon: Zap,       color: '#7c3aed' },
  { id: 'ASD',              label: 'TEA',                description: 'Transtorno do espectro autista',          icon: Star,      color: '#6366f1' },
  { id: 'GIFTED',           label: 'Superdotação',        description: 'Altas habilidades / superdotação',       icon: Target,    color: '#0891b2' },
  { id: 'DOUBLE_EXCEPTIONAL',label: '2E',                description: 'Duplamente excepcional',                  icon: Sparkles,  color: '#a855f7' },
  { id: 'OTHER',            label: 'Outro',               description: 'Outra condição de neurodivergência',     icon: Puzzle,    color: '#94a3b8' },
  { id: 'PREFER_NOT',       label: 'Prefiro não informar',description: 'Configure depois nas preferências',      icon: EyeOff,    color: '#475569' },
]

const features = [
  { icon: CalendarDays, label: 'Agenda adaptativa', color: '#6366f1' },
  { icon: Timer,        label: 'Foco estruturado',   color: '#7c3aed' },
  { icon: Heart,        label: 'Bem-estar emocional',color: '#0891b2' },
]

const steps = [
  { id: 1, title: 'Bem-vindo!' },
  { id: 2, title: 'Seu perfil' },
  { id: 3, title: 'Configurações' },
  { id: 4, title: 'Pronto!' },
]

export function OnboardingPage() {
  const [step, setStep]                       = useState(1)
  const [selectedProfiles, setSelectedProfiles] = useState<Profile[]>([])
  const { setOnboardingComplete } = useAuthStore()
  const { setReducedDensity }     = useUIStore()
  const [reducedDensityLocal, setReducedDensityLocal] = useState(false)
  const navigate = useNavigate()

  const toggleProfile = (p: Profile) => {
    if (p === 'PREFER_NOT') { setSelectedProfiles(['PREFER_NOT']); return }
    setSelectedProfiles((prev) =>
      prev.includes('PREFER_NOT')
        ? [p]
        : prev.includes(p)
          ? prev.filter((x) => x !== p)
          : [...prev.filter((x) => x !== 'PREFER_NOT'), p],
    )
  }

  const handleFinish = () => {
    if (reducedDensityLocal) setReducedDensity(true)
    setOnboardingComplete()
    navigate('/dashboard')
  }

  const handleSkip = () => {
    setOnboardingComplete()
    navigate('/dashboard')
  }

  return (
    <div className="min-h-dvh bg-base-950 bg-mesh flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-slide-up">
        {/* Skip */}
        <div className="flex justify-end mb-4">
          <Button variant="ghost" size="sm" onClick={handleSkip} className="text-slate-600">
            <X size={14} /> Pular configuração
          </Button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6" aria-label={`Passo ${step} de ${steps.length}`}>
          {steps.map((s) => (
            <div
              key={s.id}
              className={cn('h-1 flex-1 rounded-full transition-all duration-300', s.id <= step ? 'bg-focus' : 'bg-glass border border-glass-border')}
              aria-hidden
            />
          ))}
        </div>

        <div className="glass-card p-8">
          {/* Step 1 — Welcome */}
          {step === 1 && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-focus flex items-center justify-center mx-auto shadow-glow-violet">
                <Brain size={28} className="text-white" aria-hidden />
              </div>
              <div>
                <h1 className="font-display font-bold text-slate-100 text-2xl">Bem-vindo!</h1>
                <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                  O Neuro-Gen foi criado para se adaptar a você — não o contrário.
                  Em 3 passos rápidos vamos personalizar a experiência.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {features.map((f) => {
                  const Icon = f.icon
                  return (
                    <div key={f.label} className="p-3 rounded-xl bg-glass border border-glass-border flex flex-col items-center gap-2">
                      <Icon size={18} style={{ color: f.color }} aria-hidden />
                      <p className="text-xs text-slate-400 leading-relaxed">{f.label}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 2 — Profile */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display font-semibold text-slate-100 text-xl">Seu perfil</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Usado só para sugerir configurações. Nunca obrigatório, sempre ajustável.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="Selecione seu perfil">
                {profileOptions.map((option) => {
                  const Icon   = option.icon
                  const active = selectedProfiles.includes(option.id)
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleProfile(option.id)}
                      aria-pressed={active}
                      className={cn(
                        'flex flex-col gap-1.5 p-3 rounded-xl border text-left transition-all duration-150',
                        active ? 'border-focus/50 bg-focus-muted' : 'border-glass-border bg-glass hover:bg-glass-hover',
                      )}
                    >
                      <Icon size={18} style={{ color: active ? option.color : undefined }} className={active ? '' : 'text-slate-600'} aria-hidden />
                      <span className="text-sm font-medium text-slate-200">{option.label}</span>
                      <span className="text-xs text-slate-500 leading-snug">{option.description}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 3 — Settings */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display font-semibold text-slate-100 text-xl">Configurações iniciais</h2>
                <p className="text-sm text-slate-500 mt-1">Ajuste agora ou depois nas configurações</p>
              </div>

              <label className="flex items-start gap-4 p-4 rounded-xl border border-glass-border bg-glass cursor-pointer hover:bg-glass-hover transition-all">
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 rounded accent-focus"
                  checked={reducedDensityLocal}
                  onChange={(e) => setReducedDensityLocal(e.target.checked)}
                />
                <div>
                  <p className="text-sm font-medium text-slate-200">Modo baixa densidade</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Reduz a quantidade de informações visíveis por tela. Recomendado para TEA e sensibilidade sensorial.
                  </p>
                </div>
              </label>

              {selectedProfiles.includes('ADHD') && (
                <div className="p-3 rounded-xl border border-focus/20 bg-focus-muted flex items-start gap-2">
                  <Zap size={14} className="text-focus-light mt-0.5 flex-shrink-0" aria-hidden />
                  <p className="text-xs text-focus-light">
                    Para TDAH, ativamos lembretes persistentes e o timer de foco por padrão. Você pode ajustar depois.
                  </p>
                </div>
              )}

              {selectedProfiles.includes('ASD') && (
                <div className="p-3 rounded-xl border border-agenda/20 bg-agenda-muted flex items-start gap-2">
                  <Star size={14} className="text-agenda-light mt-0.5 flex-shrink-0" aria-hidden />
                  <p className="text-xs text-agenda-light">
                    Para TEA, o modo baixa densidade vem ativado por padrão e transições ficam mais suaves.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4 — Done */}
          {step === 4 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emotional-muted border border-emotional/20 flex items-center justify-center mx-auto shadow-glow-cyan">
                <CheckCircle2 size={28} className="text-emotional" aria-hidden />
              </div>
              <div>
                <h2 className="font-display font-bold text-slate-100 text-xl">Tudo pronto!</h2>
                <p className="text-sm text-slate-500 mt-2">
                  Sua conta está configurada. Você pode alterar qualquer preferência nas Configurações.
                </p>
              </div>
              {selectedProfiles.length > 0 && selectedProfiles[0] !== 'PREFER_NOT' && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {selectedProfiles.map((p) => {
                    const opt  = profileOptions.find((o) => o.id === p)
                    if (!opt) return null
                    const Icon = opt.icon
                    return (
                      <span key={p} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-focus-muted border border-focus/20 text-xs text-focus-light">
                        <Icon size={12} aria-hidden />{opt.label}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
                <ChevronLeft size={16} /> Voltar
              </Button>
            ) : <span />}

            {step < steps.length ? (
              <Button variant="primary" onClick={() => setStep((s) => s + 1)}>
                Próximo <ChevronRight size={16} />
              </Button>
            ) : (
              <Button variant="primary" onClick={handleFinish} rightIcon={<ChevronRight size={16} />}>
                Começar a usar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
