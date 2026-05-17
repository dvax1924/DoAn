import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import {
  Users,
  ShoppingBag,
  Package,
  DollarSign,
  RefreshCw,
} from 'lucide-react'
import { toast } from '@/components/ui/Toast'
import api from '../../api/axiosInstance'
import { cn } from '@/lib/utils'
import socket from '../../api/socket'
import { Button } from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (value) => {
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return value.toString()
}

const formatFullCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

const formatVietnameseDate = () => {
  const now = new Date()
  const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
  return `${days[now.getDay()]}, ${now.getDate()} tháng ${now.getMonth() + 1}, ${now.getFullYear()}`
}

// ─── Animation variants ───────────────────────────────────────────────────────
/** @type {import('framer-motion').Variants} */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

/** @type {import('framer-motion').Variants} */
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
/**
 * @param {Object} props
 * @param {import('react').ElementType} props.icon
 * @param {string} props.label
 * @param {string | number} props.value
 * @param {boolean} [props.isHighlight]
 */
function StatCard({ icon, label, value, isHighlight = false }) {
  const StatIcon = icon

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.10)' }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative overflow-hidden rounded-2xl p-6',
        isHighlight
          ? 'col-span-1 bg-[#1A1A1B] text-white md:col-span-2'
          : 'bg-white'
      )}
      style={{
        boxShadow: isHighlight
          ? '0 8px 32px -8px rgba(26,26,27,0.30)'
          : '0 4px 24px -4px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className={cn('text-sm font-medium tracking-wide', isHighlight ? 'text-white/70' : 'text-gray-500')}>
            {label}
          </p>
          <p className={cn('text-3xl font-semibold tracking-tight', isHighlight ? 'text-white' : 'text-[#1A1A1B]')}>
            {value}
          </p>
        </div>
        <div className={cn('rounded-xl p-3', isHighlight ? 'bg-white/10' : 'bg-[#F5F4F0]')}>
          <StatIcon
            className={cn('h-6 w-6', isHighlight ? 'text-amber-300' : 'text-[#1A1A1B]')}
            strokeWidth={1.5}
          />
        </div>
      </div>
      {isHighlight && (
        <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-amber-300/10" />
      )}
    </motion.div>
  )
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
/**
 * @param {{ active?: boolean, payload?: Array<{value: number}>, label?: string }} props
 */
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl bg-[#1A1A1B] px-4 py-3 shadow-xl">
        <p className="text-xs font-medium text-white/70">{label}</p>
        <p className="text-lg font-semibold text-white">
          {formatFullCurrency(payload[0].value)}
        </p>
      </div>
    )
  }
  return null
}

