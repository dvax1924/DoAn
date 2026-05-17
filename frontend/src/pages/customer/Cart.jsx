import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Package,
  Shield,
  Truck,
  AlertTriangle,
} from 'lucide-react'
import { toast } from '@/components/ui/Toast'
import { useCart } from '../../hooks/useCart'
import { useAuth } from '../../hooks/useAuth'
import { getImageUrl } from '../../utils/getImageUrl'
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { cn } from '@/lib/utils'
import socket from '../../api/socket'



function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price)
}

function CartItem({ item, onUpdateQuantity, onRemove }) {
  const [isRemoving, setIsRemoving] = useState(false)
  const maxStock = Number(item.variant?.stock) || 0
  const atMaxQty = maxStock > 0 && item.qty >= maxStock

  const handleRemoveClick = () => {
    setIsRemoving(true)
    setTimeout(() => {
      onRemove(item.product, item.variant?.size)
    }, 200)
  }

  const imageUrl =
    getImageUrl(item.image) ||
    'https://via.placeholder.com/200x280/eeeeee/666666?text=No+Image'
  const productLink = item.slug
    ? `/products/${encodeURIComponent(item.slug)}`
    : '/products'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: isRemoving ? 0 : 1,
        y: 0,
        scale: isRemoving ? 0.95 : 1,
      }}
      exit={{ opacity: 0, x: -100, transition: { duration: 0.3 } }}
      className="flex gap-3 sm:gap-6 border-b border-accent/10 py-6 sm:py-8"
    >
      <motion.div
        className="relative h-28 w-20 sm:h-36 sm:w-28 shrink-0 overflow-hidden bg-muted"
        whileHover={{ scale: 1.02 }}
      >
        <img
          src={imageUrl}
          alt={item.name}
          className="h-full w-full object-cover"
        />
      </motion.div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <Link to={productLink}>
            <h3 className="line-clamp-2 text-sm sm:text-base font-medium text-accent transition-all hover:underline md:text-lg underline-offset-4">
              {item.name}
            </h3>
          </Link>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-accent/60">
            <span>Kích thước: {item.variant?.size}</span>
            <span>Số lượng trong giỏ: {item.qty}</span>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-4">
          <div className="flex items-center gap-1 border border-accent/20">
            <motion.button
              type="button"
              whileHover={{ backgroundColor: '#1A1A1B', color: '#F5F5F3' }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                onUpdateQuantity(item.product, item.variant?.size, item.qty - 1)
              }
              className={cn(
                'flex h-9 w-9 items-center justify-center text-accent transition-colors',
                item.qty <= 1 && 'cursor-not-allowed opacity-30'
              )}
              disabled={item.qty <= 1}
            >
              <Minus className="size-3.5" />
            </motion.button>
            <span className="w-10 text-center text-sm font-medium text-accent">
              {item.qty}
            </span>
            <motion.button
              type="button"
              whileHover={{ backgroundColor: '#1A1A1B', color: '#F5F5F3' }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                onUpdateQuantity(item.product, item.variant?.size, item.qty + 1)
              }
              disabled={atMaxQty}
              className={cn(
                'flex h-9 w-9 items-center justify-center text-accent transition-colors',
                atMaxQty && 'cursor-not-allowed opacity-40'
              )}
            >
              <Plus className="size-3.5" />
            </motion.button>
          </div>

          <div className="text-right">
            <p className="text-lg font-medium text-accent">
              {formatPrice(item.price * item.qty)}
            </p>
            {item.qty > 1 && (
              <p className="mt-0.5 text-xs text-accent/50">
                {formatPrice(item.price)} / sản phẩm
              </p>
            )}
          </div>
        </div>
      </div>

      <motion.button
        type="button"
        whileHover={{ scale: 1.1, color: '#e74c3c' }}
        whileTap={{ scale: 0.9 }}
        onClick={handleRemoveClick}
        className="self-start p-2 text-accent/40 transition-colors hover:text-[#e74c3c]"
        aria-label="Xóa sản phẩm"
      >
        <Trash2 className="size-[18px]" />
      </motion.button>
    </motion.div>
  )
}

