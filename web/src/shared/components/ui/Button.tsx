import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-focus text-white hover:bg-focus-dark shadow-glow-violet/0 hover:shadow-glow-violet active:scale-[0.98]',
  secondary:
    'bg-glass border border-glass-border text-slate-200 hover:bg-glass-hover hover:border-glass-border-hover active:scale-[0.98]',
  ghost:
    'text-slate-400 hover:text-slate-200 hover:bg-glass active:scale-[0.98]',
  danger:
    'bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20 active:scale-[0.98]',
  outline:
    'border border-glass-border-hover text-slate-300 hover:bg-glass hover:text-slate-100 active:scale-[0.98]',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-xl',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-2xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-150',
          'focus-visible:ring-2 focus-visible:ring-focus/70 focus-visible:ring-offset-2 focus-visible:ring-offset-base-900 focus-visible:outline-none',
          'disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="animate-spin h-4 w-4 rounded-full border-2 border-current border-t-transparent" aria-hidden />
        ) : (
          leftIcon && <span aria-hidden>{leftIcon}</span>
        )}
        {children}
        {rightIcon && !loading && <span aria-hidden>{rightIcon}</span>}
      </button>
    )
  },
)

Button.displayName = 'Button'