// ─── Period Selector Button ────────────────────────────────────────────────────
function PeriodButton({ label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
        isActive ? 'text-[#1A1A1B]' : 'text-gray-500 hover:text-[#1A1A1B]'
      )}
    >
      {isActive && (
        <motion.div
          layoutId="activePeriod"
          className="absolute inset-0 rounded-lg bg-white shadow-sm"
          transition={{ duration: 0.2 }}
        />
      )}
      <span className="relative z-10">{label}</span>
    </button>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  // ── Old logic: state ────────────────────────────────────────────────────────
  const [stats, setStats] = useState(/** @type {any} */ ({}))
  const [revenueChart, setRevenueChart] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('week')
  const [loading, setLoading] = useState(true)     // initial mount only
  const [refreshing, setRefreshing] = useState(false) // period switch only

  const totalRevenue = revenueChart.reduce((sum, item) => sum + (item.revenue || 0), 0)

  const periodLabel = { week: 'tuần này', month: 'tháng này', year: 'năm nay' }

  // ── Old logic: fetchDashboard ───────────────────────────────────────────────
  const fetchDashboard = useCallback(async (period = 'week', isInitial = false) => {
    if (isInitial) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await api.get(`/stats/summary?period=${period}`)
      setStats(res.data)
      setRevenueChart(res.data.revenueChart || [])
    } catch {
      toast.error('Không thể tải dữ liệu dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const isFirstRender = React.useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      fetchDashboard(selectedPeriod, true) // initial load → show full spinner
    } else {
      fetchDashboard(selectedPeriod, false) // period change → subtle refresh only
    }
  }, [selectedPeriod, fetchDashboard])

  // ── Socket: auto-refresh stats on new order / payment ─────────────────────────
  useEffect(() => {
    if (!socket.connected) socket.connect()
    socket.emit('joinAdmin')

    // Silently refresh stats (no loading spinner)
    const onOrderEvent = () => fetchDashboard(selectedPeriod, false)

    socket.on('newOrderCreated', onOrderEvent)
    socket.on('orderPaymentUpdated', onOrderEvent)
    socket.on('orderStatusUpdated', onOrderEvent)

    return () => {
      socket.off('newOrderCreated', onOrderEvent)
      socket.off('orderPaymentUpdated', onOrderEvent)
      socket.off('orderStatusUpdated', onOrderEvent)
    }
  }, [fetchDashboard, selectedPeriod])

  return (
    <div className="min-h-screen bg-[#F5F4F0]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1B] sm:text-3xl">
              Xin chào, Admin 👋
            </h1>
            <p className="mt-1 text-sm text-gray-500">{formatVietnameseDate()}</p>
          </div>

          {/* Reload button — uses old fetchDashboard logic */}
          <button
            onClick={() => fetchDashboard(selectedPeriod)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1A1A1B] px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-black hover:shadow-xl"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={2} />
            Tải lại
          </button>
        </motion.div>

        {/* ── Stats Grid ── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[40vh] items-center justify-center"
            >
              <LoadingSpinner size="large" variant="dark" />
            </motion.div>
          ) : (
            <React.Fragment key="content">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
          <StatCard
            icon={Users}
            label="Tổng khách hàng"
            value={(stats.totalUsers || 0).toLocaleString('vi-VN')}
          />
          <StatCard
            icon={ShoppingBag}
            label="Tổng đơn hàng"
            value={(stats.totalOrders || 0).toLocaleString('vi-VN')}
          />
          <StatCard
            icon={Package}
            label="Tổng sản phẩm"
            value={(stats.totalProducts || 0).toLocaleString('vi-VN')}
          />
          <StatCard
            icon={ShoppingBag}
            label="Đơn hàng hôm nay"
            value={(stats.todayOrders || 0).toLocaleString('vi-VN')}
          />
          <StatCard
            icon={DollarSign}
            label="Doanh thu hôm nay"
            value={formatFullCurrency(stats.todayRevenue || 0)}
            isHighlight
          />
        </motion.div>

        {/* ── Revenue Chart ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl bg-white p-6 sm:p-8"
          style={{ boxShadow: '0 4px 24px -4px rgba(0,0,0,0.06)' }}
        >
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#1A1A1B]">Biểu đồ doanh thu</h2>
              <p className="mt-1 text-sm text-gray-500">Theo dõi doanh thu theo thời gian</p>
            </div>

            {/* Period buttons — uses old selectedPeriod logic */}
            <div className="flex items-center gap-1 rounded-xl bg-[#F5F4F0] p-1">
              <PeriodButton
                label="Tuần này"
                isActive={selectedPeriod === 'week'}
                onClick={() => setSelectedPeriod('week')}
              />
              <PeriodButton
                label="Tháng này"
                isActive={selectedPeriod === 'month'}
                onClick={() => setSelectedPeriod('month')}
              />
              <PeriodButton
                label="Năm nay"
                isActive={selectedPeriod === 'year'}
                onClick={() => setSelectedPeriod('year')}
              />
            </div>
          </div>

          {/* Chart — AnimatePresence key trick: remount on period change → smooth draw-in */}
          <div className="relative h-72 sm:h-80">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedPeriod + (refreshing ? '-r' : '')}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="h-full w-full focus:outline-none"
              >
                <ResponsiveContainer width="100%" height="100%" className="focus:outline-none">
                  <AreaChart
                    data={revenueChart}
                    margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                    style={{ outline: 'none' }}
                  >
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1A1A1B" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="#1A1A1B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      tickFormatter={formatCurrency}
                      dx={-10}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {/* Gradient fill area */}
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="transparent"
                      fill="url(#revenueGradient)"
                      isAnimationActive={true}
                      animationDuration={1000}
                      animationEasing="ease-in-out"
                    />
                    {/* Main line */}
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#1A1A1B"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 6, fill: '#1A1A1B', stroke: '#fff', strokeWidth: 3 }}
                      isAnimationActive={true}
                      animationDuration={1200}
                      animationEasing="ease-in-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Total revenue summary — old logic */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-5">
            <span className="text-sm text-gray-500">
              Tổng doanh thu {periodLabel[selectedPeriod]}
            </span>
            <strong className="text-2xl font-semibold tracking-tight text-[#1A1A1B]">
              {totalRevenue.toLocaleString('vi-VN')}đ
            </strong>
          </div>
        </motion.div>
            </React.Fragment>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}

export default AdminDashboard
