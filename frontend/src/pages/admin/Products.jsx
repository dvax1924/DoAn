import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, ChevronDown, Pencil, Trash2, Package } from 'lucide-react';
import api from '../../api/axiosInstance';
import { toast } from '@/components/ui/Toast';
import { getImageUrl } from '../../utils/getImageUrl';
import socket from '../../api/socket';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton, PRODUCTS_COLUMNS } from '@/components/ui/TableSkeleton';

// Format currency in Vietnamese
const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

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
const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.2,
    },
  },
};

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get('/products?limit=200');
      setProducts(res.data.products || res.data);
    } catch {
      toast.error('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Socket: real-time product list sync ───────────────────────────────────
  useEffect(() => {
    if (!socket.connected) socket.connect();

    const onCreated = ({ product }) =>
      setProducts((prev) =>
        prev.some((p) => p._id === product._id) ? prev : [product, ...prev]
      );

    const onUpdated = ({ product }) =>
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? product : p))
      );

    const onDeleted = ({ productId }) =>
      setProducts((prev) => prev.filter((p) => p._id !== productId));

    socket.on('productCreated', onCreated);
    socket.on('productUpdated', onUpdated);
    socket.on('productDeleted', onDeleted);

    return () => {
      socket.off('productCreated', onCreated);
      socket.off('productUpdated', onUpdated);
      socket.off('productDeleted', onDeleted);
    };
  }, []);

  const getTotalStock = (variants) => {
    if (!variants || !Array.isArray(variants)) return 0;
    return variants.reduce((total, variant) => total + (variant.stock || 0), 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p._id !== id));
      toast.success('Đã xóa sản phẩm');
    } catch {
      toast.error('Không thể xóa sản phẩm');
    }
  };

  // Derive categories from products
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category?.name).filter(Boolean));
    return ["Tất cả", ...Array.from(cats)];
  }, [products]);

  // Filter products based on search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const productCategory = product.category?.name || 'Chưa có danh mục';
    const matchesCategory =
      selectedCategory === "Tất cả" || productCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });


  return (
    <div className="min-h-screen bg-[#F5F4F0]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1B] sm:text-3xl">
              Quản lý Sản phẩm
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Quản lý kho hàng và sản phẩm của bạn
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate('/admin/products/add')}
            className="shadow-lg gap-2 rounded-xl h-[48px] px-6"
          >
            <Plus className="h-5 w-5" strokeWidth={2} />
            Thêm sản phẩm mới
          </Button>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center"
        >
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              strokeWidth={1.5}
            />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border-0 bg-white py-3.5 pl-12 pr-4 text-sm text-[#1A1A1B] placeholder-gray-400 shadow-sm ring-1 ring-inset ring-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-[#1A1A1B]"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex min-w-48 items-center justify-between gap-2 rounded-xl bg-white px-4 py-3.5 text-sm font-medium text-[#1A1A1B] shadow-sm ring-1 ring-inset ring-gray-200 transition-all hover:ring-gray-300"
            >
              <span>{selectedCategory}</span>
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", isDropdownOpen ? "rotate-180" : "")}
                strokeWidth={2}
              />
            </motion.button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 z-20 mt-2 w-full min-w-48 rounded-xl bg-white py-2 shadow-xl ring-1 ring-gray-200 max-h-60 overflow-y-auto"
                >
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                        setIsDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full px-4 py-2.5 text-left text-sm transition-colors",
                        selectedCategory === category
                          ? "bg-[#F5F4F0] font-medium text-[#1A1A1B]"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      {category}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Products Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {loading ? (
            <TableSkeleton
              rows={6}
              columns={PRODUCTS_COLUMNS}
            />
          ) : (
            <div
              className="overflow-hidden rounded-2xl bg-white shadow-sm"
              style={{ boxShadow: "0 4px 24px -4px rgba(0, 0, 0, 0.06)" }}
            >
              {/* Table Header */}
              <div className="hidden border-b border-gray-100 bg-gray-50/50 px-6 py-4 sm:grid sm:grid-cols-12 sm:gap-4">
                <div className="col-span-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Hình ảnh</div>
                <div className="col-span-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Tên sản phẩm</div>
                <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Danh mục</div>
                <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Giá</div>
                <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Tồn kho</div>
                <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Hành động</div>
              </div>

              {/* Table Body */}
              <motion.div variants={containerVariants} initial="hidden" animate="visible">
                <AnimatePresence>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => {
                      const totalStock = getTotalStock(product.variants);
                      const productImage = getImageUrl(product.images?.[0]);
                      return (
                        <motion.div
                          key={product._id}
                          variants={rowVariants}
                          exit="exit"
                          layout
                          whileHover={{ backgroundColor: "rgba(245, 245, 243, 0.5)" }}
                          className="grid grid-cols-1 gap-4 border-b border-gray-100 px-6 py-4 transition-colors last:border-b-0 sm:grid-cols-12 sm:items-center"
                        >
                          {/* Image */}
                          <div className="col-span-1">
                            <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-gray-100">
                              {productImage ? (
                                <img src={productImage} alt={product.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gray-200">
                                  <Package className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Product Name */}
                          <div className="col-span-3">
                            <p className="font-medium text-[#1A1A1B]">{product.name}</p>
                            <p className="mt-0.5 text-xs text-gray-500 sm:hidden">{product.category?.name || 'Chưa có danh mục'}</p>
                          </div>
                          {/* Category */}
                          <div className="col-span-2 hidden sm:block">
                            <Badge color="default" className="normal-case tracking-normal font-medium text-[11px] px-3 py-1">
                              {product.category?.name || 'Chưa có danh mục'}
                            </Badge>
                          </div>
                          {/* Price */}
                          <div className="col-span-2">
                            <p className="font-semibold text-[#1A1A1B]">
                              {product.price ? formatCurrency(product.price) : 'Liên hệ'}
                            </p>
                          </div>
                          {/* Stock */}
                          <div className="col-span-2">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
                              <span className={cn(
                                "font-medium",
                                totalStock < 10 ? "text-red-500" : totalStock < 20 ? "text-amber-500" : "text-green-600"
                              )}>
                                {totalStock}
                              </span>
                            </div>
                          </div>
                          {/* Actions */}
                          <div className="col-span-2 flex items-center gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => navigate(`/admin/products/edit/${product._id}`)}
                              className="gap-1.5 rounded-lg normal-case tracking-normal text-xs h-auto py-2"
                            >
                              <Pencil className="h-3.5 w-3.5" strokeWidth={2} /> Sửa
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(product._id)}
                              className="gap-1.5 rounded-lg normal-case tracking-normal text-xs h-auto py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                              shimmer={false}
                            >
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} /> Xóa
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-16 text-center"
                    >
                      <Package className="mb-4 h-12 w-12 text-gray-300" strokeWidth={1} />
                      <p className="text-sm font-medium text-gray-500">Không tìm thấy sản phẩm nào</p>
                      <p className="mt-1 text-xs text-gray-400">Thử thay đổi từ khóa tìm kiếm hoặc danh mục</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </motion.div>


        {/* Product Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 text-center text-sm text-gray-500"
        >
          Hiển thị {filteredProducts.length} / {products.length} sản phẩm
        </motion.div>
      </div>
    </div>
  );
}
