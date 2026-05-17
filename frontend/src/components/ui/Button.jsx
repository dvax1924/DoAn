import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import LoadingSpinner from './LoadingSpinner'

// ─── Variant styles ───────────────────────────────────────────────────────────
const variants = {
  primary: cn(
    'bg-[#1A1A1B] text-white',
    'hover:-translate-y-0.5 hover:shadow-md',
    'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none'
  ),
  secondary: cn(
    'bg-[#F0EFEB] text-[#1A1A1B]',
    'hover:bg-[#EAEAE8] hover:-translate-y-0.5 hover:shadow-sm',
    'active:bg-[#DFDFD9]',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none'
  ),
  outline: cn(
    'bg-transparent border border-[#1A1A1B]/20 text-[#1A1A1B]',
    'hover:border-[#1A1A1B]/50 hover:-translate-y-0.5 hover:shadow-sm',
    'disabled:border-muted disabled:text-muted-foreground disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none'
  ),
  ghost: cn(
    'bg-transparent text-[#1A1A1B]',
    'hover:bg-[#F0EFEB]',
    'active:bg-[#E8E7E3]',
    'disabled:text-muted-foreground disabled:opacity-50'
  ),
  // destructive alias (maps to danger for backward compat)
  destructive: cn(
    'bg-red-500 text-white',
    'hover:bg-red-600 hover:-translate-y-0.5 hover:shadow-md',
    'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none'
  ),
  danger: cn(
    'bg-red-500 text-white',
    'hover:bg-red-600 hover:-translate-y-0.5 hover:shadow-md',
    'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none'
  ),
}

const sizes = {
  sm:   'h-9  px-4  text-[10px] tracking-[0.18em]',
  md:   'h-11 px-6  text-[11px] tracking-[0.2em]',
  lg:   'h-12 px-8  text-[11px] tracking-[0.22em]',
  icon: 'h-10 w-10 text-sm p-0',
}

/**
 * Button — minimalist button with shimmer hover, lift effect, and loading state.
 *
 * Variants: primary | secondary | outline | ghost | danger | destructive
 * Sizes:    sm | md | lg | icon
 *
 * @example
 * <Button variant="primary" size="lg" loading={saving}>Lưu thay đổi</Button>
 * <Button variant="outline" leftIcon={<Plus />}>Thêm mới</Button>
 * <Button variant="destructive" rightIcon={<Trash2 />}>Xóa</Button>
 */
export function Button({
  variant = 'primary',
  size = 'md',
  children,
  disabled = false,
  loading = false,
  shimmer = true,
  leftIcon,
  rightIcon,
  className,
  ...props
}) {
  const isInactive = disabled || loading
  const hasShimmer = shimmer && (variant === 'primary' || variant === 'danger' || variant === 'destructive')

  return (
    <motion.button
      className={cn(
        'group relative inline-flex items-center justify-center',
        'font-medium uppercase',
        'overflow-hidden',
        'transition-all duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        variants[variant] ?? variants.primary,
        sizes[size]  ?? sizes.md,
        className
      )}
      disabled={isInactive}
      whileTap={!isInactive ? { scale: 0.95 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      {...props}
    >
      {/* Shimmer hover overlay */}
      {hasShimmer && (
        <span className="absolute inset-0 translate-x-[-101%] bg-white/10 transition-transform duration-500 ease-out group-hover:translate-x-0" />
      )}

      {/* Content */}
      {loading ? (
        <span className="relative flex items-center justify-center gap-2">
          <LoadingSpinner 
            size="small" 
            variant={variant === 'primary' || variant === 'danger' || variant === 'destructive' ? 'light' : 'dark'} 
          />
          {typeof children === 'string' ? 'Đang xử lý...' : children}
        </span>
      ) : (
        <span className="relative flex items-center justify-center gap-2">
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </span>
      )}
    </motion.button>
  )
}

export default Button
