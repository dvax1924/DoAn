import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Premium easing curve for GOLDIE
const EASE = [0.23, 1, 0.32, 1];

// Size configurations
const sizes = {
  small: {
    container: "w-4 h-4",
    stroke: 2,
    viewBox: 16,
  },
  medium: {
    container: "w-8 h-8",
    stroke: 2.5,
    viewBox: 24,
  },
  large: {
    container: "w-12 h-12",
    stroke: 3,
    viewBox: 32,
  },
  xl: {
    container: "w-16 h-16",
    stroke: 3,
    viewBox: 40,
  },
};

// Variant styles
const variants = {
  // Dark spinner on light background (default)
  dark: {
    track: "stroke-[#1A1A1B]/10",
    spinner: "stroke-[#1A1A1B]",
    text: "text-[#1A1A1B]",
  },
  // Light spinner on dark background
  light: {
    track: "stroke-[#F5F5F3]/20",
    spinner: "stroke-[#F5F5F3]",
    text: "text-[#F5F5F3]",
  },
  // Gold accent spinner
  gold: {
    track: "stroke-[#C9A96E]/20",
    spinner: "stroke-[#C9A96E]",
    text: "text-[#C9A96E]",
  },
  // Subtle/muted variant
  muted: {
    track: "stroke-[#1A1A1B]/5",
    spinner: "stroke-[#1A1A1B]/40",
    text: "text-[#1A1A1B]/60",
  },
};

// Text size mapping
const textSizes = {
  small: "text-xs",
  medium: "text-sm",
  large: "text-base",
  xl: "text-lg",
};

export default function LoadingSpinner({
  size = "medium",
  variant = "dark",
  text,
  textPosition = "bottom",
  className,
  showPulse = false,
  speed = "normal",
}) {
  const sizeConfig = sizes[size] || sizes.medium;
  const variantConfig = variants[variant] || variants.dark;
  const textSize = textSizes[size] || textSizes.medium;

  // Animation speed
  const duration = speed === "slow" ? 1.2 : speed === "fast" ? 0.6 : 0.9;

  const radius = (sizeConfig.viewBox - sizeConfig.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = sizeConfig.viewBox / 2;

  const isHorizontal = textPosition === "left" || textPosition === "right";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: EASE }}
      className={cn(
        "inline-flex items-center justify-center gap-3",
        isHorizontal ? "flex-row" : "flex-col",
        textPosition === "left" && "flex-row-reverse",
        textPosition === "top" && "flex-col-reverse",
        className
      )}
    >
      {/* Spinner container */}
      <div className="relative">
        {/* Optional pulse ring */}
        {showPulse && (
          <motion.div
            className={cn(
              "absolute inset-0 rounded-full",
              variant === "dark" && "bg-[#1A1A1B]/5",
              variant === "light" && "bg-[#F5F5F3]/10",
              variant === "gold" && "bg-[#C9A96E]/10",
              variant === "muted" && "bg-[#1A1A1B]/5"
            )}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: duration * 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        {/* SVG Spinner */}
        <svg
          className={cn(sizeConfig.container)}
          viewBox={`0 0 ${sizeConfig.viewBox} ${sizeConfig.viewBox}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={sizeConfig.stroke}
            className={variantConfig.track}
            strokeLinecap="round"
          />

          {/* Animated spinner arc */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={sizeConfig.stroke}
            className={variantConfig.spinner}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.75}
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              transformOrigin: "center",
            }}
          />
        </svg>
      </div>

      {/* Optional text */}
      {text && (
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: EASE }}
          className={cn(
            "font-sans tracking-wide",
            textSize,
            variantConfig.text
          )}
        >
          {text}
        </motion.span>
      )}
    </motion.div>
  );
}

// Convenience exports for common use cases
export function ButtonSpinner({ className }) {
  return (
    <LoadingSpinner
      size="small"
      variant="light"
      className={className}
    />
  );
}

export function PageSpinner({ text = "Đang tải..." }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#F5F5F3]">
      <LoadingSpinner
        size="large"
        variant="dark"
        text={text}
        showPulse
      />
    </div>
  );
}

export function ModalSpinner({ text = "Processing..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <LoadingSpinner
        size="large"
        variant="dark"
        text={text}
      />
    </div>
  );
}

export function InlineSpinner({ text, variant = "dark" }) {
  return (
    <LoadingSpinner
      size="small"
      variant={variant}
      text={text}
      textPosition="right"
    />
  );
}
