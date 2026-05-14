import { useEffect, useState, useCallback } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductCard from '@/components/ui/ProductCard'
import { ProductGridSkeleton } from '@/components/ui/ProductCardSkeleton'
import api from '../../api/axiosInstance'
import socket from '../../api/socket'

/** @returns {import('framer-motion').Variants} */
const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1, ease: 'easeOut', delay },
  },
})

/** @returns {import('framer-motion').Variants} */
const fadeIn = (delay = 0) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 1.2, ease: 'easeOut', delay },
  },
})

/** @type {import('framer-motion').Variants} */
const featuredContainerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15,
    },
  },
}

/** @type {import('framer-motion').Variants} */
const featuredItemVariants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
    },
  },
}

const normalizeFeaturedProduct = (product) => ({
  id: product._id || product.id,
  href: product._id ? `/products/${product._id}` : '/products',
  name: product.name || 'Untitled product',
  price: product.price,
  images:
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : [],
  category: product.category?.name || product.category || 'Collection',
  isFeatured: product.isFeatured ?? true,
  variants: Array.isArray(product.variants) ? product.variants : [],
})

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loadingFeatured, setLoadingFeatured] = useState(true)

  const { scrollY } = useScroll()

  const imageY = useTransform(scrollY, [0, 900], ['0%', '15%'])
  const contentY = useTransform(scrollY, [0, 540], ['0%', '-12%'])
  const contentOpacity = useTransform(scrollY, [0, 450], [1, 0])

  const fetchFeaturedProducts = useCallback(async () => {
    try {
      setLoadingFeatured(true)
      const res = await api.get('/products?isFeatured=true&limit=4')
      const data = res.data.products || res.data
      const products = Array.isArray(data) ? data : []
      setFeaturedProducts(products.slice(0, 4).map(normalizeFeaturedProduct))
    } catch (error) {
      console.error('Loi tai san pham noi bat:', error)
      setFeaturedProducts([])
    } finally {
      setLoadingFeatured(false)
    }
  }, [])

  useEffect(() => { fetchFeaturedProducts() }, [fetchFeaturedProducts])

  // ── Socket: re-fetch featured products when any product changes ─────────────────
  useEffect(() => {
    if (!socket.connected) socket.connect()

    socket.on('productCreated', fetchFeaturedProducts)
    socket.on('productUpdated', fetchFeaturedProducts)
    socket.on('productDeleted', fetchFeaturedProducts)

    return () => {
      socket.off('productCreated', fetchFeaturedProducts)
      socket.off('productUpdated', fetchFeaturedProducts)
      socket.off('productDeleted', fetchFeaturedProducts)
    }
  }, [fetchFeaturedProducts])

  return (
    <>
      <section
        className="relative h-screen w-full overflow-hidden"
        aria-label="Hero section"
      >
        <motion.div
          className="absolute inset-0 h-full w-full"
          style={{ y: imageY }}
          initial={{ scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.4, ease: 'easeOut' }}
        >
          <img
            src="/trangchu.jpg"
            alt="GOLDIE luxury fashion editorial"
            className="h-full w-full object-cover object-center"
          />
        </motion.div>

        <div className="absolute inset-0 bg-[#1A1A1B]/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1B]/80 via-[#1A1A1B]/10 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A1B]/30 via-transparent to-transparent" />

        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
          style={{ y: contentY, opacity: contentOpacity }}
        >
          <motion.div
            variants={fadeIn(0.2)}
            initial="hidden"
            animate="visible"
            className="mb-10 flex items-center gap-4"
          >
            <span className="block h-px w-12 bg-white/40" />
            <span className="text-[10px] font-sans uppercase tracking-[0.5em] text-white/55">
              Luxury Fashion
            </span>
            <span className="block h-px w-12 bg-white/40" />
          </motion.div>

          <motion.h1
            variants={fadeUp(0.35)}
            initial="hidden"
            animate="visible"
            className="select-none font-serif text-[clamp(5.5rem,18vw,15rem)] font-bold uppercase leading-none tracking-[0.14em] text-white [text-shadow:0_4px_60px_rgba(0,0,0,0.4)]"
          >
            GOLDIE
          </motion.h1>

          <motion.p
            variants={fadeUp(0.55)}
            initial="hidden"
            animate="visible"
            className="mt-5 mb-14 max-w-md text-balance font-serif text-[clamp(1rem,2vw,1.25rem)] italic tracking-[0.06em] text-white/65"
          >
            Where elegance meets intention
          </motion.p>

          <motion.div
            variants={fadeUp(0.7)}
            initial="hidden"
            animate="visible"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/products"
                className="group relative inline-flex cursor-pointer items-center gap-3 overflow-hidden border border-white/35 bg-white/10 px-10 py-4 font-sans text-[11px] font-medium uppercase tracking-[0.38em] text-white backdrop-blur-sm transition-colors duration-500 hover:bg-white hover:text-[#1A1A1B]"
              >
                <span className="absolute inset-0 -z-10 -translate-x-full bg-white transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0" />
                <span>Khám phá bộ sưu tập</span>
                <ArrowRight
                  size={12}
                  strokeWidth={1.6}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          variants={fadeIn(1.1)}
          initial="hidden"
          animate="visible"
          className="pointer-events-none absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3"
        >
          <div className="relative h-10 w-px overflow-hidden bg-white/20">
            <motion.div
              className="absolute top-0 left-0 w-full bg-white"
              style={{ height: '40%' }}
              animate={{ y: ['0%', '250%'] }}
              transition={{
                duration: 1.4,
                ease: 'easeInOut',
                repeat: Infinity,
                repeatDelay: 0.5,
              }}
            />
          </div>
          <span className="font-sans text-[9px] uppercase tracking-[0.5em] text-white/35">
            Scroll
          </span>
        </motion.div>

        <motion.p
          variants={fadeIn(1)}
          initial="hidden"
          animate="visible"
          className="absolute bottom-10 left-8 hidden font-sans text-[9px] uppercase tracking-[0.4em] text-white/25 md:block"
        >
          New Collection
        </motion.p>

        <motion.p
          variants={fadeIn(1)}
          initial="hidden"
          animate="visible"
          className="absolute right-8 bottom-10 hidden font-sans text-[9px] uppercase tracking-[0.4em] text-white/25 md:block"
        >
          SS - 2026
        </motion.p>
      </section>

      <section className="flex min-h-52 items-center bg-[#F5F5F3] px-5 py-10 sm:min-h-56 sm:px-6 md:min-h-64 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center"
          >
            <p className="mb-5 text-xs uppercase tracking-[0.4em] text-[#1A1A1B]/45">
              Featured
            </p>
            <h2 className="text-3xl font-light tracking-tight text-[#1A1A1B] md:text-4xl">
              New Arrivals
            </h2>
          </motion.div>
        </div>
      </section>

      <section className="bg-[#1A1A1B] px-5 pt-16 pb-12 sm:px-6 sm:pt-20 sm:pb-14 lg:px-8 lg:pt-24 lg:pb-16">
        <div className="mx-auto max-w-7xl">
          {loadingFeatured ? (
            <ProductGridSkeleton
              count={4}
              className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-7"
            />
          ) : (
            <motion.div
              key="featured-products"
              variants={featuredContainerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:gap-7 lg:grid-cols-4"
            >
              {featuredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  variants={featuredItemVariants}
                  className="group"
                >
                  <ProductCard product={product} className="h-full" />
                </motion.div>
              ))}
            </motion.div>
          )}

          {!loadingFeatured && featuredProducts.length === 0 && (
            <div className="mt-10 text-center text-sm tracking-[0.18em] text-white/45">
              Chua co san pham noi bat.
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            viewport={{ once: true }}
            className="mt-20 flex justify-center"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/products"
                className="inline-flex border border-white/20 px-10 py-4 text-xs uppercase tracking-[0.35em] text-white transition-all duration-500 hover:bg-white hover:text-[#1A1A1B]"
              >
                Xem tất cả
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  )
}

export default Home
