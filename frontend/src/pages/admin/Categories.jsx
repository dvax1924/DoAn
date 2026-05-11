import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal thêm / sửa danh mục
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '' });

  // Modal migrate khi xóa danh mục
  const [showMigrateModal, setShowMigrateModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [newCategoryId, setNewCategoryId] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.categories || res.data);
    } catch {
      toast.error("Không thể tải danh mục");
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name });
    } else {
      setEditingCategory(null);
      setFormData({ name: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, formData);
        toast.success("Cập nhật danh mục thành công");
      } else {
        await api.post('/categories', formData);
        toast.success("Thêm danh mục thành công");
      }
      fetchCategories();
      setShowModal(false);
    } catch {
      toast.error("Thao tác thất bại");
    }
  };

  // ====================== XÓA DANH MỤC ======================
  const handleDeleteClick = async (category) => {
    setCategoryToDelete(category);

    try {
      const res = await api.get(`/products?category=${category._id}`);
      const count = Number(res.data.totalCount ?? res.data.products?.length ?? 0);

      if (count === 0) {
        if (window.confirm(`Xóa danh mục "${category.name}"?`)) {
          await api.delete(`/categories/${category._id}`);
          toast.success("Đã xóa danh mục thành công");
          fetchCategories();
        }
      } else {
        setShowMigrateModal(true);
      }
    } catch {
      toast.error("Không thể kiểm tra số lượng sản phẩm");
    }
  };

  const handleMigrateDelete = async () => {
    if (!newCategoryId) {
      toast.warning("Vui lòng chọn danh mục mới");
      return;
    }

    try {
      await api.delete(`/categories/${categoryToDelete._id}`, {
        data: { newCategoryId }
      });

      toast.success(`Đã chuyển sản phẩm sang danh mục mới và xóa thành công!`);
      setShowMigrateModal(false);
      setCategoryToDelete(null);
      setNewCategoryId('');
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || "Xóa thất bại");
    }
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '100px' }}>Đang tải danh mục...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', margin: 0 }}>Quản lý Danh mục</h1>
        <button 
          onClick={() => openModal()}
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
          <FaPlus /> Thêm danh mục mới
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
          placeholder="Tìm kiếm danh mục..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '16px'
          }}
        />
      </div>

      {/* Table - Căn giữa toàn bộ */}
      <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f8f8', borderBottom: '2px solid #eee' }}>
              <th style={thCenterStyle}>Tên danh mục</th>
              <th style={thCenterStyle}>Số lượng sản phẩm</th>
              <th style={thCenterStyle}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.map((cat) => (
              <tr key={cat._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdStrongCenterStyle}>{cat.name}</td>
                <td style={tdCenterStyle}>{cat.productCount ?? 0}</td>
                <td style={tdCenterStyle}>
                  <button 
                    onClick={() => openModal(cat)}
                    style={{ marginRight: '15px', color: '#3498db', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <FaEdit />
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(cat)}
                    style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredCategories.length === 0 && (
        <p style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
          Không tìm thấy danh mục phù hợp
        </p>
      )}

      {/* Modal Thêm / Sửa */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 3000
        }}>
          <div style={{
            background: 'white', padding: '40px', borderRadius: '16px',
            width: '100%', maxWidth: '420px'
          }}>
            <h2 style={{ marginBottom: '25px' }}>
              {editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '30px' }}>
                <label>Tên danh mục *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '8px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '16px', backgroundColor: '#eee', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  style={{ flex: 1, padding: '16px', backgroundColor: '#1A1A1B', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
                >
                  {editingCategory ? 'Lưu thay đổi' : 'Thêm danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Migrate */}
      {showMigrateModal && categoryToDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 3000
        }}>
          <div style={{
            background: 'white', padding: '40px', borderRadius: '16px',
            width: '100%', maxWidth: '480px'
          }}>
            <h2 style={{ marginBottom: '10px', color: '#e74c3c' }}>Xóa danh mục</h2>
            <p style={{ marginBottom: '20px' }}>
              Danh mục <strong>"{categoryToDelete.name}"</strong> đang có sản phẩm.<br />
              Bạn phải chuyển tất cả sản phẩm sang danh mục khác trước khi xóa.
            </p>

            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Chọn danh mục mới</label>
            <select
              value={newCategoryId}
              onChange={(e) => setNewCategoryId(e.target.value)}
              style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '30px' }}
            >
              <option value="">-- Chọn danh mục --</option>
              {categories
                .filter(c => c._id !== categoryToDelete._id)
                .map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
            </select>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={() => { 
                  setShowMigrateModal(false); 
                  setNewCategoryId(''); 
                }}
                style={{ flex: 1, padding: '16px', backgroundColor: '#eee', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button 
                onClick={handleMigrateDelete}
                style={{ flex: 1, padding: '16px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
              >
                Chuyển sản phẩm & Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ==================== STYLE CĂN GIỮA (đồng bộ với các trang khác) ==================== */
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

const tdStrongCenterStyle = {
  ...tdCenterStyle,
  fontWeight: '600',
  color: '#1A1A1B'
};

export default Categories;