function EmptyCart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center px-6 py-24 text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="relative mb-10"
      >
        <div className="flex h-40 w-40 items-center justify-center rounded-full bg-accent/5">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-accent/5">
            <ShoppingBag
              className="text-accent/30"
              size={48}
              strokeWidth={1}
            />
          </div>
        </div>
        <motion.div
          className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-accent/10"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-4 -left-4 h-3 w-3 rounded-full bg-accent/10"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      <h2 className="mb-4 text-3xl font-light tracking-tight text-accent md:text-4xl">
        Giỏ hàng trống
      </h2>
      <p className="mb-10 max-w-md leading-relaxed text-accent/60">
        Bạn chưa có sản phẩm nào trong giỏ hàng. Khám phá bộ sưu tập của chúng tôi
        để tìm những món đồ hoàn hảo cho phong cách của bạn.
      </p>

      <Link
        to="/products"
        className="group relative inline-flex overflow-hidden bg-accent px-10 py-4 text-sm uppercase tracking-[0.2em] text-background"
      >
        <motion.span
          className="relative z-10 flex items-center gap-3"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Khám phá sản phẩm
          <ArrowRight className="size-4" />
        </motion.span>
        <motion.div
          className="pointer-events-none absolute inset-0 bg-[#2a2a2b]"
          initial={{ x: '-100%' }}
          whileHover={{ x: 0 }}
          transition={{ duration: 0.3 }}
        />
      </Link>
    </motion.div>
  )
}

