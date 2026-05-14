import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Upload, X, Loader2, ChevronDown } from "lucide-react";
import api from "../../api/axiosInstance";
import { toast } from "@/components/ui/Toast";
import { sortVariantsBySize } from "../../utils/sortVariantsBySize";
import { cn } from "@/lib/utils";
import Button from "../../components/ui/Button";

const availableSizes = ["M", "L", "XL"];

// Animation variants
/** @type {import('framer-motion').Variants} */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

/** @type {import('framer-motion').Variants} */
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

/** @type {import('framer-motion').Variants} */
const variantItemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    x: -20,
    transition: {
      duration: 0.2,
    },
  },
};

/** @type {import('framer-motion').Variants} */
const imageVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2,
    },
  },
};

export default function AddProduct() {
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
  
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [openVariantDropdownIndex, setOpenVariantDropdownIndex] = useState(null);
  
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [formData.description]);

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

  const addVariant = () => {
    const usedSizes = variants.map(v => v.size);
    const availableSize = availableSizes.find(s => !usedSizes.includes(s));

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
    form.append('price', String(formData.price));
    form.append('isActive', String(formData.isActive));
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

  const canAddMoreVariants =
    variants.length < availableSizes.length &&
    !variants.some((v) => !availableSizes.includes(v.size));

  return (
    <div className="min-h-screen bg-[#F5F4F0]">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link to="/admin/products">
            <motion.button
              whileHover={{ x: -4 }}
              whileTap={{ scale: 0.98 }}
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-[#1A1A1B]"
              onClick={(e) => { e.preventDefault(); navigate('/admin/products'); }}
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              Quay lại
            </motion.button>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1B] sm:text-3xl">
            Thêm sản phẩm mới
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Điền thông tin chi tiết để thêm sản phẩm vào kho hàng
          </p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Basic Info Card */}
            <motion.div
              variants={itemVariants}
              className="rounded-2xl bg-white p-6 sm:p-8"
              style={{ boxShadow: "0 4px 24px -4px rgba(0, 0, 0, 0.06)" }}
            >
              <h2 className="mb-6 text-lg font-semibold text-[#1A1A1B]">
                Thông tin cơ bản
              </h2>
              <div className="space-y-5">
                {/* Product Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-[#1A1A1B]"
                  >
                    Tên sản phẩm *
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên sản phẩm"
                    className="w-full rounded-xl border-0 bg-[#F5F4F0]/50 px-4 py-3.5 text-sm text-[#1A1A1B] placeholder-gray-400 ring-1 ring-inset ring-gray-200 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A1A1B]"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label
                    htmlFor="category"
                    className="mb-2 block text-sm font-medium text-[#1A1A1B]"
                  >
                    Danh mục *
                  </label>
                  <div className="relative">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className="flex w-full items-center justify-between rounded-xl border-0 bg-[#F5F4F0]/50 px-4 py-3.5 text-sm text-[#1A1A1B] ring-1 ring-inset ring-gray-200 transition-all hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A1A1B]"
                    >
                      <span>
                        {formData.category
                          ? categories.find(c => c._id === formData.category)?.name || "Chọn danh mục"
                          : "Chọn danh mục"}
                      </span>
                      <ChevronDown
                        className={cn("h-4 w-4 text-gray-500 transition-transform", isCategoryDropdownOpen ? "rotate-180" : "")}
                        strokeWidth={2}
                      />
                    </motion.button>

                    <AnimatePresence>
                      {isCategoryDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute z-20 mt-2 w-full max-h-60 overflow-auto rounded-xl bg-white py-2 shadow-xl ring-1 ring-gray-200"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              handleInputChange({ target: { name: 'category', value: '' } });
                              setIsCategoryDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full px-4 py-2.5 text-left text-sm transition-colors",
                              !formData.category ? "bg-[#F5F4F0] font-medium text-[#1A1A1B]" : "text-gray-600 hover:bg-gray-50"
                            )}
                          >
                            Chọn danh mục
                          </button>
                          {categories.map((cat) => (
                            <button
                              key={cat._id}
                              type="button"
                              onClick={() => {
                                handleInputChange({ target: { name: 'category', value: cat._id } });
                                setIsCategoryDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full px-4 py-2.5 text-left text-sm transition-colors",
                                formData.category === cat._id
                                  ? "bg-[#F5F4F0] font-medium text-[#1A1A1B]"
                                  : "text-gray-600 hover:bg-gray-50"
                              )}
                            >
                              {cat.name}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label
                    htmlFor="price"
                    className="mb-2 block text-sm font-medium text-[#1A1A1B]"
                  >
                    Giá sản phẩm (VND) *
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    inputMode="numeric"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handlePriceChange}
                    placeholder="0"
                    className="w-full rounded-xl border-0 bg-[#F5F4F0]/50 px-4 py-3.5 text-sm text-[#1A1A1B] placeholder-gray-400 ring-1 ring-inset ring-gray-200 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A1A1B]"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-medium text-[#1A1A1B]"
                  >
                    Mô tả
                  </label>
                  <motion.textarea
                    ref={textareaRef}
                    whileFocus={{ scale: 1.01 }}
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Nhập mô tả sản phẩm"
                    rows={4}
                    className="w-full resize-none rounded-xl border-0 bg-[#F5F4F0]/50 px-4 py-3.5 text-sm text-[#1A1A1B] placeholder-gray-400 ring-1 ring-inset ring-gray-200 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A1A1B] overflow-hidden"
                  />
                </div>
              </div>
            </motion.div>

            {/* Variants Card */}
            <motion.div
              variants={itemVariants}
              className="rounded-2xl bg-white p-6 sm:p-8"
              style={{ boxShadow: "0 4px 24px -4px rgba(0, 0, 0, 0.06)" }}
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#1A1A1B]">
                    Biến thể sản phẩm
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Thêm các size và số lượng tồn kho
                  </p>
                </div>
                {canAddMoreVariants && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addVariant}
                    className="rounded-lg gap-1.5"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2} />
                    Thêm size
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {variants.map((variant, index) => (
                    <motion.div
                      key={index}
                      variants={variantItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="flex items-center gap-4 rounded-xl bg-[#F5F4F0]/50 p-4"
                    >
                      <div className="flex-1">
                        <label className="mb-1.5 block text-xs font-medium text-gray-500">
                          Size
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenVariantDropdownIndex(openVariantDropdownIndex === index ? null : index)}
                            className="flex w-full items-center justify-between rounded-lg border-0 bg-white px-3 py-2.5 text-sm font-medium text-[#1A1A1B] ring-1 ring-inset ring-gray-200 transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1A1A1B]"
                          >
                            <span>{variant.size}</span>
                            <ChevronDown
                              className={cn("h-4 w-4 text-gray-500 transition-transform", openVariantDropdownIndex === index ? "rotate-180" : "")}
                              strokeWidth={2}
                            />
                          </button>

                          <AnimatePresence>
                            {openVariantDropdownIndex === index && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute z-20 mt-1 w-full rounded-lg bg-white py-1 shadow-lg ring-1 ring-gray-200"
                              >
                                {availableSizes.map((size) => {
                                  const isSelected = variants.some((v, i) => i !== index && v.size === size);
                                  return (
                                    <button
                                      key={size}
                                      type="button"
                                      disabled={isSelected}
                                      onClick={() => {
                                        handleVariantChange(index, "size", size);
                                        setOpenVariantDropdownIndex(null);
                                      }}
                                      className={cn(
                                        "w-full px-3 py-2 text-left text-sm transition-colors",
                                        variant.size === size
                                          ? "bg-[#F5F4F0] font-medium text-[#1A1A1B]"
                                          : isSelected
                                          ? "cursor-not-allowed text-gray-400"
                                          : "text-gray-600 hover:bg-gray-50"
                                      )}
                                    >
                                      {size}{isSelected ? ' (đã chọn)' : ''}
                                    </button>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="mb-1.5 block text-xs font-medium text-gray-500">
                          Tồn kho
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={variant.stock}
                          onChange={(e) =>
                            handleVariantChange(index, "stock", e.target.value.replace(/[^0-9]/g, ''))
                          }
                          placeholder="0"
                          className="w-full rounded-lg border-0 bg-white px-3 py-2.5 text-sm text-[#1A1A1B] placeholder-gray-400 ring-1 ring-inset ring-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-[#1A1A1B]"
                        />
                      </div>
                      <div className="pt-5">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeVariant(index)}
                          disabled={variants.length === 1}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={2} />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Images Card */}
            <motion.div
              variants={itemVariants}
              className="rounded-2xl bg-white p-6 sm:p-8"
              style={{ boxShadow: "0 4px 24px -4px rgba(0, 0, 0, 0.06)" }}
            >
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-[#1A1A1B]">
                  Hình ảnh sản phẩm
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Tải lên hình ảnh sản phẩm (có thể chọn nhiều ảnh)
                </p>
              </div>

              {/* Upload Area */}
              <motion.div
                whileHover={{ borderColor: "#1A1A1B" }}
                onClick={() => fileInputRef.current?.click()}
                className="mb-4 cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-[#F5F4F0]/30 p-8 text-center transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F4F0]"
                >
                  <Upload
                    className="h-6 w-6 text-[#1A1A1B]"
                    strokeWidth={1.5}
                  />
                </motion.div>
                <p className="text-sm font-medium text-[#1A1A1B]">
                  Nhấp để tải ảnh lên
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  PNG, JPG, WEBP
                </p>
              </motion.div>

              {/* Image Previews */}
              <AnimatePresence>
                {previewImages.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
                  >
                    {previewImages.map((preview, index) => (
                      <motion.div
                        key={index}
                        variants={imageVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100"
                      >
                        <img
                          src={preview}
                          alt="preview"
                          className="h-full w-full object-cover"
                        />
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeImage(index)}
                          className="absolute right-2 top-2 rounded-full bg-[#1A1A1B]/80 p-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </motion.button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-3 sm:flex-row sm:justify-end"
            >
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto rounded-xl"
                onClick={() => navigate('/admin/products')}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full sm:w-auto rounded-xl shadow-lg gap-2"
              >
                {!loading && <Plus className="h-4 w-4" strokeWidth={2} />}
                Thêm sản phẩm
              </Button>
            </motion.div>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
