import { Settings, Palette, Accessibility, Bell, Shield, LogOut, ChevronRight } from 'lucide-react'
import { Button, Card } from '@/shared/components/ui'
import { useUIStore } from '@/shared/stores/ui.store'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useLogout } from '@/features/auth/hooks/useAuth'
import { cn } from '@/shared/lib/cn'

function ToggleRow({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-4 py-3 cursor-pointer group">
      <div>
        <p className="text-sm font-medium text-slate-200 group-hover:text-slate-100 transition-colors">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-10 h-5 rounded-full transition-all duration-200 flex-shrink-0',
          checked ? 'bg-focus' : 'bg-glass-hover border border-glass-border',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200',
            checked ? 'left-5' : 'left-0.5',
          )}
        />
        <span className="sr-only">{checked ? 'Ativado' : 'Desativado'}</span>
      </button>
    </label>
  )
}

function RangeRow({ label, value, min, max, step, onChange, format }: {
  label: string; value: number; min: number; max: number; step: number
  onChange: (v: number) => void; format: (v: number) => string
}) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <span className="text-xs text-slate-500 font-mono">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-focus h-1.5 rounded-full"
        aria-label={label}
      />
    </div>
  )
}

const sections = [
  { id: 'appearance', label: 'Aparência', icon: Palette },
  { id: 'accessibility', label: 'Acessibilidade', icon: Accessibility },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'security', label: 'Segurança', icon: Shield },
]

export function SettingsPage() {
  const { reducedMotion, reducedDensity, fontScale, setReducedMotion, setReducedDensity, setFontScale } = useUIStore()
  const user   = useAuthStore((s) => s.user)
  const logout = useLogout()

  return (
    <div className="page-container space-y-6 animate-fade-in">
      <div>
        <h1 className="section-header text-xl flex items-center gap-2">
          <Settings size={18} className="text-slate-500" aria-hidden /> Configurações
        </h1>
        <p className="text-sm text-slate-500 mt-1">Personalize sua experiência no Neuro-Gen</p>
      </div>

      {/* Account */}
      <Card>
        <div className="flex items-center gap-4 pb-4 border-b border-glass-border">
          <div className="w-12 h-12 rounded-2xl bg-focus-muted border border-focus/20 flex items-center justify-center font-display font-bold text-focus-light text-lg select-none">
            {(user?.email ?? 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-200 truncate">{user?.email}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {user?.role === 'TITULAR' ? 'Conta Titular' : 'Conta de Apoio'}
              {user?.emailVerified === false && (
                <span className="ml-2 text-amber-400">· E-mail não verificado</span>
              )}
            </p>
            {user?.totpEnabled && (
              <p className="text-[10px] text-emotional mt-0.5">· 2FA ativo</p>
            )}
            {user?.status === 'PENDING_VERIFICATION' && (
              <p className="text-[10px] text-amber-400 mt-0.5">· Aguardando verificação de e-mail</p>
            )}
          </div>
        </div>

        <div className="pt-3 space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-danger hover:text-danger w-full justify-start"
            onClick={() => logout.mutate()}
            loading={logout.isPending}
          >
            <LogOut size={15} /> Sair da conta
          </Button>
        </div>
      </Card>

      {/* Aparência */}
      <Card>
        <div className="flex items-center gap-2 mb-1">
          <Palette size={15} className="text-slate-500" aria-hidden />
          <h2 className="text-sm font-semibold text-slate-300">Aparência</h2>
        </div>
        <div className="divide-y divide-glass-border">
          <RangeRow
            label="Tamanho da fonte"
            value={fontScale}
            min={0.85}
            max={1.25}
            step={0.05}
            onChange={setFontScale}
            format={(v) => `${Math.round(v * 100)}%`}
          />
        </div>
      </Card>

      {/* Acessibilidade */}
      <Card>
        <div className="flex items-center gap-2 mb-1">
          <Accessibility size={15} className="text-slate-500" aria-hidden />
          <h2 className="text-sm font-semibold text-slate-300">Acessibilidade</h2>
        </div>
        <div className="divide-y divide-glass-border">
          <ToggleRow
            label="Reduzir movimento"
            description="Desativa animações e transições"
            checked={reducedMotion}
            onChange={setReducedMotion}
          />
          <ToggleRow
            label="Baixa densidade"
            description="Menos informações por tela — recomendado para TEA"
            checked={reducedDensity}
            onChange={setReducedDensity}
          />
        </div>
      </Card>

      {/* Links para seções futuras */}
      <Card>
        <div className="divide-y divide-glass-border">
          {sections.filter((s) => s.id === 'notifications' || s.id === 'security').map((s) => {
            const Icon = s.icon
            return (
              <div key={s.id} className="flex items-center justify-between py-3 text-slate-500">
                <div className="flex items-center gap-2">
                  <Icon size={15} aria-hidden />
                  <span className="text-sm">{s.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-700 bg-glass px-2 py-0.5 rounded-full">Em breve</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <p className="text-center text-xs text-slate-700">Neuro-Gen v0.1.0 · Dados protegidos pela LGPD</p>
    </div>
  )
}
