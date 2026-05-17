import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  AlertTriangle,
  ShoppingBag,
  ArrowRight,
  Receipt,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "../../api/axiosInstance";
import { useCart } from "../../hooks/useCart";
import { Button } from "@/components/ui/Button";
import { ButtonSpinner } from "@/components/ui/LoadingSpinner";

const VNPAY_CART_STORAGE_KEY = 'pendingVnpayCart';

// --- Animation constants ---
const EASE = [0.23, 1, 0.32, 1];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE },
  },
};

// --- Status configurations ---
const statusConfig = {
  success: {
    icon: Check,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    ringColor: "ring-emerald-500/20",
    accentColor: "#22c55e",
    title: "Thanh toán thành công",
    description: "Cảm ơn bạn đã mua sắm tại GOLDIE. Giao dịch đã được xác nhận thành công.",
  },
  failed: {
    icon: X,
    iconBg: "bg-red-500/10",
    iconColor: "text-red-500",
    ringColor: "ring-red-500/20",
    accentColor: "#ef4444",
    title: "Thanh toán không thành công",
    description: "Giao dịch chưa hoàn tất hoặc đã bị hủy. Giỏ hàng đã được khôi phục để bạn có thể thử lại.",
  },
  invalid: {
    icon: AlertTriangle,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    ringColor: "ring-amber-500/20",
    accentColor: "#f59e0b",
    title: "Không xác minh được giao dịch",
    description: "Hệ thống chưa xác minh được kết quả từ VNPay. Vui lòng kiểm tra lại trong lịch sử đơn hàng.",
  },
  'not-found': {
    icon: AlertTriangle,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    ringColor: "ring-amber-500/20",
    accentColor: "#f59e0b",
    title: "Không tìm thấy đơn hàng",
    description: "Hệ thống không tìm thấy đơn hàng tương ứng với giao dịch này.",
  },
  error: {
    icon: AlertTriangle,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    ringColor: "ring-amber-500/20",
    accentColor: "#f59e0b",
    title: "Có lỗi khi xử lý thanh toán",
    description: "Đã có lỗi trong quá trình xử lý kết quả thanh toán. Vui lòng kiểm tra lại sau.",
  }
};

// --- Animated checkmark/cross path ---
function StatusIcon({ status, config }) {
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5, ease: EASE }}
      className={cn(
        "relative w-24 h-24 rounded-full flex items-center justify-center",
        "ring-2",
        config.iconBg,
        config.ringColor
      )}
    >
      {/* Animated ring pulse */}
      <motion.div
        className={cn("absolute inset-0 rounded-full", config.iconBg)}
        initial={{ scale: 1, opacity: 0.5 }}
        animate={{ scale: 1.3, opacity: 0 }}
        transition={{
          delay: 0.4,
          duration: 1,
          ease: "easeOut",
        }}
      />

      {/* Icon with path animation */}
      {status === "success" ? (
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          aria-hidden="true"
        >
          <motion.path
            d="M10 20l8 8 12-16"
            stroke={config.accentColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.4, duration: 0.6, ease: EASE }}
          />
        </svg>
      ) : status === "failed" ? (
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          aria-hidden="true"
        >
          <motion.path
            d="M10 10l16 16M26 10l-16 16"
            stroke={config.accentColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.4, duration: 0.6, ease: EASE }}
          />
        </svg>
      ) : (
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ delay: 0.4, duration: 0.5, ease: EASE }}
        >
          <IconComponent
            size={36}
            strokeWidth={1.5}
            className={config.iconColor}
          />
        </motion.div>
      )}
    </motion.div>
  );
}

// --- Order info row ---
function InfoRow({ label, value, icon, highlight = false }) {
  const InfoIcon = icon

  if (!value) return null;
  return (
    <motion.div
      variants={itemVariants}
      className="flex items-center justify-between py-3 border-b border-border last:border-b-0"
    >
      <div className="flex items-center gap-2.5 text-muted-foreground">
        <InfoIcon size={14} strokeWidth={1.5} />
        <span className="text-xs uppercase tracking-[0.15em]">
          {label}
        </span>
      </div>
      <span
        className={cn(
          "text-sm tracking-wide",
          highlight ? "text-foreground font-medium" : "text-foreground/70"
        )}
      >
        {value}
      </span>
    </motion.div>
  );
}

