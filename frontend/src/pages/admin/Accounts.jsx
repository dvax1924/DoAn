import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axiosInstance';
import socket from '../../api/socket';
import { toast } from 'react-toastify';
import { FaEdit, FaSearch, FaTrash, FaUsers } from 'react-icons/fa';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({ password: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setAccounts(res.data.users || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    socket.connect();
    socket.emit('joinAdmin');

    const handleUserPasswordUpdated = (passwordUpdate) => {
      setAccounts((prev) =>
        prev.map((account) =>
          account._id === passwordUpdate?._id
            ? {
                ...account,
                passwordChangedAt: passwordUpdate.passwordChangedAt,
                passwordLabel: 'Vừa cập nhật'
              }
            : account
        )
      );
    };

    socket.on('userPasswordUpdated', handleUserPasswordUpdated);

    return () => {
      socket.off('userPasswordUpdated', handleUserPasswordUpdated);
    };
  }, []);

  const filteredAccounts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return accounts;
    return accounts.filter((account) => 
      (account.email || '').toLowerCase().includes(keyword)
    );
  }, [accounts, searchTerm]);

  const openEditModal = (account) => {
    setEditingAccount(account);
    setFormData({ password: '' });
  };

  const closeEditModal = () => {
    setEditingAccount(null);
    setFormData({ password: '' });
  };

  const handleDelete = async (account) => {
    if (account.role === 'admin') return;
    if (!window.confirm(`Xóa tài khoản ${account.email}?`)) return;

    try {
      await api.delete(`/users/${account._id}`);
      setAccounts((prev) => prev.filter((item) => item._id !== account._id));
      toast.success('Đã xóa tài khoản customer');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa tài khoản');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingAccount) return;
    if (!formData.password.trim()) {
      toast.warning('Vui lòng nhập mật khẩu mới');
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/users/${editingAccount._id}`, { password: formData.password.trim() });
      toast.success('Đổi mật khẩu thành công');
      closeEditModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể đổi mật khẩu');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p style={{ textAlign: 'center', padding: '100px' }}>Đang tải danh sách tài khoản...</p>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '32px', margin: 0 }}>Quản lý tài khoản</h1>
          <p style={{ color: '#666', marginTop: '8px' }}>
            Xem email, role, trạng thái và đổi mật khẩu cho mọi tài khoản
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
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Tổng tài khoản</p>
              <strong style={{ fontSize: '28px' }}>{accounts.length}</strong>
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
          placeholder="Tìm theo email tài khoản..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: '16px' }}
        />
      </div>

      {/* Bảng */}
      <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f8f8', borderBottom: '2px solid #eee' }}>
                <th style={thCenterStyle}>Email</th>
                <th style={thCenterStyle}>Mật khẩu</th>
                <th style={thCenterStyle}>Role</th>
                <th style={thCenterStyle}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => (
                <tr key={account._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStrongCenterStyle}>{account.email}</td>
                  <td style={tdCenterStyle}>{formatPasswordStatus(account)}</td>
                  <td style={tdCenterStyle}>{account.role === 'admin' ? 'Admin' : 'Customer'}</td>
                  <td style={tdCenterStyle}>
                    <button
                      onClick={() => openEditModal(account)}
                      style={{ marginRight: '12px', color: '#3498db', background: 'none', border: 'none', cursor: 'pointer' }}
                      title="Đổi mật khẩu"
                    >
                      <FaEdit />
                    </button>
                    {account.role !== 'admin' && (
                      <button
                        onClick={() => handleDelete(account)}
                        style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer' }}
                        title="Xóa tài khoản customer"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAccounts.length === 0 && (
        <p style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
          Không tìm thấy tài khoản phù hợp
        </p>
      )}

      {/* Modal đổi mật khẩu */}
      {editingAccount && (
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
            <h2 style={{ marginTop: 0, marginBottom: '10px' }}>Đổi mật khẩu tài khoản</h2>
            <p style={{ color: '#666', marginBottom: '24px' }}>
              Tài khoản: <strong>{editingAccount.email}</strong>
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '24px' }}>
                <label>Mật khẩu mới</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ password: e.target.value })}
                  placeholder="Nhập mật khẩu mới"
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

/* ==================== STYLE ĐÃ ĐƯỢC CĂN GIỮA ==================== */
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

const formatPasswordStatus = () => {
  return 'Đã mã hóa';
};

export default Accounts;
