import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axiosInstance';
import socket from '../../api/socket';
import { toast } from 'react-toastify';
import { FaEye, FaPrint, FaSearch, FaSync } from 'react-icons/fa';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  // 🔔 Socket.IO: Lắng nghe đơn hàng mới từ customer real-time
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('joinAdmin');

    socket.on('newOrderCreated', (data) => {
      const { order } = data;

      let isNewOrder = false;

      // Tránh trùng đơn khi cùng một đơn được đồng bộ nhiều lần
      setOrders((prev) => {
        const exists = prev.some((item) => item._id === order._id);
        isNewOrder = !exists;
        return exists ? prev : [order, ...prev];
      });

      if (isNewOrder) {
        toast.info(`📦 Đơn hàng mới #${order._id.slice(-8).toUpperCase()} - ${order.totalAmount?.toLocaleString('vi-VN')}đ`);
      }
    });

    socket.on('orderPaymentUpdated', (data) => {
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
    });

    return () => {
      socket.off('newOrderCreated');
      socket.off('orderPaymentUpdated');
    };
  }, [fetchOrders]);

  // ==================== LỌC ĐƠN HÀNG (ĐÃ SỬA HOÀN CHỈNH) ====================
  const filteredOrders = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();

    return orders.filter((order) => {
      // Kiểm tra tìm kiếm (mã đơn, tên khách, SĐT)
      let matchesSearch = true;

      if (searchLower) {
        const orderIdStr = order._id.toString().toLowerCase();
        const shortId = order._id.toString().slice(-8).toLowerCase();

        const idMatch = 
          orderIdStr.includes(searchLower) || 
          shortId.includes(searchLower) ||
          searchLower.includes(shortId);

        const nameMatch = (order.shippingAddress?.name || '')
          .toLowerCase()
          .includes(searchLower);

        const phoneMatch = (order.shippingAddress?.phone || '')
          .toLowerCase()
          .includes(searchLower);

        matchesSearch = idMatch || nameMatch || phoneMatch;
      }

      // Kiểm tra lọc trạng thái
      if (statusFilter === 'all') {
        return matchesSearch;
      }
      return matchesSearch && order.orderStatus === statusFilter;
    });
  }, [orders, searchTerm, statusFilter]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { orderStatus: newStatus });
      toast.success("Cập nhật trạng thái thành công");
      fetchOrders();
    } catch {
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'confirmed': return '#3498db';
      case 'cancelled': return '#e74c3c';
      default: return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Đang chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const formatOrderCode = (orderId) => `#${orderId?.toString().slice(-8).toUpperCase() || '--------'}`;

  const formatCurrency = (amount) => `${Number(amount || 0).toLocaleString('vi-VN')}đ`;

  const formatOrderDate = (date, includeTime = false) => {
    if (!date) return '—';

    return new Date(date).toLocaleString(
      'vi-VN',
      includeTime
        ? {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }
        : {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }
    );
  };

  const formatAddress = (shippingAddress) => {
    if (!shippingAddress) return '—';

    const fullAddress = [
      shippingAddress.street,
      shippingAddress.ward,
      shippingAddress.district,
      shippingAddress.province
    ]
      .filter(Boolean)
      .join(', ');

    return fullAddress || '—';
  };

  const formatPaymentMethodText = (paymentMethod) => {
    switch (paymentMethod) {
      case 'VNPAY':
        return 'VNPay';
      case 'COD':
        return 'COD';
      default:
        return paymentMethod || 'COD';
    }
  };

  const formatPaymentStatusText = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid':
        return 'Đã thanh toán';
      case 'pending':
        return 'Chờ thanh toán';
      case 'failed':
        return 'Thanh toán thất bại';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return paymentStatus || '—';
    }
  };

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

  const openOrderDetails = async (orderId) => {
    setShowDetailModal(true);
    setDetailLoading(true);
    setSelectedOrder(null);

    try {
      const res = await api.get(`/orders/${orderId}`);
      setSelectedOrder(res.data.order || res.data);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải chi tiết đơn hàng");
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeOrderDetails = () => {
    setShowDetailModal(false);
    setSelectedOrder(null);
    setDetailLoading(false);
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
                <span class="value">${escapeHtml(formatOrderDate(selectedOrder.createdAt, true))}</span>
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

  if (loading) {
    return <p style={{ textAlign: 'center', padding: '100px' }}>Đang tải đơn hàng...</p>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', margin: 0 }}>Quản lý Đơn hàng</h1>
        <button 
          onClick={fetchOrders}
          style={{
            padding: '12px 24px',
            backgroundColor: '#1A1A1B',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <FaSync /> Tải lại
        </button>
      </div>

      {/* Thanh tìm kiếm + Lọc trạng thái */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <div style={{ flex: 1, background: 'white', padding: '12px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center' }}>
          <FaSearch style={{ marginRight: '12px', color: '#999' }} />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, tên khách hoặc SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '16px' }}
          />
        </div>

        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid #ddd', background: 'white' }}
        >
          <option value="all">Tất cả</option>
          <option value="pending">Đang chờ xác nhận</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      {/* Bảng - Căn giữa toàn bộ */}
      <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f8f8', borderBottom: '2px solid #eee' }}>
              <th style={thCenterStyle}>Mã đơn</th>
              <th style={thCenterStyle}>Khách hàng</th>
              <th style={thCenterStyle}>SĐT</th>
              <th style={thCenterStyle}>Tổng tiền</th>
              <th style={thCenterStyle}>Ngày đặt</th>
              <th style={thCenterStyle}>Trạng thái</th>
              <th style={thCenterStyle}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdCenterStyle}>{formatOrderCode(order._id)}</td>
                <td style={{ ...tdCenterStyle, whiteSpace: 'nowrap' }}>{order.shippingAddress?.name || '—'}</td>
                <td style={tdCenterStyle}>{order.shippingAddress?.phone || '—'}</td>
                <td style={tdCenterStyle}>
                  {formatCurrency(order.totalAmount)}
                </td>
                <td style={tdCenterStyle}>
                  {formatOrderDate(order.createdAt)}
                </td>
                <td style={tdCenterStyle}>
                  <span style={{
                    padding: '8px 18px',
                    borderRadius: '30px',
                    fontSize: '14px',
                    backgroundColor: getStatusColor(order.orderStatus) + '20',
                    color: getStatusColor(order.orderStatus),
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    whiteSpace: 'nowrap',
                    minWidth: '180px'
                  }}>
                    {getStatusText(order.orderStatus)}
                  </span>
                </td>
                <td style={tdCenterStyle}>
                  <div style={actionControlsStyle}>
                    <button
                      onClick={() => openOrderDetails(order._id)}
                      style={actionButtonStyle}
                    >
                      <FaEye /> Chi tiết
                    </button>

                    {order.orderStatus === 'cancelled' ? (
                      <span style={actionStatusTextStyle}>Đã hủy</span>
                    ) : (
                      <select
                        value={order.orderStatus}
                        onChange={(e) => updateStatus(order._id, e.target.value)}
                        style={actionSelectStyle}
                      >
                        {order.orderStatus === 'pending' && <option value="pending">Đang chờ</option>}
                        <option value="confirmed">Xác nhận</option>
                        <option value="cancelled">Hủy</option>
                      </select>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredOrders.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#666' }}>
          <p style={{ fontSize: '18px' }}>Không tìm thấy đơn hàng nào phù hợp</p>
        </div>
      )}

      {showDetailModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
              <div>
                <h2 style={{ margin: '0 0 8px', fontSize: '28px' }}>Chi tiết đơn hàng</h2>
                <p style={{ margin: 0, color: '#666' }}>
                  {selectedOrder ? formatOrderCode(selectedOrder._id) : 'Đang tải dữ liệu đơn hàng...'}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {!detailLoading && selectedOrder?.orderStatus === 'confirmed' && (
                  <button
                    onClick={printInvoice}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#1A1A1B',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FaPrint /> In hóa đơn
                  </button>
                )}

                <button
                  onClick={closeOrderDetails}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1px solid #ddd',
                    background: 'white',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>

            {detailLoading && (
              <p style={{ textAlign: 'center', padding: '40px 0', margin: 0 }}>
                Đang tải chi tiết đơn hàng...
              </p>
            )}

            {!detailLoading && selectedOrder && (
              <>
                <div style={detailGridStyle}>
                  <div style={detailCardStyle}>
                    <p style={detailLabelStyle}>Mã đơn</p>
                    <p style={detailValueStyle}>{formatOrderCode(selectedOrder._id)}</p>
                  </div>

                  <div style={detailCardStyle}>
                    <p style={detailLabelStyle}>Ngày mua</p>
                    <p style={detailValueStyle}>{formatOrderDate(selectedOrder.createdAt, true)}</p>
                  </div>

                  <div style={detailCardStyle}>
                    <p style={detailLabelStyle}>Giá tiền</p>
                    <p style={detailValueStyle}>{formatCurrency(selectedOrder.totalAmount)}</p>
                  </div>

                  <div style={detailCardStyle}>
                    <p style={detailLabelStyle}>Phương thức thanh toán</p>
                    <p style={detailValueStyle}>{formatPaymentMethodText(selectedOrder.paymentMethod)}</p>
                  </div>

                  <div style={detailCardStyle}>
                    <p style={detailLabelStyle}>Trạng thái thanh toán</p>
                    <p style={detailValueStyle}>{formatPaymentStatusText(selectedOrder.paymentStatus)}</p>
                  </div>

                  <div style={detailCardStyle}>
                    <p style={detailLabelStyle}>Tên khách hàng</p>
                    <p style={detailValueStyle}>
                      {selectedOrder.shippingAddress?.name || selectedOrder.user?.name || '—'}
                    </p>
                  </div>

                  <div style={detailCardStyle}>
                    <p style={detailLabelStyle}>Số điện thoại</p>
                    <p style={detailValueStyle}>
                      {selectedOrder.shippingAddress?.phone || selectedOrder.user?.phone || '—'}
                    </p>
                  </div>

                  <div style={detailCardStyle}>
                    <p style={detailLabelStyle}>Địa chỉ</p>
                    <p style={detailValueStyle}>{formatAddress(selectedOrder.shippingAddress)}</p>
                  </div>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <p style={{ ...detailLabelStyle, marginBottom: '12px' }}>Tên sản phẩm</p>

                  <div style={{ display: 'grid', gap: '12px' }}>
                    {selectedOrder.items?.length ? (
                      selectedOrder.items.map((item, index) => (
                        <div
                          key={`${item.product?._id || item.product || 'item'}-${index}`}
                          style={{
                            border: '1px solid #eee',
                            borderRadius: '12px',
                            padding: '16px 18px',
                            background: '#fafafa'
                          }}
                        >
                          <p style={{ margin: '0 0 8px', fontWeight: '600', color: '#1A1A1B' }}>
                            {item.product?.name || 'Sản phẩm không xác định'}
                          </p>
                          <p style={{ margin: '0 0 4px', color: '#555' }}>
                            Số lượng: {item.qty} {item.variant?.size ? `| Size: ${item.variant.size}` : ''}
                          </p>
                          <p style={{ margin: 0, color: '#555' }}>
                            Đơn giá: {formatCurrency(item.price)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div style={{ ...detailCardStyle, textAlign: 'center' }}>
                        Không có dữ liệu sản phẩm
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ==================== STYLE CĂN GIỮA ==================== */
const thCenterStyle = {
  padding: '18px 20px',
  textAlign: 'center',
  fontWeight: '600'
};

const tdCenterStyle = {
  padding: '16px 20px',
  color: '#444',
  textAlign: 'center'
};

const actionControlsStyle = {
  display: 'grid',
  gridTemplateColumns: '104px 96px',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '10px'
};

const actionButtonStyle = {
  width: '104px',
  padding: '8px 10px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  background: 'white',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  cursor: 'pointer',
  fontWeight: '500'
};

const actionSelectStyle = {
  width: '96px',
  padding: '8px 10px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  background: 'white'
};

const actionStatusTextStyle = {
  width: '96px',
  color: '#e74c3c',
  fontWeight: '500',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  zIndex: 3000
};

const modalContentStyle = {
  width: '100%',
  maxWidth: '900px',
  maxHeight: '90vh',
  overflowY: 'auto',
  background: 'white',
  borderRadius: '18px',
  padding: '32px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.18)'
};

const detailGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '16px'
};

const detailCardStyle = {
  padding: '18px',
  borderRadius: '14px',
  background: '#fafafa',
  border: '1px solid #eee'
};

const detailLabelStyle = {
  margin: '0 0 8px',
  color: '#666',
  fontSize: '14px',
  fontWeight: '500'
};

const detailValueStyle = {
  margin: 0,
  color: '#1A1A1B',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '1.5'
};



export default AdminOrders;
