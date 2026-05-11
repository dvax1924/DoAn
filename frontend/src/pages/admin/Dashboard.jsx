import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import { 
  FaUsers, 
  FaShoppingBag, 
  FaBox, 
  FaMoneyBillWave, 
  FaSync 
} from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [revenueChart, setRevenueChart] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [loading, setLoading] = useState(true);

  const totalRevenue = revenueChart.reduce((sum, item) => sum + (item.revenue || 0), 0);

  const periodLabel = {
    week: 'tuần này',
    month: 'tháng này',
    year: 'năm nay'
  };

  const fetchDashboard = useCallback(async (period = 'week') => {
    setLoading(true);
    try {
      const res = await api.get(`/stats/summary?period=${period}`);
      setStats(res.data);
      setRevenueChart(res.data.revenueChart || []);
    } catch {
      toast.error("Không thể tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(selectedPeriod);
  }, [selectedPeriod, fetchDashboard]);

  if (loading) {
    return <p style={{ textAlign: 'center', padding: '120px', fontSize: '18px' }}>Đang tải dữ liệu...</p>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '32px', margin: 0 }}>Xin chào, Admin 👋</h1>
          <p style={{ color: '#666', marginTop: '8px' }}>
            Hôm nay là {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button 
          onClick={() => fetchDashboard(selectedPeriod)}
          style={{ padding: '12px 24px', backgroundColor: '#1A1A1B', color: 'white', border: 'none', borderRadius: '12px' }}
        >
          <FaSync /> Tải lại
        </button>
      </div>

      {/* ==================== 5 Ô THỐNG KÊ (Flexbox - tự động rộng theo nội dung) ==================== */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '24px', 
        marginBottom: '40px' 
      }}>
        <StatCard icon={<FaUsers />} title="Tổng khách hàng" value={stats.totalUsers || 0} />
        <StatCard icon={<FaShoppingBag />} title="Tổng đơn hàng" value={stats.totalOrders || 0} />
        <StatCard icon={<FaBox />} title="Tổng sản phẩm" value={stats.totalProducts || 0} />
        <StatCard icon={<FaShoppingBag />} title="Đơn hàng hôm nay" value={stats.todayOrders || 0} />
        
        {/* Ô Doanh thu hôm nay - TỰ ĐỘNG RỘNG THEO ĐỘ DÀI SỐ TIỀN */}
        <StatCard 
          icon={<FaMoneyBillWave />} 
          title="Doanh thu hôm nay" 
          value={`${(stats.todayRevenue || 0).toLocaleString('vi-VN')}đ`} 
          isRevenue 
        />
      </div>

      {/* Biểu đồ Doanh thu */}
      <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 6px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Doanh thu</h3>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px' }}
          >
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
            <option value="year">Năm nay</option>
          </select>
        </div>

        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={revenueChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" />
            <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
            <Tooltip formatter={(value) => `${value.toLocaleString('vi-VN')}đ`} />
            <Line type="monotone" dataKey="revenue" stroke="#1A1A1B" strokeWidth={5} dot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>

        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <span style={{ color: '#666', fontSize: '16px' }}>
            Tổng doanh thu {periodLabel[selectedPeriod]}
          </span>
          <strong style={{ fontSize: '28px', color: '#1A1A1B' }}>
            {totalRevenue.toLocaleString('vi-VN')}đ
          </strong>
        </div>
      </div>
    </div>
  );
};

/* ====================== STATCARD ĐÃ TỐI ƯU (TỰ ĐỘNG RỘNG) ====================== */
const StatCard = ({ icon, title, value, isRevenue = false }) => (
  <div style={{ 
    flex: isRevenue ? '2 1 340px' : '1 1 260px',   // Ô doanh thu rộng gấp đôi
    minWidth: isRevenue ? '340px' : '260px',
    background: 'white', 
    padding: '28px 24px', 
    borderRadius: '16px', 
    boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
    minHeight: '168px',
    display: 'flex',
    alignItems: 'center'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ 
          color: '#666', 
          fontSize: '15px', 
          marginBottom: '10px',
          whiteSpace: 'nowrap'
        }}>
          {title}
        </p>
        <h3 style={{ 
          fontSize: isRevenue ? '32px' : '42px',
          fontWeight: '700',
          margin: 0,
          lineHeight: '1.1',
          wordBreak: 'break-word',
          overflowWrap: 'break-word'
        }}>
          {value}
        </h3>
      </div>

      <div style={{ 
        fontSize: '56px', 
        color: '#1A1A1B', 
        opacity: 0.12,
        flexShrink: 0,
        marginLeft: '16px'
      }}>
        {icon}
      </div>
    </div>
  </div>
);

export default AdminDashboard;