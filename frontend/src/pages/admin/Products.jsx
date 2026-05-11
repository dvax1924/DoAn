import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import { getImageUrl } from '../../utils/getImageUrl';

const AdminProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products?limit=50');
        setProducts(res.data.products || res.data);
      } catch {
        toast.error("Không thể tải danh sách sản phẩm");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Hàm tính tổng tồn kho của tất cả size
  const getTotalStock = (variants) => {
    if (!variants || !Array.isArray(variants)) return 0;
    return variants.reduce((total, variant) => total + (variant.stock || 0), 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa sản phẩm này?")) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p._id !== id));
      toast.success("Đã xóa sản phẩm");
    } catch {
      toast.error("Không thể xóa sản phẩm");
    }
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '100px' }}>Đang tải sản phẩm...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', margin: 0 }}>Quản lý Sản phẩm</h1>
        
        <button 
          onClick={() => navigate('/admin/products/add')}
          style={{
            backgroundColor: '#1A1A1B',
            color: 'white',
            border: 'none',
            padding: '14px 28px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <FaPlus /> Thêm sản phẩm mới
        </button>
      </div>

      {/* Search */}
      <div style={{ 
        background: 'white', 
        padding: '12px 20px', 
        borderRadius: '12px', 
        display: 'flex', 
        alignItems: 'center',
        marginBottom: '30px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.06)'
      }}>
        <FaSearch style={{ marginRight: '12px', color: '#999' }} />
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: '16px' }}
        />
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f8f8', borderBottom: '2px solid #eee' }}>
              <th style={{ padding: '18px 20px', textAlign: 'center', fontWeight: '600' }}>Hình ảnh</th>
              <th style={{ padding: '18px 20px', textAlign: 'center', fontWeight: '600' }}>Tên sản phẩm</th>
              <th style={{ padding: '18px 20px', textAlign: 'center', fontWeight: '600' }}>Danh mục</th>
              <th style={{ padding: '18px 20px', textAlign: 'center', fontWeight: '600' }}>Giá</th>
              <th style={{ padding: '18px 20px', textAlign: 'center', fontWeight: '600' }}>Tồn kho</th>
              <th style={{ padding: '18px 20px', textAlign: 'center', fontWeight: '600' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const totalStock = getTotalStock(product.variants);
              const productImage = getImageUrl(product.images?.[0]);
              return (
                <tr key={product._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '16px 20px' }}>
                    {productImage && (
                      <img 
                        src={productImage}
                        alt={product.name}
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: '500', textAlign: 'center' }}>{product.name}</td>
                  <td style={{ padding: '16px 20px', color: '#666', textAlign: 'center' }}>
                    {product.category?.name || 'Chưa có danh mục'}
                  </td>
                  {/* ==================== GIÁ CHUNG ==================== */}
                  <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: '600' }}>
                    {product.price 
                      ? product.price.toLocaleString('vi-VN') + 'đ' 
                      : 'Liên hệ'}
                  </td>
                  {/* ==================== TỔNG TỒN KHO ==================== */}
                  <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: '600' }}>
                    {totalStock}
                  </td>

                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <button 
                      onClick={() => navigate(`/admin/products/edit/${product._id}`)}
                      style={{ marginRight: '12px', color: '#3498db', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <FaEdit />
                    </button>
                    <button 
                      onClick={() => handleDelete(product._id)}
                      style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredProducts.length === 0 && (
        <p style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
          Không tìm thấy sản phẩm nào
        </p>
      )}
    </div>
  );
};

export default AdminProducts;
