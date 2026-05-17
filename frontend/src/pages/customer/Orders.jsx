import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  Calendar,
  ChevronRight,
  ShoppingBag,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  CreditCard,
  Pencil,
} from 'lucide-react'
import { toast } from '@/components/ui/Toast'
import api from '../../api/axiosInstance'
import socket from '../../api/socket'
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PageSpinner, ButtonSpinner } from '@/components/ui/LoadingSpinner'
import { cn } from '@/lib/utils'

// ─── Status config ────────────────────────────────────────────────────────────
const statusConfig = {
  pending: {
    label: 'Đang chờ xác nhận',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
  },
  confirmed: {
    label: 'Đã xác nhận',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Đã hủy',
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: XCircle,
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString('vi-VN')
}

// ─── Animation variants ──────────────────────────────────────────────────────
/** @type {import('framer-motion').Variants} */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

/** @type {import('framer-motion').Variants} */
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

// ─── Main Component ───────────────────────────────────────────────────────────
const Orders = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)

  // ── Fetch orders ───────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders/my-orders')
      setOrders(res.data.orders || [])
    } catch {
      toast.error('Không thể tải lịch sử đơn hàng')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // ── Socket listeners ───────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return undefined

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const userId = payload.id || payload._id || payload.userId
      if (!userId) return undefined

      if (!socket.connected) socket.connect()
      socket.emit('join', userId)

      const handleOrderStatusUpdated = ({ orderId, newStatus }) => {
        setOrders((prev) => prev.map((o) =>
          o._id === orderId ? { ...o, orderStatus: newStatus } : o
        ))
        setSelectedOrder((prev) =>
          prev?._id === orderId ? { ...prev, orderStatus: newStatus } : prev
        )
      }

      const handleOrderPaymentUpdated = ({ orderId, paymentStatus, orderStatus }) => {
        setOrders((prev) => prev.map((o) =>
          o._id === orderId
            ? { ...o, paymentStatus, orderStatus: orderStatus || o.orderStatus }
            : o
        ))
        setSelectedOrder((prev) =>
          prev?._id === orderId
            ? { ...prev, paymentStatus, orderStatus: orderStatus || prev.orderStatus }
            : prev
        )
      }

      socket.on('orderStatusUpdated', handleOrderStatusUpdated)
      socket.on('orderPaymentUpdated', handleOrderPaymentUpdated)

      return () => {
        socket.off('orderStatusUpdated', handleOrderStatusUpdated)
        socket.off('orderPaymentUpdated', handleOrderPaymentUpdated)
      }
    } catch (error) {
      return undefined
    }
  }, [])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openDetail = (order) => setSelectedOrder(order)
  const closeDetail = () => setSelectedOrder(null)

  const openCancelModal = (order) => {
    setOrderToCancel(order)
    setShowCancelModal(true)
  }

  const confirmCancel = async () => {
    if (!orderToCancel) return
    setCancellingId(orderToCancel._id)

    try {
      await api.put(`/orders/${orderToCancel._id}/status`, { orderStatus: 'cancelled' })
      toast.success('Đơn hàng đã được hủy thành công')
      setOrders((prev) => prev.map((o) =>
        o._id === orderToCancel._id
          ? { ...o, orderStatus: 'cancelled', paymentStatus: o.paymentStatus === 'paid' ? 'paid' : 'cancelled' }
          : o
      ))
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể hủy đơn hàng')
    } finally {
      setShowCancelModal(false)
      setOrderToCancel(null)
      setCancellingId(null)
    }
  }

  const getStatus = (statusKey) => statusConfig[statusKey] || statusConfig.pending

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return <PageSpinner />
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F5F3]">
        <div className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
          <motion.div
            className="flex flex-col items-center justify-center py-24 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative mb-8">
              <motion.div
                className="flex h-32 w-32 items-center justify-center rounded-full bg-[#1A1A1B]/5"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Package className="h-16 w-16 text-[#1A1A1B]/30" strokeWidth={1} />
              </motion.div>
              <motion.div
                className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-[#1A1A1B]/10"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute -bottom-1 -left-3 h-4 w-4 rounded-full bg-[#1A1A1B]/10"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              />
            </div>

            <h2 className="mb-3 text-3xl font-light tracking-tight text-[#1A1A1B] md:text-4xl">Chưa có đơn hàng nào</h2>
            <p className="mb-8 max-w-md text-[#1A1A1B]/50">
              Bạn chưa có đơn hàng nào. Hãy khám phá bộ sưu tập của chúng tôi và bắt đầu mua sắm.
            </p>

            <Link to="/products">
              <motion.button
                className="group relative inline-flex items-center gap-2 overflow-hidden bg-[#1A1A1B] px-8 py-4 text-sm uppercase tracking-[0.2em] text-white"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Khám phá sản phẩm
                </span>
                <motion.div
                  className="absolute inset-0 bg-[#2a2a2b]"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F5F3]">
      <div className="mx-auto max-w-4xl px-6 py-16 lg:px-8">

        {/* Header */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#1A1A1B]/40">Tài khoản</p>
          <h1 className="text-3xl font-light tracking-tight text-[#1A1A1B] md:text-4xl">Lịch sử đơn hàng</h1>
          <p className="mt-3 text-sm text-[#1A1A1B]/50">{orders.length} đơn hàng</p>
        </motion.div>

        {/* Orders list */}
        <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
          <AnimatePresence mode="popLayout">
            {orders.map((order) => {
              const status = getStatus(order.orderStatus)
              const StatusIcon = status.icon
              const canCancel = order.orderStatus === 'pending' && order.paymentMethod !== 'VNPAY'
              const isCancelling = cancellingId === order._id

              return (
                <motion.div
                  key={order._id}
                  variants={itemVariants}
                  layout
                  exit={{ opacity: 0, x: -20 }}
                  className="group overflow-hidden border border-[#1A1A1B]/10 bg-white transition-shadow duration-300 hover:shadow-lg"
                >
                  {/* Order header */}
                  <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center bg-[#1A1A1B]/5">
                        <Package className="h-5 w-5 text-[#1A1A1B]/60" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="mb-1 font-medium text-[#1A1A1B]">
                          #{order._id.slice(-8).toUpperCase()}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[#1A1A1B]/50">
                          <Calendar className="h-3 w-3" />
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className={cn('inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1.5 text-xs font-medium', status.color)}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {status.label}
                    </div>
                  </div>

                  {/* Items preview */}
                  <div className="border-t border-[#1A1A1B]/5 bg-[#F5F5F3]/50 px-6 py-4">
                    <div className="flex flex-wrap gap-2 text-xs text-[#1A1A1B]/60">
                      {(order.items || []).map((item, index) => (
                        <span key={index} className="flex items-center gap-1">
                          <span className="font-medium text-[#1A1A1B]/80">{item.qty}x</span>
                          {item.name}
                          {index < order.items.length - 1 && <span className="ml-2 text-[#1A1A1B]/20">|</span>}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Order footer */}
                  <div className="flex flex-col gap-4 border-t border-[#1A1A1B]/5 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#1A1A1B]/40">Tổng tiền</p>
                      <p className="text-lg font-medium text-[#1A1A1B]">{formatPrice(order.totalAmount || 0)}</p>
                    </div>
                    <div className="flex gap-3">
                      {canCancel && (
                        <motion.button
                          onClick={() => openCancelModal(order)}
                          disabled={isCancelling}
                          className="relative flex items-center gap-2 overflow-hidden border border-red-200 px-5 py-2.5 text-xs uppercase tracking-wider text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isCancelling ? (
                            <ButtonSpinner />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                          Hủy đơn
                        </motion.button>
                      )}
                      <motion.button
                        onClick={() => openDetail(order)}
                        className="group/btn relative flex items-center gap-2 overflow-hidden bg-[#1A1A1B] px-5 py-2.5 text-xs uppercase tracking-wider text-white"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          Chi tiết
                          <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                        </span>
                        <motion.div
                          className="absolute inset-0 bg-[#2a2a2b]"
                          initial={{ x: '-100%' }}
                          whileHover={{ x: 0 }}
                          transition={{ duration: 0.3 }}
                        />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Detail modal ── */}
      <Modal isOpen={!!selectedOrder} onClose={closeDetail} size="lg">
        <ModalHeader onClose={closeDetail}>
          <ModalTitle>Chi tiết đơn hàng</ModalTitle>
        </ModalHeader>
        <ModalContent>
          {selectedOrder && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package size={14} className="shrink-0" />
                <span className="font-medium text-foreground">Mã đơn:</span>
                #{selectedOrder._id.slice(-8).toUpperCase()}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar size={14} className="shrink-0" />
                <span className="font-medium text-foreground">Thời gian:</span>
                {formatDateTime(selectedOrder.createdAt)}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin size={14} className="shrink-0" />
                <span className="font-medium text-foreground">Người nhận:</span>
                {selectedOrder.shippingAddress?.name || '—'} — {selectedOrder.shippingAddress?.phone || '—'}
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin size={14} className="mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-foreground">Địa chỉ: </span>
                  {[
                    selectedOrder.shippingAddress?.street,
                    selectedOrder.shippingAddress?.ward,
                    selectedOrder.shippingAddress?.district,
                    selectedOrder.shippingAddress?.province,
                  ].filter(Boolean).join(', ') || '—'}
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CreditCard size={14} className="shrink-0" />
                <span className="font-medium text-foreground">Thanh toán:</span>
                {selectedOrder.paymentMethod || 'COD'}
              </div>

              <div className="h-px bg-border" />

              {/* Items */}
              <div className="space-y-2">
                {(selectedOrder.items || []).map((item, i) => (
                  <div key={i} className="flex justify-between text-muted-foreground">
                    <span>{item.qty}x {item.name} {item.variant?.size ? `(${item.variant.size})` : ''}</span>
                    <span className="font-medium text-foreground">{formatPrice((item.price || 0) * item.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="h-px bg-border" />

              <div className="flex justify-between text-base font-medium text-foreground">
                <span>Tổng cộng</span>
                <span>{formatPrice(selectedOrder.totalAmount || 0)}</span>
              </div>
            </div>
          )}
        </ModalContent>
        <ModalFooter className="flex gap-3 justify-stretch">
          <Button variant="outline" size="lg" onClick={closeDetail} className="flex-1">
            Đóng
          </Button>
          {selectedOrder?.orderStatus === 'pending' && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => { closeDetail(); navigate(`/orders/${selectedOrder._id}/edit`) }}
              className="flex-1"
            >
              <Pencil size={14} />
              Cập nhật thông tin
            </Button>
          )}
        </ModalFooter>
      </Modal>

      {/* ── Cancel modal ── */}
      <Modal
        isOpen={showCancelModal && !!orderToCancel}
        onClose={() => { setShowCancelModal(false); setOrderToCancel(null) }}
        size="sm"
      >
        <ModalHeader onClose={() => { setShowCancelModal(false); setOrderToCancel(null) }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <ModalTitle>Xác nhận hủy đơn hàng</ModalTitle>
          </div>
        </ModalHeader>
        <ModalContent>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc chắn muốn hủy đơn hàng{' '}
            {orderToCancel && (
              <span className="font-medium text-foreground">
                #{orderToCancel._id.slice(-8).toUpperCase()}
              </span>
            )}
            ? Hành động này không thể hoàn tác.
          </p>
        </ModalContent>
        <ModalFooter className="flex gap-3 justify-stretch">
          <Button
            variant="outline"
            size="lg"
            onClick={() => { setShowCancelModal(false); setOrderToCancel(null) }}
            className="flex-1"
          >
            Quay lại
          </Button>
          <Button
            variant="danger"
            size="lg"
            onClick={confirmCancel}
            className="flex-1"
          >
            Xác nhận hủy
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default Orders
