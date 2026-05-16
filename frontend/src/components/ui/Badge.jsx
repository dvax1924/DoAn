import * as React from 'react'
import { cn } from '@/lib/utils'

// ─── Preset color variants ───────────────────────────────────────────────────
const colorVariants = {
  default: 'bg-secondary text-secondary-foreground border-border',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
}

const sizes = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
}


export function Badge({
  children,
  color = 'default',
  size = 'md',
  icon: Icon = null,
  className,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        'font-medium uppercase tracking-wider',
        'border rounded-full',
        'select-none whitespace-nowrap',
        colorVariants[color],
        sizes[size],
        className
      )}
      {...props}
    >
      {Icon && <Icon className="h-3 w-3 shrink-0" />}
      {children}
    </span>
  )
}

export default Badge
