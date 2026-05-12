import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-14 px-5 text-base",
};

export function Label({
  children,
  required,
  className = undefined,
  ...props
}) {
  return (
    <label
      className={cn(
        "block text-xs font-medium uppercase tracking-[0.15em] text-foreground mb-2",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-1 text-muted-foreground">*</span>
      )}
    </label>
  );
}

export function Input({
  label,
  error,
  hint,
  size = "md",
  className,
  id,
  required,
  onFocus,
  onBlur,
  ...props
}) {
  const autoId = React.useId()
  const inputId = id ?? autoId
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div className="w-full">
      {label && (
        <Label htmlFor={inputId} required={required}>
          {label}
        </Label>
      )}
      <div className="relative">
        <motion.input
          id={inputId}
          className={cn(
            "w-full",
            "bg-card text-foreground",
            "border border-border rounded-lg",
            "placeholder:text-muted-foreground placeholder:text-sm",
            "transition-all duration-200",
            "focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
            error && "border-destructive focus:border-destructive focus:ring-destructive",
            sizes[size],
            className
          )}
          required={required}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          animate={{
            scale: isFocused ? 1.005 : 1,
          }}
          transition={{ duration: 0.15 }}
          {...props}
        />
        <motion.div
          className="absolute bottom-0 left-1/2 h-[2px] bg-foreground rounded-full"
          initial={{ width: 0, x: "-50%" }}
          animate={{
            width: isFocused ? "calc(100% - 2px)" : 0,
            x: "-50%",
          }}
          transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </div>
      {(error || hint) && (
        <motion.p
          className={cn(
            "mt-2 text-xs",
            error ? "text-destructive" : "text-muted-foreground"
          )}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error || hint}
        </motion.p>
      )}
    </div>
  );
}

export function Textarea({
  label,
  error,
  hint,
  className,
  id,
  required,
  onFocus,
  onBlur,
  ...props
}) {
  const autoId = React.useId()
  const inputId = id ?? autoId
  const [isFocused, setIsFocused] = React.useState(false)

  return (
    <div className="w-full">
      {label && (
        <Label htmlFor={inputId} required={required}>
          {label}
        </Label>
      )}
      <div className="relative">
        <motion.textarea
          id={inputId}
          className={cn(
            "w-full min-h-[120px] px-4 py-3",
            "bg-card text-foreground",
            "border border-border rounded-lg",
            "placeholder:text-muted-foreground placeholder:text-sm",
            "transition-all duration-200",
            "focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
            "resize-y",
            error && "border-destructive focus:border-destructive focus:ring-destructive",
            className
          )}
          required={required}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          animate={{
            scale: isFocused ? 1.002 : 1,
          }}
          transition={{ duration: 0.15 }}
          {...props}
        />
      </div>
      {(error || hint) && (
        <motion.p
          className={cn(
            "mt-2 text-xs",
            error ? "text-destructive" : "text-muted-foreground"
          )}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error || hint}
        </motion.p>
      )}
    </div>
  );
}

export default Input
