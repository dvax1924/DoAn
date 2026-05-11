import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axiosInstance';
import socket from '../../api/socket';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);

  // Quản lý chế độ hiển thị
  const [mode, setMode] = useState('view'); // 'view' | 'edit' | 'password'

  // Form chỉnh sửa thông tin
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });

  // Form đổi mật khẩu
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Lấy thông tin profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/profile');
        const data = res.data.user;
        setProfile(data);

        setFormData({
          name: data.name || '',
          phone: data.phone || ''
        });
      } catch {
        toast.error("Không thể tải thông tin profile");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchProfile();
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) {
      return undefined;
    }

    socket.connect();
    socket.emit('join', user._id);

    const handleUserProfileUpdated = (updatedUser) => {
      if (updatedUser?._id !== user._id) {
        return;
      }

      setProfile((prev) => ({ ...prev, ...updatedUser }));
      setFormData({
        name: updatedUser.name || '',
        phone: updatedUser.phone || ''
      });
      updateUser(updatedUser);
    };

    socket.on('userProfileUpdated', handleUserProfileUpdated);

    return () => {
      socket.off('userProfileUpdated', handleUserProfileUpdated);
    };
  }, [user?._id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  // Lưu thông tin cá nhân
  const handleSaveProfile = async () => {
    try {
      const res = await api.put('/users/profile', {
        name: formData.name,
        phone: formData.phone
      });

      if (res.data.success) {
        toast.success("Cập nhật thông tin thành công!");
        setProfile(res.data.user || profile);
        updateUser(res.data.user || profile);
        setMode('view');   // Quay về chế độ xem
      }
    } catch {
      toast.error("Cập nhật thất bại");
    }
  };

  // Đổi mật khẩu
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toast.error("Mật khẩu mới không khớp");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    try {
      const res = await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (res.data.success) {
        toast.success("Đổi mật khẩu thành công!");
        setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        setMode('view');   // Quay về chế độ xem
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Đổi mật khẩu thất bại");
    }
  };


  if (loading) return <p style={{ textAlign: 'center', padding: '100px' }}>Đang tải...</p>;

  return (
    <div style={{ padding: '40px 20px', backgroundColor: '#F5F5F3', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>

        <h1 style={{ textAlign: 'center', marginBottom: '40px', fontSize: '36px' }}>
          Thông tin tài khoản
        </h1>

        {/* ==================== CHẾ ĐỘ XEM THÔNG TIN ==================== */}
        {mode === 'view' && (
          <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ fontWeight: '500' }}>Họ và tên</label>
              <p style={{ fontSize: '18px', marginTop: '8px' }}>{profile.name}</p>
            </div>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ fontWeight: '500' }}>Email</label>
              <p style={{ fontSize: '18px', marginTop: '8px' }}>{profile.email}</p>
            </div>
            <div style={{ marginBottom: '40px' }}>
              <label style={{ fontWeight: '500' }}>Số điện thoại</label>
              <p style={{ fontSize: '18px', marginTop: '8px' }}>{profile.phone || 'Chưa cập nhật'}</p>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={() => setMode('edit')}
                style={{ flex: 1, padding: '16px', backgroundColor: '#1A1A1B', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600' }}
              >
                Chỉnh sửa thông tin
              </button>

              <button 
                onClick={() => setMode('password')}
                style={{ flex: 1, padding: '16px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600' }}
              >
                Đổi mật khẩu
              </button>
            </div>
          </div>
        )}

        {/* ==================== CHẾ ĐỘ CHỈNH SỬA THÔNG TIN ==================== */}
        {mode === 'edit' && (
          <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
            <h3 style={{ marginBottom: '25px' }}>Chỉnh sửa thông tin</h3>

            <div style={{ marginBottom: '20px' }}>
              <label>Họ và tên</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '8px' }} 
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label>Số điện thoại</label>
              <input 
                type="text" 
                name="phone" 
                value={formData.phone} 
                onChange={handleInputChange}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '8px' }} 
              />
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={handleSaveProfile}
                style={{ flex: 1, padding: '15px', backgroundColor: '#1A1A1B', color: 'white', border: 'none', borderRadius: '8px' }}
              >
                Lưu thay đổi
              </button>
              <button 
                onClick={() => setMode('view')}
                style={{ flex: 1, padding: '15px', backgroundColor: '#eee', color: '#333', border: 'none', borderRadius: '8px' }}
              >
                Quay lại
              </button>
            </div>
          </div>
        )}

        {/* ==================== CHẾ ĐỘ ĐỔI MẬT KHẨU ==================== */}
        {mode === 'password' && (
          <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
            <h3 style={{ marginBottom: '25px' }}>Đổi mật khẩu</h3>

            <div style={{ marginBottom: '20px' }}>
              <label>Mật khẩu hiện tại</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showCurrentPass ? "text" : "password"}
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '8px' }}
                />
                <span onClick={() => setShowCurrentPass(!showCurrentPass)} style={{ position: 'absolute', right: '15px', top: '22px', cursor: 'pointer' }}>
                  {showCurrentPass ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label>Mật khẩu mới</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showNewPass ? "text" : "password"}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '8px' }}
                />
                <span onClick={() => setShowNewPass(!showNewPass)} style={{ position: 'absolute', right: '15px', top: '22px', cursor: 'pointer' }}>
                  {showNewPass ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label>Xác nhận mật khẩu mới</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showConfirmPass ? "text" : "password"}
                  name="confirmNewPassword"
                  value={passwordData.confirmNewPassword}
                  onChange={handlePasswordChange}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '8px' }}
                />
                <span onClick={() => setShowConfirmPass(!showConfirmPass)} style={{ position: 'absolute', right: '15px', top: '22px', cursor: 'pointer' }}>
                  {showConfirmPass ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={handleChangePassword}
                style={{ flex: 1, padding: '15px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px' }}
              >
                Đổi mật khẩu
              </button>
              <button 
                onClick={() => setMode('view')}
                style={{ flex: 1, padding: '15px', backgroundColor: '#eee', color: '#333', border: 'none', borderRadius: '8px' }}
              >
                Quay lại
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
