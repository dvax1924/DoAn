import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Minus,
  Plus,
  ShoppingBag,
  Zap,
  Check,
  ChevronLeft,
  ChevronRight,
  Truck,
  RotateCcw,
  Shield,
} from 'lucide-react'
import { toast } from '@/components/ui/Toast'
import api from '../../api/axiosInstance'
import socket from '../../api/socket'
import { useCart } from '../../hooks/useCart'
import { sortVariantsBySize } from '../../utils/sortVariantsBySize'
import { getImageUrl } from '../../utils/getImageUrl'
import { cn } from '@/lib/utils'

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price)
}

function normalizeSlug(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

const ProductDetail = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart, cart } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [mainImage, setMainImage] = useState('')
  const [selectedStock, setSelectedStock] = useState(0)

  const [addedToCart, setAddedToCart] = useState(false)

  const sortedVariants = useMemo(
    () => sortVariantsBySize(product?.variants || []),
    [product]
  )

  const images = product?.images?.length ? product.images : []

  const mainImageUrl = getImageUrl(mainImage)
  const selectedImageIndex =
    images.length && mainImage
      ? Math.max(0, images.indexOf(mainImage))
      : 0

  const getCartQuantityForSelectedSize = () =>
    cart.find(
      (item) => item.product === product?._id && item.variant?.size === selectedSize
    )?.qty || 0

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)

      try {
        const safeSlug = encodeURIComponent(slug || '')
        let data

        try {
          const res = await api.get(`/products/slug/${safeSlug}`)
          data = res.data.product || res.data
        } catch (error) {
          const isSlugEndpointMissing = error.response?.status === 404

          if (!isSlugEndpointMissing) {
            throw error
          }

          const fallbackRes = await api.get('/products?limit=500')
          const fallbackProducts = fallbackRes.data.products || fallbackRes.data || []
          const targetSlug = String(slug || '')
          const normalizedTargetSlug = normalizeSlug(targetSlug)

          data = fallbackProducts.find((item) => {
            const itemSlug = String(item?.slug || '')
            return (
              itemSlug === targetSlug ||
              normalizeSlug(itemSlug) === normalizedTargetSlug
            )
          })

          if (!data) {
            throw error
          }
        }

        const sorted = sortVariantsBySize(data.variants || [])

        setProduct(data)
        setMainImage(data.images?.[0] || '')

        if (sorted.length > 0) {
          const firstInStock = sorted.find((v) => (v.stock || 0) > 0)
          const initial = firstInStock || sorted[0]
          setSelectedSize(initial.size)
          setSelectedStock(initial.stock || 0)
        }
      } catch (error) {
        toast.error('Không tìm thấy sẩn phẩm')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [slug])

  const onProductUpdated = useCallback(
    (data) => {
      const matchesCurrentProduct =
        data.product &&
        (data.product.slug === slug || data.product._id === product?._id)

      if (matchesCurrentProduct) {
        const updated = data.product
        const sorted = sortVariantsBySize(updated.variants || [])

        setProduct(updated)
        setMainImage((prev) => {
          if (updated.images?.length) {
            return updated.images.includes(prev) ? prev : updated.images[0]
          }
          return ''
        })

        if (sorted.length > 0) {
          setSelectedSize((prevSize) => {
            const currentVariant = sorted.find((variant) => variant.size === prevSize)

            if (currentVariant) {
              setSelectedStock(currentVariant.stock || 0)
              return prevSize
            }

            const firstInStock = sorted.find((v) => (v.stock || 0) > 0)
            const fallback = firstInStock || sorted[0]
            setSelectedStock(fallback.stock || 0)
            return fallback.size
          })
        }

        toast.info('Sản phẩm vừa được cập nhật')
      }
    },
    [slug, product?._id]
  )

  const onProductDeleted = useCallback(
    (data) => {
      if (data.productId === product?._id) {
        toast.warning('Sản phẩm này đã bị xóa')
        navigate('/products')
      }
    },
    [product?._id, navigate]
  )

  useEffect(() => {
    if (!socket.connected) {
      socket.connect()
    }

    socket.on('productUpdated', onProductUpdated)
    socket.on('productDeleted', onProductDeleted)

    return () => {
      socket.off('productUpdated', onProductUpdated)
      socket.off('productDeleted', onProductDeleted)
    }
  }, [onProductUpdated, onProductDeleted])

  useEffect(() => {
    if (product && selectedSize) {
      const variant = product.variants.find((item) => item.size === selectedSize)
      setSelectedStock(variant ? variant.stock : 0)
      setQuantity(1)
    }
  }, [selectedSize, product])

  const handlePrevImage = () => {
    if (!images.length) return
    const idx = images.indexOf(mainImage) >= 0 ? images.indexOf(mainImage) : 0
    const prev = idx === 0 ? images.length - 1 : idx - 1
    setMainImage(images[prev])
  }

  const handleNextImage = () => {
    if (!images.length) return
    const idx = images.indexOf(mainImage) >= 0 ? images.indexOf(mainImage) : 0
    const next = idx === images.length - 1 ? 0 : idx + 1
    setMainImage(images[next])
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.warning('Vui lòng chọn size')
      return
    }

    const variant = product.variants.find((item) => item.size === selectedSize)
    if (!variant) {
      toast.error('Không tìm thấy lựa chọn nào')
      return
    }

    if (!variant.stock) {
      toast.warning('Size này đã hết hàng')
      return
    }

    const existingQty = getCartQuantityForSelectedSize()
    if (existingQty + quantity > variant.stock) {
      toast.error(
        `Giỏ hàng chỉ có thể chứa tối đa ${variant.stock} chiếc cho size này`
      )
      return
    }

    addToCart(product, variant, quantity)
    toast.success('Đã thêm vào giỏ hàng')
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const handleBuyNow = () => {
    if (!selectedSize) {
      toast.warning('Vui lòng chọn size')
      return
    }

    const variant = product.variants.find((item) => item.size === selectedSize)
    if (!variant) {
      toast.error('Không tìm thấy lựa chọn nào')
      return
    }

    if (!variant.stock) {
      toast.warning('Size này đã hết hàng')
      return
    }

    if (quantity > variant.stock) {
      toast.error(`Chỉ còn ${variant.stock} sản phẩm`)
      return
    }

    // Lưu item "Mua ngay" vào sessionStorage, không thêm vào giỏ hàng
    const buyNowItem = {
      product: product._id,
      productData: product,
      image: product.images?.[0] || '',   // ảnh đầu tiên để hiển thị
      variant,
      qty: quantity,
      price: product.price,
      name: product.name,
    }
    sessionStorage.setItem('buyNowItem', JSON.stringify(buyNowItem))
    navigate('/checkout?mode=buynow')
  }

  const increaseQuantity = () => {
    if (quantity < selectedStock) {
      setQuantity((prev) => prev + 1)
      return
    }

    toast.warning(`Chi con ${selectedStock} san pham`)
  }

  const decreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1))
  }

  const selectedVariant = sortedVariants.find((v) => v.size === selectedSize)
  const isOutOfStock = selectedVariant?.stock === 0
  const lowStock =
    selectedVariant?.stock > 0 && selectedVariant?.stock <= 3

  const categoryLabel =
    typeof product?.category === 'object' && product?.category?.name
      ? product.category.name
      : typeof product?.category === 'string'
        ? product.category
        : 'Sản phẩm'

  const detailItems = Array.isArray(product?.details)
    ? product.details
    : []

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <p className="text-accent/60 text-sm tracking-wide">Đang tải...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <p className="text-accent/60 text-sm tracking-wide">
          Không tìm thấy sản phẩm
        </p>
      </div>
    )
  }

  const displaySrc =
    mainImageUrl ||
    'https://via.placeholder.com/600x600/eeeeee/666666?text=No+Image'

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-16">
        <motion.nav
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ol className="flex flex-wrap items-center gap-2 text-sm text-accent/50">
            <li>
              <Link
                to="/"
                className="transition-colors hover:text-accent"
              >
                Trang chủ
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link
                to="/products"
                className="transition-colors hover:text-accent"
              >
                Sản phẩm
              </Link>
            </li>
            <li>/</li>
            <li className="text-accent">{categoryLabel}</li>
          </ol>
        </motion.nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="group relative aspect-[4/5] overflow-hidden bg-muted">
              <AnimatePresence mode="wait">
                <motion.img
                  key={displaySrc}
                  src={displaySrc}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                />
              </AnimatePresence>

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-white/90 text-accent opacity-0 transition-all duration-300 hover:bg-white group-hover:opacity-100"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-white/90 text-accent opacity-0 transition-all duration-300 hover:bg-white group-hover:opacity-100"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {images.length > 0 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-accent/80 px-3 py-1 text-xs tracking-wider text-background">
                  {selectedImageIndex + 1} / {images.length}
                </div>
              )}
            </div>

            {images.length > 0 && (
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1">
                {images.map((img, index) => {
                  const thumbUrl = getImageUrl(img)
                  return (
                    <motion.button
                      key={`${img}-${index}`}
                      type="button"
                      onClick={() => setMainImage(img)}
                      className={cn(
                        'relative aspect-square w-16 sm:w-20 shrink-0 overflow-hidden rounded-md bg-muted transition-all duration-300',
                        mainImage === img
                          ? 'opacity-100 shadow-md'
                          : 'opacity-60 hover:opacity-100'
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <img
                        src={thumbUrl}
                        alt={`${product.name} - ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </motion.button>
                  )
                })}
              </div>
            )}
          </motion.div>

          <motion.div
            className="flex flex-col"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="mb-2 text-xs uppercase tracking-[0.3em] text-accent/50">
              {categoryLabel}
            </span>

            <h1 className="mb-4 text-3xl font-light tracking-tight text-accent lg:text-4xl">
              {product.name}
            </h1>

            <div className="mb-6">
              <span className="text-2xl font-light text-accent">
                {formatPrice(product.price)}
              </span>
            </div>

            <div className="mb-6">
              <span className="text-sm font-medium uppercase tracking-wider text-accent">
                Kích thước
              </span>
              <div className="mt-3 flex flex-wrap gap-2">
                {sortedVariants.map((variant) => {
                  const isSelected = selectedSize === variant.size
                  const outOfStock = variant.stock === 0

                  return (
                    <motion.button
                      key={variant.size}
                      type="button"
                      onClick={() => setSelectedSize(variant.size)}
                      className={cn(
                        'relative flex h-12 min-w-[48px] items-center justify-center border px-4 text-sm font-medium transition-all duration-300',
                        isSelected &&
                          !outOfStock &&
                          'border-accent bg-accent text-background',
                        isSelected &&
                          outOfStock &&
                          'border-red-400/60 bg-red-50 text-red-700',
                        !isSelected &&
                          outOfStock &&
                          'border-accent/15 text-accent/45 hover:border-accent/25 hover:text-accent/70',
                        !isSelected &&
                          !outOfStock &&
                          'border-accent/20 text-accent hover:border-accent'
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {variant.size}
                    </motion.button>
                  )
                })}
              </div>

              <AnimatePresence mode="wait">
                {selectedSize && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3"
                  >
                    {isOutOfStock ? (
                      <span className="text-xs text-red-500">Hết hàng</span>
                    ) : lowStock ? (
                      <span className="text-xs text-amber-600">
                        Chỉ còn {selectedVariant.stock} sản phẩm
                      </span>
                    ) : (
                      <span className="text-xs text-green-600">Còn hàng</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mb-8">
              <span className="mb-3 block text-sm font-medium uppercase tracking-wider text-accent">
                Số lượng
              </span>
              <div className="flex items-center gap-1">
                <motion.button
                  type="button"
                  onClick={decreaseQuantity}
                  className="flex h-12 w-12 items-center justify-center border border-accent/20 text-accent transition-colors hover:border-accent hover:bg-accent hover:text-background"
                  whileTap={{ scale: 0.95 }}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </motion.button>
                <div className="flex h-12 w-16 items-center justify-center border-y border-accent/20 text-sm font-medium text-accent">
                  {quantity}
                </div>
                <motion.button
                  type="button"
                  onClick={increaseQuantity}
                  disabled={quantity >= selectedStock}
                  className={cn(
                    'flex h-12 w-12 items-center justify-center border border-accent/20 text-accent transition-colors hover:border-accent hover:bg-accent hover:text-background',
                    quantity >= selectedStock && 'pointer-events-none opacity-40'
                  )}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="h-4 w-4" />
                </motion.button>
              </div>
            </div>

            <div className="mb-8 flex flex-col gap-3 sm:flex-row">
              <motion.button
                type="button"
                onClick={handleAddToCart}
                disabled={!selectedSize || isOutOfStock}
                className={cn(
                  'relative flex h-14 w-full sm:w-auto sm:flex-1 items-center justify-center gap-2 overflow-hidden border-2 border-accent text-sm font-medium uppercase tracking-wider transition-all duration-300',
                  !selectedSize || isOutOfStock
                    ? 'cursor-not-allowed opacity-50'
                    : addedToCart
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-transparent text-accent hover:bg-accent hover:text-background'
                )}
                whileHover={
                  selectedSize && !isOutOfStock ? { scale: 1.01 } : {}
                }
                whileTap={selectedSize && !isOutOfStock ? { scale: 0.99 } : {}}
              >
                <AnimatePresence mode="wait">
                  {addedToCart ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      <span>Đã thêm vào giỏ</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="default"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>Thêm vào giỏ hàng</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              <motion.button
                type="button"
                onClick={handleBuyNow}
                disabled={!selectedSize || isOutOfStock}
                className={cn(
                  'relative flex h-14 w-full sm:w-auto sm:flex-1 items-center justify-center gap-2 overflow-hidden text-sm font-medium uppercase tracking-wider transition-all duration-300',
                  !selectedSize || isOutOfStock
                    ? 'cursor-not-allowed bg-accent/50 text-background'
                    : 'bg-accent text-background hover:bg-[#2a2a2b]'
                )}
                whileHover={
                  selectedSize && !isOutOfStock ? { scale: 1.01 } : {}
                }
                whileTap={selectedSize && !isOutOfStock ? { scale: 0.99 } : {}}
              >
                <motion.div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span>Mua ngay</span>
                </motion.div>
              </motion.button>
            </div>

            <p className="mb-8 text-sm leading-relaxed text-accent/70 whitespace-pre-wrap">
              {product.description || '—'}
            </p>

            <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 border-y border-accent/10 py-6">
              <div className="flex sm:flex-col items-center gap-3 sm:gap-2 text-left sm:text-center">
                <Truck className="h-5 w-5 text-accent/70" />
                <span className="text-xs text-accent/70">
                  Miễn phí vận chuyển
                </span>
              </div>
              <div className="flex sm:flex-col items-center gap-3 sm:gap-2 text-left sm:text-center">
                <RotateCcw className="h-5 w-5 shrink-0 text-accent/70" />
                <span className="text-xs text-accent/70">Đổi trả 30 ngày</span>
              </div>
              <div className="flex sm:flex-col items-center gap-3 sm:gap-2 text-left sm:text-center">
                <Shield className="h-5 w-5 shrink-0 text-accent/70" />
                <span className="text-xs text-accent/70">
                  Bảo hành chính hãng
                </span>
              </div>
            </div>

            {detailItems.length > 0 && (
              <div>
                <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-accent">
                  Chi tiết sản phẩm
                </h3>
                <ul className="space-y-2">
                  {detailItems.map((detail, index) => (
                    <motion.li
                      key={index}
                      className="flex items-center gap-3 text-sm text-accent/70"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <span className="h-1 w-1 shrink-0 rounded-full bg-accent/40" />
                      {detail}
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
