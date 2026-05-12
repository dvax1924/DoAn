import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';

const VNPAY_CART_STORAGE_KEY = 'pendingVnpayCart';

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
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.warning('Vui lòng đăng nhập để thanh toán');
      navigate('/login?redirect=/checkout');
    }
  }, [user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      const onlyNumbers = value.replace(/[^0-9]/g, '');
      setShippingAddress((prev) => ({ ...prev, [name]: onlyNumbers }));
      return;
    }

    setShippingAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error('Giỏ hàng trống');
      return;
    }

    const finalTotal = Number(cartTotal);
    if (Number.isNaN(finalTotal) || finalTotal <= 0) {
      toast.error('Giá trị đơn hàng không hợp lệ');
      return;
    }

    const orderItems = cart.map((item) => ({
      product: item?.product?._id || item.product,
      variant: item.variant,
      qty: item.qty,
      price: Number(item.price) || 0
    }));

    setLoading(true);

    try {
      const res = await api.post('/orders', {
        items: orderItems,
        shippingAddress,
        paymentMethod
      });

      if (!res.data.success) {
        throw new Error(res.data.message || 'Đặt hàng thất bại');
      }

      if (paymentMethod === 'VNPAY') {
        if (!res.data.paymentUrl) {
          throw new Error('Không tạo được liên kết thanh toán VNPay');
        }

        sessionStorage.setItem(VNPAY_CART_STORAGE_KEY, JSON.stringify(cart));
        clearCart();
        window.location.assign(res.data.paymentUrl);
        return;
      }

      toast.success('Đặt hàng thành công');
      clearCart();
      navigate('/orders');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Đặt hàng thất bại');
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
          <div>
            <h2 style={{ marginBottom: '25px' }}>Thông tin giao hàng</h2>
            <form onSubmit={handleSubmitOrder}>
              <div style={{ marginBottom: '20px' }}>
                <label>Họ và tên *</label>
                <input type="text" name="name" value={shippingAddress.name} onChange={handleInputChange} required style={inputStyle} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label>Số điện thoại *</label>
                <input type="tel" name="phone" value={shippingAddress.phone} onChange={handleInputChange} maxLength={11} required style={inputStyle} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label>Địa chỉ chi tiết *</label>
                <input type="text" name="street" value={shippingAddress.street} onChange={handleInputChange} required style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label>Phường/Xã *</label>
                  <input type="text" name="ward" value={shippingAddress.ward} onChange={handleInputChange} required style={inputStyle} />
                </div>
                <div>
                  <label>Quận/Huyện *</label>
                  <input type="text" name="district" value={shippingAddress.district} onChange={handleInputChange} required style={inputStyle} />
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <label>Tỉnh/Thành phố</label>
                <input type="text" name="province" value={shippingAddress.province} onChange={handleInputChange} style={inputStyle} />
              </div>

              <div style={{ marginTop: '28px' }}>
                <p style={{ margin: '0 0 12px', fontWeight: '600' }}>Phương thức thanh toán</p>

                <label style={paymentOptionStyle}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>Thanh toán khi nhận hàng (COD)</span>
                </label>

                <label style={paymentOptionStyle}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="VNPAY"
                    checked={paymentMethod === 'VNPAY'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>Thanh toán online qua VNPay</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '40px',
                  width: '100%',
                  padding: '18px',
                  backgroundColor: '#1A1A1B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading
                  ? 'Đang xử lý...'
                  : paymentMethod === 'VNPAY'
                    ? 'THANH TOÁN QUA VNPAY'
                    : 'XÁC NHẬN ĐẶT HÀNG (COD)'}
              </button>
            </form>
          </div>

          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', height: 'fit-content' }}>
            <h3 style={{ marginBottom: '20px' }}>Đơn hàng của bạn</h3>

            {cart.map((item, index) => {
              const price = Number(item.price) || 0;
              const subtotal = price * item.qty;

              return (
                <div
                  key={`${item.product}-${item.variant?.size || index}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '18px',
                    paddingBottom: '18px',
                    borderBottom: '1px solid #eee'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>{item.name}</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      Size: {item.variant?.size || '-'} | SL: {item.qty}
                    </div>
                  </div>
                  <div style={{ fontWeight: '600', textAlign: 'right' }}>
                    {subtotal.toLocaleString('vi-VN')}đ
                  </div>
                </div>
              );
            })}

            <div
              style={{
                marginTop: '25px',
                paddingTop: '20px',
                borderTop: '2px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '20px',
                fontWeight: '600'
              }}
            >
              <span>Tổng cộng</span>
              <span>{cartTotal.toLocaleString('vi-VN')}đ</span>
            </div>

            <div style={{ marginTop: '12px', fontSize: '14px', color: '#555', textAlign: 'center', lineHeight: '1.7' }}>
              {paymentMethod === 'VNPAY'
                ? 'Bạn sẽ được chuyển đến cổng thanh toán VNPay sau khi hệ thống tạo đơn hàng.'
                : 'Bạn sẽ thanh toán khi nhận hàng.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  marginTop: '8px'
};

const paymentOptionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '14px 16px',
  border: '1px solid #e5e5e5',
  borderRadius: '10px',
  background: 'white',
  marginBottom: '12px',
  cursor: 'pointer'
};

export default Checkout;
