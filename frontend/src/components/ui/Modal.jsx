import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
}

export function Modal({ isOpen, onClose, children, size = 'md' }) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm transition-opacity duration-300 ease-out data-[closed]:opacity-0"
      />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            transition
            className={cn(
              'w-full transition duration-300 ease-out',
              'data-[closed]:opacity-0 data-[closed]:scale-95 data-[closed]:translate-y-4',
              sizes[size],
              'bg-card rounded-lg',
              'shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)]',
              'border border-border',
              'overflow-hidden'
            )}
          >
            {children}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}

export function ModalHeader({ children, onClose, className }) {
  return (
    <div
      className={cn(
        'flex items-start justify-between',
        'px-6 pt-6 pb-2',
        className
      )}
    >
      <div className="flex-1">{children}</div>
      {onClose ? (
        <motion.button
          type="button"
          onClick={onClose}
          className={cn(
            'ml-4 p-2 -mr-2 -mt-2',
            'text-muted-foreground hover:text-foreground',
            'rounded-lg hover:bg-secondary',
            'transition-colors duration-200'
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </motion.button>
      ) : null}
    </div>
  )
}

export function ModalTitle({ children, className }) {
  return (
    <DialogTitle
      className={cn(
        'text-lg font-medium tracking-tight text-foreground',
        className
      )}
    >
      {children}
    </DialogTitle>
  )
}

export function ModalDescription({ children, className }) {
  return (
    <p className={cn('mt-1 text-sm text-muted-foreground', className)}>
      {children}
    </p>
  )
}

export function ModalContent({ children, className }) {
  return <div className={cn('px-6 py-4', className)}>{children}</div>
}

export function ModalFooter({ children, className }) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3',
        'px-6 py-4',
        'border-t border-border',
        'bg-secondary/30',
        className
      )}
    >
      {children}
    </div>
  )
}

export default Modal
