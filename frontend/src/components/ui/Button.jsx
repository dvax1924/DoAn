import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const variants = {
  primary: cn(
    'bg-primary text-primary-foreground',
    'hover:bg-[#2A2A2B]',
    'active:bg-[#0A0A0B]',
    'disabled:bg-muted disabled:text-muted-foreground'
  ),
  secondary: cn(
    'bg-secondary text-secondary-foreground',
    'hover:bg-[#EAEAE8]',
    'active:bg-[#DFDFD9]',
    'disabled:bg-muted disabled:text-muted-foreground disabled:opacity-50'
  ),
  outline: cn(
    'bg-transparent border border-border text-foreground',
    'hover:bg-secondary hover:border-foreground',
    'active:bg-accent',
    'disabled:border-muted disabled:text-muted-foreground disabled:opacity-50'
  ),
  ghost: cn(
    'bg-transparent text-foreground',
    'hover:bg-secondary',
    'active:bg-accent',
    'disabled:text-muted-foreground disabled:opacity-50'
  ),
}

const sizes = {
  sm: 'h-9 px-4 text-xs tracking-[0.1em]',
  md: 'h-11 px-6 text-sm tracking-[0.1em]',
  lg: 'h-14 px-10 text-sm tracking-[0.15em]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  disabled = false,
  loading = false,
  className,
  ...props
}) {
  const isInactive = disabled || loading
  return (
    <motion.button
      className={cn(
        'relative inline-flex items-center justify-center',
        'font-medium uppercase',
        'rounded-lg',
        'transition-colors duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isInactive}
      whileHover={!isInactive ? { scale: 1.02 } : undefined}
      whileTap={!isInactive ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      {...props}
    >
      {loading ? (
        <motion.span
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </motion.span>
      ) : null}
      <span className={cn(loading && 'opacity-0')}>{children}</span>
    </motion.button>
  )
}

export default Button
