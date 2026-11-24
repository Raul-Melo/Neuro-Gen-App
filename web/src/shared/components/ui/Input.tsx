import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightElement?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightElement, className, id, ...props }, ref) => {
    const inputId = id ?? `input-${Math.random().toString(36).slice(2)}`
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-300"
          >
            {label}
            {props.required && (
              <span className="text-danger ml-1" aria-label="obrigatório">*</span>
            )}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              aria-hidden
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={cn(error && errorId, helperText && helperId)}
            className={cn(
              'w-full h-11 rounded-xl bg-glass border border-glass-border',
              'text-slate-200 placeholder:text-slate-600 text-sm',
              'transition-all duration-150',
              'focus:outline-none focus:border-focus/50 focus:bg-glass-hover focus:ring-1 focus:ring-focus/30',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              error && 'border-danger/50 focus:border-danger/70 focus:ring-danger/20',
              leftIcon ? 'pl-10' : 'pl-4',
              rightElement ? 'pr-11' : 'pr-4',
              className,
            )}
            {...props}
          />

          {rightElement && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightElement}
            </span>
          )}
        </div>

        {error && (
          <p id={errorId} role="alert" className="text-xs text-danger flex items-center gap-1">
            <span aria-hidden>⚠</span> {error}
          </p>
        )}

        {helperText && !error && (
          <p id={helperId} className="text-xs text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
