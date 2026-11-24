import { cn } from '@/shared/lib/cn'

interface AvatarProps {
  name?: string
  src?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getColor(name: string) {
  const colors = [
    'from-focus to-agenda',
    'from-emotional to-link',
    'from-vault to-emotional',
    'from-agenda to-focus',
  ]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

export function Avatar({ name = '', src, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-display font-semibold overflow-hidden select-none flex-shrink-0',
        sizeClasses[size],
        !src && `bg-gradient-to-br ${getColor(name)} text-white`,
        className,
      )}
      aria-label={name || 'Avatar'}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  )
}
