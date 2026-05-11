import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaPlus, FaTrash, FaUpload } from 'react-icons/fa';
import { sortVariantsBySize } from '../../utils/sortVariantsBySize';

const AddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: 0,
    isActive: true,
  });

  const [variants, setVariants] = useState([
    { size: 'M', stock: 0 }
  ]);

  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.categories || res.data);
      } catch {
        toast.error("Không thể tải danh mục");
      }
    };
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePriceChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, price: Number(value) || 0 }));
  };

  const handleVariantChange = (index, field, value) => {
    if (field === 'size') {
      const isDuplicate = variants.some((v, i) => i !== index && v.size === value);
      if (isDuplicate) {
        toast.warning(`Size ${value} đã tồn tại!`);
        return;
      }
    }
    const newVariants = [...variants];
    newVariants[index][field] = field === 'stock' ? Number(value) || 0 : value;
    setVariants(sortVariantsBySize(newVariants));
  };

  const allSizes = ['M', 'L', 'XL'];

  const addVariant = () => {
    const usedSizes = variants.map(v => v.size);
    const availableSize = allSizes.find(s => !usedSizes.includes(s));

    if (!availableSize) {
      toast.warning('Đã thêm tất cả các size (M, L, XL)');
      return;
    }

    setVariants(sortVariantsBySize([...variants, { size: availableSize, stock: 0 }]));
  };

  const removeVariant = (index) => {
    if (variants.length === 1) return;
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(prev => [...prev, ...previews]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviewImages(previewImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const form = new FormData();
    form.append('name', formData.name);
    form.append('description', formData.description);
    form.append('category', formData.category);
    form.append('price', formData.price);           // ← Giá chung
    form.append('isActive', formData.isActive);
    form.append('variants', JSON.stringify(sortVariantsBySize(variants)));

    images.forEach(image => form.append('images', image));

    try {
      await api.post('/products', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("✅ Thêm sản phẩm thành công!");
      navigate('/admin/products');
    } catch (error) {
      toast.error(error.response?.data?.message || "Thêm sản phẩm thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <button onClick={() => navigate('/admin/products')} style={{ background: 'none', border: 'none', fontSize: '26px', cursor: 'pointer' }}>
          <FaArrowLeft />
        </button>
        <h1 style={{ margin: 0 }}>Thêm sản phẩm mới</h1>
      </div>

      <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 6px 20px rgba(0,0,0,0.06)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {/* Cột trái */}
            <div>
              <div style={{ marginBottom: '20px' }}>
                <label>Tên sản phẩm *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '8px' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label>Danh mục *</label>
                <select name="category" value={formData.category} onChange={handleInputChange} required style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '8px' }}>
                  <option value="">Chọn danh mục</option>
                  {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label>Giá sản phẩm (đ) *</label>
                <input type="text" inputMode="numeric" value={formData.price} onChange={handlePriceChange} required style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '8px' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label>Mô tả sản phẩm</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="4" style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '8px' }} />
              </div>
            </div>

            {/* Cột phải */}
            <div>
              <div style={{ marginBottom: '25px' }}>
                <label>Ảnh sản phẩm (có thể chọn nhiều)</label>
                <div style={{ border: '2px dashed #ccc', borderRadius: '12px', padding: '30px', textAlign: 'center', cursor: 'pointer' }} onClick={() => document.getElementById('fileInput').click()}>
                  <FaUpload style={{ fontSize: '40px', color: '#999', marginBottom: '10px' }} />
                  <p>Click để chọn ảnh hoặc kéo thả</p>
                  <input id="fileInput" type="file" multiple accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '15px' }}>
                  {previewImages.map((preview, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                      <img src={preview} alt="preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                      <button type="button" onClick={() => removeImage(index)} style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px' }}>×</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Variants - chỉ size + stock */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <label>Variants (Size + Tồn kho)</label>
                  <button type="button" onClick={addVariant} style={{ padding: '6px 14px', background: '#1A1A1B', color: 'white', border: 'none', borderRadius: '6px' }}>
                    <FaPlus /> Thêm size
                  </button>
                </div>
                {variants.map((variant, index) => (
                  <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
                    <select
                      value={variant.size}
                      onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                      style={{ width: '40%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                    >
                      {allSizes.map(s => (
                        <option key={s} value={s} disabled={variants.some((v, i) => i !== index && v.size === s)}>
                          {s}{variants.some((v, i) => i !== index && v.size === s) ? ' (đã chọn)' : ''}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Tồn kho"
                      value={variant.stock}
                      onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                      style={{ width: '40%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                    />
                    <button type="button" onClick={() => removeVariant(index)} style={{ color: '#e74c3c', border:'none', backgroundColor:'#fff' }}>
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '40px', display: 'flex', gap: '15px' }}>
            <button type="button" onClick={() => navigate('/admin/products')} style={{ flex: 1, padding: '16px', backgroundColor: '#eee', border: 'none', borderRadius: '10px' }}>Hủy</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '16px', backgroundColor: '#1A1A1B', color: 'white', border: 'none', borderRadius: '10px' }}>
              {loading ? 'Đang thêm...' : 'Thêm sản phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
