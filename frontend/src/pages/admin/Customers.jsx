import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axiosInstance';
import socket from '../../api/socket';
import { toast } from 'react-toastify';
import { FaEdit, FaSearch, FaUsers } from 'react-icons/fa';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setCustomers((res.data.users || []).filter((user) => user.role !== 'admin'));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    socket.connect();
    socket.emit('joinAdmin');

    const handleUserProfileUpdated = (updatedUser) => {
      setCustomers((prev) =>
        prev.map((customer) =>
          customer._id === updatedUser?._id
            ? { ...customer, ...updatedUser }
            : customer
        )
      );

      setEditingCustomer((prev) => (
        prev?._id === updatedUser?._id
          ? { ...prev, ...updatedUser }
          : prev
      ));

      if (editingCustomer?._id === updatedUser?._id && !submitting) {
        setFormData({
          name: updatedUser.name || '',
          phone: updatedUser.phone || ''
        });
      }
    };

    socket.on('userProfileUpdated', handleUserProfileUpdated);

    return () => {
      socket.off('userProfileUpdated', handleUserProfileUpdated);
    };
  }, [editingCustomer?._id, submitting]);

  const filteredCustomers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return customers;

    return customers.filter((customer) =>
      [customer.email, customer.phone]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword))
    );
  }, [customers, searchTerm]);

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || ''
    });
  };

  const closeEditModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingCustomer) return;

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim()
      };

      const res = await api.put(`/users/${editingCustomer._id}`, payload);
      const updatedUser = res.data.user;

      setCustomers((prev) =>
        prev.map((item) =>
          item._id === editingCustomer._id
            ? { ...item, ...updatedUser }
            : item
        )
      );

      toast.success('Cập nhật khách hàng thành công');
      closeEditModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật khách hàng');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p style={{ textAlign: 'center', padding: '100px' }}>Đang tải danh sách khách hàng...</p>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '32px', margin: 0 }}>Quản lý Khách hàng</h1>
          <p style={{ color: '#666', marginTop: '8px' }}>
            Hiển thị thông tin khách hàng và cho phép cập nhật tên, số điện thoại
          </p>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '14px',
          padding: '16px 22px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
          minWidth: '180px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FaUsers style={{ fontSize: '24px', color: '#1A1A1B' }} />
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Số khách hàng</p>
              <strong style={{ fontSize: '28px' }}>{customers.length}</strong>
            </div>
          </div>
        </div>
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
          placeholder="Tìm theo email hoặc số điện thoại..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: '16px' }}
        />
      </div>

      {/* Bảng */}
      <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f8f8', borderBottom: '2px solid #eee' }}>
                <th style={thCenterStyle}>Tên</th>
                <th style={thCenterStyle}>Số điện thoại</th>
                <th style={thCenterStyle}>Email</th>
                <th style={thCenterStyle}>Thời gian tạo</th>
                <th style={thCenterStyle}>Số đơn đã đặt</th>
                <th style={thCenterStyle}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStrongCenterStyle}>{customer.name || '-'}</td>
                  <td style={tdCenterStyle}>{customer.phone || '-'}</td>
                  <td style={tdCenterStyle}>{customer.email}</td>
                  <td style={tdCenterStyle}>{new Date(customer.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td style={tdCenterStyle}>{customer.totalOrders || 0}</td>
                  <td style={tdCenterStyle}>
                    <button
                      onClick={() => openEditModal(customer)}
                      style={{ color: '#3498db', background: 'none', border: 'none', cursor: 'pointer' }}
                      title="Cập nhật thông tin khách hàng"
                    >
                      <FaEdit />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredCustomers.length === 0 && (
        <p style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
          Không tìm thấy khách hàng phù hợp
        </p>
      )}

      {/* Modal */}
      {editingCustomer && (
        <div
          onClick={closeEditModal}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              width: '90%',
              maxWidth: '520px',
              borderRadius: '16px',
              padding: '30px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.12)'
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: '10px' }}>Cập nhật khách hàng</h2>
            <p style={{ color: '#666', marginBottom: '24px' }}>
              Trang này chỉ cho phép cập nhật tên và số điện thoại của khách hàng.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '18px' }}>
                <label>Tên khách hàng</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label>Số điện thoại</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '14px' }}>
                <button
                  type="button"
                  onClick={closeEditModal}
                  style={{ flex: 1, padding: '14px', border: 'none', borderRadius: '10px', backgroundColor: '#eee', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ flex: 1, padding: '14px', border: 'none', borderRadius: '10px', backgroundColor: '#1A1A1B', color: 'white', cursor: submitting ? 'not-allowed' : 'pointer' }}
                >
                  {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ==================== STYLE CĂN GIỮA ==================== */
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

const inputStyle = {
  width: '100%',
  padding: '14px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  marginTop: '8px'
};

export default Customers;
