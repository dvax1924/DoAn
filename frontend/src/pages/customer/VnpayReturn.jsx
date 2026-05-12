import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useCart } from '../../hooks/useCart';

const VNPAY_CART_STORAGE_KEY = 'pendingVnpayCart';

const STATUS_META = {
  success: {
    title: 'Thanh toán thành công',
    color: '#1f8f5f',
    badgeBackground: '#e6f7ef',
    badgeColor: '#1f8f5f',
    description: 'Giao dịch đã được xác nhận thành công.'
  },
  failed: {
    title: 'Thanh toán chưa thành công',
    color: '#d64545',
    badgeBackground: '#fdecec',
    badgeColor: '#d64545',
    description: 'Giao dịch chưa hoàn tất hoặc đã bị hủy. Giỏ hàng đã được khôi phục để bạn có thể thử lại.'
  },
  invalid: {
    title: 'Không xác minh được giao dịch',
    color: '#c58512',
    badgeBackground: '#fff4dc',
    badgeColor: '#c58512',
    description: 'Hệ thống chưa xác minh được kết quả từ VNPay. Vui lòng kiểm tra lại trong lịch sử đơn hàng.'
  },
  'not-found': {
    title: 'Không tìm thấy đơn hàng',
    color: '#c58512',
    badgeBackground: '#fff4dc',
    badgeColor: '#c58512',
    description: 'Hệ thống không tìm thấy đơn hàng tương ứng với giao dịch này.'
  },
  error: {
    title: 'Có lỗi khi xử lý thanh toán',
    color: '#c58512',
    badgeBackground: '#fff4dc',
    badgeColor: '#c58512',
    description: 'Đã có lỗi trong quá trình xử lý kết quả thanh toán. Vui lòng kiểm tra lại sau.'
  }
};

const VnpayReturn = () => {
  const { cart, clearCart, replaceCart } = useCart();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [totalAmount, setTotalAmount] = useState(0);
  const handledCartStateRef = useRef(false);

  const status = searchParams.get('status') || 'error';
  const orderId = searchParams.get('orderId') || '';

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
        console.error('Không thể tải số tiền đơn hàng sau thanh toán:', error);
      }
    };

    fetchOrderAmount();
  }, [orderId]);

  const meta = useMemo(() => STATUS_META[status] || STATUS_META.error, [status]);
  const orderCode = orderId ? `#${orderId.slice(-8).toUpperCase()}` : null;
  const formattedAmount = totalAmount > 0 ? `${totalAmount.toLocaleString('vi-VN')}đ` : null;

  return (
    <div style={{ padding: '56px 20px', backgroundColor: '#f3f1ed', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '760px', margin: '0 auto' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f9f6f0 100%)',
            borderRadius: '20px',
            padding: '40px 36px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.04)',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '82px',
              height: '82px',
              margin: '0 auto 22px',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: meta.badgeBackground,
              color: meta.color,
              fontSize: '38px',
              fontWeight: '700'
            }}
          >
            {status === 'success' ? '✓' : '!'}
          </div>

          <p
            style={{
              margin: '0 auto 12px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 14px',
              borderRadius: '999px',
              backgroundColor: meta.badgeBackground,
              color: meta.badgeColor,
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            Kết quả giao dịch VNPay
          </p>

          <h1 style={{ margin: '0 0 12px', fontSize: '36px', color: '#1a1a1b' }}>{meta.title}</h1>
          <p style={{ margin: '0 0 28px', lineHeight: '1.8', color: '#333' }}>{meta.description}</p>

          {formattedAmount && (
            <div
              style={{
                background: '#fff',
                border: '1px solid #ece7df',
                borderRadius: '18px',
                padding: '22px 20px',
                marginBottom: '24px'
              }}
            >
              <p style={{ margin: '0 0 10px', color: '#7b756d', fontSize: '15px' }}>
                {status === 'success' ? 'Số tiền đã thanh toán' : 'Giá trị đơn hàng'}
              </p>
              <p style={{ margin: 0, fontSize: '34px', fontWeight: '700', color: '#1a1a1b' }}>
                {formattedAmount}
              </p>
              {orderCode && (
                <p style={{ margin: '10px 0 0', color: '#666' }}>
                  Mã đơn hàng: <strong>{orderCode}</strong>
                </p>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => navigate('/orders')} style={primaryButtonStyle}>
              Xem lịch sử đơn hàng
            </button>
            <button type="button" onClick={() => navigate('/products')} style={secondaryButtonStyle}>
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const baseButtonStyle = {
  border: 'none',
  cursor: 'pointer',
  fontSize: '16px'
};

const primaryButtonStyle = {
  ...baseButtonStyle,
  padding: '14px 22px',
  backgroundColor: '#1A1A1B',
  color: 'white',
  borderRadius: '10px',
  fontWeight: '600'
};

const secondaryButtonStyle = {
  ...baseButtonStyle,
  padding: '14px 22px',
  backgroundColor: '#f0ebe3',
  color: '#1A1A1B',
  borderRadius: '10px',
  fontWeight: '600'
};

export default VnpayReturn;
