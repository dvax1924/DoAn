import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function Card({
  children,
  hoverable = true,
  className,
  ...props
}) {
  return (
    <motion.div
      className={cn(
        "relative overflow-hidden",
        "bg-card text-card-foreground",
        "rounded-lg",
        "border border-border",
        "shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={
        hoverable
          ? {
              y: -4,
              boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
            }
          : undefined
      }
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div className={cn("px-4 pt-4 sm:px-6 sm:pt-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  as = 'h3',
  className,
  ...props
}) {
  return React.createElement(
    as,
    {
      className: cn(
        'text-lg font-medium tracking-tight text-foreground',
        className
      ),
      ...props,
    },
    children
  )
}

export function CardDescription({
  children,
  className,
  ...props
}) {
  return (
    <p
      className={cn(
        "mt-1.5 text-sm text-muted-foreground leading-relaxed",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={cn("px-4 py-3 sm:px-6 sm:py-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "flex items-center px-4 pb-4 pt-2 sm:px-6 sm:pb-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardImage({
  aspectRatio = "video",
  className,
  alt = "",
  ...props
}) {
  const aspectRatios = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
  };

  return (
    <div className={cn("relative overflow-hidden", aspectRatios[aspectRatio])}>
      <motion.img
        className={cn(
          "h-full w-full object-cover",
          "transition-transform duration-500",
          className
        )}
        alt={alt}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        {...props}
      />
    </div>
  );
}

export default Card
