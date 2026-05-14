import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck,
  CreditCard,
  ShieldCheck,
  Check,
  ChevronRight,
  MapPin,
  Phone,
  User,
  Wallet,
  Banknote,
  ShoppingBag,
  ArrowLeft,
  Loader2,
} from 'lucide-react'
import { toast } from '@/components/ui/Toast'
import api from '../../api/axiosInstance'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'
import { getImageUrl } from '../../utils/getImageUrl'
import { Input } from '../../components/ui/Input'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────
const VNPAY_CART_STORAGE_KEY = 'pendingVnpayCart'

// ─── Progress steps ───────────────────────────────────────────────────────────
const steps = [
  { id: 1, name: 'Giỏ hàng', href: '/cart' },
  { id: 2, name: 'Thanh toán', href: '/checkout' },
  { id: 3, name: 'Hoàn tất', href: '#' },
]

// ─── Payment methods ──────────────────────────────────────────────────────────
const paymentMethods = [
  {
    id: 'COD',
    name: 'Thanh toán khi nhận hàng',
    description: 'Thanh toán bằng tiền mặt khi nhận hàng',
    icon: Banknote,
  },
  {
    id: 'VNPAY',
    name: 'VNPAY',
    description: 'Thanh toán qua ví điện tử, thẻ ATM/Visa/Master',
    icon: Wallet,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price)
}



