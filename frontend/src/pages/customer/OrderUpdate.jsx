import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from '@/components/ui/Toast'
import api from '../../api/axiosInstance'
import socket from '../../api/socket'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

// ─── Animation variants ──────────────────────────────────────────────────────
/** @type {import('framer-motion').Variants} */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

/** @type {import('framer-motion').Variants} */
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

// ─── Main Component ───────────────────────────────────────────────────────────
const OrderUpdate = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    phone: '',
    street: '',
    ward: '',
    district: '',
    province: 'TP. Hồ Chí Minh',
  })

  // ── Fetch order ────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`)
        const data = res.data.order || res.data

        if (data.orderStatus !== 'pending') {
          toast.warning('Đơn hàng này không thể chỉnh sửa nữa')
          navigate('/orders')
          return
        }

        setOrder(data)
        setFormData({
          phone: data.shippingAddress.phone || '',
          street: data.shippingAddress.street || '',
          ward: data.shippingAddress.ward || '',
          district: data.shippingAddress.district || '',
          province: data.shippingAddress.province || 'TP. Hồ Chí Minh',
        })
      } catch {
        toast.error('Không tìm thấy đơn hàng hoặc không có quyền chỉnh sửa')
        navigate('/orders')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [id, navigate])

  // ── Socket: redirect if admin changes order status while customer is editing ─────
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return undefined
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const userId = payload.id || payload._id || payload.userId
      if (!userId) return undefined
      if (!socket.connected) socket.connect()
      socket.emit('join', userId)

      const onStatusUpdated = ({ orderId, newStatus }) => {
        if (orderId !== id) return
        if (newStatus !== 'pending') {
          toast.warning('Đơn hàng này vừa được cập nhật và không thể chỉnh sửa nữa')
          navigate('/orders')
        }
      }

      socket.on('orderStatusUpdated', onStatusUpdated)
      return () => { socket.off('orderStatusUpdated', onStatusUpdated) }
    } catch {
      return undefined
    }
  }, [id, navigate])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await api.put(`/orders/${id}/status`, {
        shippingAddress: {
          name: order.shippingAddress.name,
          phone: formData.phone,
          street: formData.street,
          ward: formData.ward,
          district: formData.district,
          province: formData.province,
        },
      })

      if (res.data.success) {
        toast.success('Cập nhật thông tin đơn hàng thành công!')
        navigate('/orders')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại')
    } finally {
      setSaving(false)
    }
  }

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          className="h-6 w-6 rounded-full border-2 border-foreground/20 border-t-foreground"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
        />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Không tìm thấy đơn hàng</p>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-lg px-6 py-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Page title */}
          <motion.div variants={itemVariants} className="space-y-2 text-center">
            <h1 className="text-3xl font-light tracking-tight text-[#1A1A1B] md:text-4xl">
              Cập nhật thông tin đơn hàng
            </h1>
            <p className="font-mono text-sm text-muted-foreground">
              #{order._id.slice(-8).toUpperCase()}
            </p>
          </motion.div>

          {/* Divider */}
          <motion.div
            variants={itemVariants}
            className="mx-auto h-px w-12 bg-foreground/20"
          />

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div variants={itemVariants}>
              <Input
                label="Số điện thoại"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Nhập số điện thoại"
                required
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <Input
                label="Địa chỉ chi tiết"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                placeholder="Số nhà, tên đường, tòa nhà..."
                required
              />
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
              <Input
                label="Phường/Xã"
                name="ward"
                value={formData.ward}
                onChange={handleInputChange}
                placeholder="Nhập phường/xã"
                required
              />
              <Input
                label="Quận/Huyện"
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                placeholder="Nhập quận/huyện"
                required
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <Input
                label="Tỉnh/Thành phố"
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                placeholder="Nhập tỉnh/thành phố"
              />
            </motion.div>

            {/* Buttons */}
            <motion.div variants={itemVariants} className="flex flex-col gap-3 pt-6">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={saving}
                className="w-full"
              >
                Lưu thay đổi
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate('/orders')}
                className="w-full"
              >
                Quay lại
              </Button>
            </motion.div>
          </form>

          {/* Footer note */}
          <motion.p
            variants={itemVariants}
            className="pt-4 text-center text-xs text-muted-foreground"
          >
            Thông tin sẽ được cập nhật cho đơn hàng của bạn
          </motion.p>
        </motion.div>
      </main>
    </div>
  )
}

export default OrderUpdate