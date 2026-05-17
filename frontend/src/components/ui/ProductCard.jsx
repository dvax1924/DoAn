import { useState, memo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { getImageUrl } from '../../utils/getImageUrl'

const FALLBACK_IMAGE = 'https://via.placeholder.com/600x800?text=No+Image'

// Premium easing curve for luxury feel
const PREMIUM_EASE = [0.23, 1, 0.32, 1]

// ─── Helpers (unchanged logic) ────────────────────────────────────────────────

function formatVND(price) {
  if (typeof price === 'number') {
    return `${price.toLocaleString('vi-VN')}đ`
  }
  if (typeof price === 'string' && price.trim()) {
    return price
  }
  return 'Liên hệ'
}

function getCategoryLabel(category) {
  if (typeof category === 'string' && category.trim()) {
    return category
  }
  if (category && typeof category === 'object') {
    return category.name || category.label || 'Collection'
  }
  return 'Collection'
}

function getProductImages(product) {
  const images = Array.isArray(product?.images) ? product.images : []

  const normalized = images
    .map((image) => {
      if (typeof image === 'string') {
        return getImageUrl(image) || image
      }
      if (image && typeof image === 'object') {
        return (
          getImageUrl(image.url || image.path || image.src || '') ||
          image.url ||
          image.path ||
          image.src ||
          ''
        )
      }
      return ''
    })
    .filter(Boolean)

  if (normalized.length > 0) return normalized

  if (typeof product?.image === 'string' && product.image) {
    return [getImageUrl(product.image) || product.image]
  }

  return [FALLBACK_IMAGE]
}

function getVariantSize(variant) {
  if (!variant) return ''
  if (typeof variant === 'string' || typeof variant === 'number') {
    return String(variant)
  }
  return variant.size || variant.name || variant.label || variant.value || ''
}

// ─── Component ────────────────────────────────────────────────────────────────

const ProductCard = memo(({
  product,
  showSizes = true,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const {
    id,
    _id,
    slug,
    name,
    price,
    category,
    isFeatured = false,
    variants = [],
    href,
  } = product || {}

  const images = getProductImages(product)
  const primaryImage = images[0] || FALLBACK_IMAGE
  const hoverImage = images[1] || primaryImage
  const encodedSlug = slug ? encodeURIComponent(slug) : ''
  const productHref =
    href || (encodedSlug ? `/products/${encodedSlug}` : _id ? `/products/${_id}` : id ? `/products/${id}` : '/products')
  const sizes = [...new Set(variants.map(getVariantSize).filter(Boolean))]

  return (
    <motion.article
      className={cn(
        'group relative overflow-hidden bg-[#F5F5F3]',
        'transition-shadow duration-500',
        className
      )}
      initial={{
        y: 0,
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      }}
      whileHover={{
        y: -8,
        boxShadow: '0 25px 50px rgba(0,0,0,0.12)',
      }}
      transition={{ duration: 0.4, ease: PREMIUM_EASE }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Link to={productHref} className="block">
        {/* ── Image Container ────────────────────────────────────────── */}
        <div className="relative aspect-[3/4] overflow-hidden bg-[#E8E8E6]">
          {/* Primary Image */}
          <motion.img
            src={primaryImage}
            alt={name || 'Product image'}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
            animate={{
              scale: isHovered ? 1.08 : 1,
              opacity: isHovered ? 0 : 1,
            }}
            transition={{ duration: 0.4, ease: PREMIUM_EASE }}
          />

          {/* Hover Image */}
          <motion.img
            src={hoverImage}
            alt={`${name || 'Product'} - alternate view`}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
            animate={{
              scale: isHovered ? 1.08 : 1.15,
              opacity: isHovered ? 1 : 0,
            }}
            transition={{ duration: 0.4, ease: PREMIUM_EASE }}
          />

          {/* Featured Badge */}
          {isFeatured && (
            <motion.div
              className="absolute left-4 top-4 z-10"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, ease: PREMIUM_EASE }}
            >
              <span className="bg-[#1A1A1B] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-white">
                Featured
              </span>
            </motion.div>
          )}



          {/* Gradient Overlay */}
          <motion.div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.4, ease: PREMIUM_EASE }}
          />
        </div>

        {/* ── Product Info ───────────────────────────────────────────── */}
        <motion.div
          className="space-y-2 px-5 py-5"
          animate={{ y: isHovered ? -2 : 0 }}
          transition={{ duration: 0.4, ease: PREMIUM_EASE }}
        >
          {category && (
            <motion.p
              className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#1A1A1B]/50"
              animate={{
                color: isHovered
                  ? 'rgba(26, 26, 27, 0.7)'
                  : 'rgba(26, 26, 27, 0.5)',
              }}
              transition={{ duration: 0.3 }}
            >
              {getCategoryLabel(category)}
            </motion.p>
          )}

          <h3
            className="line-clamp-2 text-sm font-medium leading-snug tracking-wide text-[#1A1A1B]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {name || 'Untitled product'}
          </h3>

          <motion.p
            className="text-sm font-semibold tracking-wide"
            animate={{ color: isHovered ? '#C9A96E' : '#1A1A1B' }}
            transition={{ duration: 0.3, ease: PREMIUM_EASE }}
          >
            {formatVND(price)}
          </motion.p>

          {showSizes && sizes.length > 0 && (
            <motion.div
              className="flex flex-wrap gap-1.5 pt-1"
              animate={{ opacity: isHovered ? 1 : 0.8 }}
              transition={{ duration: 0.3 }}
            >
              {sizes.slice(0, 5).map((size) => (
                <motion.span
                  key={size}
                  className={cn(
                    'inline-flex h-6 min-w-[28px] items-center justify-center',
                    'border border-[#1A1A1B]/20 px-2',
                    'text-[10px] font-medium uppercase tracking-wider text-[#1A1A1B]/70',
                    'transition-all duration-200',
                    'hover:border-[#1A1A1B] hover:text-[#1A1A1B]'
                  )}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  {size}
                </motion.span>
              ))}
              {sizes.length > 5 && (
                <span className="inline-flex h-6 items-center px-1 text-[10px] text-[#1A1A1B]/50">
                  +{sizes.length - 5}
                </span>
              )}
            </motion.div>
          )}
        </motion.div>
      </Link>
    </motion.article>
  )
})

ProductCard.displayName = 'ProductCard'

export default ProductCard
