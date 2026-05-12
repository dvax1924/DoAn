import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  User,
  ShoppingBag,
  X,
  ChevronDown,
  Menu,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'
import api from '../api/axiosInstance'
import socket from '../api/socket'
import { toast } from 'react-toastify'
import { cn } from '@/lib/utils'

/**
 * Gợi ý tìm kiếm nhanh (search overlay) — KHÔNG phải danh mục Collection.
 * Collection chỉ render từ state `categories` (API GET /categories + socket categoryUpdated).
 */
const POPULAR_SEARCH_TERMS = [
  'Dresses',
  'Handbags',
  'Jewelry',
  'Sale',
  'Outer',
]

const Navbar = () => {
  const { user, logout } = useAuth()
  const { cartCount } = useCart()
  const navigate = useNavigate()

  const [scrolled, setScrolled] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [showCollection, setShowCollection] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  const userDropdownRef = useRef(null)
  const collectionDropdownRef = useRef(null)

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories')
      const fetched = res.data.categories || res.data || []

      setCategories([{ name: 'All', slug: 'all' }, ...fetched])
    } catch (error) {
      console.error('Lỗi tải danh mục:', error)
      setCategories([
        { name: 'All', slug: 'all' },
        { name: 'T-shirt', slug: 't-shirt' },
        { name: 'Outer', slug: 'outer' },
      ])
    } finally {
      setLoadingCategories(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const onCategoryUpdated = useCallback(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    if (!socket.connected) {
      socket.connect()
    }

    socket.on('categoryUpdated', onCategoryUpdated)

    return () => {
      socket.off('categoryUpdated', onCategoryUpdated)
    }
  }, [onCategoryUpdated])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setShowAccountMenu(false)
      }
      if (
        collectionDropdownRef.current &&
        !collectionDropdownRef.current.contains(event.target)
      ) {
        setShowCollection(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (showSearch || mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [showSearch, mobileMenuOpen])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      navigate(`/products?search=${searchTerm}`)
      setShowSearch(false)
      setSearchTerm('')
    }
  }

  const handleLogout = () => {
    logout()
    setShowAccountMenu(false)
    setMobileMenuOpen(false)
    toast.success('Đã đăng xuất')
    navigate('/')
  }

  const closeSearch = () => {
    setShowSearch(false)
    setSearchTerm('')
  }

  const dropdownVariants = {
    hidden: { opacity: 0, y: -8, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
    },
    exit: {
      opacity: 0,
      y: -8,
      scale: 0.96,
      transition: { duration: 0.15 },
    },
  }

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  }

  const searchContentVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, delay: 0.1, ease: [0.23, 1, 0.32, 1] },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.2 },
    },
  }

  const mobileMenuVariants = {
    hidden: { x: '100%' },
    visible: {
      x: 0,
      transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] },
    },
    exit: {
      x: '100%',
      transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] },
    },
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
  }

  const staggerItem = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  }

  const navLinkTone = scrolled
    ? 'text-white/90 hover:text-white'
    : 'text-[#1A1A1B]/80 hover:text-[#1A1A1B]'

  const iconTone = scrolled
    ? 'text-white/80 hover:text-white'
    : 'text-[#1A1A1B]/70 hover:text-[#1A1A1B]'

  const categoryTo = (cat) =>
    cat.slug === 'all' ? '/products' : `/products?category=${cat._id}`

  return (
    <>
      {/* Offset for fixed header (nav cũ dùng sticky trong luồng layout) */}
      <div className="h-20 shrink-0" aria-hidden />
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          scrolled
            ? 'bg-[#1A1A1B]/95 backdrop-blur-md shadow-lg shadow-black/5'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <motion.div
              className="relative z-10"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to="/"
                className={cn(
                  'text-2xl font-bold tracking-[0.3em] transition-colors duration-300',
                  scrolled ? 'text-white' : 'text-[#1A1A1B]'
                )}
              >
                GOLDIE
              </Link>
            </motion.div>

            <div className="hidden md:flex items-center gap-10">
              <div ref={collectionDropdownRef} className="relative">
                <motion.button
                  type="button"
                  onClick={() => {
                    setShowCollection(!showCollection)
                    setShowAccountMenu(false)
                  }}
                  className={cn(
                    'flex items-center gap-1.5 text-sm font-medium tracking-wider uppercase transition-colors duration-300',
                    navLinkTone
                  )}
                  whileHover={{ y: -1 }}
                >
                  Collection
                  <motion.span
                    animate={{ rotate: showCollection ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="size-3.5" strokeWidth={2} />
                  </motion.span>
                </motion.button>

                <AnimatePresence>
                  {showCollection && (
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute top-full left-0 mt-4 w-56 bg-[#1A1A1B] border border-white/10 shadow-2xl max-h-[min(420px,70vh)] overflow-y-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <motion.ul
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                        className="py-2"
                      >
                        {loadingCategories ? (
                          <li className="px-5 py-3 text-sm text-white/50">
                            Đang tải danh mục...
                          </li>
                        ) : (
                          categories.map((cat) => (
                            <motion.li
                              key={cat._id || cat.slug}
                              variants={staggerItem}
                            >
                              <Link
                                to={categoryTo(cat)}
                                className="block px-5 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 tracking-wide"
                                onClick={() => setShowCollection(false)}
                              >
                                {cat.name}
                              </Link>
                            </motion.li>
                          ))
                        )}
                      </motion.ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.div whileHover={{ y: -1 }}>
                <Link
                  to="/products"
                  className={cn(
                    'text-sm font-medium tracking-wider uppercase transition-colors duration-300',
                    navLinkTone
                  )}
                >
                  Products
                </Link>
              </motion.div>
            </div>

            <div className="flex items-center gap-5">
              <motion.button
                type="button"
                onClick={() => setShowSearch(true)}
                className={cn('p-2 transition-colors duration-300', iconTone)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Open search"
              >
                <Search className="size-5" strokeWidth={1.5} />
              </motion.button>

              <div ref={userDropdownRef} className="relative hidden md:block">
                <motion.button
                  type="button"
                  onClick={() => {
                    setShowAccountMenu(!showAccountMenu)
                    setShowCollection(false)
                  }}
                  className={cn('p-2 transition-colors duration-300', iconTone)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="User menu"
                >
                  <User className="size-5" strokeWidth={1.5} />
                </motion.button>

                <AnimatePresence>
                  {showAccountMenu && (
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute top-full right-0 mt-4 w-56 bg-[#1A1A1B] border border-white/10 shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                        className="py-2"
                      >
                        {user ? (
                          <>
                            <motion.div
                              variants={staggerItem}
                              className="px-5 py-3 text-sm font-semibold text-white border-b border-white/10"
                            >
                              {user.name}
                            </motion.div>
                            <motion.div variants={staggerItem}>
                              <Link
                                to="/profile"
                                className="block px-5 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 tracking-wide"
                                onClick={() => setShowAccountMenu(false)}
                              >
                                Hồ sơ
                              </Link>
                            </motion.div>
                            <motion.div variants={staggerItem}>
                              <Link
                                to="/orders"
                                className="block px-5 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 tracking-wide"
                                onClick={() => setShowAccountMenu(false)}
                              >
                                Lịch sử mua hàng
                              </Link>
                            </motion.div>
                            <motion.div variants={staggerItem}>
                              <button
                                type="button"
                                onClick={handleLogout}
                                className="block w-full text-left px-5 py-3 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 tracking-wide"
                              >
                                Đăng xuất
                              </button>
                            </motion.div>
                          </>
                        ) : (
                          <>
                            <motion.div variants={staggerItem}>
                              <Link
                                to="/login"
                                className="block px-5 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 tracking-wide"
                                onClick={() => setShowAccountMenu(false)}
                              >
                                Đăng nhập
                              </Link>
                            </motion.div>
                            <motion.div variants={staggerItem}>
                              <Link
                                to="/register"
                                className="block px-5 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 tracking-wide"
                                onClick={() => setShowAccountMenu(false)}
                              >
                                Đăng ký
                              </Link>
                            </motion.div>
                          </>
                        )}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <Link
                  to="/cart"
                  className={cn(
                    'relative block p-2 transition-colors duration-300',
                    iconTone
                  )}
                  aria-label="Shopping cart"
                >
                  <ShoppingBag className="size-5" strokeWidth={1.5} />
                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 bg-[#1A1A1B] text-white text-[10px] font-medium flex items-center justify-center rounded-full border border-white/20"
                    >
                      {cartCount > 9 ? '9+' : cartCount}
                    </motion.span>
                  )}
                </Link>
              </motion.div>

              <motion.button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className={cn(
                  'p-2 md:hidden transition-colors duration-300',
                  iconTone
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Open menu"
              >
                <Menu className="size-[22px]" strokeWidth={1.5} />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {showSearch && (
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[60] bg-[#1A1A1B]/98 backdrop-blur-xl"
          >
            <form
              className="h-full flex flex-col"
              onSubmit={handleSearch}
            >
              <div className="flex items-center justify-between px-6 lg:px-8 h-20 border-b border-white/10">
                <span className="text-2xl font-bold tracking-[0.3em] text-white">
                  GOLDIE
                </span>
                <motion.button
                  type="button"
                  onClick={closeSearch}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Close search"
                >
                  <X className="size-6" strokeWidth={1.5} />
                </motion.button>
              </div>

              <motion.div
                variants={searchContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex-1 flex flex-col items-center justify-center px-6"
              >
                <div className="w-full max-w-2xl">
                  <div className="relative">
                    <Search
                      className="absolute left-0 top-1/2 -translate-y-1/2 size-6 text-white/40"
                      strokeWidth={1.5}
                    />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm kiếm sản phẩm..."
                      className="w-full bg-transparent border-b-2 border-white/20 focus:border-white/60 py-4 pl-10 pr-4 text-2xl text-white placeholder:text-white/30 outline-none transition-colors duration-300"
                      autoFocus
                    />
                  </div>

                  <div className="mt-12">
                    <p className="text-xs uppercase tracking-widest text-white/40 mb-6">
                      Popular Searches
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {POPULAR_SEARCH_TERMS.map((term) => (
                        <motion.button
                          key={term}
                          type="button"
                          onClick={() => setSearchTerm(term)}
                          className="px-5 py-2.5 border border-white/20 text-white/70 text-sm tracking-wide hover:bg-white hover:text-[#1A1A1B] transition-all duration-300"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {term}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <p className="mt-8 text-center text-xs text-white/40 tracking-widest uppercase">
                    Nhấn Enter để tìm — hoặc đóng bằng nút X
                  </p>
                </div>
              </motion.div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.div
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm z-[70] bg-[#1A1A1B] md:hidden"
            >
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between px-6 h-20 border-b border-white/10">
                  <span className="text-xl font-bold tracking-[0.3em] text-white">
                    GOLDIE
                  </span>
                  <motion.button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-white/60 hover:text-white transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Close menu"
                  >
                    <X className="size-6" strokeWidth={1.5} />
                  </motion.button>
                </div>

                <motion.nav
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="flex-1 px-6 py-8 overflow-y-auto"
                >
                  <motion.div variants={staggerItem} className="mb-8">
                    <p className="text-xs uppercase tracking-widest text-white/40 mb-4">
                      Collection
                    </p>
                    <ul className="space-y-1">
                      {loadingCategories ? (
                        <li className="py-3 text-white/50 text-sm">
                          Đang tải danh mục...
                        </li>
                      ) : (
                        categories.map((cat) => (
                          <li key={cat._id || cat.slug}>
                            <Link
                              to={categoryTo(cat)}
                              className="block py-3 text-lg text-white/80 hover:text-white transition-colors"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {cat.name}
                            </Link>
                          </li>
                        ))
                      )}
                    </ul>
                  </motion.div>

                  <motion.div variants={staggerItem} className="mb-8">
                    <Link
                      to="/products"
                      className="block py-3 text-lg text-white/80 hover:text-white transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Products
                    </Link>
                  </motion.div>

                  <motion.div
                    variants={staggerItem}
                    className="pt-8 border-t border-white/10"
                  >
                    <p className="text-xs uppercase tracking-widest text-white/40 mb-4">
                      Account
                    </p>
                    <ul className="space-y-1">
                      {user ? (
                        <>
                          <li className="py-2 text-white font-semibold border-b border-white/10 mb-2">
                            {user.name}
                          </li>
                          <li>
                            <Link
                              to="/profile"
                              className="block py-3 text-lg text-white/80 hover:text-white transition-colors"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              Hồ sơ
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="/orders"
                              className="block py-3 text-lg text-white/80 hover:text-white transition-colors"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              Lịch sử mua hàng
                            </Link>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() => {
                                setMobileMenuOpen(false)
                                handleLogout()
                              }}
                              className="block w-full text-left py-3 text-lg text-red-400/80 hover:text-red-400 transition-colors"
                            >
                              Đăng xuất
                            </button>
                          </li>
                        </>
                      ) : (
                        <>
                          <li>
                            <Link
                              to="/login"
                              className="block py-3 text-lg text-white/80 hover:text-white transition-colors"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              Đăng nhập
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="/register"
                              className="block py-3 text-lg text-white/80 hover:text-white transition-colors"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              Đăng ký
                            </Link>
                          </li>
                        </>
                      )}
                    </ul>
                  </motion.div>
                </motion.nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar
