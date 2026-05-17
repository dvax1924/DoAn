import { motion } from "framer-motion";
import { Home, ShoppingBag, ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";

// --- Animation constants ---
const EASE = [0.23, 1, 0.32, 1];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE },
  },
};

// Large "404" number animation
const numberVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 40 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE },
  },
};

// Floating animation for decorative elements
const floatVariants = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 4,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};

// Sparkle animation
const sparkleVariants = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.3, 0.6, 0.3],
    rotate: [0, 180, 360],
    transition: {
      duration: 3,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};

// --- Main 404 component ---
export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F5F3] flex flex-col items-center justify-center px-4 py-16 overflow-hidden">
      {/* Subtle texture overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='1' height='1' fill='%231A1A1B'/%3E%3C/svg%3E\")",
          backgroundSize: "4px 4px",
        }}
      />

      {/* Decorative floating sparkles */}
      <motion.div
        variants={sparkleVariants}
        animate="animate"
        className="absolute top-[15%] left-[10%] text-[#C9A96E]/20 hidden md:block"
      >
        <Sparkles size={24} />
      </motion.div>
      <motion.div
        variants={sparkleVariants}
        animate="animate"
        style={{ animationDelay: "1s" }}
        className="absolute top-[25%] right-[15%] text-[#C9A96E]/15 hidden md:block"
      >
        <Sparkles size={18} />
      </motion.div>
      <motion.div
        variants={sparkleVariants}
        animate="animate"
        style={{ animationDelay: "2s" }}
        className="absolute bottom-[20%] left-[20%] text-[#C9A96E]/20 hidden md:block"
      >
        <Sparkles size={20} />
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-lg text-center"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="inline-flex flex-col items-center gap-3">
            {/* Decorative rule */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-px bg-[#C9A96E]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#C9A96E]" />
              <div className="w-8 h-px bg-[#C9A96E]" />
            </div>
            <h1 className="font-serif text-[32px] md:text-[38px] font-light tracking-[0.3em] text-[#1A1A1B] leading-none select-none">
              GOLDIE
            </h1>
          </div>
        </motion.div>

        {/* Large 404 number with floating animation */}
        <motion.div
          variants={numberVariants}
          className="relative mb-6"
        >
          <motion.div
            variants={floatVariants}
            animate="animate"
            className="relative inline-block"
          >
            {/* Background glow effect */}
            <div 
              className="absolute inset-0 blur-3xl opacity-20 bg-[#C9A96E]"
              style={{ transform: "scale(0.8)" }}
            />
            
            <span className="relative font-serif text-[120px] md:text-[180px] lg:text-[200px] font-light text-[#1A1A1B]/10 leading-none select-none tracking-tight">
              404
            </span>
            
            {/* Overlay text with gradient */}
            <span 
              className="absolute inset-0 font-serif text-[120px] md:text-[180px] lg:text-[200px] font-light leading-none select-none tracking-tight bg-gradient-to-b from-[#1A1A1B] via-[#1A1A1B]/80 to-[#1A1A1B]/40 bg-clip-text text-transparent"
              aria-hidden="true"
            >
              404
            </span>
          </motion.div>
        </motion.div>

        {/* Card container */}
        <motion.div
          variants={itemVariants}
          className="bg-white/60 backdrop-blur-sm border border-[#1A1A1B]/8 rounded-sm px-6 md:px-10 py-8 md:py-10 shadow-[0_8px_48px_rgba(26,26,27,0.06)] mx-4 md:mx-0"
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Main message */}
            <motion.h2
              variants={itemVariants}
              className="font-sans text-xl md:text-2xl font-light text-[#1A1A1B] tracking-wide mb-3"
            >
              Trang bạn đang tìm không tồn tại
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="text-sm md:text-base text-[#1A1A1B]/50 font-sans leading-relaxed mb-8 max-w-sm mx-auto"
            >
              Có vẻ như trang này đã bị lạc lối trong không gian của chúng tôi.
            </motion.p>

            {/* Decorative divider */}
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-center gap-4 mb-8"
            >
              <div className="w-12 h-px bg-[#1A1A1B]/10" />
              <div className="w-1 h-1 rounded-full bg-[#C9A96E]" />
              <div className="w-12 h-px bg-[#1A1A1B]/10" />
            </motion.div>

            {/* Action buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
            >
              <Button
                variant="primary"
                leftIcon={<Home size={14} strokeWidth={2} />}
                onClick={() => navigate("/")}
                className="w-full sm:w-auto whitespace-nowrap shadow-[0_4px_16px_rgba(26,26,27,0.15)]"
              >
                Quay về Trang Chủ
              </Button>
              
              <Button
                variant="outline"
                leftIcon={<ShoppingBag size={14} strokeWidth={2} />}
                onClick={() => navigate("/products")}
                className="w-full sm:w-auto whitespace-nowrap bg-white/80 border-[#1A1A1B]/12 hover:border-[#1A1A1B]/25 hover:text-[#1A1A1B] hover:bg-white"
              >
                Khám phá Bộ sưu tập
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Back link */}
        <motion.div
          variants={itemVariants}
          className="mt-8"
        >
          <motion.button
            type="button"
            onClick={() => navigate(-1)}
            whileHover={{ x: -4 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="inline-flex items-center gap-2 text-xs text-[#1A1A1B]/40 hover:text-[#1A1A1B]/70 font-sans tracking-wide transition-colors duration-200 cursor-pointer outline-none focus-visible:underline"
          >
            <ArrowLeft size={12} strokeWidth={2} />
            <span>Quay lại trang trước</span>
          </motion.button>
        </motion.div>

        {/* Footer brand note */}
        <motion.p
          variants={itemVariants}
          className="text-[10px] uppercase tracking-[0.25em] text-[#1A1A1B]/20 font-sans mt-10"
        >
          &copy; {new Date().getFullYear()} Goldie. All rights reserved.
        </motion.p>
      </motion.div>
    </div>
  );
}

export { NotFound as Page404 };
