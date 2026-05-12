import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axiosInstance';
import { Link, useSearchParams } from 'react-router-dom';
import socket from '../../api/socket';
import { getImageUrl } from '../../utils/getImageUrl';

const PRODUCTS_PER_PAGE = 20;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState('');
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const [categoryName, setCategoryName] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const categoryId = searchParams.get('category') || '';
  const searchKeyword = searchParams.get('search') || '';

  const fetchProducts = useCallback(async (pageNum, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const params = new URLSearchParams();
      if (categoryId) params.append('category', categoryId);
      if (searchKeyword) params.append('search', searchKeyword);
      if (sort) params.append('sort', sort);
      params.append('page', pageNum);
      params.append('limit', PRODUCTS_PER_PAGE);

      const url = `/products?${params.toString()}`;
      const res = await api.get(url);

      const data = res.data.products || res.data;
      const fetchedProducts = Array.isArray(data) ? data : [];
      const totalCount = Number(res.data.totalCount ?? fetchedProducts.length);

      setTotalProducts(totalCount);

      if (isLoadMore) {
        setProducts((prev) => [...prev, ...fetchedProducts]);
      } else {
        setProducts(fetchedProducts);
      }

      setHasMore(pageNum * PRODUCTS_PER_PAGE < totalCount);

      if (!isLoadMore) {
        if (categoryId && fetchedProducts.length > 0) {
          setCategoryName(fetchedProducts[0].category?.name || '');
        } else if (categoryId && fetchedProducts.length === 0) {
          try {
            const catRes = await api.get(`/categories/${categoryId}`);
            setCategoryName(catRes.data.category?.name || catRes.data.name || '');
          } catch {
            setCategoryName('');
          }
        } else {
          setCategoryName('');
        }
      }
    } catch (err) {
      console.error('Lỗi tải sản phẩm:', err);
      if (!isLoadMore) {
        setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [categoryId, searchKeyword, sort]);

  useEffect(() => {
    setPage(1);
    fetchProducts(1, false);
  }, [fetchProducts]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, true);
  };

  useEffect(() => {
    setHasMore(products.length < totalProducts);
  }, [products.length, totalProducts]);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const refreshProducts = () => {
      setPage(1);
      fetchProducts(1, false);
    };

    socket.on('productCreated', refreshProducts);
    socket.on('productUpdated', refreshProducts);
    socket.on('productDeleted', refreshProducts);

    return () => {
      socket.off('productCreated');
      socket.off('productUpdated');
      socket.off('productDeleted');
    };
  }, [fetchProducts]);

  const pageTitle = searchKeyword
    ? `Kết quả tìm kiếm: "${searchKeyword}"`
    : categoryName || 'Tất cả sản phẩm';

  return (
    <div style={{ padding: '40px 20px', backgroundColor: '#F5F5F3', minHeight: '80vh' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: '600', marginBottom: '10px' }}>
            {pageTitle}
          </h1>
          <p style={{ color: '#666', fontSize: '18px' }}>
            {totalProducts} sản phẩm
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              padding: '12px 20px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px',
              minWidth: '220px'
            }}
          >
            <option value="">Sắp xếp mặc định</option>
            <option value="price-low">Giá: Thấp đến cao</option>
            <option value="price-high">Giá: Cao đến thấp</option>
          </select>
        </div>

        {loading && (
          <p style={{ textAlign: 'center', fontSize: '18px', marginTop: '50px' }}>
            Đang tải sản phẩm...
          </p>
        )}

        {error && (
          <p style={{ textAlign: 'center', color: 'red', fontSize: '18px', marginTop: '50px' }}>
            {error}
          </p>
        )}

        {!loading && !error && products.length > 0 && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(285px, 1fr))',
                gap: '32px'
              }}
            >
              {products.map((product) => {
                const productImage = getImageUrl(product.images?.[0]);

                return (
                  <Link
                    to={`/products/${product._id}`}
                    key={product._id}
                    style={{
                      textDecoration: 'none',
                      color: 'inherit',
                      display: 'flex',
                      height: '100%'
                    }}
                  >
                    <div
                      style={{
                        background: 'white',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        height: '100%'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <div
                        style={{
                          height: '360px',
                          backgroundImage: `url(${productImage || 'https://via.placeholder.com/300x400?text=No+Image'})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />

                      <div
                        style={{
                          padding: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          flexGrow: 1
                        }}
                      >
                        <h3
                          style={{
                            fontSize: '17px',
                            fontWeight: '500',
                            marginBottom: '10px',
                            lineHeight: '1.4',
                            minHeight: '48px',
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 2,
                            overflow: 'hidden'
                          }}
                        >
                          {product.name}
                        </h3>

                        <p
                          style={{
                            color: '#1A1A1B',
                            fontSize: '18px',
                            fontWeight: '600',
                            marginTop: 'auto'
                          }}
                        >
                          {product.price ? `${product.price.toLocaleString('vi-VN')}d` : 'Lien he'}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  style={{
                    padding: '16px 48px',
                    backgroundColor: '#1A1A1B',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: loadingMore ? 'not-allowed' : 'pointer',
                    opacity: loadingMore ? 0.7 : 1,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => { if (!loadingMore) e.currentTarget.style.backgroundColor = '#333'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1A1A1B'; }}
                >
                  {loadingMore ? 'Đang tải...' : 'Xem thêm sản phẩm'}
                </button>
              </div>
            )}
          </>
        )}

        {!loading && !error && products.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '80px' }}>
            <p style={{ fontSize: '20px', color: '#666' }}>
              Hiện tại chưa có sản phẩm nào.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
