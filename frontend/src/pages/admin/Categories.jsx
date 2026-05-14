import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  ArrowRight
} from "lucide-react";
import { toast } from "@/components/ui/Toast";
import api from "../../api/axiosInstance";
import socket from "../../api/socket";
import Button from "../../components/ui/Button";
import { TableSkeleton, CATEGORIES_COLUMNS } from "@/components/ui/TableSkeleton";

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

/** @type {import('framer-motion').Variants} */
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
};

/** @type {import('framer-motion').Variants} */
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Thêm / Sửa Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
  });

  // Migrate Modal
  const [showMigrateModal, setShowMigrateModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [newCategoryId, setNewCategoryId] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.categories || res.data);
    } catch {
      toast.error('Không thể tải danh mục');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // ── Socket: real-time category sync ───────────────────────────────────────
  useEffect(() => {
    if (!socket.connected) socket.connect();

    const onCategoryUpdated = () => fetchCategories();

    socket.on('categoryUpdated', onCategoryUpdated);

    return () => {
      socket.off('categoryUpdated', onCategoryUpdated);
    };
  }, [fetchCategories]);

  // Modal Actions
  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
      };

      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, payload);
        toast.success("Cập nhật danh mục thành công");
      } else {
        await api.post("/categories", payload);
        toast.success("Thêm danh mục thành công");
      }
      fetchCategories();
      closeModal();
    } catch {
      toast.error("Thao tác thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async (category) => {
    setCategoryToDelete(category);
    try {
      const res = await api.get(`/products?category=${category._id}`);
      const count = Number(res.data.totalCount ?? res.data.products?.length ?? 0);
      
      if (count === 0) {
        if (window.confirm(`Xóa danh mục "${category.name}"?`)) {
          await api.delete(`/categories/${category._id}`);
          toast.success("Đã xóa danh mục thành công");
          fetchCategories();
        }
      } else {
        setShowMigrateModal(true);
      }
    } catch {
      toast.error("Không thể kiểm tra số lượng sản phẩm");
    }
  };

  const handleMigrateDelete = async () => {
    if (!newCategoryId) {
      toast.warning("Vui lòng chọn danh mục mới");
      return;
    }
    setIsDeleting(true);
    try {
      await api.delete(`/categories/${categoryToDelete._id}`, {
        data: { newCategoryId },
      });
      toast.success("Đã chuyển sản phẩm sang danh mục mới và xóa thành công!");
      setShowMigrateModal(false);
      setCategoryToDelete(null);
      setNewCategoryId("");
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || "Xóa thất bại");
    } finally {
      setIsDeleting(false);
    }
  };


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
              Quản lý Danh mục
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Quản lý các danh mục sản phẩm của bạn
            </p>
          </div>
          <Button
            variant="primary"
            onClick={openAddModal}
            className="rounded-xl shadow-lg gap-2"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Thêm danh mục mới
          </Button>
        </motion.div>

        {/* Categories Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {loading ? (
            <TableSkeleton rows={6} columns={CATEGORIES_COLUMNS} />
          ) : (
            <div
              className="overflow-hidden rounded-2xl bg-white shadow-sm"
              style={{ boxShadow: "0 4px 24px -4px rgba(0, 0, 0, 0.06)" }}
            >
              {/* Table Header */}
              <div className="hidden border-b border-gray-100 bg-gray-50/50 px-6 py-4 sm:grid sm:grid-cols-12 sm:gap-4">
                <div className="col-span-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Tên danh mục
                </div>
                <div className="col-span-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Số lượng sản phẩm
                </div>
                <div className="col-span-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Hành động
                </div>
              </div>

              {/* Table Body */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence>
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <motion.div
                        key={category._id}
                        variants={rowVariants}
                        exit="exit"
                        whileHover={{ backgroundColor: "rgba(245, 244, 240, 0.5)" }}
                        className="grid grid-cols-1 gap-4 border-b border-gray-100 px-6 py-5 transition-colors last:border-b-0 sm:grid-cols-12 sm:items-center"
                      >
                        {/* Category Name */}
                        <div className="col-span-4 flex items-center gap-4">
                          <div>
                            <p className="font-medium text-[#1A1A1B]">
                              {category.name}
                            </p>
                          </div>
                        </div>

                        {/* Product Count */}
                        <div className="col-span-4 flex justify-center">
                          <span className="inline-flex items-center gap-2 rounded-full bg-[#F5F4F0] px-4 py-1.5 text-sm font-medium text-[#1A1A1B]">
                            {category.productCount ?? 0} sản phẩm
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="col-span-4 flex items-center justify-end gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openEditModal(category)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5F4F0] px-3 py-2 text-xs font-medium text-[#1A1A1B] transition-colors hover:bg-[#1A1A1B] hover:text-white"
                          >
                            <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                            Sửa
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteClick(category)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-600 hover:text-white"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                            Xóa
                          </motion.button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-16 text-center"
                    >
                      <p className="text-sm font-medium text-gray-500">
                        Chưa có danh mục nào
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Bấm nút "Thêm danh mục mới" để bắt đầu
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Category Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-center text-sm text-gray-500"
        >
          Tổng cộng {categories.length} danh mục
        </motion.div>
      </div>

      {/* Modal Thêm / Sửa */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8"
              style={{ boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.18)", maxHeight: "90vh", overflowY: "auto" }}
            >
              {/* Modal Header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[#1A1A1B]">
                    {editingCategory ? "Sửa danh mục" : "Thêm danh mục mới"}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {editingCategory
                      ? "Cập nhật thông tin danh mục"
                      : "Điền thông tin để tạo danh mục mới"}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeModal}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" strokeWidth={2} />
                </motion.button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Category Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-[#1A1A1B]"
                  >
                    Tên danh mục *
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên danh mục"
                    className="w-full rounded-xl border-0 bg-[#F5F4F0]/50 px-4 py-3.5 text-sm text-[#1A1A1B] placeholder-gray-400 ring-1 ring-inset ring-gray-200 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A1A1B]"
                    required
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
                    className="flex-1 rounded-xl"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={isSubmitting}
                    className="flex-1 rounded-xl shadow-lg"
                  >
                    {editingCategory ? "Cập nhật" : "Thêm danh mục"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Migrate */}
      <AnimatePresence>
        {showMigrateModal && categoryToDelete && (
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => {
              if (!isDeleting) {
                setShowMigrateModal(false);
                setNewCategoryId("");
              }
            }}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8"
              style={{ boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.18)" }}
            >
              {/* Modal Header */}
              <div className="mb-6 flex items-start gap-4">
                <div className="flex-shrink-0 rounded-full bg-red-100 p-3">
                  <Trash2 className="h-6 w-6 text-red-600" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#1A1A1B]">
                    Xóa danh mục
                  </h2>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                    Danh mục <strong className="text-[#1A1A1B]">"{categoryToDelete.name}"</strong> đang có sản phẩm.
                    <br />
                    Bạn phải chuyển tất cả sản phẩm sang danh mục khác trước khi xóa.
                  </p>
                </div>
              </div>

              {/* Migrate Select */}
              <div className="mb-8 pl-14">
                <label className="mb-2 block text-sm font-medium text-[#1A1A1B]">
                  Chọn danh mục mới
                </label>
                <div className="relative">
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    className="w-full cursor-pointer appearance-none rounded-xl border-0 bg-[#F5F4F0]/50 px-4 py-3.5 text-sm font-medium text-[#1A1A1B] ring-1 ring-inset ring-gray-200 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A1A1B]"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories
                      .filter((c) => c._id !== categoryToDelete._id)
                      .map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pl-14">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowMigrateModal(false);
                    setNewCategoryId("");
                  }}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl"
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  loading={isDeleting}
                  onClick={handleMigrateDelete}
                  className="flex-[2] rounded-xl shadow-lg gap-2"
                >
                  {!isDeleting && <ArrowRight className="h-4 w-4" />}
                  Chuyển sản phẩm & Xóa
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
