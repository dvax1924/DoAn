import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axiosInstance';
import socket from '../../api/socket';
import { toast } from 'react-toastify';
import { FaEye, FaSearch, FaSync } from 'react-icons/fa';

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
                <td style={tdCenterStyle}>{order.shippingAddress?.name || '—'}</td>
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
                    color: getStatusColor(order.orderStatus)
                  }}>
                    {getStatusText(order.orderStatus)}
                  </span>
                </td>
                <td style={tdCenterStyle}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => openOrderDetails(order._id)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        background: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      <FaEye /> Chi tiết
                    </button>

                    {order.orderStatus === 'cancelled' ? (
                      <span style={{ color: '#e74c3c', fontWeight: '500' }}>Đã hủy</span>
                    ) : (
                      <select
                        value={order.orderStatus}
                        onChange={(e) => updateStatus(order._id, e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd' }}
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
                    <p style={detailValueStyle}>{selectedOrder.paymentMethod || 'COD'}</p>
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
