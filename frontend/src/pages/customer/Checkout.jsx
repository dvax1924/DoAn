import React, { useState, useEffect } from 'react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || '',
    phone: '',
    street: '',
    ward: '',
    district: '',
    province: ''
  });

  const [loading, setLoading] = useState(false);

  // Debug giỏ hàng
  useEffect(() => {
    console.log("=== DỮ LIỆU GIỎ HÀNG Ở CHECKOUT ===");
    console.log("Cart:", cart);
    console.log("CartTotal:", cartTotal);
  }, [cart, cartTotal]);

  // Kiểm tra đăng nhập
  useEffect(() => {
    if (!user) {
      toast.warning("Vui lòng đăng nhập để thanh toán");
      navigate('/login');
    }
  }, [user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const onlyNumbers = value.replace(/[^0-9]/g, '');
      setShippingAddress(prev => ({ ...prev, [name]: onlyNumbers }));
    } else {
      setShippingAddress(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmitOrder = async (e) => {
  e.preventDefault();

  if (cart.length === 0) {
    toast.error("Giỏ hàng trống!");
    return;
  }

  // Sử dụng trực tiếp cartTotal từ context (đã tính sẵn và chính xác)
  const finalTotal = Number(cartTotal);

  console.log("=== PAYLOAD GỬI SERVER ===");
  console.log("totalAmount:", finalTotal);
  console.log("Cart data:", cart);

  const orderItems = cart.map(item => ({
    product: item.product,
    variant: item.variant,
    qty: item.qty,
    price: Number(item.price) || 0
  }));

  console.log("orderItems:", orderItems);

  if (isNaN(finalTotal) || finalTotal <= 0) {
    toast.error("Giá trị đơn hàng không hợp lệ!");
    return;
  }

  setLoading(true);

  try {
    const res = await api.post('/orders', {
      items: orderItems,
      shippingAddress,
      totalAmount: finalTotal,
      paymentMethod: 'COD'
    });

    if (res.data.success) {
      toast.success("Đặt hàng thành công!");
      clearCart();
      navigate('/orders');
    }
  } catch (error) {
    console.error("Lỗi đặt hàng:", error.response?.data || error);
    toast.error(error.response?.data?.message || "Đặt hàng thất bại");
  } finally {
    setLoading(false);
  }
};

  if (!user) return null;

  if (cart.length === 0) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h2>Giỏ hàng trống</h2>
        <p>Vui lòng thêm sản phẩm trước khi thanh toán.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px', backgroundColor: '#F5F5F3', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '40px', fontSize: '36px' }}>
          Thanh toán
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>

          {/* Form địa chỉ */}
          <div>
            <h2 style={{ marginBottom: '25px' }}>Thông tin giao hàng</h2>
            <form onSubmit={handleSubmitOrder}>
              <div style={{ marginBottom: '20px' }}>
                <label>Họ và tên *</label>
                <input type="text" name="name" value={shippingAddress.name} onChange={handleInputChange} required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '8px' }} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label>Số điện thoại *</label>
                <input type="tel" name="phone" value={shippingAddress.phone} onChange={handleInputChange} maxLength={11} required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '8px' }} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label>Địa chỉ chi tiết *</label>
                <input type="text" name="street" value={shippingAddress.street} onChange={handleInputChange} required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '8px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label>Phường/Xã *</label>
                  <input type="text" name="ward" value={shippingAddress.ward} onChange={handleInputChange} required
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '8px' }} />
                </div>
                <div>
                  <label>Quận/Huyện *</label>
                  <input type="text" name="district" value={shippingAddress.district} onChange={handleInputChange} required
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '8px' }} />
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <label>Tỉnh/Thành phố</label>
                <input type="text" name="province" value={shippingAddress.province} onChange={handleInputChange}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '8px' }} />
              </div>

              <button 
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '40px', width: '100%', padding: '18px',
                  backgroundColor: '#1A1A1B', color: 'white', border: 'none',
                  borderRadius: '8px', fontSize: '18px', fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? "Đang xử lý..." : "XÁC NHẬN ĐẶT HÀNG (COD)"}
              </button>
            </form>
          </div>

          {/* Phần Đơn hàng của bạn */}
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', height: 'fit-content' }}>
            <h3 style={{ marginBottom: '20px' }}>Đơn hàng của bạn</h3>
            
            {cart.map((item, index) => {
              const price = Number(item.price) || 0;
              const subtotal = price * item.qty;

              return (
                <div key={index} style={{ 
                  display: 'flex', justifyContent: 'space-between', 
                  marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid #eee'
                }}>
                  <div>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>{item.name}</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      Size: {item.variant?.size || '—'} • SL: {item.qty}
                    </div>
                  </div>
                  <div style={{ fontWeight: '600', textAlign: 'right' }}>
                    {subtotal.toLocaleString('vi-VN')}đ
                  </div>
                </div>
              );
            })}

            <div style={{ 
              marginTop: '25px', paddingTop: '20px', borderTop: '2px solid #eee',
              display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '600'
            }}>
              <span>Tổng cộng</span>
              <span>{cartTotal.toLocaleString('vi-VN')}đ</span>
            </div>

            <div style={{ marginTop: '10px', fontSize: '14px', color: '#27ae60', textAlign: 'center' }}>
              Thanh toán khi nhận hàng (COD)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
