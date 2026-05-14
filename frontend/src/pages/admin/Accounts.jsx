import React, { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, 
  Filter, 
  ChevronDown,
  Pencil,
  Trash2, 
  X,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  Users,
  RefreshCw,
  Lock,
  Unlock
} from "lucide-react"
import api from '../../api/axiosInstance';
import socket from '../../api/socket';
import { toast } from '@/components/ui/Toast';
import Button from '../../components/ui/Button';
import { cn } from '@/lib/utils';
import { TableSkeleton } from '@/components/ui/TableSkeleton';

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/users');
      setAccounts(res.data.users || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tải danh sách tài khoản');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    socket.connect();
    socket.emit('joinAdmin');

    const handleUserPasswordUpdated = (passwordUpdate) => {
      setAccounts((prev) =>
        prev.map((account) =>
          account._id === passwordUpdate?._id
            ? {
                ...account,
                passwordChangedAt: passwordUpdate.passwordChangedAt,
              }
            : account
        )
      );
    };

    socket.on('userPasswordUpdated', handleUserPasswordUpdated);
    return () => {
      socket.off('userPasswordUpdated', handleUserPasswordUpdated);
    };
  }, []);

  const filteredAccounts = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    
    return accounts.filter((account) => {
      const matchesSearch = 
        (account.name || '').toLowerCase().includes(keyword) ||
        (account.email || '').toLowerCase().includes(keyword);
        
      const status = account.isActive !== false ? "active" : "locked";
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [accounts, searchQuery, statusFilter]);

  const handleEdit = (account) => {
    setSelectedAccount(account)
    setNewPassword("")
    setConfirmPassword("")
    setShowPasswordForm(false)
    setEditModalOpen(true)
  }

  const handleDelete = (account) => {
    if (account.role === 'admin') {
      toast.warning('Không thể xóa tài khoản Admin');
      return;
    }
    setSelectedAccount(account)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedAccount) return;
    setSubmitting(true);
    try {
      await api.delete(`/users/${selectedAccount._id}`);
      setAccounts((prev) => prev.filter((item) => item._id !== selectedAccount._id));
      toast.success('Đã xóa tài khoản');
      setDeleteModalOpen(false);
      setSelectedAccount(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa tài khoản');
    } finally {
      setSubmitting(false);
    }
  }

  const handlePasswordChange = async () => {
    if (!newPassword.trim()) {
      toast.warning('Vui lòng nhập mật khẩu mới');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning('Mật khẩu không khớp');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.put(`/users/${selectedAccount._id}`, { password: newPassword.trim() });
      toast.success('Đổi mật khẩu thành công');
      setShowPasswordForm(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể đổi mật khẩu');
    } finally {
      setSubmitting(false);
    }
  }

  const handleToggleStatus = async (account) => {
    if (account.role === 'admin') {
      toast.warning('Không thể khóa tài khoản Admin');
      return;
    }
    const newStatus = account.isActive !== false ? false : true;
    try {
      await api.put(`/users/${account._id}/status`, { isActive: newStatus });
      setAccounts((prev) =>
        prev.map((item) =>
          item._id === account._id ? { ...item, isActive: newStatus } : item
        )
      );
      // also update selectedAccount if modal is open
      setSelectedAccount((prev) =>
        prev?._id === account._id ? { ...prev, isActive: newStatus } : prev
      );
      toast.success(newStatus ? 'Mở khóa tài khoản thành công' : 'Khóa tài khoản thành công');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  }

  const getRoleBadgeStyles = (role) => {
    switch (role) {
      case "admin":
        return "bg-[#1A1A1B]/10 text-[#1A1A1B] border-[#1A1A1B]/20"
      case "customer":
      default:
        return "bg-[#1A1A1B]/5 text-[#1A1A1B]/60 border-[#1A1A1B]/10"
    }
  }

  const formatRole = (role) => {
    if (role === 'admin') return 'Admin';
    if (role === 'customer') return 'Customer';
    return role;
  }

  /** @type {import('framer-motion').Variants} */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }

  /** @type {import('framer-motion').Variants} */
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      x: 20,
      transition: { duration: 0.2 }
    }
  }

  /** @type {import('framer-motion').Variants} */
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      y: 20,
      transition: { duration: 0.2 }
    }
  }

  /** @type {import('framer-motion').Variants} */
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  }

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
              Quản lý Tài khoản
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Xem email, vai trò, trạng thái và đổi mật khẩu
            </p>
          </div>
          <button
            onClick={fetchAccounts}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1A1A1B] px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-black hover:shadow-xl"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={2} />
            Tải lại
          </button>
        </motion.div>

        {/* Search and Filter Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search 
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" 
              strokeWidth={1.5}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên hoặc email..."
              autoComplete="off"
              className="w-full rounded-xl border-0 bg-white py-3.5 pl-12 pr-4 text-sm text-[#1A1A1B] placeholder-gray-400 shadow-sm ring-1 ring-inset ring-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-[#1A1A1B]"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="inline-flex min-w-48 items-center justify-between gap-2 rounded-xl bg-white px-4 py-3.5 text-sm font-medium text-[#1A1A1B] shadow-sm ring-1 ring-inset ring-gray-200 transition-all hover:ring-gray-300"
            >
              <span>
                {statusFilter === "all" && "Tất cả trạng thái"}
                {statusFilter === "active" && "Đang hoạt động"}
                {statusFilter === "locked" && "Đã khóa"}
              </span>
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", isFilterOpen && "rotate-180")}
                strokeWidth={2}
              />
            </motion.button>

            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 z-20 mt-2 w-full min-w-48 rounded-xl bg-white py-2 shadow-xl ring-1 ring-gray-200"
                >
                  {["all", "active", "locked"].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status)
                        setIsFilterOpen(false)
                      }}
                      className={cn(
                        "w-full px-4 py-2.5 text-left text-sm transition-colors",
                        statusFilter === status
                          ? "bg-[#F5F4F0] font-medium text-[#1A1A1B]"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      {status === "all" && "Tất cả trạng thái"}
                      {status === "active" && "Đang hoạt động"}
                      {status === "locked" && "Đã khóa"}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Data Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {isLoading ? (
            <TableSkeleton
              rows={6}
              headers={["Khách hàng", "Email", "Vai trò", "Trạng thái", "Hành động"]}
              className="overflow-hidden rounded-2xl bg-white shadow-sm"
            />
          ) : (
            <div
              className="overflow-hidden rounded-2xl bg-white shadow-sm"
              style={{ boxShadow: "0 4px 24px -4px rgba(0, 0, 0, 0.06)" }}
            >
              {/* Table Header */}
              <div className="hidden border-b border-gray-100 bg-gray-50/50 px-6 py-4 md:grid md:grid-cols-12 md:gap-4">
            <div className="col-span-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Người dùng
            </div>
            <div className="col-span-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Email
            </div>
            <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Vai trò
            </div>
            <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Trạng thái
            </div>
            <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">
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
              {filteredAccounts.length === 0 ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <Users className="mb-4 h-12 w-12 text-gray-300" strokeWidth={1} />
                  <p className="text-sm font-medium text-gray-500">Không tìm thấy tài khoản nào</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Thử thay đổi từ khóa hoặc bộ lọc tìm kiếm
                  </p>
                </motion.div>
              ) : (
                filteredAccounts.map((account) => (
                  <motion.div
                    key={account._id}
                    variants={itemVariants}
                    layout
                    whileHover={{ backgroundColor: "rgba(245, 245, 243, 0.5)" }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 border-b border-gray-100 px-6 py-5 transition-colors last:border-b-0 md:items-center"
                  >
                    {/* Name */}
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#1A1A1B] text-sm font-semibold text-white">
                        {(account.name || 'U').split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <span className="font-medium text-[#1A1A1B]">
                          {account.name || 'Chưa cập nhật tên'}
                        </span>
                        <span className="text-xs text-gray-500 md:hidden block mt-0.5">
                          {account.email}
                        </span>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="col-span-3 hidden md:flex items-center">
                      <span className="text-sm text-gray-600">
                        {account.email}
                      </span>
                    </div>

                    {/* Role */}
                    <div className="col-span-2 flex items-center">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeStyles(account.role)}`}>
                        {formatRole(account.role)}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="col-span-2 flex items-center">
                      {account.isActive !== false ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Đã khóa
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center md:justify-end gap-2 mt-2 md:mt-0">
                      <motion.button
                        onClick={() => handleEdit(account)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5F4F0] px-3 py-2 text-xs font-medium text-[#1A1A1B] transition-colors hover:bg-[#1A1A1B] hover:text-white"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                        Sửa
                      </motion.button>
                      {account.role !== 'admin' && (
                        <motion.button
                          onClick={() => handleDelete(account)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-600 hover:text-white"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                          Xóa
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </motion.div>
            </div>
          )}
        </motion.div>

        {/* Results Count */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 text-center text-sm text-gray-500"
        >
          Hiển thị {filteredAccounts.length} / {accounts.length} tài khoản
        </motion.div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editModalOpen && selectedAccount && (
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setEditModalOpen(false)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-md overflow-hidden rounded-2xl bg-white"
              style={{ boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.18)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-gray-100 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#1A1A1B] text-base font-semibold text-white">
                    {(selectedAccount.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A1A1B]">
                      {selectedAccount.name || 'Chưa cập nhật tên'}
                    </p>
                    <p className="text-sm text-gray-500">{selectedAccount.email}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" strokeWidth={2} />
                </motion.button>
              </div>

              <div className="p-6 space-y-6">
                {/* Section: Trạng thái */}
                {selectedAccount.role !== 'admin' && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Trạng thái tài khoản
                    </p>
                    <div className="flex items-center justify-between rounded-xl bg-[#F5F4F0]/60 px-4 py-3">
                      {selectedAccount.isActive !== false ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Đã khóa
                        </span>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleToggleStatus(selectedAccount)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                          selectedAccount.isActive !== false
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                        )}
                      >
                        {selectedAccount.isActive !== false ? (
                          <><Lock className="h-3.5 w-3.5" strokeWidth={2} /> Khóa tài khoản</>
                        ) : (
                          <><Unlock className="h-3.5 w-3.5" strokeWidth={2} /> Mở khóa</>
                        )}
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* Divider */}
                {selectedAccount.role !== 'admin' && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-100" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-3 text-xs text-gray-400">hoặc</span>
                    </div>
                  </div>
                )}

                {/* Section: Đổi mật khẩu */}
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Đổi mật khẩu
                    </p>
                    {!showPasswordForm && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowPasswordForm(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5F4F0] px-3 py-2 text-xs font-medium text-[#1A1A1B] transition-colors hover:bg-[#1A1A1B] hover:text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                        Đổi mật khẩu
                      </motion.button>
                    )}
                  </div>

                  <AnimatePresence>
                    {showPasswordForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-3 pt-3">
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              autoComplete="new-password"
                              className="w-full rounded-xl border-0 bg-[#F5F4F0]/60 py-3 pl-4 pr-12 text-sm text-[#1A1A1B] ring-1 ring-inset ring-gray-200 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A1A1B]"
                              placeholder="Mật khẩu mới"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 hover:text-[#1A1A1B] hover:bg-gray-100 transition-colors"
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>

                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              autoComplete="new-password"
                              className={`w-full rounded-xl border-0 py-3 pl-4 pr-12 text-sm text-[#1A1A1B] ring-1 ring-inset transition-all focus:outline-none focus:ring-2 ${
                                confirmPassword && newPassword !== confirmPassword
                                  ? 'bg-red-50 ring-red-300 focus:ring-red-500'
                                  : 'bg-[#F5F4F0]/60 ring-gray-200 focus:bg-white focus:ring-[#1A1A1B]'
                              }`}
                              placeholder="Xác nhận mật khẩu"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 hover:text-[#1A1A1B] hover:bg-gray-100 transition-colors"
                            >
                              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          {confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-xs text-red-500">Mật khẩu xác nhận không khớp</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 border-t border-gray-100 p-6 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  leftIcon={null}
                  rightIcon={null}
                  onClick={() => {
                    if (showPasswordForm) {
                      setShowPasswordForm(false);
                      setNewPassword("");
                      setConfirmPassword("");
                    } else {
                      setEditModalOpen(false);
                    }
                  }}
                  className="flex-1 rounded-xl"
                >
                  {showPasswordForm ? 'Hủy' : 'Đóng'}
                </Button>
                {showPasswordForm && (
                  <Button
                    type="button"
                    variant="primary"
                    leftIcon={null}
                    rightIcon={null}
                    loading={submitting}
                    disabled={!newPassword || confirmPassword !== newPassword}
                    onClick={handlePasswordChange}
                    className="flex-1 rounded-xl shadow-lg"
                  >
                    Lưu mật khẩu
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && selectedAccount && (
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setDeleteModalOpen(false)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-sm overflow-hidden rounded-2xl bg-white p-8 text-center"
              style={{ boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.18)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle size={32} className="text-red-500" strokeWidth={1.5} />
              </div>

              <h2 className="mb-2 text-xl font-semibold text-[#1A1A1B]">Xóa tài khoản?</h2>
              <p className="mb-8 text-sm text-gray-500">
                Bạn có chắc chắn muốn xóa tài khoản của <strong className="text-[#1A1A1B]">{selectedAccount.email}</strong>? Hành động này không thể hoàn tác.
              </p>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 rounded-xl"
                  leftIcon={null}
                  rightIcon={null}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  loading={submitting}
                  onClick={confirmDelete}
                  className="flex-1 rounded-xl shadow-lg"
                  leftIcon={null}
                  rightIcon={null}
                >
                  Xóa ngay
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
