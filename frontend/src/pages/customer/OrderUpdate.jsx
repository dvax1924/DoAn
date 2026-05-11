import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';

const OrderUpdate = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    phone: '',
    street: '',
    ward: '',
    district: '',
    province: 'TP. Hồ Chí Minh'
  });

  // Lấy thông tin đơn hàng
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        const data = res.data.order || res.data;

        if (data.orderStatus !== 'pending') {
          toast.warning("Đơn hàng này không thể chỉnh sửa nữa");
          navigate('/orders');
          return;
        }

        setOrder(data);
        setFormData({
          phone: data.shippingAddress.phone || '',
          street: data.shippingAddress.street || '',
          ward: data.shippingAddress.ward || '',
          district: data.shippingAddress.district || '',
          province: data.shippingAddress.province || 'TP. Hồ Chí Minh'
        });
      } catch  {
        toast.error("Không tìm thấy đơn hàng hoặc không có quyền chỉnh sửa");
        navigate('/orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await api.put(`/orders/${id}/status`, {
        shippingAddress: {
          name: order.shippingAddress.name,
          phone: formData.phone,
          street: formData.street,
          ward: formData.ward,
          district: formData.district,
          province: formData.province
        }
      });

      if (res.data.success) {
        toast.success("Cập nhật thông tin đơn hàng thành công!");
        navigate('/orders');           // Quay về trang Orders
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '100px' }}>Đang tải...</p>;
  if (!order) return <p style={{ textAlign: 'center', padding: '100px' }}>Không tìm thấy đơn hàng</p>;

  return (
    <div style={{ padding: '40px 20px', backgroundColor: '#F5F5F3', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '700px', margin: '0 auto' }}>
        
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
          Cập nhật thông tin đơn hàng
        </h1>

        <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
          
          <div style={{ marginBottom: '25px' }}>
            <strong>Mã đơn hàng:</strong> #{order._id.slice(-8).toUpperCase()}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label>Số điện thoại *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '8px' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label>Địa chỉ chi tiết *</label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '8px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label>Phường/Xã *</label>
                <input
                  type="text"
                  name="ward"
                  value={formData.ward}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '8px' }}
                />
              </div>
              <div>
                <label>Quận/Huyện *</label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '8px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label>Tỉnh/Thành phố</label>
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                placeholder="Nhập tỉnh/thành phố"
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  borderRadius: '8px', 
                  border: '1px solid #ddd', 
                  marginTop: '8px' 
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                type="submit"
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '16px',
                  backgroundColor: '#1A1A1B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>

              <button 
                type="button"
                onClick={() => navigate('/orders')}
                style={{
                  flex: 1,
                  padding: '16px',
                  backgroundColor: '#eee',
                  color: '#333',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Quay lại
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrderUpdate;