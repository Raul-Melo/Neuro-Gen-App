import { type HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  accentColor?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({
  hover = false,
  accentColor,
  padding = 'md',
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'glass-card relative overflow-hidden',
        hover && 'glass-card-hover cursor-pointer',
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {accentColor && (
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}80, transparent)` }}
          aria-hidden
        />
      )}
      {children}
    </div>
  )
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}
export function CardHeader({ children, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  )
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}
export function CardTitle({ children, className, ...props }: CardTitleProps) {
  return (
    <h3 className={cn('section-header', className)} {...props}>
      {children}
    </h3>
  )
}