function OrderSummary({
  subtotal,
  pieceCount,
  onCheckout,
  onClearCart,
}) {
  const shipping = 0
  const total = subtotal + shipping

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="border border-accent/10 bg-card p-5 sm:p-8"
    >
      <h2 className="mb-6 text-lg font-medium tracking-tight text-accent">
        Tóm tắt đơn hàng
      </h2>

      <div className="space-y-4 text-sm">
        <div className="flex justify-between text-accent/70">
          <span>Tạm tính ({pieceCount} sản phẩm)</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-accent/70">
          <span>Phí vận chuyển</span>
          <span className="font-medium text-green-600">Miễn phí</span>
        </div>

        <div className="border-t border-accent/10 pt-4">
          <div className="flex justify-between text-base font-medium text-accent">
            <span>Tổng cộng</span>
            <span>{formatPrice(total)}</span>
          </div>
          <p className="mt-1 text-xs text-accent/50">Đã bao gồm thuế VAT</p>
        </div>
      </div>

      <motion.button
        type="button"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onCheckout}
        className="relative mt-8 w-full overflow-hidden bg-accent py-4 text-sm uppercase tracking-[0.15em] text-background"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          Tiến hành thanh toán
          <ArrowRight className="size-4" />
        </span>
        <motion.div
          className="pointer-events-none absolute inset-0 bg-[#2a2a2b]"
          initial={{ x: '-100%' }}
          whileHover={{ x: 0 }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>

      <motion.button
        type="button"
        whileTap={{ scale: 0.99 }}
        onClick={onClearCart}
        className="mt-3 w-full border border-red-500/40 py-3 text-sm text-red-600 transition-colors hover:bg-red-50"
      >
        Xóa toàn bộ giỏ hàng
      </motion.button>

      <div className="mt-8 space-y-3 border-t border-accent/10 pt-6">
        <div className="flex items-center gap-3 text-xs text-accent/60">
          <Truck className="size-4 shrink-0" />
          <span>Giao hàng miễn phí cho đơn trên 1.000.000đ</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-accent/60">
          <Package className="size-4 shrink-0" />
          <span>Đổi trả miễn phí trong 30 ngày</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-accent/60">
          <Shield className="size-4 shrink-0" />
          <span>Thanh toán an toàn & bảo mật</span>
        </div>
      </div>
    </motion.div>
  )
}

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart, cartCount } =
    useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showConfirm, setShowConfirm] = useState(false)

  const pieceCount = cart.reduce((sum, item) => sum + (item.qty || 0), 0)

  const handleQuantityChange = (productId, size, newQty) => {
    const cartItem = cart.find(
      (item) => item.product === productId && item.variant?.size === size
    )

    if (!cartItem) return

    const maxStock = Number(cartItem.variant?.stock) || 0
    if (newQty > maxStock) {
      toast.warning(`Chỉ còn ${maxStock} sản phẩm cho size này`)
      updateQuantity(productId, size, maxStock)
      return
    }

    updateQuantity(productId, size, newQty)
  }

  const handleRemove = (productId, size) => {
    removeFromCart(productId, size)
    toast.success('Đã xóa sản phẩm khỏi giỏ hàng')
  }

  const handleClearCart = () => {
    setShowConfirm(true)
  }

  const handleConfirmClear = () => {
    clearCart()
    setShowConfirm(false)
    toast.success('Đã xóa toàn bộ giỏ hàng')
  }

  const handleCancelClear = () => {
    setShowConfirm(false)
  }

  const handleCheckout = () => {
    if (cart.length === 0) return
    if (!user) {
      navigate('/login?redirect=/checkout')
    } else {
      navigate('/checkout')
    }
  }

  // ── Socket: warn + auto-remove when admin deletes a product ─────────────────
  useEffect(() => {
    if (!socket.connected) socket.connect()

    const onProductDeleted = ({ productId }) => {
      const affected = cart.filter((item) => item.product === productId)
      if (affected.length === 0) return

      affected.forEach((item) => removeFromCart(item.product, item.variant?.size))
      toast.warning('Ổi không! Một sản phẩm trong giỏ hàng vừa bị gỡ xuống. Chúng tôi đã xóa nó khỏi giỏ hàng.')
    }

    const onProductUpdated = ({ product }) => {
      // If stock dropped to 0 for a size in cart, warn the user
      const affected = cart.filter((item) => item.product === product._id)
      affected.forEach((item) => {
        const variant = product.variants?.find((v) => v.size === item.variant?.size)
        if (variant && variant.stock === 0) {
          toast.warning(`Size ${item.variant?.size} của “${product.name}” hiện đã hết hàng`)
        }
      })
    }

    socket.on('productDeleted', onProductDeleted)
    socket.on('productUpdated', onProductUpdated)

    return () => {
      socket.off('productDeleted', onProductDeleted)
      socket.off('productUpdated', onProductUpdated)
    }
  }, [cart, removeFromCart])

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 lg:px-8 md:py-16">
          <EmptyCart />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Modal isOpen={showConfirm} onClose={handleCancelClear} size="sm">
        <ModalHeader onClose={handleCancelClear}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="size-5 text-red-500" />
            </div>
            <ModalTitle>Xóa toàn bộ giỏ hàng</ModalTitle>
          </div>
        </ModalHeader>
        <ModalContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Bạn có chắc chắn muốn xóa toàn bộ sản phẩm trong giỏ hàng không?
            Hành động này không thể hoàn tác.
          </p>
        </ModalContent>
        <ModalFooter className="flex gap-3 justify-stretch">
          <Button variant="outline" size="lg" onClick={handleCancelClear} className="flex-1">
            Hủy
          </Button>
          <Button
            variant="danger"
            size="lg"
            onClick={handleConfirmClear}
            className="flex-1"
          >
            Xóa giỏ hàng
          </Button>
        </ModalFooter>
      </Modal>
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-accent/50">
            Mua sắm
          </p>
          <h1 className="text-3xl font-light tracking-tight text-accent md:text-4xl">
            Giỏ hàng của bạn
          </h1>
          <p className="mt-2 text-sm text-accent/60">
            {pieceCount} sản phẩm trong giỏ hàng
            {cartCount > 0 && (
              <span className="text-accent/40">
                {' '}
                · {cartCount} mục
              </span>
            )}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-16">
          <div className="lg:col-span-2">
            <AnimatePresence mode="popLayout">
              {cart.map((item) => (
                <CartItem
                  key={`${item.product}-${item.variant?.size}`}
                  item={item}
                  onUpdateQuantity={handleQuantityChange}
                  onRemove={handleRemove}
                />
              ))}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8"
            >
              <Link
                to="/products"
                className="group inline-flex items-center gap-2 text-sm text-accent/60 transition-colors hover:text-accent"
              >
                <motion.span
                  className="inline-block rotate-180"
                  whileHover={{ x: -4 }}
                >
                  <ArrowRight className="size-3.5" />
                </motion.span>
                Tiếp tục mua sắm
              </Link>
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-32">
              <OrderSummary
                subtotal={cartTotal}
                pieceCount={pieceCount}
                onCheckout={handleCheckout}
                onClearCart={handleClearCart}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
