import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  hideClose?: boolean
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  hideClose = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = `modal-title-${Math.random().toString(36).slice(2)}`
  const descId = `modal-desc-${Math.random().toString(36).slice(2)}`

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    const handleCancel = (e: Event) => {
      e.preventDefault()
      onClose()
    }
    dialog?.addEventListener('cancel', handleCancel)
    return () => dialog?.removeEventListener('cancel', handleCancel)
  }, [onClose])

  if (!open) return null

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      className={cn(
        'fixed w-full rounded-2xl p-0',
        // Mobile: bottom sheet (anchored to bottom, full width, max 90dvh)
        'sm:inset-0 sm:m-auto',
        'max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:m-0 max-sm:rounded-b-none max-sm:max-h-[90dvh]',
        'bg-base-800 border border-glass-border shadow-glass-lg',
        'backdrop:bg-base-950/70 backdrop:backdrop-blur-sm',
        'open:animate-slide-up overflow-y-auto',
        sizeClasses[size],
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {(title || !hideClose) && (
        <div className="flex items-center justify-between p-5 border-b border-glass-border">
          <div>
            {title && (
              <h2 id={titleId} className="font-display font-semibold text-slate-100 text-base">
                {title}
              </h2>
            )}
            {description && (
              <p id={descId} className="text-sm text-slate-500 mt-0.5">
                {description}
              </p>
            )}
          </div>
          {!hideClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Fechar"
              className="ml-4 -mr-1 text-slate-500 hover:text-slate-200"
            >
              <X size={16} />
            </Button>
          )}
        </div>
      )}
      <div className="p-5">{children}</div>
    </dialog>
  )
}
