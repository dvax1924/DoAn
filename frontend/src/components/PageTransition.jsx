"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useLocation } from "react-router-dom"

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -10,
  },
}

const pageTransition = {
  duration: 0.3,
  ease: [0.23, 1, 0.32, 1],
}

export default function PageTransition({ children }) {
  const location = useLocation()

  if (location.pathname.startsWith('/admin')) {
    return <>{children}</>
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={pageTransition}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
