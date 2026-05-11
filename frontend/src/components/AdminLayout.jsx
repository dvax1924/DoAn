import React, { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import { 
  FaHome, FaBox, FaList, FaShoppingBag, 
  FaUsers, FaUserCog, FaSignOutAlt 
} from 'react-icons/fa';

const AdminLayout = ({ children }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success("Đã đăng xuất thành công");
    navigate('/login');
  };

  const menuItems = useMemo(() => [
    { path: '/admin', icon: <FaHome />, label: 'Trang chủ' },
    { path: '/admin/products', icon: <FaBox />, label: 'Quản lý Sản phẩm' },
    { path: '/admin/categories', icon: <FaList />, label: 'Quản lý Danh mục' },
    { path: '/admin/orders', icon: <FaShoppingBag />, label: 'Quản lý Đơn hàng' },
    { path: '/admin/customers', icon: <FaUsers />, label: 'Quản lý Khách hàng' },
    { path: '/admin/accounts', icon: <FaUserCog />, label: 'Quản lý tài khoản' },
  ], []);

  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F5F5F3' }}>
      
      {/* SIDEBAR */}
      <div style={{
        width: '280px',
        backgroundColor: '#1A1A1B',
        color: 'white',
        height: '100vh',
        position: 'fixed',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 0 15px rgba(0,0,0,0.1)',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', padding: '30px 20px 40px' }}>
          <h1 style={{ color: 'white', fontSize: '32px', letterSpacing: '-1px', margin: 0 }}>
            GOLDIE
          </h1>
          <p style={{ color: '#888', fontSize: '14px', marginTop: '4px', fontWeight: '500' }}>
            ADMIN PANEL
          </p>
        </div>

        {/* Navigation + Scrollbar */}
        <nav className="admin-sidebar-nav" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 20px',
          paddingBottom: '30px'
        }}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px 24px',
                color: isActive(item.path) ? 'white' : '#ccc',
                backgroundColor: isActive(item.path) ? '#2a2a2b' : 'transparent',
                textDecoration: 'none',
                borderRadius: '12px',
                marginBottom: '6px',
                fontSize: '16px',
                transition: 'all 0.3s ease',
              }}
            >
              <span style={{ marginRight: '14px', fontSize: '18px' }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{
          backgroundColor: '#2a2a2b',
          margin: '20px',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '42px', height: '42px',
              backgroundColor: '#444',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              👨‍💼
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: '600' }}>{user?.name || 'Admin'}</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#aaa' }}>Quản trị viên</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            <FaSignOutAlt /> Đăng xuất
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: '280px', flex: 1, padding: '40px 50px', minHeight: '100vh' }}>
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
