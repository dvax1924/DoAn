import React, { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Box,
  List,
  ShoppingBag,
  Users,
  UserCog,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import Toast from '@/components/ui/Toast'
import { toast } from 'react-toastify'
import { useAuth } from '../hooks/useAuth'
import { cn } from '@/lib/utils'

/** @type {import('framer-motion').Variants} */
const sidebarVariants = {
  hidden: { x: -280, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
}

/** @type {import('framer-motion').Variants} */
const menuItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (index) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: index * 0.05,
      duration: 0.3,
      ease: 'easeOut',
    },
  }),
}

const AdminLayout = ({ children }) => {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    toast.success('Đã đăng xuất thành công')
    navigate('/login')
  }

  const menuItems = useMemo(
    () => [
      { path: '/admin', icon: Home, label: 'Trang chủ' },
      { path: '/admin/products', icon: Box, label: 'Quản lý Sản phẩm' },
      { path: '/admin/categories', icon: List, label: 'Quản lý Danh mục' },
      { path: '/admin/orders', icon: ShoppingBag, label: 'Quản lý Đơn hàng' },
      { path: '/admin/customers', icon: Users, label: 'Quản lý Khách hàng' },
      { path: '/admin/accounts', icon: UserCog, label: 'Quản lý tài khoản' },
    ],
    []
  )

  const isActive = (path) => location.pathname === path

  const userName = user?.name || 'Admin'
  const userInitials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')

  const renderSidebarContent = () => (
    <>
      <div className="border-b border-white/10 px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold tracking-[0.3em] text-white">
            GOLDIE
          </h1>
          <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-white/35">
            Admin Panel
          </p>
        </motion.div>
      </div>

      <nav className="admin-sidebar-nav flex-1 overflow-y-auto px-4 py-6">
        <ul className="space-y-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const active = isActive(item.path)

            return (
              <motion.li
                key={item.path}
                custom={index}
                variants={menuItemVariants}
                initial="hidden"
                animate="visible"
              >
                <Link
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-[#2A2A2B] text-white'
                      : 'text-white/45 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <AnimatePresence>
                    {active && (
                      <motion.div
                        className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-white"
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        exit={{ opacity: 0, scaleY: 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </AnimatePresence>

                  <Icon
                    size={18}
                    className={cn(
                      'transition-transform duration-200',
                      active ? 'text-white' : 'group-hover:scale-110'
                    )}
                    strokeWidth={1.8}
                  />
                  <span>{item.label}</span>
                </Link>
              </motion.li>
            )
          })}
        </ul>
      </nav>

      <motion.div
        className="border-t border-white/10 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 text-sm font-semibold text-white">
            {userInitials || 'AD'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {userName}
            </p>
            <p className="text-xs text-white/35">Quản trị viên</p>
          </div>
        </div>

        <motion.button
          type="button"
          onClick={handleLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#E74C3C]/10 px-4 py-2.5 text-sm font-medium text-[#E74C3C] transition-colors duration-200 hover:bg-[#E74C3C]/20"
        >
          <LogOut size={16} strokeWidth={1.8} />
          <span>Đăng xuất</span>
        </motion.button>
      </motion.div>
    </>
  )

  return (
    <div className="min-h-screen bg-[#F5F5F3]">
      <motion.aside
        className="fixed left-0 top-0 z-40 hidden h-screen w-[280px] flex-col bg-[#1A1A1B] lg:flex"
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
      >
        {renderSidebarContent()}
      </motion.aside>

      <div className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between bg-[#1A1A1B] px-4 lg:hidden">
        <div>
          <h1 className="text-lg font-bold tracking-[0.2em] text-white">
            GOLDIE
          </h1>
          <p className="text-[8px] uppercase tracking-[0.2em] text-white/35">
            Admin Panel
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? (
            <X size={24} strokeWidth={1.8} />
          ) : (
            <Menu size={24} strokeWidth={1.8} />
          )}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              className="fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col bg-[#1A1A1B] lg:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              {renderSidebarContent()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="min-h-screen pt-16 lg:ml-[280px] lg:pt-0">
        <div className="px-6 py-8 lg:px-[50px] lg:py-10">{children}</div>
      </main>

      <style>{`
        .admin-sidebar-nav::-webkit-scrollbar {
          width: 4px;
        }
        .admin-sidebar-nav::-webkit-scrollbar-track {
          background: transparent;
        }
        .admin-sidebar-nav::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        .admin-sidebar-nav::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  )
}

export default AdminLayout
