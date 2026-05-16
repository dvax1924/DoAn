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

/**
 * @typedef {Object} InputCustomProps
 * @property {string} [label]
 * @property {string} [error]
 * @property {string} [hint]
 * @property {'sm'|'md'|'lg'} [size]
 */

/**
 * @param {Omit<import('react').InputHTMLAttributes<HTMLInputElement>, 'size'> & import('framer-motion').MotionProps & InputCustomProps} props
 */
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
            "focus:outline-none focus:border-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
            error && "border-destructive focus:border-destructive",
            sizes[size],
            className
          )}
          required={required}
          onFocus={(e) => onFocus?.(e)}
          onBlur={(e) => onBlur?.(e)}
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
            "focus:outline-none focus:border-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
            "resize-y",
            error && "border-destructive focus:border-destructive",
            className
          )}
          required={required}
          onFocus={(e) => onFocus?.(e)}
          onBlur={(e) => onBlur?.(e)}
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

/**
 * PasswordInput — wraps shared Input with a right-side element slot.
 *
 * Use this for password fields that need an eye-toggle button.
 *
 * @example
 * <PasswordInput
 *   label="Mật khẩu mới"
 *   type={show ? 'text' : 'password'}
 *   value={value}
 *   onChange={onChange}
 *   rightElement={<EyeToggleButton />}
 *   error={errors.password}
 * />
 *
 * @param {Omit<import('react').InputHTMLAttributes<HTMLInputElement>, 'size'> & import('framer-motion').MotionProps & InputCustomProps & { rightElement?: import('react').ReactNode }} props
 */
export function PasswordInput({ rightElement, className, ...props }) {
  return (
    <div className="relative w-full">
      <Input {...props} className={cn(rightElement && 'pr-12', className)} />
      {rightElement && (
        <span className="absolute right-4 top-[38px]">
          {rightElement}
        </span>
      )}
    </div>
  )
}

export default Input

