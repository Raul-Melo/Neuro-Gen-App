import { useState } from 'react'
import { Download, X } from 'lucide-react'
import { usePWA } from '@/shared/hooks/usePWA'
import { cn } from '@/shared/lib/cn'

export function InstallPrompt() {
  const { isInstallable, promptInstall } = usePWA()
  const [dismissed, setDismissed]       = useState(false)

  if (!isInstallable || dismissed) return null

  return (
    <div
      className={cn(
        'fixed bottom-[100px] left-3 right-3 z-50 lg:left-auto lg:right-6 lg:bottom-6 lg:w-80',
        'glass-card p-4 animate-slide-up',
        'border border-brand/30',
      )}
      role="banner"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Ícone */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-brand">
          <img src="/logo-64.webp" alt="" width={24} height={24} className="w-6 h-6" aria-hidden />
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-100 leading-tight">
            Instalar Neuro-Gen
          </p>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            Acesse rapidamente pelo atalho do seu dispositivo.
          </p>
          <button
            onClick={() => promptInstall()}
            className={cn(
              'mt-2 inline-flex items-center gap-1.5 text-xs font-medium',
              'px-3 py-1.5 rounded-lg',
              'bg-brand/20 text-brand-light border border-brand/30',
              'hover:bg-brand/30 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60',
            )}
          >
            <Download size={12} aria-hidden />
            Instalar app
          </button>
        </div>

        {/* Fechar */}
        <button
          onClick={() => setDismissed(true)}
          aria-label="Fechar sugestão de instalação"
          className={cn(
            'flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full',
            'text-slate-500 hover:text-slate-200 hover:bg-glass transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60',
          )}
        >
          <X size={14} aria-hidden />
        </button>
      </div>
    </div>
  )
}
