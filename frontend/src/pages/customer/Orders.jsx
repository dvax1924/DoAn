import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axiosInstance';
import socket from '../../api/socket';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders/my-orders');
      setOrders(res.data.orders || []);
    } catch {
      toast.error('Không thể tải lịch sử đơn hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return undefined;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id || payload._id || payload.userId;

      if (!userId) return undefined;

      if (!socket.connected) {
        socket.connect();
      }
      socket.emit('join', userId);

      const handleOrderStatusUpdated = ({ orderId, newStatus }) => {
        setOrders((prev) => prev.map((order) => (
          order._id === orderId ? { ...order, orderStatus: newStatus } : order
        )));

        setSelectedOrder((prev) => (
          prev?._id === orderId ? { ...prev, orderStatus: newStatus } : prev
        ));
      };

      const handleOrderPaymentUpdated = ({ orderId, paymentStatus, orderStatus }) => {
        setOrders((prev) => prev.map((order) => (
          order._id === orderId
            ? { ...order, paymentStatus, orderStatus: orderStatus || order.orderStatus }
            : order
        )));

        setSelectedOrder((prev) => (
          prev?._id === orderId
            ? { ...prev, paymentStatus, orderStatus: orderStatus || prev.orderStatus }
            : prev
        ));
      };

      socket.on('orderStatusUpdated', handleOrderStatusUpdated);
      socket.on('orderPaymentUpdated', handleOrderPaymentUpdated);

      return () => {
        socket.off('orderStatusUpdated', handleOrderStatusUpdated);
        socket.off('orderPaymentUpdated', handleOrderPaymentUpdated);
      };
    } catch (error) {
      console.error('Socket setup error:', error);
      return undefined;
    }
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f39c12';
      case 'confirmed':
        return '#3498db';
      case 'cancelled':
        return '#e74c3c';
      default:
        return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Đang chờ xác nhận';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const openDetail = (order) => {
    setSelectedOrder(order);
  };

  const closeDetail = () => {
    setSelectedOrder(null);
  };

  const openCancelModal = (order) => {
    setOrderToCancel(order);
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!orderToCancel) return;

    try {
      await api.put(`/orders/${orderToCancel._id}/status`, { orderStatus: 'cancelled' });
      toast.success('Đơn hàng đã được hủy thành công');

      setOrders((prev) => prev.map((order) => (
        order._id === orderToCancel._id
          ? {
              ...order,
              orderStatus: 'cancelled',
              paymentStatus: order.paymentStatus === 'paid' ? 'paid' : 'cancelled'
            }
          : order
      )));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể hủy đơn hàng');
    } finally {
      setShowCancelModal(false);
      setOrderToCancel(null);
    }
  };

  if (loading) {
    return <p style={{ textAlign: 'center', padding: '100px' }}>Đang tải lịch sử đơn hàng...</p>;
  }

  return (
    <div style={{ padding: '40px 20px', backgroundColor: '#F5F5F3', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '40px', fontSize: '36px' }}>
          Lịch sử đơn hàng
        </h1>

        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <p style={{ fontSize: '18px', color: '#666' }}>Bạn chưa có đơn hàng nào.</p>
            <Link to="/" style={continueLinkStyle}>
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {orders.map((order) => {
                const canCancel = order.orderStatus === 'pending' && order.paymentMethod !== 'VNPAY';

                return (
                  <div
                    key={order._id}
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '25px',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '20px'
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '15px', color: '#666', marginBottom: '6px' }}>
                        Đơn hàng #{order._id.slice(-8).toUpperCase()}
                      </p>
                      <p style={{ fontSize: '18px', fontWeight: '600' }}>
                        {Number(order.totalAmount || 0).toLocaleString('vi-VN')}đ
                      </p>
                      <p style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                        {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          padding: '6px 16px',
                          borderRadius: '30px',
                          fontSize: '14px',
                          fontWeight: '500',
                          backgroundColor: `${getStatusColor(order.orderStatus)}20`,
                          color: getStatusColor(order.orderStatus)
                        }}
                      >
                        {getStatusText(order.orderStatus)}
                      </span>

                      <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button onClick={() => openDetail(order)} style={darkButtonStyle}>
                          Chi tiết
                        </button>

                        {canCancel && (
                          <button onClick={() => openCancelModal(order)} style={dangerButtonStyle}>
                            Hủy đơn
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: 'center', marginTop: '60px' }}>
              <Link to="/" style={continueLinkStyle}>
                Tiếp tục mua sắm
              </Link>
            </div>
          </>
        )}
      </div>

      {selectedOrder && (
        <div style={overlayStyle} onClick={closeDetail}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '20px' }}>Chi tiết đơn hàng</h2>

            <p><strong>Mã đơn:</strong> #{selectedOrder._id.slice(-8).toUpperCase()}</p>
            <p><strong>Thời gian:</strong> {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
            <p><strong>Tên người nhận:</strong> {selectedOrder.shippingAddress?.name || '—'}</p>
            <p><strong>Số điện thoại:</strong> {selectedOrder.shippingAddress?.phone || '—'}</p>
            <p>
              <strong>Địa chỉ:</strong>{' '}
              {[
                selectedOrder.shippingAddress?.street,
                selectedOrder.shippingAddress?.ward,
                selectedOrder.shippingAddress?.district,
                selectedOrder.shippingAddress?.province
              ].filter(Boolean).join(', ') || '—'}
            </p>
            <p><strong>Tổng tiền:</strong> {Number(selectedOrder.totalAmount || 0).toLocaleString('vi-VN')}đ</p>
            <p><strong>Phương thức thanh toán:</strong> {selectedOrder.paymentMethod || 'COD'}</p>

            <div style={{ marginTop: '30px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <button onClick={closeDetail} style={{ ...darkButtonStyle, flex: 1, padding: '14px' }}>
                Đóng
              </button>

              {selectedOrder.orderStatus === 'pending' && selectedOrder.paymentMethod !== 'VNPAY' && (
                <button
                  onClick={() => {
                    closeDetail();
                    navigate(`/orders/${selectedOrder._id}/edit`);
                  }}
                  style={{ ...infoButtonStyle, flex: 1, padding: '14px' }}
                >
                  Cập nhật thông tin
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showCancelModal && orderToCancel && (
        <div style={overlayStyle}>
          <div
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              maxWidth: '400px',
              textAlign: 'center'
            }}
          >
            <h3>Bạn có chắc muốn hủy đơn hàng này?</h3>
            <p style={{ margin: '20px 0', color: '#666' }}>Hành động này không thể hoàn tác.</p>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setOrderToCancel(null);
                }}
                style={{ flex: 1, padding: '14px', backgroundColor: '#eee', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                Quay lại
              </button>
              <button
                onClick={confirmCancel}
                style={{ flex: 1, padding: '14px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000
};

const modalStyle = {
  background: 'white',
  width: '90%',
  maxWidth: '600px',
  borderRadius: '12px',
  padding: '30px',
  position: 'relative'
};

const baseButtonStyle = {
  padding: '8px 16px',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px'
};

const darkButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: '#1A1A1B'
};

const dangerButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: '#e74c3c'
};

const infoButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: '#3498db'
};

const continueLinkStyle = {
  backgroundColor: '#1A1A1B',
  color: 'white',
  padding: '14px 40px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: '600',
  display: 'inline-block'
};

export default Orders;
