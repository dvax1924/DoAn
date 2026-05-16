

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  Eye,
  RefreshCw,
  X,
  Package,
  User,
  CreditCard,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  ShoppingBag,
  Printer
} from "lucide-react";
import api from "../../api/axiosInstance";
import socket from "../../api/socket";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { TableSkeleton, ORDERS_COLUMNS } from "@/components/ui/TableSkeleton";

const statusOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "pending", label: "Chờ xử lý" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "cancelled", label: "Đã hủy" },
];

const statusConfig = {
  pending: {
    label: "Chờ xử lý",
    color: "bg-amber-100 text-amber-700",
    icon: Clock,
  },
  confirmed: {
    label: "Đã xác nhận",
    color: "bg-blue-100 text-blue-700",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Đã hủy",
    color: "bg-red-100 text-red-700",
    icon: AlertCircle,
  }
};

const statusFlow = ["pending", "confirmed"];

// Helpers from old code
const convertThreeDigitsToVietnamese = (number) => {
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const hundreds = Math.floor(number / 100);
  const tens = Math.floor((number % 100) / 10);
  const ones = number % 10;
  let result = '';

  if (hundreds > 0) {
    result += `${digits[hundreds]} trăm`;
    if (tens === 0 && ones > 0) {
      result += ' lẻ';
    }
  }

  if (tens > 1) {
    result += `${result ? ' ' : ''}${digits[tens]} mươi`;
    if (ones === 1) {
      result += ' mốt';
    } else if (ones === 4) {
      result += ' tư';
    } else if (ones === 5) {
      result += ' lăm';
    } else if (ones > 0) {
      result += ` ${digits[ones]}`;
    }
  } else if (tens === 1) {
    result += `${result ? ' ' : ''}mười`;
    if (ones === 5) {
      result += ' lăm';
    } else if (ones > 0) {
      result += ` ${digits[ones]}`;
    }
  } else if (ones > 0) {
    if (hundreds > 0) {
      result += ` ${digits[ones]}`;
    } else {
      result += digits[ones];
    }
  }

  return result.trim();
};

const convertNumberToVietnameseText = (value) => {
  const number = Math.round(Number(value || 0));
  if (number <= 0) return 'Không đồng';

  const units = ['', 'nghìn', 'triệu', 'tỷ'];
  const chunks = [];
  let remaining = number;

  while (remaining > 0) {
    chunks.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  const parts = [];
  for (let i = chunks.length - 1; i >= 0; i -= 1) {
    const chunk = chunks[i];
    if (chunk === 0) continue;

    const chunkText = convertThreeDigitsToVietnamese(chunk);
    const unit = units[i] || '';
    parts.push(`${chunkText}${unit ? ` ${unit}` : ''}`.trim());
  }

  const sentence = parts.join(' ').replace(/\s+/g, ' ').trim();
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)} đồng`;
};

const escapeHtml = (value) => String(value ?? '—')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatOrderCode = (orderId) => `#${orderId?.toString().slice(-8).toUpperCase() || '--------'}`;

const formatAddress = (shippingAddress) => {
  if (!shippingAddress) return '—';
  const fullAddress = [
    shippingAddress.street,
    shippingAddress.ward,
    shippingAddress.district,
    shippingAddress.province
  ].filter(Boolean).join(', ');
  return fullAddress || '—';
};

const formatPaymentMethodText = (paymentMethod) => {
  switch (paymentMethod) {
    case 'VNPAY': return 'VNPay';
    case 'COD': return 'COD';
    default: return paymentMethod || 'COD';
  }
};

const formatPaymentStatusText = (paymentStatus) => {
  switch (paymentStatus) {
    case 'paid': return 'Đã thanh toán';
    case 'pending': return 'Chờ thanh toán';
    case 'failed': return 'Thanh toán thất bại';
    case 'cancelled': return 'Đã hủy';
    default: return paymentStatus || '—';
  }
};

