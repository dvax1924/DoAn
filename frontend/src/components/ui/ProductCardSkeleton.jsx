import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

// ─── Base shimmer bone ─────────────────────────────────────────────────────

function Bone({ className, delay = 0 }) {
  return (
    <div className={cn("relative overflow-hidden bg-[#1A1A1B]/[0.06]", className)}>
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#1A1A1B]/[0.06] to-transparent"
        animate={{ translateX: ["-100%", "200%"] }}
        transition={{
          duration: 1.6,
          delay,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  )
}

// ─── ProductCardSkeleton ───────────────────────────────────────────────────

export function ProductCardSkeleton({ className }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={cn("bg-white group", className)}
    >
      {/* Image area — 3:4 aspect ratio */}
      <div className="aspect-[3/4] w-full relative overflow-hidden bg-[#1A1A1B]/[0.04]">
        <Bone className="absolute inset-0 bg-transparent" />
        <div className="absolute top-4 right-4">
          <Bone className="h-5 w-12" />
        </div>
      </div>

      {/* Meta */}
      <div className="p-5 space-y-3">
        {/* Category label */}
        <Bone className="h-2.5 w-16" delay={0.05} />
        {/* Product name */}
        <Bone className="h-4 w-3/4" delay={0.1} />
        {/* Short subtitle line */}
        <Bone className="h-3 w-1/2" delay={0.12} />

        <div className="pt-1 flex items-center justify-between">
          {/* Price */}
          <Bone className="h-4 w-20" delay={0.15} />
          {/* Stock badge */}
          <Bone className="h-6 w-16 rounded-sm" delay={0.18} />
        </div>
      </div>
    </motion.div>
  )
}

// ─── ProductGridSkeleton ───────────────────────────────────────────────────

export function ProductGridSkeleton({ count = 6, className }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}
