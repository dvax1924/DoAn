import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import api from '../api/axiosInstance';
import socket from '../api/socket';
import { FaUser, FaSearch, FaShoppingCart, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showCollection, setShowCollection] = useState(false);

  // ==================== DANH MỤC THỰC TẾ TỪ API ====================
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch danh mục
  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories');
      const fetched = res.data.categories || res.data || [];
      
      setCategories([
        { name: 'All', slug: 'all' },
        ...fetched
      ]);
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
      setCategories([
        { name: 'All', slug: 'all' },
        { name: 'T-shirt', slug: 't-shirt' },
        { name: 'Outer', slug: 'outer' }
      ]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Fetch khi load Navbar
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // 🔔 Socket.IO: Lắng nghe thay đổi danh mục real-time
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.on('categoryUpdated', () => {
      fetchCategories();
    });

    return () => {
      socket.off('categoryUpdated');
    };
  }, [fetchCategories]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${searchTerm}`);
      setShowSearch(false);
      setSearchTerm('');
    }
  };

  const handleLogout = () => {
    logout();
    setShowAccountMenu(false);
    toast.success("Đã đăng xuất");
    navigate('/');
  };

  return (
    <nav style={{ backgroundColor: '#1A1A1B', color: 'white', position: 'sticky', top: 0, zIndex: 1000 }}>
      <div className="container" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '18px 0' 
      }}>

        {/* Logo */}
        <Link to="/" style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '-1px', color: 'white', textDecoration: 'none' }}>
          GOLDIE
        </Link>

        {/* COLLECTION Dropdown - Lấy từ DB */}
        <div 
          style={{ position: 'relative' }}
          onMouseEnter={() => setShowCollection(true)}
          onMouseLeave={() => setShowCollection(false)}
        >
          <Link 
            to="/products" 
            style={{ 
              color: 'white', 
              textDecoration: 'none', 
              fontWeight: '500', 
              fontSize: '16px',
              padding: '8px 16px'
            }}
          >
            COLLECTION
          </Link>

          {showCollection && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'white',
              color: '#1A1A1B',
              boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
              borderRadius: '8px',
              padding: '20px 30px',
              minWidth: '280px',
              zIndex: 1001,
              maxHeight: '420px',
              overflowY: 'auto'
            }}>
              {loadingCategories ? (
                <p style={{ padding: '10px 20px', color: '#999' }}>Đang tải danh mục...</p>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {categories.map(cat => (
                    <Link 
                      key={cat._id || cat.slug}
                      to={cat.slug === 'all' ? '/products' : `/products?category=${cat._id}`}
                      style={{ 
                        color: '#1A1A1B', 
                        textDecoration: 'none', 
                        padding: '6px 0',
                        fontSize: '15px'
                      }}
                      onClick={() => setShowCollection(false)}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

          {/* Search */}
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowSearch(!showSearch)}>
            <FaSearch size={20} />
          </div>

          {/* Account Menu */}
          <div 
            style={{ position: 'relative', cursor: 'pointer' }}
            onMouseEnter={() => setShowAccountMenu(true)}
            onMouseLeave={() => setShowAccountMenu(false)}
          >
            <FaUser size={20} />

            {showAccountMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                backgroundColor: 'white',
                color: '#1A1A1B',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                borderRadius: '8px',
                padding: '15px 20px',
                minWidth: '200px',
                zIndex: 1001
              }}>
                {user ? (
                  <>
                    <div 
                      onClick={() => { navigate('/profile'); setShowAccountMenu(false); }}
                      style={{ padding: '8px 0', fontWeight: '600', cursor: 'pointer', borderBottom: '1px solid #eee', marginBottom: '8px' }}
                    >
                      {user.name}
                    </div>
                    <Link to="/orders" style={{ display: 'block', padding: '8px 0', textDecoration: 'none', color: '#1A1A1B', fontSize:'16px', fontWeight:'400' }} onClick={() => setShowAccountMenu(false)}>
                      Lịch sử mua hàng
                    </Link>
                    <button onClick={handleLogout} style={{ display: 'block', padding: '8px 0', background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', width: '100%', textAlign: 'left',fontSize:'16px', fontWeight:'400' }}>
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" style={{ display: 'block', padding: '8px 0', textDecoration: 'none', color: '#1A1A1B', fontSize:'16px', fontWeight:'400' }}>Đăng nhập</Link>
                    <Link to="/register" style={{ display: 'block', padding: '8px 0', textDecoration: 'none', color: '#1A1A1B',fontSize:'16px', fontWeight:'400' }}>Đăng ký</Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Cart */}
          <Link to="/cart" style={{ position: 'relative', color: 'white', textDecoration: 'none', fontSize: '24px' }}>
            <FaShoppingCart />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: '#e74c3c',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* ==================== SEARCH BAR OVERLAY ==================== */}
      {showSearch && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          padding: '15px 0',
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
          zIndex: 999
        }}>
          <form onSubmit={handleSearch} className="container" style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
              autoFocus
            />
            <button 
              type="button" 
              onClick={() => setShowSearch(false)} 
              style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
            >
              <FaTimes />
            </button>
          </form>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
