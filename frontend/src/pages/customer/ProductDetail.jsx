import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axiosInstance';
import socket from '../../api/socket';
import { useCart } from '../../hooks/useCart';
import { sortVariantsBySize } from '../../utils/sortVariantsBySize';
import { getImageUrl } from '../../utils/getImageUrl';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');
  const [selectedStock, setSelectedStock] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        const data = res.data.product || res.data;
        const sortedVariants = sortVariantsBySize(data.variants || []);

        setProduct(data);
        setMainImage(data.images?.[0] || '');

        if (sortedVariants.length > 0) {
          setSelectedSize(sortedVariants[0].size);
          setSelectedStock(sortedVariants[0].stock || 0);
        }
      } catch (error) {
        console.error('Lỗi tải chi tiết sản phẩm', error);
        toast.error('Không tìm thấy sẩn phẩm');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    socket.connect();

    socket.on('productUpdated', (data) => {
      if (data.product && data.product._id === id) {
        const updated = data.product;
        const sortedVariants = sortVariantsBySize(updated.variants || []);

        setProduct(updated);
        setMainImage((prev) => {
          if (updated.images?.length) {
            return updated.images.includes(prev) ? prev : updated.images[0];
          }
          return '';
        });

        if (sortedVariants.length > 0) {
          setSelectedSize((prevSize) => {
            const currentVariant = sortedVariants.find((variant) => variant.size === prevSize);

            if (currentVariant) {
              setSelectedStock(currentVariant.stock || 0);
              return prevSize;
            }

            setSelectedStock(sortedVariants[0].stock || 0);
            return sortedVariants[0].size;
          });
        }

        toast.info('Sản phẩm vừa được cập nhật');
      }
    });

    socket.on('productDeleted', (data) => {
      if (data.productId === id) {
        toast.warning('Sản phẩm này đã bị xóa');
        navigate('/products');
      }
    });

    return () => {
      socket.off('productUpdated');
      socket.off('productDeleted');
      socket.disconnect();
    };
  }, [id, navigate]);

  useEffect(() => {
    if (product && selectedSize) {
      const variant = product.variants.find((item) => item.size === selectedSize);
      setSelectedStock(variant ? variant.stock : 0);
      setQuantity(1);
    }
  }, [selectedSize, product]);

  const sortedVariants = sortVariantsBySize(product?.variants || []);
  const mainImageUrl = getImageUrl(mainImage);

  const getCartQuantityForSelectedSize = () =>
    cart.find((item) => item.product === product?._id && item.variant?.size === selectedSize)?.qty || 0;

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.warning('Vui lòng chọn size');
      return;
    }

    const variant = product.variants.find((item) => item.size === selectedSize);
    if (!variant) {
      toast.error('Không tìm thấy lựa chọn nào');
      return;
    }

    const existingQty = getCartQuantityForSelectedSize();
    if (existingQty + quantity > variant.stock) {
      toast.error(`Giỏ hàng chỉ có thể chứa tối đa ${variant.stock} chiếc cho size này`);
      return;
    }

    addToCart(product, variant, quantity);
    toast.success('Đã thêm vào giỏ hàng');
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      toast.warning('Vui lòng chọn size');
      return;
    }

    const variant = product.variants.find((item) => item.size === selectedSize);
    if (!variant) {
      toast.error('Không tìm thấy lựa chọn nào');
      return;
    }

    const existingQty = getCartQuantityForSelectedSize();
    if (existingQty + quantity > variant.stock) {
      toast.error(`Giỏ hàng chỉ có thể chứa tối đa ${variant.stock} cái cho size này`);
      return;
    }

    addToCart(product, variant, quantity);
    navigate('/checkout');
  };

  const increaseQuantity = () => {
    if (quantity < selectedStock) {
      setQuantity((prev) => prev + 1);
      return;
    }

    toast.warning(`Chi con ${selectedStock} san pham`);
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  if (loading) {
    return <p style={{ textAlign: 'center', padding: '100px' }}>Đang tải...</p>;
  }

  if (!product) {
    return <p style={{ textAlign: 'center', padding: '100px' }}>Không tìm thấy sản phẩm</p>;
  }

  return (
    <div style={{ padding: '40px 20px', backgroundColor: '#F5F5F3' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px' }}>
          <div>
            <div
              style={{
                height: '520px',
                backgroundImage: `url(${mainImageUrl || 'https://via.placeholder.com/600x600/eeeeee/666666?text=No+Image'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '12px',
                marginBottom: '25px',
                border: '1px solid #eee'
              }}
            />

            {product.images?.length > 0 && (
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                {product.images.map((img, index) => {
                  const fullUrl = getImageUrl(img);

                  return (
                    <div
                      key={index}
                      onClick={() => setMainImage(img)}
                      style={{
                        width: '85px',
                        height: '85px',
                        backgroundImage: `url(${fullUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: mainImage === img ? '3px solid #1A1A1B' : '2px solid #ddd'
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h1 style={{ fontSize: '32px', marginBottom: '12px' }}>{product.name}</h1>

            <p
              style={{
                fontSize: '26px',
                fontWeight: '600',
                color: '#1A1A1B',
                marginBottom: '30px'
              }}
            >
              {product.price.toLocaleString('vi-VN')}d
            </p>

            <div style={{ marginBottom: '30px' }}>
              <p style={{ fontWeight: '500', marginBottom: '12px' }}>Size</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {sortedVariants.map((variant, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedSize(variant.size)}
                    style={{
                      padding: '12px 26px',
                      minWidth: '60px',
                      border: selectedSize === variant.size ? '2px solid #1A1A1B' : '1px solid #ddd',
                      backgroundColor: selectedSize === variant.size ? '#1A1A1B' : 'white',
                      color: selectedSize === variant.size ? 'white' : '#1A1A1B',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: selectedSize === variant.size ? '600' : '400'
                    }}
                  >
                    {variant.size}
                  </button>
                ))}
              </div>
            </div>

            {selectedSize && (
              <p style={{ color: '#27ae60', fontWeight: '500', marginBottom: '15px' }}>
                Còn lại: <strong>{selectedStock}</strong> sản phẩm
              </p>
            )}

            <div style={{ marginBottom: '35px' }}>
              <p style={{ fontWeight: '500', marginBottom: '12px' }}>Số lượng</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button
                  onClick={decreaseQuantity}
                  style={{ width: '45px', height: '45px', fontSize: '20px', border: '1px solid #ddd', borderRadius: '6px' }}
                >
                  -
                </button>
                <span style={{ fontSize: '20px', width: '40px', textAlign: 'center' }}>{quantity}</span>
                <button
                  onClick={increaseQuantity}
                  disabled={quantity >= selectedStock}
                  style={{
                    width: '45px',
                    height: '45px',
                    fontSize: '20px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    opacity: quantity >= selectedStock ? 0.4 : 1
                  }}
                >
                  +
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '40px' }}>
              <button
                onClick={handleAddToCart}
                style={{
                  flex: 1,
                  padding: '18px',
                  backgroundColor: '#1A1A1B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '17px',
                  fontWeight: '600'
                }}
              >
                THÊM VÀO GIỎ HÀNG
              </button>
              <button
                onClick={handleBuyNow}
                style={{
                  flex: 1,
                  padding: '18px',
                  backgroundColor: 'white',
                  color: '#1A1A1B',
                  border: '2px solid #1A1A1B',
                  borderRadius: '8px',
                  fontSize: '17px',
                  fontWeight: '600'
                }}
              >
                MUA NGAY
              </button>
            </div>

            <div>
              <h3 style={{ marginBottom: '15px' }}>Mô tả sản phẩm</h3>
              <p style={{ lineHeight: '1.8', color: '#444', whiteSpace: 'pre-wrap' }}>{product.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
