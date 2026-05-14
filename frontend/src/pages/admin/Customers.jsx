import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  User,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  X,
  Users,
  Pencil,
  Save,
  RefreshCw
} from "lucide-react";
import api from '../../api/axiosInstance';
import socket from '../../api/socket';
import { toast } from '@/components/ui/Toast';
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/Button';
import { TableSkeleton } from "@/components/ui/TableSkeleton";

// Format currency in Vietnamese
const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value || 0);
};

// Format date in Vietnamese
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// Get initials from name
const getInitials = (name) => {
  if (!name) return "KH";
  return name
    .trim()
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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

const customerTableHeaders = ["Khách hàng", "Email", "Số điện thoại", "Ngày đăng ký", "Trạng thái", "Hành động"];
const customerTableColumnsClassName = "lg:grid-cols-[minmax(150px,1.2fr)_minmax(170px,1.3fr)_minmax(125px,0.9fr)_minmax(120px,0.9fr)_minmax(112px,0.8fr)_minmax(86px,0.65fr)]";
const customerTableGapClassName = "gap-4 lg:gap-3";
const customerTableGridClassName = `grid grid-cols-1 ${customerTableColumnsClassName}`;
const customerTableHeaderGridClassName = `hidden lg:grid ${customerTableColumnsClassName}`;

const getOrderUserId = (orderUser) => {
  if (!orderUser) return null;
  if (typeof orderUser === 'string') return orderUser;
  return orderUser._id || orderUser.id || null;
};

const buildOrderStatsMap = (orders = []) => {
  return orders.reduce((statsMap, order) => {
    const userId = getOrderUserId(order.user);
    if (!userId) return statsMap;

    const currentStats = statsMap.get(userId) || {
      totalOrders: 0,
      totalSpent: 0,
    };

    currentStats.totalOrders += 1;
    if (order.orderStatus !== 'cancelled') {
      currentStats.totalSpent += Number(order.totalAmount) || 0;
    }

    statsMap.set(userId, currentStats);
    return statsMap;
  }, new Map());
};

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
  });

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/users');
      let orderStatsMap = new Map();

      try {
        const ordersRes = await api.get('/orders');
        orderStatsMap = buildOrderStatsMap(ordersRes.data.orders || []);
      } catch {
        orderStatsMap = new Map();
      }

      setCustomers(
        (res.data.users || [])
          .filter((user) => user.role !== 'admin')
          .map((user) => {
            const orderStats = orderStatsMap.get(user._id);

            return {
              ...user,
              totalOrders: orderStats?.totalOrders ?? user.totalOrders ?? 0,
              totalSpent: orderStats ? orderStats.totalSpent : user.totalSpent || 0,
            };
          })
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tải danh sách khách hàng');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    socket.connect();
    socket.emit('joinAdmin');

    const handleUserProfileUpdated = (updatedUser) => {
      setCustomers((prev) =>
        prev.map((customer) =>
          customer._id === updatedUser?._id
            ? { ...customer, ...updatedUser }
            : customer
        )
      );

      setSelectedCustomer((prev) => (
        prev?._id === updatedUser?._id
          ? { ...prev, ...updatedUser }
          : prev
      ));

      if (selectedCustomer?._id === updatedUser?._id && !isSaving) {
        setEditForm({
          name: updatedUser.name || '',
          phone: updatedUser.phone || ''
        });
      }
    };

    socket.on('userProfileUpdated', handleUserProfileUpdated);

    return () => {
      socket.off('userProfileUpdated', handleUserProfileUpdated);
    };
  }, [selectedCustomer?._id, isSaving]);

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return customers;

    return customers.filter((customer) =>
      [customer.email, customer.phone, customer.name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword))
    );
  }, [customers, searchQuery]);

  const openCustomerModal = (customer) => {
    setSelectedCustomer(customer);
    setEditForm({
      name: customer.name || "",
      phone: customer.phone || "",
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!selectedCustomer) return;

    setIsSaving(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        phone: editForm.phone.trim()
      };

      const res = await api.put(`/users/${selectedCustomer._id}`, payload);
      const updatedUser = res.data.user;

      setCustomers((prev) =>
        prev.map((item) =>
          item._id === selectedCustomer._id
            ? { ...item, ...updatedUser }
            : item
        )
      );

      setSelectedCustomer((prev) =>
        prev ? { ...prev, ...updatedUser } : null
      );

      toast.success('Cập nhật khách hàng thành công');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật khách hàng');
    } finally {
      setIsSaving(false);
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
              Quản lý Khách hàng
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Xem và quản lý thông tin khách hàng
            </p>
          </div>
          <button
            onClick={fetchCustomers}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1A1A1B] px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-black hover:shadow-xl"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={2} />
            Tải lại
          </button>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative max-w-md">
            <Search
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              strokeWidth={1.5}
            />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border-0 bg-white py-3.5 pl-12 pr-4 text-sm text-[#1A1A1B] placeholder-gray-400 shadow-sm ring-1 ring-inset ring-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-[#1A1A1B]"
            />
          </div>
        </motion.div>

        {/* Customers Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {isLoading ? (
            <TableSkeleton
              rows={6}
              headers={customerTableHeaders}
              headerGridClassName={customerTableHeaderGridClassName}
              rowGridClassName={customerTableGridClassName}
              gapClassName={customerTableGapClassName}
              useColumnSpans={false}
            />
          ) : (
            <div
              className="overflow-hidden rounded-2xl bg-white shadow-sm"
              style={{ boxShadow: "0 4px 24px -4px rgba(0, 0, 0, 0.06)" }}
            >
              {/* Table Header */}
              <div className="hidden border-b border-gray-100 bg-gray-50/50 px-6 py-4 lg:grid lg:grid-cols-[minmax(150px,1.2fr)_minmax(170px,1.3fr)_minmax(125px,0.9fr)_minmax(120px,0.9fr)_minmax(112px,0.8fr)_minmax(86px,0.65fr)] lg:gap-3">
                <div className="min-w-0 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Khách hàng
                </div>
                <div className="min-w-0 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Email
                </div>
                <div className="min-w-0 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Số điện thoại
                </div>
                <div className="min-w-0 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Ngày đăng ký
                </div>
                <div className="min-w-0 whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Trạng thái
                </div>
                <div className="min-w-0 whitespace-nowrap text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Hành động
                </div>
              </div>

              {/* Table Body */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence mode="wait">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <motion.div
                        key={customer._id}
                        variants={rowVariants}
                        exit="exit"
                        layout
                        whileHover={{ backgroundColor: "rgba(245, 245, 243, 0.5)" }}
                        className="grid grid-cols-1 gap-4 border-b border-gray-100 px-6 py-5 transition-colors last:border-b-0 lg:grid-cols-[minmax(150px,1.2fr)_minmax(170px,1.3fr)_minmax(125px,0.9fr)_minmax(120px,0.9fr)_minmax(112px,0.8fr)_minmax(86px,0.65fr)] lg:items-center lg:gap-3"
                      >
                        {/* Name */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#1A1A1B] text-sm font-semibold text-white">
                              {getInitials(customer.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-[#1A1A1B]">
                                {customer.name || '-'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Email */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Mail
                              className="h-4 w-4 text-gray-400 lg:hidden"
                              strokeWidth={1.5}
                            />
                            <p className="min-w-0 truncate text-sm text-gray-600">{customer.email}</p>
                          </div>
                        </div>

                        {/* Phone */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Phone
                              className="h-4 w-4 text-gray-400 lg:hidden"
                              strokeWidth={1.5}
                            />
                            <p className="text-sm text-gray-600">{customer.phone || '-'}</p>
                          </div>
                        </div>

                        {/* Registered Date */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Calendar
                              className="h-4 w-4 text-gray-400 lg:hidden"
                              strokeWidth={1.5}
                            />
                            <p className="text-sm text-gray-600">
                              {formatDate(customer.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="min-w-0">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                              customer.isActive !== false
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-red-200 bg-red-50 text-red-600"
                            )}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                customer.isActive !== false ? "bg-emerald-500" : "bg-red-500"
                              )}
                            />
                            {customer.isActive !== false ? "Hoạt động" : "Đã khóa"}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex min-w-0 items-center gap-2 lg:justify-end">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openCustomerModal(customer)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5F4F0] px-3 py-2 text-xs font-medium text-[#1A1A1B] transition-colors hover:bg-[#1A1A1B] hover:text-white"
                          >
                            <User className="h-3.5 w-3.5" strokeWidth={2} />
                            Xem
                          </motion.button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-16 text-center"
                    >
                      <Users className="mb-4 h-12 w-12 text-gray-300" strokeWidth={1} />
                      <p className="text-sm font-medium text-gray-500">
                        Không tìm thấy khách hàng nào
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Thử thay đổi từ khóa tìm kiếm
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Customer Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 text-center text-sm text-gray-500"
        >
          Hiển thị {filteredCustomers.length} / {customers.length} khách hàng
        </motion.div>
      </div>

      {/* Customer Detail Modal */}
      <AnimatePresence>
        {isModalOpen && selectedCustomer && (
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
              className="w-full max-w-lg overflow-hidden rounded-2xl bg-white p-6 sm:p-8"
              style={{ boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.18)" }}
            >
              {/* Modal Header */}
              <div className="mb-6 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1A1A1B] text-lg font-semibold text-white">
                    {getInitials(selectedCustomer.name)}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[#1A1A1B]">
                      Thông tin khách hàng
                    </h2>
                    <p className="mt-0.5 text-sm text-gray-500">
                      ID: #{selectedCustomer._id.slice(-6).toUpperCase()}
                    </p>
                  </div>
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

              {/* Customer Info */}
              <div className="space-y-4">
                {/* Name */}
                <div className="rounded-xl bg-[#F5F4F0]/50 p-4">
                  <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <User className="h-4 w-4" strokeWidth={1.5} />
                    Họ và tên
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full rounded-lg border-0 bg-white px-4 py-2.5 text-sm text-[#1A1A1B] ring-1 ring-inset ring-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-[#1A1A1B]"
                    />
                  ) : (
                    <p className="font-medium text-[#1A1A1B]">
                      {selectedCustomer.name || '-'}
                    </p>
                  )}
                </div>

                {/* Email (read-only) */}
                <div className="rounded-xl bg-[#F5F4F0]/50 p-4">
                  <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <Mail className="h-4 w-4" strokeWidth={1.5} />
                    Email
                  </label>
                  <p className="font-medium text-[#1A1A1B]">
                    {selectedCustomer.email}
                  </p>
                </div>

                {/* Phone */}
                <div className="rounded-xl bg-[#F5F4F0]/50 p-4">
                  <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <Phone className="h-4 w-4" strokeWidth={1.5} />
                    Số điện thoại
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      className="w-full rounded-lg border-0 bg-white px-4 py-2.5 text-sm text-[#1A1A1B] ring-1 ring-inset ring-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-[#1A1A1B]"
                    />
                  ) : (
                    <p className="font-medium text-[#1A1A1B]">
                      {selectedCustomer.phone || '-'}
                    </p>
                  )}
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-[#F5F4F0]/50 p-4">
                    <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <Calendar className="h-4 w-4" strokeWidth={1.5} />
                      Ngày đăng ký
                    </label>
                    <p className="font-medium text-[#1A1A1B]">
                      {formatDate(selectedCustomer.createdAt)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#F5F4F0]/50 p-4">
                    <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
                      Tổng đơn hàng
                    </label>
                    <p className="font-medium text-[#1A1A1B]">
                      {selectedCustomer.totalOrders || 0} đơn
                    </p>
                  </div>
                </div>

                {/* Total Spent */}
                <div className="rounded-xl bg-[#1A1A1B] p-4">
                  <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Tổng chi tiêu
                  </label>
                  <p className="text-2xl font-semibold text-white">
                    {formatCurrency(selectedCustomer.totalSpent || 0)}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => setIsEditing(false)}
                    >
                      Hủy
                    </Button>
                    <Button
                      variant="primary"
                      className="rounded-xl shadow-lg gap-2"
                      onClick={handleSave}
                      loading={isSaving}
                    >
                      {!isSaving && <Save className="h-4 w-4" strokeWidth={2} />}
                      Lưu thay đổi
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    className="rounded-xl shadow-lg gap-2"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-4 w-4" strokeWidth={2} />
                    Chỉnh sửa
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
