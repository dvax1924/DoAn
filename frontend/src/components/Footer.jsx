import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { createLucideIcon, MapPin, Phone, Mail } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const Instagram = createLucideIcon('Instagram', [
  ['rect', { x: '3', y: '3', width: '18', height: '18', rx: '5', key: '1' }],
  ['circle', { cx: '12', cy: '12', r: '4', key: '2' }],
  ['circle', { cx: '17.5', cy: '6.5', r: '1', fill: 'currentColor', key: '3' }],
])

const Facebook = createLucideIcon('Facebook', [
  [
    'path',
    {
      d: 'M14 8h3V4h-3c-3.314 0-6 2.686-6 6v3H5v4h3v5h4v-5h4l1-4h-5v-3c0-1.105.895-2 2-2z',
      key: '1',
    },
  ],
])

const quickLinks = [
  { name: 'Shop', to: '/products' },
  { name: 'Cart', to: '/cart' },
]

const socialLinks = [
  {
    name: 'Instagram',
    icon: Instagram,
    href: 'https://www.instagram.com/theonlygoldieofficial/',
  },
  {
    name: 'Facebook',
    icon: Facebook,
    href: 'https://facebook.com/goldievietnam',
  },
]

/** @type {import('framer-motion').Variants} */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
}

/** @type {import('framer-motion').Variants} */
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
}

/** @type {import('framer-motion').Variants} */
const linkHoverVariants = {
  hover: {
    x: 4,
    transition: { duration: 0.3 },
  },
}

/** @type {import('framer-motion').Variants} */
const socialHoverVariants = {
  hover: {
    scale: 1.12,
    y: -2,
    transition: { duration: 0.25 },
  },
}

const Footer = () => {
  const [hoveredIcon, setHoveredIcon] = useState(null)

  return (
    <footer className="mt-auto bg-[#1A1A1B] text-white">
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <motion.div
            className="grid grid-cols-1 gap-12 md:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={containerVariants}
          >
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-4 text-center md:text-left items-center md:items-start"
            >
              <p className="text-3xl font-bold tracking-[0.3em] text-white md:text-4xl">
                GOLDIE
              </p>
              <p className="mx-auto max-w-md text-base leading-relaxed text-white/45 text-center md:mx-0 md:max-w-sm md:text-sm md:text-left">
                  GOLDIE crafts a raw aesthetic with technical fabrics, experimental knitting, and chemical dyes — redefining urban streetwear through deconstructed cuts, hand distressing, and bold asymmetry.
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-4 text-center items-center md:text-left md:items-start"
            >
              <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-white/90">
                Quick Links
              </h3>
              <nav className="flex flex-col gap-3 items-center md:items-start">
                {quickLinks.map((link) => (
                  <motion.div
                    key={link.name}
                    whileHover="hover"
                    variants={linkHoverVariants}
                    className="w-fit"
                  >
                    <Link
                      to={link.to}
                      className={cn(
                        'text-sm tracking-[0.12em] uppercase text-white/45 transition-colors duration-300',
                        'hover:text-white'
                      )}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
              </nav>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex flex-col items-center md:items-end"
            >
              <div className="flex flex-col gap-4 items-center md:items-start text-center md:text-left">
                <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-white/90">
                  Follow Us
                </h3>
                <div className="flex justify-center gap-4 md:justify-start">
                  {socialLinks.map((social, index) => {
                    const Icon = social.icon
                    const isActive = hoveredIcon === index

                    return (
                      <motion.a
                        key={social.name}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.name}
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-300',
                          isActive
                            ? 'text-white'
                            : 'text-white/45 hover:text-white'
                        )}
                        whileHover="hover"
                        variants={socialHoverVariants}
                        onHoverStart={() => setHoveredIcon(index)}
                        onHoverEnd={() => setHoveredIcon(null)}
                      >
                        <Icon size={30} strokeWidth={1.5} />
                      </motion.a>
                    )
                  })}
                </div>
                <div className="flex flex-col gap-3 mt-2">
                  <div className="flex items-center justify-center md:justify-start gap-3 text-sm text-white/60">
                    <MapPin size={16} strokeWidth={1.5} className="shrink-0 text-white/60" />
                    <span>360 Phố Huế, Hà Nội</span>
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-3 text-sm text-white/60">
                    <Phone size={16} strokeWidth={1.5} className="shrink-0 text-white/60" />
                    <span>0985 032 589</span>
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-3 text-sm text-white/60">
                    <Mail size={16} strokeWidth={1.5} className="shrink-0 text-white/60" />
                    <span>info@goldievietnam.com</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          className="mx-auto max-w-7xl px-6 lg:px-8"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true }}
        >
          <div className="h-px origin-center bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </motion.div>

        <motion.div
          className="mx-auto max-w-7xl px-6 py-8 lg:px-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-center">
            <p className="text-center text-xs tracking-[0.14em] text-white/35">
              &copy; 2026 Goldie Vietnam. All rights reserved.
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer
