import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/auth/register', formData);

      if (res.data.success) {
        toast.success("Đăng ký tài khoản thành công! Vui lòng đăng nhập.");
        navigate('/login');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#F5F5F3',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '50px 40px',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '440px',
        position: 'relative'
      }}>
        {/* Nút Back */}
        <button 
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666'
          }}
        >
          <FaArrowLeft />
        </button>

        <h2 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '32px' }}>
          Đăng ký tài khoản
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Họ và tên</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
              placeholder="Nhập họ và tên"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
              placeholder="Nhập email"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Số điện thoại</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              style={{ width: '100%', padding: '14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
              placeholder="Nhập số điện thoại"
            />
          </div>

          <div style={{ marginBottom: '30px', position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Mật khẩu</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
              placeholder="Nhập mật khẩu"
            />
            <span 
              onClick={() => setShowPassword(!showPassword)}
              style={{ 
                position: 'absolute', 
                right: '15px', 
                top: '42px', 
                cursor: 'pointer',
                color: '#666'
              }}
            >
              {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#1A1A1B',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '17px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '20px'
            }}
          >
            {loading ? "Đang đăng ký..." : "ĐĂNG KÝ"}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          Đã có tài khoản?{' '}
          <Link to="/login" style={{ color: '#1A1A1B', fontWeight: '600' }}>
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;