// --- Main component ---
export default function VnpayReturn() {
  const { cart, clearCart, replaceCart } = useCart();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [totalAmount, setTotalAmount] = useState(0);
  const handledCartStateRef = useRef(false);

  // Trạng thái retry
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState(null);
  const retryHandledRef = useRef(false);

  const status = searchParams.get('status') || 'error';
  const orderId = searchParams.get('orderId') || '';

  const config = statusConfig[status] || statusConfig.error;

  useEffect(() => {
    if (handledCartStateRef.current) {
      return;
    }

    const backupCart = sessionStorage.getItem(VNPAY_CART_STORAGE_KEY);

    if (status === 'success') {
      handledCartStateRef.current = true;
      clearCart();
      sessionStorage.removeItem(VNPAY_CART_STORAGE_KEY);
      return;
    }

    if (!backupCart || cart.length > 0) {
      handledCartStateRef.current = true;
      return;
    }

    try {
      const parsed = JSON.parse(backupCart);
      if (Array.isArray(parsed) && parsed.length > 0) {
        handledCartStateRef.current = true;
        replaceCart(parsed);
      }
    } catch (error) {
      console.error('Không thể khôi phục giỏ hàng VNPay:', error);
    } finally {
      sessionStorage.removeItem(VNPAY_CART_STORAGE_KEY);
      handledCartStateRef.current = true;
    }
  }, [status, cart.length, clearCart, replaceCart]);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrderAmount = async () => {
      try {
        const res = await api.get(`/orders/${orderId}`);
        const order = res.data.order || null;
        setTotalAmount(Number(order?.totalAmount) || 0);
      } catch (error) {
      }
    };

    fetchOrderAmount();
  }, [orderId]);

  /**
   * Xử lý khi người dùng nhấn "Thử lại thanh toán" cho đơn hàng VNPAY thất bại
   * - Gọi backend API để lấy paymentUrl mới cho đơn hàng hiện tại (không tạo đơn hàng mới)
   * - Redirect đến trang thanh toán VNPay mới
   */
  const handleRetryPayment = async () => {
    if (isRetrying || !orderId) return;

    setIsRetrying(true);
    setRetryError(null);

    try {
      // Gọi API endpoint mới: POST /orders/:orderId/retry-payment
      // Endpoint này sẽ trả về paymentUrl mới cho đơn hàng tương tự
      const res = await api.post(`/orders/${orderId}/retry-payment`);

      if (res.data.success && res.data.paymentUrl) {
        // Redirect đến trang thanh toán VNPay mới
        window.location.href = res.data.paymentUrl;
      } else {
        setRetryError(res.data.message || 'Không thể lấy URL thanh toán mới');
        setIsRetrying(false);
      }
    } catch (error) {
      console.error('Lỗi khi thử lại thanh toán:', error);
      setRetryError(
        error.response?.data?.message || 'Có lỗi khi xử lý yêu cầu thử lại'
      );
      setIsRetrying(false);
    }
  };

  /**
   * Hủy đơn hàng khi người dùng rời khỏi trang (chỉ khi status === 'failed')
   * Được gọi khi user click "Xem lịch sử đơn hàng" hoặc "Tiếp tục mua sắm"
   * Update: orderStatus -> 'cancelled', paymentStatus -> 'cancelled', release inventory
   */
  const handleCancelOrder = async () => {
    // Chỉ hủy khi status là 'failed' và đơn hàng vẫn ở trạng thái 'pending'
    if (status !== 'failed' || !orderId || retryHandledRef.current) return;

    retryHandledRef.current = true;

    try {
      // Gọi API để hủy đơn hàng: PUT /orders/:orderId/status
      // Truyền orderStatus: 'cancelled'
      await api.put(`/orders/${orderId}/status`, {
        orderStatus: 'cancelled'
      });
    } catch (error) {
      console.error('Không thể hủy đơn hàng:', error);
      // Không hiển thị lỗi cho user, vì đây là xử lý ngầm
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    if (!value || value <= 0) return null;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const orderCode = orderId ? `#${orderId.slice(-8).toUpperCase()}` : null;
  const formattedAmount = formatCurrency(totalAmount);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16 relative">
      {/* Subtle dot-grid texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='1' height='1' fill='%231A1A1B'/%3E%3C/svg%3E\")",
          backgroundSize: "4px 4px",
        }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md relative z-10"
      >
        {/* Wordmark */}
        <motion.div variants={itemVariants} className="text-center mb-10">
          <div className="inline-flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-px bg-[#C9A96E]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#C9A96E]" />
              <div className="w-8 h-px bg-[#C9A96E]" />
            </div>
            <h1 className="text-[42px] font-light tracking-[0.3em] text-foreground leading-none select-none">
              GOLDIE
            </h1>
            <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
              IMPERFECTION            </p>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          variants={itemVariants}
          className="bg-card backdrop-blur-sm border border-border rounded-lg px-8 py-10 shadow-lg"
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center"
          >
            {/* Status icon */}
            <motion.div variants={itemVariants}>
              <StatusIcon status={status} config={config} />
            </motion.div>

            {/* Status text */}
            <motion.div variants={itemVariants} className="text-center mt-6 mb-8">
              <h2 className="text-2xl font-medium text-foreground tracking-wide">
                {config.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-2 tracking-wide leading-relaxed max-w-xs mx-auto">
                {config.description}
              </p>
            </motion.div>

            {/* Order details */}
            {(orderCode || formattedAmount) && (
              <motion.div
                variants={itemVariants}
                className="w-full bg-muted/30 rounded-lg px-5 py-4 mb-8"
              >
                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                  <InfoRow
                    label="Mã đơn hàng"
                    value={orderCode}
                    icon={Receipt}
                    highlight
                  />
                  <InfoRow
                    label="Số tiền"
                    value={formattedAmount}
                    icon={ShoppingBag}
                    highlight
                  />
                </motion.div>
              </motion.div>
            )}

            {/* Action buttons */}
            <motion.div
              variants={itemVariants}
              className="w-full flex flex-col gap-3"
            >
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  handleCancelOrder();
                  navigate('/orders');
                }}
                className="w-full flex items-center justify-center gap-2"
              >
                Xem lịch sử đơn hàng <ArrowRight size={16} />
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  handleCancelOrder();
                  navigate('/products');
                }}
                className="w-full flex items-center justify-center gap-2"
              >
                <ShoppingBag size={16} /> Tiếp tục mua sắm
              </Button>

              {/* Retry button for failed status */}
              {status === "failed" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-1"
                >
                  {/* Error message khi retry thất bại */}
                  {retryError && (
                    <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-600 text-center">
                      {retryError}
                    </div>
                  )}

                  {/* Nút retry payment */}
                  <button
                    type="button"
                    disabled={isRetrying}
                    onClick={handleRetryPayment}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 text-sm tracking-wide underline underline-offset-4",
                      "transition-colors py-2 rounded",
                      isRetrying
                        ? "text-muted-foreground cursor-wait opacity-60"
                        : "text-muted-foreground hover:text-foreground cursor-pointer hover:bg-muted/50"
                    )}
                  >
                    {isRetrying ? (
                      <>
                        <ButtonSpinner />
                        Đang xử lý...
                      </>
                    ) : (
                      "Thử lại thanh toán"
                    )}
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>



        {/* Footer brand note */}
        <motion.p
          variants={itemVariants}
          className="text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-8"
        >
          &copy; {new Date().getFullYear()} Goldie. All rights reserved.
        </motion.p>
      </motion.div>
    </div>
  );
}
