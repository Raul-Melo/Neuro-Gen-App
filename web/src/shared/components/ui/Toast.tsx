import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { useUIStore } from '@/shared/stores/ui.store'

const toastConfig = {
  success: { icon: CheckCircle, classes: 'border-emotional/30 text-emotional-light', iconClass: 'text-emotional' },
  error: { icon: XCircle, classes: 'border-danger/30 text-slate-200', iconClass: 'text-danger' },
  warning: { icon: AlertTriangle, classes: 'border-vault/30 text-slate-200', iconClass: 'text-vault' },
  info: { icon: Info, classes: 'border-agenda/30 text-slate-200', iconClass: 'text-agenda' },
}

function ToastItem({ id, message, variant, duration = 4000 }: {
  id: string; message: string; variant: keyof typeof toastConfig; duration?: number
}) {
  const removeToast = useUIStore((s) => s.removeToast)
  const { icon: Icon, classes, iconClass } = toastConfig[variant]

  useEffect(() => {
    const timer = setTimeout(() => removeToast(id), duration)
    return () => clearTimeout(timer)
  }, [id, duration, removeToast])

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl glass-card border animate-slide-up',
        'min-w-[280px] max-w-[380px]',
        classes,
      )}
    >
      <Icon size={18} className={cn('flex-shrink-0 mt-0.5', iconClass)} aria-hidden />
      <p className="text-sm flex-1">{message}</p>
      <button
        onClick={() => removeToast(id)}
        aria-label="Fechar notificação"
        className="text-slate-500 hover:text-slate-200 transition-colors -mt-0.5"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-[1000] flex flex-col gap-2 items-end"
      aria-live="polite"
      aria-label="Notificações"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </div>
  )
}