// Animation variants
/** @type {import('framer-motion').Variants} */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

/** @type {import('framer-motion').Variants} */
const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

/** @type {import('framer-motion').Variants} */
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
};

/** @type {import('framer-motion').Variants} */
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch logic
  const fetchOrders = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      setOrders(res.data.orders || res.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách đơn hàng");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Socket logic
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('joinAdmin');

    const handleNewOrder = (data) => {
      const { order } = data;
      let isNewOrder = false;

      setOrders((prev) => {
        const exists = prev.some((item) => item._id === order._id);
        isNewOrder = !exists;
        return exists ? prev : [order, ...prev];
      });

      if (isNewOrder) {
        toast.info(`📦 Đơn hàng mới #${order._id.slice(-8).toUpperCase()} - ${order.totalAmount?.toLocaleString('vi-VN')}đ`);
      }
    };

    const handlePaymentUpdate = (data) => {
      const { orderId, paymentStatus, orderStatus } = data;
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId
            ? { ...order, paymentStatus, orderStatus: orderStatus || order.orderStatus }
            : order
        )
      );
      fetchOrders();
      if (orderStatus === 'cancelled') {
        toast.info(`Thanh toán VNPay của đơn #${orderId.slice(-8).toUpperCase()} đã bị hủy hoặc thất bại`);
      }
    };

    const handleStatusUpdate = (data) => {
      const { orderId, newStatus, confirmedAt } = data;
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId
            ? { ...order, orderStatus: newStatus, confirmedAt: confirmedAt || order.confirmedAt }
            : order
        )
      );
      
      // Update selectedOrder if it's currently open in modal
      setSelectedOrder((prev) => 
        prev && prev._id === orderId 
          ? { ...prev, orderStatus: newStatus, confirmedAt: confirmedAt || prev.confirmedAt }
          : prev
      );
    };

    socket.on('newOrderCreated', handleNewOrder);
    socket.on('orderPaymentUpdated', handlePaymentUpdate);
    socket.on('orderStatusUpdated', handleStatusUpdate);

    return () => {
      socket.off('newOrderCreated', handleNewOrder);
      socket.off('orderPaymentUpdated', handlePaymentUpdate);
      socket.off('orderStatusUpdated', handleStatusUpdate);
    };
  }, [fetchOrders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    const searchLower = searchQuery.toLowerCase().trim();

    return orders.filter((order) => {
      let matchesSearch = true;

      if (searchLower) {
        const orderIdStr = order._id?.toString().toLowerCase() || "";
        const shortId = order._id?.toString().slice(-8).toLowerCase() || "";
        const idMatch = orderIdStr.includes(searchLower) || shortId.includes(searchLower) || searchLower.includes(shortId);
        const nameMatch = (order.shippingAddress?.name || '').toLowerCase().includes(searchLower);
        const phoneMatch = (order.shippingAddress?.phone || '').toLowerCase().includes(searchLower);
        matchesSearch = idMatch || nameMatch || phoneMatch;
      }

      const matchesStatus = selectedStatus === "all" || order.orderStatus === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, selectedStatus]);

  const openOrderModal = async (orderId) => {
    setIsModalOpen(true);
    setSelectedOrder(null);
    try {
      const res = await api.get(`/orders/${orderId}`);
      setSelectedOrder(res.data.order || res.data);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải chi tiết đơn hàng");
      setIsModalOpen(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const getNextStatus = (currentStatus) => {
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex >= 0 && currentIndex < statusFlow.length - 1) {
      return statusFlow[currentIndex + 1];
    }
    return null;
  };

  const handleUpdateStatus = async (newStatus = null) => {
    if (!selectedOrder) return;
    
    const nextStatus = newStatus || getNextStatus(selectedOrder.orderStatus);
    if (!nextStatus) return;

    setIsUpdating(true);
    
    try {
      const res = await api.put(`/orders/${selectedOrder._id}/status`, { orderStatus: nextStatus });
      const updatedOrder = res.data.order || {};
      toast.success("Cập nhật trạng thái thành công");
      
      setOrders((prev) =>
        prev.map((order) =>
          order._id === selectedOrder._id
            ? { ...order, ...updatedOrder, orderStatus: nextStatus }
            : order
        )
      );

      setSelectedOrder((prev) => prev ? { ...prev, ...updatedOrder, orderStatus: nextStatus } : null);
    } catch (err) {
      // Hiển thị message lỗi từ server (vd: VNPAY chưa thanh toán)
      const serverMsg = err?.response?.data?.message;
      toast.error(serverMsg || "Không thể cập nhật trạng thái");
    } finally {
      setIsUpdating(false);
    }
  };

  const printInvoice = () => {
    if (!selectedOrder || selectedOrder.orderStatus !== 'confirmed') {
      toast.error('Chỉ có thể in hóa đơn cho đơn hàng đã xác nhận');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=960,height=720');
    if (!printWindow) {
      toast.error('Trình duyệt đang chặn cửa sổ in hóa đơn');
      return;
    }

    const invoiceNumber = formatOrderCode(selectedOrder._id);
    const issueDate = new Date();
    const issueDay = String(issueDate.getDate()).padStart(2, '0');
    const issueMonth = String(issueDate.getMonth() + 1).padStart(2, '0');
    const issueYear = issueDate.getFullYear();
    const amountInWords = convertNumberToVietnameseText(selectedOrder.totalAmount);

    const itemsMarkup = selectedOrder.items?.length
      ? selectedOrder.items.map((item, index) => {
          const quantity = Number(item.qty || 0);
          const unitPrice = Number(item.price || 0);
          const itemTotal = quantity * unitPrice;

          return `
            <tr>
              <td class="col-stt">${index + 1}</td>
              <td>${escapeHtml(item.product?.name || 'Sản phẩm không xác định')}</td>
              <td class="col-size">${escapeHtml(item.variant?.size || '—')}</td>
              <td class="col-qty">${quantity}</td>
              <td class="col-price">${escapeHtml(formatCurrency(unitPrice))}</td>
              <td class="col-total">${escapeHtml(formatCurrency(itemTotal))}</td>
            </tr>
          `;
        }).join('')
      : `
        <tr>
          <td colspan="6" style="text-align:center;">Không có dữ liệu sản phẩm</td>
        </tr>
      `;

    const invoiceHtml = `
      <!doctype html>
      <html lang="vi">
        <head>
          <meta charset="utf-8" />
          <title>Hoa don ${escapeHtml(formatOrderCode(selectedOrder._id))}</title>
          <style>
            :root {
              --invoice-blue: #1782c7;
              --invoice-blue-dark: #136aa2;
              --invoice-red: #dd2f2f;
            }
            * { box-sizing: border-box; }
            body {
              font-family: "Times New Roman", serif;
              color: var(--invoice-blue-dark);
              margin: 0;
              background: #fff;
              line-height: 1.35;
            }
            .page {
              width: 210mm;
              min-height: 297mm;
              padding: 18mm 14mm 16mm;
              margin: 0 auto;
              background:
                radial-gradient(circle at top left, rgba(23,130,199,0.08), transparent 28%),
                radial-gradient(circle at bottom right, rgba(23,130,199,0.08), transparent 28%);
            }
            .top-dash {
              border-top: 2px dashed var(--invoice-blue);
              margin-bottom: 16px;
            }
            .header {
              display: block;
              align-items: start;
            }
            .store-name {
              font-size: 32px;
              font-weight: 700;
              margin: 0;
              color: var(--invoice-blue-dark);
            }
            .store-line {
              font-size: 15px;
              margin: 2px 0;
            }
            .invoice-no-row {
              margin-top: 8px;
              display: flex;
              justify-content: flex-end;
              align-items: baseline;
              gap: 10px;
            }
            .invoice-no-label {
              font-size: 20px;
              font-weight: 700;
            }
            .invoice-no-value {
              color: var(--invoice-red);
              font-size: 34px;
              font-weight: 700;
              letter-spacing: 1px;
            }
            .invoice-no-dots {
              border-bottom: 2px dotted var(--invoice-blue);
              width: 180px;
              margin-left: auto;
            }
            .main-title {
              text-align: center;
              margin: 18px 0 12px;
            }
            .main-title h1 {
              margin: 0;
              font-size: 28px;
              color: var(--invoice-blue-dark);
              font-weight: 700;
            }
            .main-title p {
              margin: 4px 0 0;
              font-size: 18px;
            }
            .info-row {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 18px;
              margin-bottom: 10px;
              font-size: 18px;
            }
            .line-field {
              display: flex;
              align-items: baseline;
              gap: 8px;
              min-width: 0;
            }
            .line-field .label {
              white-space: nowrap;
              font-size: 18px;
            }
            .line-field .value {
              flex: 1;
              border-bottom: 2px dotted var(--invoice-blue);
              min-height: 26px;
              font-size: 18px;
              font-weight: 600;
              color: var(--invoice-blue-dark);
              padding-bottom: 2px;
              word-break: break-word;
            }
            .line-field.full {
              grid-column: 1 / -1;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 14px;
              color: var(--invoice-blue-dark);
            }
            th, td {
              border: 2px solid rgba(23,130,199,0.85);
              padding: 9px 10px;
              vertical-align: top;
              font-size: 18px;
            }
            th {
              text-align: center;
              font-size: 17px;
              font-weight: 700;
            }
            tbody td {
              border-style: solid;
            }
            tbody tr:not(:last-child) td {
              border-bottom-style: dotted;
            }
            .col-stt, .col-qty, .col-size {
              text-align: center;
              width: 64px;
            }
            .col-price, .col-total {
              text-align: right;
              width: 145px;
              white-space: nowrap;
            }
            .summary-row td {
              font-weight: 700;
              font-size: 19px;
            }
            .summary-label {
              text-align: center;
            }
            .text-line {
              margin-top: 16px;
              display: flex;
              gap: 8px;
              align-items: baseline;
              font-size: 18px;
            }
            .text-line .value {
              flex: 1;
              border-bottom: 2px dotted var(--invoice-blue);
              min-height: 30px;
              font-weight: 600;
              padding-bottom: 2px;
            }
            .notes {
              margin-top: 10px;
              font-size: 17px;
            }
            .notes-title {
              font-weight: 700;
              margin-bottom: 4px;
            }
            .notes ol {
              margin: 6px 0 0 22px;
              padding: 0;
            }
            .sign-date {
              text-align: right;
              margin-top: 8px;
              font-style: italic;
              font-size: 18px;
            }
            .signatures {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-top: 28px;
              text-align: center;
            }
            .sign-title {
              font-size: 18px;
              font-weight: 700;
              text-transform: uppercase;
            }
            .sign-note {
              font-size: 15px;
              font-style: italic;
            }
            .sign-space {
              height: 82px;
            }
            @media print {
              body { margin: 0; }
              .page { margin: 0; width: auto; min-height: auto; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="top-dash"></div>
            <div class="header">
              <div>
                <p class="store-name">GOLDIE VIETNAM</p>
                <p class="store-line">Địa chỉ: 360 Phố Huế</p>
                <p class="store-line">Điện thoại: 0985 032 589</p>
                <p class="store-line">Email: info@goldievietnam.com</p>
                <div class="invoice-no-row">
                  <span class="invoice-no-label">Mã đơn hàng:</span>
                  <span class="invoice-no-value">${escapeHtml(invoiceNumber)}</span>
                </div>
                <div class="invoice-no-dots"></div>
              </div>
            </div>

            <div class="main-title">
              <h1>HÓA ĐƠN BÁN LẺ</h1>
            </div>

            <div class="info-row">
              <div class="line-field">
                <span class="label">Khách hàng:</span>
                <span class="value">${escapeHtml(selectedOrder.shippingAddress?.name || selectedOrder.user?.name || '—')}</span>
              </div>
              <div class="line-field">
                <span class="label">Điện thoại:</span>
                <span class="value">${escapeHtml(selectedOrder.shippingAddress?.phone || selectedOrder.user?.phone || '—')}</span>
              </div>
              <div class="line-field full">
                <span class="label">Địa chỉ:</span>
                <span class="value">${escapeHtml(formatAddress(selectedOrder.shippingAddress))}</span>
              </div>
              <div class="line-field">
                <span class="label">Ngày mua:</span>
                <span class="value">${escapeHtml(formatDate(selectedOrder.createdAt))}</span>
              </div>
              <div class="line-field">
                <span class="label">Thanh toán:</span>
                <span class="value">${escapeHtml(formatPaymentMethodText(selectedOrder.paymentMethod))}</span>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th class="col-stt">STT</th>
                  <th>Tên sản phẩm</th>
                  <th class="col-size">Size</th>
                  <th class="col-qty">Số lượng</th>
                  <th class="col-price">Đơn giá</th>
                  <th class="col-total">Thành tiền</th>
                </tr>
              </thead>
              <tbody>${itemsMarkup}</tbody>
              <tfoot>
                <tr class="summary-row">
                  <td colspan="4" class="summary-label">Tổng</td>
                  <td colspan="2" class="col-total">${escapeHtml(formatCurrency(selectedOrder.totalAmount))}</td>
                </tr>
              </tfoot>
            </table>

            <div class="text-line">
              <span>Tổng tiền (ghi bằng chữ):</span>
              <span class="value">${escapeHtml(amountInWords)}</span>
            </div>

            <div class="notes">
              <div class="notes-title">Điều kiện bảo hành:</div>
              <ol>
                <li>Sản phẩm được hỗ trợ theo chính sách bán hàng và bảo hành hiện hành của cửa hàng.</li>
                <li>Hóa đơn và thông tin đơn hàng phải còn rõ ràng, không bị chỉnh sửa.</li>
                <li>Không áp dụng bảo hành với hư hỏng do sử dụng sai cách hoặc tác động từ bên ngoài.</li>
                <li>Vui lòng liên hệ cửa hàng trước khi gửi sản phẩm cần hỗ trợ.</li>
              </ol>
            </div>

            <div class="sign-date">Ngày ${issueDay} tháng ${issueMonth} năm ${issueYear}</div>

            <div class="signatures">
              <div>
                <div class="sign-title">Khách hàng</div>
                <div class="sign-note">(Ký, ghi rõ họ tên)</div>
                <div class="sign-space"></div>
              </div>
              <div>
                <div class="sign-title">Người bán hàng</div>
                <div class="sign-note">(Ký, ghi rõ họ tên)</div>
                <div class="sign-space"></div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  return (
    <div className="min-h-screen bg-[#F5F4F0]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1B] sm:text-3xl">
              Quản lý Đơn hàng
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Theo dõi và cập nhật trạng thái đơn hàng
            </p>
          </div>
          <button
            onClick={fetchOrders}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1A1A1B] px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-black hover:shadow-xl"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={2} />
            Tải lại
          </button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center"
        >
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              strokeWidth={1.5}
            />
            <input
              type="text"
              placeholder="Tìm kiếm mã đơn hàng, tên khách hoặc SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border-0 bg-white py-3.5 pl-12 pr-4 text-sm text-[#1A1A1B] placeholder-gray-400 shadow-sm ring-1 ring-inset ring-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-[#1A1A1B]"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="inline-flex min-w-48 items-center justify-between gap-2 rounded-xl bg-white px-4 py-3.5 text-sm font-medium text-[#1A1A1B] shadow-sm ring-1 ring-inset ring-gray-200 transition-all hover:ring-gray-300"
            >
              <span>
                {statusOptions.find((s) => s.value === selectedStatus)?.label}
              </span>
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", isStatusDropdownOpen && "rotate-180")}
                strokeWidth={2}
              />
            </motion.button>

            <AnimatePresence>
              {isStatusDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 z-20 mt-2 w-full min-w-48 rounded-xl bg-white py-2 shadow-xl ring-1 ring-gray-200"
                >
                  {statusOptions.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => {
                        setSelectedStatus(status.value);
                        setIsStatusDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full px-4 py-2.5 text-left text-sm transition-colors",
                        selectedStatus === status.value
                          ? "bg-[#F5F4F0] font-medium text-[#1A1A1B]"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      {status.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Orders Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {loading ? (
            <TableSkeleton rows={6} columns={ORDERS_COLUMNS} />
          ) : (
            <div
              className="overflow-hidden rounded-2xl bg-white shadow-sm"
              style={{ boxShadow: "0 4px 24px -4px rgba(0, 0, 0, 0.06)" }}
            >
              {/* Table Header */}
              <div className="hidden border-b border-gray-100 bg-gray-50/50 px-6 py-4 lg:grid lg:grid-cols-12 lg:gap-4">
                <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Mã đơn
                </div>
                <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Ngày đặt
                </div>
                <div className="col-span-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Khách hàng
                </div>
                <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Tổng tiền
                </div>
                <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Trạng thái
                </div>
                <div className="col-span-1 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right whitespace-nowrap">
                  Hành động
                </div>
              </div>

              {/* Table Body */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => {
                      const statusInfo = statusConfig[order.orderStatus] || statusConfig.pending;
                      const StatusIcon = statusInfo.icon;
                      return (
                        <motion.div
                          key={order._id}
                          variants={rowVariants}
                          exit="exit"
                          layout
                          whileHover={{ backgroundColor: "rgba(245, 244, 240, 0.5)" }}
                          className="grid grid-cols-1 gap-4 border-b border-gray-100 px-6 py-5 transition-colors last:border-b-0 lg:grid-cols-12 lg:items-center"
                        >
                          {/* Order ID */}
                          <div className="col-span-2">
                            <p className="font-semibold text-[#1A1A1B]">
                              {formatOrderCode(order._id)}
                            </p>
                          </div>

                          {/* Date */}
                          <div className="col-span-2">
                            <p className="text-sm text-gray-600">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>

                          {/* Customer */}
                          <div className="col-span-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#F5F4F0]">
                                <User
                                  className="h-5 w-5 text-[#1A1A1B]"
                                  strokeWidth={1.5}
                                />
                              </div>
                              <div>
                                <p className="font-medium text-[#1A1A1B]">
                                  {order.shippingAddress?.name || order.user?.name || '—'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {order.shippingAddress?.phone || order.user?.phone || '—'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Total */}
                          <div className="col-span-2">
                            <p className="font-semibold text-[#1A1A1B]">
                              {formatCurrency(order.totalAmount)}
                            </p>
                          </div>

                          {/* Status */}
                          <div className="col-span-2">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
                                statusInfo.color
                              )}
                            >
                              <StatusIcon className="h-3.5 w-3.5" strokeWidth={2} />
                              {statusInfo.label}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="col-span-1 flex items-center justify-end gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => openOrderModal(order._id)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5F4F0] px-3 py-2 text-xs font-medium text-[#1A1A1B] transition-colors hover:bg-[#1A1A1B] hover:text-white"
                            >
                              <Eye className="h-3.5 w-3.5" strokeWidth={2} />
                              Xem
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-16 text-center"
                    >
                      <ShoppingBag
                        className="mb-4 h-12 w-12 text-gray-300"
                        strokeWidth={1}
                      />
                      <p className="text-sm font-medium text-gray-500">
                        Không tìm thấy đơn hàng nào
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Thử thay đổi bộ lọc tìm kiếm
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Order Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 text-center text-sm text-gray-500"
        >
          Hiển thị {filteredOrders.length} / {orders.length} đơn hàng
        </motion.div>
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {isModalOpen && selectedOrder && (
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 sm:p-8"
              style={{ boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.18)" }}
            >
              {/* Modal Header */}
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[#1A1A1B]">
                    Chi tiết đơn hàng
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {formatOrderCode(selectedOrder._id)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedOrder.orderStatus !== 'cancelled' && selectedOrder.orderStatus !== 'pending' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={printInvoice}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#F5F4F0] px-3 py-2 text-sm font-medium text-[#1A1A1B] transition-colors hover:bg-gray-200"
                    >
                      <Printer className="h-4 w-4" strokeWidth={2} />
                      In hóa đơn
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={closeModal}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" strokeWidth={2} />
                  </motion.button>
                </div>
              </div>

              {/* Order Status */}
              <div className="mb-6 rounded-xl bg-[#F5F4F0]/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const statusInfo = statusConfig[selectedOrder.orderStatus] || statusConfig.pending;
                      const StatusIcon = statusInfo.icon;
                      return (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium",
                            statusInfo.color
                          )}
                        >
                          <StatusIcon className="h-4 w-4" strokeWidth={2} />
                          {statusInfo.label}
                        </span>
                      );
                    })()}
                  </div>
                <div className="flex items-center gap-2">
                    {selectedOrder.orderStatus === 'pending' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleUpdateStatus('cancelled')}
                        disabled={isUpdating}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-50 text-red-600 px-4 py-2.5 text-sm font-medium transition-all hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Hủy đơn
                      </motion.button>
                    )}
                    {selectedOrder.orderStatus === 'pending' && (() => {
                      // Đơn VNPAY chưa thanh toán: disable nút và hiển thị tooltip warning
                      const isVnpayUnpaid =
                        selectedOrder.paymentMethod === 'VNPAY' &&
                        selectedOrder.paymentStatus !== 'paid';

                      return (
                        <div className="relative group">
                          <motion.button
                            whileHover={!isVnpayUnpaid ? { scale: 1.02 } : {}}
                            whileTap={!isVnpayUnpaid ? { scale: 0.98 } : {}}
                            onClick={() => !isVnpayUnpaid && handleUpdateStatus('confirmed')}
                            disabled={isUpdating || isVnpayUnpaid}
                            className={cn(
                              "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                              isVnpayUnpaid
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-[#1A1A1B] text-white hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                            )}
                          >
                            {isUpdating ? (
                              <RefreshCw className="h-4 w-4 animate-spin" strokeWidth={2} />
                            ) : (
                              <CheckCircle className="h-4 w-4" strokeWidth={2} />
                            )}
                            Xác nhận
                          </motion.button>
                          {/* Tooltip chỉ hiển thị khi VNPay chưa thanh toán */}
                          {isVnpayUnpaid && (
                            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10 w-64">
                              <div className="rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg">
                                Không thể xác nhận vì thanh toán VNPay chưa thành công
                                <div className="absolute -bottom-1 right-6 h-2 w-2 rotate-45 bg-gray-900" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Warning banner khi đơn VNPAY chưa được thanh toán */}
                {selectedOrder.orderStatus === 'pending' &&
                  selectedOrder.paymentMethod === 'VNPAY' &&
                  selectedOrder.paymentStatus !== 'paid' && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
                      <p className="text-xs text-amber-700 leading-relaxed">
                        <span className="font-semibold">VNPay chưa thanh toán</span> — Đơn hàng này chỉ có thể xác nhận sau khi khách hàng hoàn tất thanh toán qua VNPay.
                        Trạng thái hiện tại:{' '}
                        <span className="font-medium">{formatPaymentStatusText(selectedOrder.paymentStatus)}</span>.
                      </p>
                    </div>
                )}

                {/* Status Progress */}
                {selectedOrder.orderStatus !== 'cancelled' && (
                  <div className="mt-4 flex items-center justify-between">
                    {statusFlow.map((status, index) => {
                      const isCompleted =
                        statusFlow.indexOf(selectedOrder.orderStatus) >= index;
                      const isCurrent = selectedOrder.orderStatus === status;
                      return (
                        <div key={status} className="flex flex-1 items-center">
                          <div className="flex flex-col items-center">
                            <div
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors",
                                isCompleted
                                  ? "bg-[#1A1A1B] text-white"
                                  : "bg-gray-200 text-gray-500",
                                isCurrent && "ring-2 ring-[#1A1A1B] ring-offset-2"
                              )}
                            >
                              {index + 1}
                            </div>
                            <span
                              className={cn(
                                "mt-1.5 text-xs",
                                isCompleted ? "font-medium text-[#1A1A1B]" : "text-gray-400"
                              )}
                            >
                              {statusConfig[status].label}
                            </span>
                          </div>
                          {index < statusFlow.length - 1 && (
                            <div
                              className={cn(
                                "mx-2 h-0.5 flex-1 transition-colors",
                                statusFlow.indexOf(selectedOrder.orderStatus) > index
                                  ? "bg-[#1A1A1B]"
                                  : "bg-gray-200"
                              )}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div className="mb-6">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1A1A1B]">
                  <User className="h-4 w-4" strokeWidth={2} />
                  Thông tin khách hàng
                </h3>
                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-gray-500">Họ tên</p>
                      <p className="font-medium text-[#1A1A1B]">
                        {selectedOrder.shippingAddress?.name || selectedOrder.user?.name || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Số điện thoại</p>
                      <p className="font-medium text-[#1A1A1B]">
                        {selectedOrder.shippingAddress?.phone || selectedOrder.user?.phone || '—'}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs text-gray-500">Địa chỉ</p>
                      <p className="font-medium text-[#1A1A1B]">
                        {formatAddress(selectedOrder.shippingAddress)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1A1A1B]">
                  <Package className="h-4 w-4" strokeWidth={2} />
                  Sản phẩm ({selectedOrder.items?.length || 0})
                </h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-xl bg-gray-50 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-gray-200 overflow-hidden">
                          {item.product?.images?.[0] ? (
                            <img src={item.product.images[0]} alt={item.product?.name} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-full w-full p-3 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[#1A1A1B]">{item.product?.name || "Sản phẩm đã xóa"}</p>
                          <p className="text-xs text-gray-500">
                            Size: {item.variant?.size || '—'} | Số lượng: {item.qty}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-[#1A1A1B]">
                        {formatCurrency(item.price * item.qty)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="rounded-xl bg-[#F5F4F0]/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <CreditCard className="h-3 w-3" strokeWidth={1.5} /> PTTT
                      </p>
                      <span className="text-sm font-medium text-[#1A1A1B]">
                        {formatPaymentMethodText(selectedOrder.paymentMethod)}
                      </span>
                    </div>
                    <div className="w-px h-8 bg-gray-300"></div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" strokeWidth={1.5} /> Thanh toán
                      </p>
                      <span className="text-sm font-medium text-[#1A1A1B]">
                        {formatPaymentStatusText(selectedOrder.paymentStatus)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Tổng cộng</p>
                    <p className="text-xl font-bold text-[#1A1A1B]">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={closeModal}
                className="mt-6 w-full rounded-xl border border-gray-300 bg-white py-3.5 text-sm font-medium text-[#1A1A1B] transition-colors hover:bg-gray-50"
              >
                Đóng
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
