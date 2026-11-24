import { cn } from '@/shared/lib/cn'

type BadgeVariant = 'agenda' | 'focus' | 'emotional' | 'vault' | 'link' | 'danger' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

const variantClasses: Record<BadgeVariant, string> = {
  agenda: 'bg-agenda-muted text-agenda-light border-agenda/20',
  focus: 'bg-focus-muted text-focus-light border-focus/20',
  emotional: 'bg-emotional-muted text-emotional-light border-emotional/20',
  vault: 'bg-vault-muted text-vault-light border-vault/20',
  link: 'bg-link-muted text-link-light border-link/20',
  danger: 'bg-danger-muted text-danger-light border-danger/20',
  neutral: 'bg-glass text-slate-400 border-glass-border',
}

const dotColors: Record<BadgeVariant, string> = {
  agenda: 'bg-agenda',
  focus: 'bg-focus',
  emotional: 'bg-emotional',
  vault: 'bg-vault',
  link: 'bg-link',
  danger: 'bg-danger',
  neutral: 'bg-slate-500',
}

export function Badge({ variant = 'neutral', children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'module-pill border',
        variantClasses[variant],
        className,
      )}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])}
          aria-hidden
        />
      )}
      {children}
    </span>
  )
}
