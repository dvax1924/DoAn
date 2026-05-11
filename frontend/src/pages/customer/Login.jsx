import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Lấy redirect từ query (nếu có từ giỏ hàng hoặc trang khác)
  const redirect = searchParams.get('redirect') || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      
      if (res.data.success) {
        login(res.data, res.data.token);
        toast.success("Đăng nhập thành công!");

        // === XỬ LÝ REDIRECT ===
        if (redirect) {
          navigate(redirect);                    // Quay lại trang trước (ví dụ: /checkout)
        } 
        else if (res.data.role === 'admin') {
          navigate('/admin');                    // Admin → Dashboard Admin
        } 
        else {
          navigate('/');                         // User thường → Trang chủ
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Email hoặc mật khẩu không đúng");
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
        maxWidth: '420px',
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
          Đăng nhập
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
              placeholder="Nhập email của bạn"
            />
          </div>

          <div style={{ marginBottom: '30px', position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Mật khẩu</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
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
            {loading ? "Đang đăng nhập..." : "ĐĂNG NHẬP"}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          Chưa có tài khoản?{' '}
          <Link to="/register" style={{ color: '#1A1A1B', fontWeight: '600' }}>
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
