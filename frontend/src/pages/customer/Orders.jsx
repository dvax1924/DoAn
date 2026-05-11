import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axiosInstance';
import socket from '../../api/socket';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';

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
      toast.error("Không thể tải lịch sử đơn hàng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 🔔 Socket.IO: Lắng nghe cập nhật trạng thái đơn hàng real-time
  useEffect(() => {
    // Lấy userId từ token đã lưu
    const token = localStorage.getItem('token');
    if (!token) return;

    // Decode JWT để lấy userId (payload là phần thứ 2)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id || payload._id || payload.userId;

      if (!userId) return;

      // Kết nối socket và join vào room của user
      socket.connect();
      socket.emit('join', userId);

      // Lắng nghe sự kiện cập nhật trạng thái
      socket.on('orderStatusUpdated', (data) => {
        const { orderId, newStatus } = data;

        // Cập nhật trạng thái đơn hàng trong state ngay lập tức
        setOrders(prev => prev.map(order => 
          order._id === orderId 
            ? { ...order, orderStatus: newStatus } 
            : order
        ));

        // Hiển thị thông báo cho customer
        const statusText = {
          confirmed: 'đã được xác nhận ✅',
          shipping: 'đang được giao 🚚',
          delivered: 'đã giao thành công ✅',
          cancelled: 'đã bị hủy ❌',
        };
        const msg = statusText[newStatus] || `đã chuyển sang "${newStatus}"`;
        toast.info(`Đơn hàng #${orderId.slice(-8).toUpperCase()} ${msg}`);
      });
    } catch (e) {
      console.error('Socket setup error:', e);
    }

    // Cleanup khi rời khỏi trang
    return () => {
      socket.off('orderStatusUpdated');
      socket.disconnect();
    };
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'confirmed': return '#3498db';
      case 'shipping': return '#9b59b6';
      case 'delivered': return '#27ae60';
      case 'cancelled': return '#e74c3c';
      default: return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Đang chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'shipping': return 'Đang giao hàng';
      case 'delivered': return 'Đã giao';
      case 'cancelled': return 'Đã hủy';
      default: return status;
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
      toast.success("Đơn hàng đã được hủy thành công");

      setOrders(orders.map(o => 
        o._id === orderToCancel._id ? { ...o, orderStatus: 'cancelled' } : o
      ));
    } catch {
      toast.error("Không thể hủy đơn hàng");
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
            <Link 
              to="/"
              style={{
                backgroundColor: '#1A1A1B',
                color: 'white',
                padding: '14px 36px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                display: 'inline-block',
                marginTop: '20px'
              }}
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {orders.map((order) => (
                <div key={order._id} style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '25px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <p style={{ fontSize: '15px', color: '#666', marginBottom: '6px' }}>
                      Đơn hàng #{order._id.slice(-8).toUpperCase()}
                    </p>
                    <p style={{ fontSize: '18px', fontWeight: '600' }}>
                      {order.totalAmount.toLocaleString('vi-VN')}đ
                    </p>
                    <p style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                      {new Date(order.createdAt).toLocaleDateString('vi-VN', { 
                        hour: '2-digit', minute: '2-digit' 
                      })}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      padding: '6px 16px',
                      borderRadius: '30px',
                      fontSize: '14px',
                      fontWeight: '500',
                      backgroundColor: getStatusColor(order.orderStatus) + '20',
                      color: getStatusColor(order.orderStatus)
                    }}>
                      {getStatusText(order.orderStatus)}
                    </span>

                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      {/* Nút Chi tiết chỉ hiển thị khi chưa hủy */}
                      {order.orderStatus !== 'cancelled' && (
                        <button 
                          onClick={() => openDetail(order)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#1A1A1B',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          Chi tiết
                        </button>
                      )}

                      {/* Nút Hủy đơn chỉ hiển thị khi đang chờ xác nhận */}
                      {order.orderStatus === 'pending' && (
                        <button 
                          onClick={() => openCancelModal(order)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          Hủy đơn
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Nút Tiếp tục mua sắm */}
            <div style={{ textAlign: 'center', marginTop: '60px' }}>
              <Link 
                to="/"
                style={{
                  backgroundColor: '#1A1A1B',
                  color: 'white',
                  padding: '14px 40px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  display: 'inline-block'
                }}
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Modal Chi tiết đơn hàng */}
      {selectedOrder && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
          onClick={closeDetail}
        >
          <div 
            style={{
              background: 'white',
              width: '90%',
              maxWidth: '600px',
              borderRadius: '12px',
              padding: '30px',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}   // ← Đã sửa lỗi
          >
            <h2 style={{ marginBottom: '20px' }}>Chi tiết đơn hàng</h2>
            
            <p><strong>Mã đơn:</strong> #{selectedOrder._id.slice(-8).toUpperCase()}</p>
            <p><strong>Thời gian:</strong> {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
            <p><strong>Tên người nhận:</strong> {selectedOrder.shippingAddress.name}</p>
            <p><strong>Số điện thoại:</strong> {selectedOrder.shippingAddress.phone}</p>
            <p><strong>Địa chỉ:</strong> {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.ward}, {selectedOrder.shippingAddress.district}, {selectedOrder.shippingAddress.province}</p>
            <p><strong>Tổng tiền:</strong> {selectedOrder.totalAmount.toLocaleString('vi-VN')}đ</p>

            <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
              <button 
                onClick={closeDetail}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: '#1A1A1B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>

              {/* Nút Cập nhật thông tin chỉ hiện khi pending */}
              {selectedOrder.orderStatus === 'pending' && (
                <button 
                  onClick={() => {
                    closeDetail();
                    navigate(`/orders/${selectedOrder._id}/edit`);
                  }}
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Cập nhật thông tin
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Popup xác nhận hủy đơn */}
      {showCancelModal && orderToCancel && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <h3>Bạn có chắc muốn hủy đơn hàng này?</h3>
            <p style={{ margin: '20px 0', color: '#666' }}>Hành động này không thể hoàn tác.</p>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={() => { setShowCancelModal(false); setOrderToCancel(null); }}
                style={{ flex: 1, padding: '14px', backgroundColor: '#eee', border: 'none', borderRadius: '8px' }}
              >
                Quay lại
              </button>
              <button 
                onClick={confirmCancel}
                style={{ flex: 1, padding: '14px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px' }}
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

export default Orders;