// ─── Empty Cart ───────────────────────────────────────────────────────────────
function EmptyCartView() {
  return (
    <div className="min-h-screen bg-[#F5F5F3]">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="relative mb-8">
            <motion.div
              className="flex h-32 w-32 items-center justify-center rounded-full bg-[#1A1A1B]/5"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <ShoppingBag className="h-16 w-16 text-[#1A1A1B]/20" />
            </motion.div>
          </div>
          <h2 className="mb-3 text-3xl font-light tracking-tight text-[#1A1A1B] md:text-4xl">
            Giỏ hàng trống
          </h2>
          <p className="mb-8 max-w-md text-sm text-[#1A1A1B]/60">
            Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá bộ sưu tập
            của chúng tôi.
          </p>
          <Link to="/products">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group flex items-center gap-2 bg-[#1A1A1B] px-8 py-4 text-xs font-medium uppercase tracking-widest text-white transition-all duration-300 hover:bg-[#2a2a2b]"
            >
              Khám phá sản phẩm
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // ── Buy Now mode: đọc item từ sessionStorage ────────────────────────────
  const isBuyNow = searchParams.get('mode') === 'buynow'
  const buyNowItem = (() => {
    if (!isBuyNow) return null
    try { return JSON.parse(sessionStorage.getItem('buyNowItem') || 'null') } catch { return null }
  })()
  const checkoutItems = isBuyNow && buyNowItem ? [buyNowItem] : cart
  const checkoutTotal = isBuyNow && buyNowItem ? buyNowItem.price * buyNowItem.qty : cartTotal

  // ── State ──────────────────────────────────────────────────────────────────
  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || '',
    phone: '',
    street: '',
    ward: '',
    district: '',
    province: '',
  })
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [loading, setLoading] = useState(false)
  const currentStep = 2

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) {
      toast.warning('Vui lòng đăng nhập để thanh toán')
      navigate('/login?redirect=/checkout')
    }
  }, [user, authLoading, navigate])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target

    if (name === 'phone') {
      const onlyNumbers = value.replace(/[^0-9]/g, '')
      setShippingAddress((prev) => ({ ...prev, [name]: onlyNumbers }))
      return
    }

    setShippingAddress((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmitOrder = async (e) => {
    e.preventDefault()

    if (checkoutItems.length === 0) {
      toast.error('Giỏ hàng trống')
      return
    }

    const finalTotal = Number(checkoutTotal)
    if (Number.isNaN(finalTotal) || finalTotal <= 0) {
      toast.error('Giá trị đơn hàng không hợp lệ')
      return
    }

    const orderItems = checkoutItems.map((item) => ({
      product: item?.product?._id || item.product,
      variant: item.variant,
      qty: item.qty,
      price: Number(item.price) || 0,
    }))

    setLoading(true)

    try {
      const res = await api.post('/orders', {
        items: orderItems,
        shippingAddress,
        paymentMethod,
      })

      if (!res.data.success) {
        throw new Error(res.data.message || 'Đặt hàng thất bại')
      }

      if (paymentMethod === 'VNPAY') {
        if (!res.data.paymentUrl) {
          throw new Error('Không tạo được liên kết thanh toán VNPay')
        }
        // Backup cart trước khi chuyển sang VNPay (chỉ với cart thường)
        if (!isBuyNow) {
          sessionStorage.setItem(VNPAY_CART_STORAGE_KEY, JSON.stringify(cart))
          clearCart()
        } else {
          sessionStorage.removeItem('buyNowItem')
        }
        window.location.assign(res.data.paymentUrl)
        return
      }

      toast.success('Đặt hàng thành công')
      if (isBuyNow) {
        sessionStorage.removeItem('buyNowItem')
      } else {
        clearCart()
      }
      navigate('/orders')
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || 'Đặt hàng thất bại'
      )
    } finally {
      setLoading(false)
    }
  }

  // ── Guard renders ──────────────────────────────────────────────────────────
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1A1A1B]/40" />
      </div>
    )
  }
  if (checkoutItems.length === 0) return <EmptyCartView />

  // ── Derived values ─────────────────────────────────────────────────────────
  const subtotal = Number(checkoutTotal)
  const shipping = 0
  const total = subtotal + shipping

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F5F3]">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">

        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            to="/cart"
            className="group inline-flex items-center gap-2 text-sm text-[#1A1A1B]/60 transition-colors hover:text-[#1A1A1B]"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Quay lại giỏ hàng
          </Link>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center justify-center gap-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center gap-3">
                  <motion.div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                      step.id < currentStep
                        ? 'border-[#1A1A1B] bg-[#1A1A1B] text-white'
                        : step.id === currentStep
                          ? 'border-[#1A1A1B] bg-white text-[#1A1A1B]'
                          : 'border-[#1A1A1B]/20 bg-white text-[#1A1A1B]/40'
                    )}
                    whileHover={{ scale: 1.05 }}
                  >
                    {step.id < currentStep ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </motion.div>
                  <span
                    className={cn(
                      'hidden text-sm font-medium sm:block',
                      step.id <= currentStep
                        ? 'text-[#1A1A1B]'
                        : 'text-[#1A1A1B]/40'
                    )}
                  >
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'mx-4 h-px w-12 sm:w-20',
                      step.id < currentStep ? 'bg-[#1A1A1B]' : 'bg-[#1A1A1B]/20'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Main 2-column grid */}
        <div className="grid gap-12 lg:grid-cols-12">

          {/* ── Left: Form ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-7"
          >
            <form id="checkout-form" onSubmit={handleSubmitOrder}>

              {/* Shipping Information */}
              <div className="mb-10">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1A1A1B]/5">
                    <Truck className="h-5 w-5 text-[#1A1A1B]" />
                  </div>
                  <h2 className="text-lg font-medium text-[#1A1A1B]">
                    Thông tin giao hàng
                  </h2>
                </div>

                <div className="space-y-5 rounded-xl border border-[#1A1A1B]/5 bg-white p-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      label="Họ và tên"
                      name="name"
                      value={shippingAddress.name}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      label="Số điện thoại"
                      name="phone"
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={handleInputChange}
                      maxLength={11}
                      required
                    />
                  </div>

                  <Input
                    label="Địa chỉ chi tiết"
                    name="street"
                    value={shippingAddress.street}
                    onChange={handleInputChange}
                    required
                  />

                  <div className="grid gap-5 sm:grid-cols-3">
                    <Input
                      label="Phường/Xã"
                      name="ward"
                      value={shippingAddress.ward}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      label="Quận/Huyện"
                      name="district"
                      value={shippingAddress.district}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      label="Tỉnh/Thành phố"
                      name="province"
                      value={shippingAddress.province}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-10">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1A1A1B]/5">
                    <CreditCard className="h-5 w-5 text-[#1A1A1B]" />
                  </div>
                  <h2 className="text-lg font-medium text-[#1A1A1B]">
                    Phương thức thanh toán
                  </h2>
                </div>

                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <motion.label
                      key={method.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={cn(
                        'flex cursor-pointer items-center gap-4 rounded-xl border-2 bg-white p-5 transition-all',
                        paymentMethod === method.id
                          ? 'border-[#1A1A1B] shadow-sm'
                          : 'border-transparent hover:border-[#1A1A1B]/20'
                      )}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="sr-only"
                      />
                      <div
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-lg',
                          paymentMethod === method.id
                            ? 'bg-[#1A1A1B] text-white'
                            : 'bg-[#1A1A1B]/5 text-[#1A1A1B]'
                        )}
                      >
                        <method.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[#1A1A1B]">
                          {method.name}
                        </p>
                        <p className="text-sm text-[#1A1A1B]/60">
                          {method.description}
                        </p>
                      </div>
                      <div
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full border-2',
                          paymentMethod === method.id
                            ? 'border-[#1A1A1B] bg-[#1A1A1B]'
                            : 'border-[#1A1A1B]/20'
                        )}
                      >
                        {paymentMethod === method.id && (
                          <Check className="h-4 w-4 text-white" />
                        )}
                      </div>
                    </motion.label>
                  ))}
                </div>
              </div>

              {/* Trust badges */}
              <div className="mb-8 flex flex-wrap items-center justify-center gap-6 rounded-xl border border-[#1A1A1B]/5 bg-white p-5 sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-[#1A1A1B]/60">
                  <ShieldCheck className="h-5 w-5" />
                  <span>Thanh toán bảo mật</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#1A1A1B]/60">
                  <Truck className="h-5 w-5" />
                  <span>Giao hàng nhanh chóng</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#1A1A1B]/60">
                  <Check className="h-5 w-5" />
                  <span>Đổi trả 30 ngày</span>
                </div>
              </div>

              {/* Submit – mobile only */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.99 }}
                className="relative w-full overflow-hidden bg-[#1A1A1B] py-4 text-sm font-medium uppercase tracking-widest text-white transition-colors hover:bg-[#2a2a2b] disabled:cursor-not-allowed disabled:opacity-70 lg:hidden"
              >
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </motion.span>
                  ) : (
                    <motion.span
                      key="text"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {paymentMethod === 'VNPAY'
                        ? 'Thanh toán qua VNPAY'
                        : 'Xác nhận đặt hàng'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </form>
          </motion.div>

          {/* ── Right: Order Summary ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div className="sticky top-8 rounded-xl border border-[#1A1A1B]/5 bg-white p-6">
              <h2 className="mb-6 text-lg font-medium text-[#1A1A1B]">
                Đơn hàng của bạn
              </h2>

              {/* Cart items */}
              <div className="mb-6 max-h-80 space-y-4 overflow-y-auto pr-2">
              {checkoutItems.map((item, index) => {
                  const price = Number(item.price) || 0
                  // image có thể là string hoặc object { url, path, ... }
                  const resolveImageStr = (img) => {
                    if (!img) return ''
                    if (typeof img === 'string') return img
                    return img.url || img.path || img.src || ''
                  }
                  const rawImage =
                    resolveImageStr(item.image) ||
                    resolveImageStr(item.productData?.images?.[0]) ||
                    ''
                  const imageUrl =
                    getImageUrl(rawImage) ||
                    'https://via.placeholder.com/80x80/eeeeee/666666?text=No+Image'

                  return (
                    <motion.div
                      key={`${item.product}-${item.variant?.size || index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className="flex gap-4"
                    >
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-[#F5F5F3]">
                        <img
                          src={imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-center">
                        <h3 className="text-sm font-medium leading-snug text-[#1A1A1B]">
                          {item.name}
                        </h3>
                        <p className="text-xs text-[#1A1A1B]/60">
                          Size: {item.variant?.size || '-'} &bull; Số lượng: {item.qty}
                        </p>
                        <p className="mt-1 text-sm font-medium text-[#1A1A1B]">
                          {formatPrice(price * item.qty)}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Divider */}
              <div className="mb-6 h-px bg-[#1A1A1B]/10" />

              {/* Totals */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#1A1A1B]/60">Tạm tính</span>
                  <span className="text-[#1A1A1B]">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#1A1A1B]/60">Phí vận chuyển</span>
                  <span className="font-medium text-emerald-600">Miễn phí</span>
                </div>
                <div className="h-px bg-[#1A1A1B]/10" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#1A1A1B]">
                    Tổng cộng
                  </span>
                  <div className="text-right">
                    <span className="text-xl font-semibold text-[#1A1A1B]">
                      {formatPrice(total)}
                    </span>
                    <p className="text-xs text-[#1A1A1B]/40">(Đã bao gồm VAT)</p>
                  </div>
                </div>
              </div>

              {/* VNPAY note */}
              {paymentMethod === 'VNPAY' && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-xs leading-relaxed text-blue-700"
                >
                  Bạn sẽ được chuyển đến cổng thanh toán VNPAY sau khi hệ thống
                  tạo đơn hàng.
                </motion.p>
              )}

              {/* Submit – desktop */}
              <motion.button
                type="submit"
                form="checkout-form"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="relative mt-6 hidden w-full overflow-hidden bg-[#1A1A1B] py-4 text-sm font-medium uppercase tracking-widest text-white transition-colors hover:bg-[#2a2a2b] disabled:cursor-not-allowed disabled:opacity-70 lg:block"
              >
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </motion.span>
                  ) : (
                    <motion.span
                      key="text"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {paymentMethod === 'VNPAY'
                        ? 'Thanh toán qua VNPAY'
                        : 'Xác nhận đặt hàng'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <p className="mt-4 text-center text-xs text-[#1A1A1B]/40">
                Bằng việc đặt hàng, bạn đồng ý với điều khoản sử dụng của
                GOLDIE
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
