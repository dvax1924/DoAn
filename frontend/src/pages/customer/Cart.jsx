import React from 'react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaTrash } from 'react-icons/fa';
import { getImageUrl } from '../../utils/getImageUrl';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleQuantityChange = (productId, size, newQty) => {
    const cartItem = cart.find(
      (item) => item.product === productId && item.variant?.size === size
    );

    if (!cartItem) return;

    const maxStock = Number(cartItem.variant?.stock) || 0;
    if (newQty > maxStock) {
      toast.warning(`Chỉ còn ${maxStock} sản phẩm cho size này`);
      updateQuantity(productId, size, maxStock);
      return;
    }

    updateQuantity(productId, size, newQty);
  };

  const handleRemove = (productId, size) => {
    removeFromCart(productId, size);
    toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
  };

  const handleClearCart = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
      clearCart();
      toast.success('Đã xóa toàn bộ giỏ hàng');
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    if (!user) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (cart.length === 0) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center', backgroundColor: '#F5F5F3', minHeight: '70vh' }}>
        <h2 style={{ marginBottom: '20px' }}>Giỏ hàng của bạn đang trống</h2>
        <p style={{ color: '#666', marginBottom: '40px' }}>Hãy thêm một vài sản phẩm để tiếp tục mua sắm.</p>
        <Link
          to="/products"
          style={{
            backgroundColor: '#1A1A1B',
            color: 'white',
            padding: '14px 36px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600'
          }}
        >
          Khám phá sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px', backgroundColor: '#F5F5F3' }}>
      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '40px', fontSize: '36px' }}>
          Giỏ hàng của bạn
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
          <div>
            {cart.map((item, index) => {
              const itemImage = getImageUrl(item.image);

              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    gap: '20px',
                    background: 'white',
                    padding: '20px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  }}
                >
                  <div
                    style={{
                      width: '140px',
                      height: '140px',
                      backgroundImage: `url(${itemImage || 'https://via.placeholder.com/140x140'})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: '8px',
                      flexShrink: 0
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>{item.name}</h3>
                    <p style={{ color: '#666', marginBottom: '12px' }}>
                      Size: {item.variant.size} • Số lượng: {item.qty}
                    </p>
                    <p style={{ fontWeight: '600', fontSize: '18px', color: '#1A1A1B' }}>
                      {item.price.toLocaleString('vi-VN')}đ
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          onClick={() => handleQuantityChange(item.product, item.variant.size, item.qty - 1)}
                          style={{ width: '32px', height: '32px', border: '1px solid #ddd', borderRadius: '6px' }}
                        >
                          -
                        </button>
                        <span style={{ width: '30px', textAlign: 'center', fontSize: '17px' }}>{item.qty}</span>
                        <button
                          onClick={() => handleQuantityChange(item.product, item.variant.size, item.qty + 1)}
                          style={{ width: '32px', height: '32px', border: '1px solid #ddd', borderRadius: '6px' }}
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemove(item.product, item.variant.size)}
                        style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '100px' }}>
                    <div style={{ fontWeight: '600', textAlign: 'right' }}>
                      {(item.price * item.qty).toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', height: 'fit-content' }}>
            <h3 style={{ marginBottom: '20px' }}>Tổng đơn hàng</h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '17px' }}>
              <span>Tạm tính</span>
              <span>{cartTotal.toLocaleString('vi-VN')}đ</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', fontSize: '17px' }}>
              <span>Phí vận chuyển</span>
              <span style={{ color: '#27ae60' }}>Miễn phí</span>
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '600' }}>
              <span>Tổng cộng</span>
              <span>{cartTotal.toLocaleString('vi-VN')}đ</span>
            </div>

            <button
              onClick={handleCheckout}
              style={{
                width: '100%',
                marginTop: '30px',
                padding: '16px',
                backgroundColor: '#1A1A1B',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '17px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              TIẾN HÀNH THANH TOÁN
            </button>

            <button
              onClick={handleClearCart}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '12px',
                backgroundColor: 'transparent',
                color: '#e74c3c',
                border: '1px solid #e74c3c',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Xóa toàn bộ giỏ hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
