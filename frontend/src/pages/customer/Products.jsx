import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Grid3X3, LayoutGrid, X } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import ProductCard from '@/components/ui/ProductCard'
import { ProductGridSkeleton } from '@/components/ui/ProductCardSkeleton'
import { cn } from '@/lib/utils'
import api from '../../api/axiosInstance'
import socket from '../../api/socket'

const PRODUCTS_PER_PAGE = 20

const sortOptions = [
  { id: '', name: 'Sắp xếp mặc định' },
  { id: 'price-low', name: 'Giá: Thấp đến cao' },
  { id: 'price-high', name: 'Giá: Cao đến thấp' },
]

/** @type {import('framer-motion').Variants} */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

/** @type {import('framer-motion').Variants} */
const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
}

const Products = () => {
  const [products, setProducts] = useState([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sort, setSort] = useState('')
  const [error, setError] = useState(null)
  const [searchParams] = useSearchParams()
  const [categoryName, setCategoryName] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [gridCols, setGridCols] = useState(4)

  const categoryId = searchParams.get('category') || ''
  const searchKeyword = searchParams.get('search') || ''

  const fetchProducts = useCallback(
    async (pageNum, isLoadMore = false) => {
      try {
        if (isLoadMore) {
          setLoadingMore(true)
        } else {
          setLoading(true)
          setError(null)
        }

        const params = new URLSearchParams()
        if (categoryId) params.append('category', categoryId)
        if (searchKeyword) params.append('search', searchKeyword)
        if (sort) params.append('sort', sort)
        params.append('page', String(pageNum))
        params.append('limit', String(PRODUCTS_PER_PAGE))

        const url = `/products?${params.toString()}`
        const res = await api.get(url)

        const data = res.data.products || res.data
        const fetchedProducts = Array.isArray(data) ? data : []
        const totalCount = Number(res.data.totalCount ?? fetchedProducts.length)

        setTotalProducts(totalCount)

        if (isLoadMore) {
          setProducts((prev) => [...prev, ...fetchedProducts])
        } else {
          setProducts(fetchedProducts)
        }

        setHasMore(pageNum * PRODUCTS_PER_PAGE < totalCount)

        if (!isLoadMore) {
          if (categoryId && fetchedProducts.length > 0) {
            setCategoryName(fetchedProducts[0].category?.name || '')
          } else if (categoryId && fetchedProducts.length === 0) {
            try {
              const catRes = await api.get(`/categories/${categoryId}`)
              setCategoryName(catRes.data.category?.name || catRes.data.name || '')
            } catch {
              setCategoryName('')
            }
          } else {
            setCategoryName('')
          }
        }
      } catch (err) {
        console.error('Lỗi tải sản phẩm:', err)
        if (!isLoadMore) {
          setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.')
        }
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [categoryId, searchKeyword, sort]
  )

  useEffect(() => {
    setPage(1)
    fetchProducts(1, false)
  }, [fetchProducts])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchProducts(nextPage, true)
  }

  useEffect(() => {
    setHasMore(products.length < totalProducts)
  }, [products.length, totalProducts])

  useEffect(() => {
    if (!socket.connected) {
      socket.connect()
    }

    const refreshProducts = () => {
      setPage(1)
      fetchProducts(1, false)
    }

    socket.on('productCreated', refreshProducts)
    socket.on('productUpdated', refreshProducts)
    socket.on('productDeleted', refreshProducts)

    return () => {
      socket.off('productCreated')
      socket.off('productUpdated')
      socket.off('productDeleted')
    }
  }, [fetchProducts])

  const pageTitle = searchKeyword
    ? `Kết quả tìm kiếm: "${searchKeyword}"`
    : categoryName || 'Tất cả sản phẩm'

  const activeSortLabel = useMemo(
    () => sortOptions.find((option) => option.id === sort)?.name || sortOptions[0].name,
    [sort]
  )

  const hasActiveFilters = Boolean(categoryId || searchKeyword)

  return (
    <div className="min-h-screen bg-[#F5F5F3]">
      <motion.header
        className="px-6 pb-14 pt-24 lg:px-8 lg:pb-16 lg:pt-28"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mx-auto max-w-7xl text-center">
          <motion.p
            className="mb-4 text-xs uppercase tracking-[0.3em] text-[#1A1A1B]/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Bộ sưu tập
          </motion.p>
          <motion.h1
            className="text-3xl font-light tracking-tight text-[#1A1A1B] md:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {pageTitle}
          </motion.h1>
        </div>
      </motion.header>

      <motion.div
        className="sticky top-20 z-30 border-y border-[#1A1A1B]/10 bg-[#F5F5F3]/95 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 justify-start">
              {hasActiveFilters ? (
                <div className="flex flex-wrap items-center justify-start gap-2">
                  {categoryId && (
                    <span className="rounded-full bg-[#1A1A1B] px-4 py-1.5 text-xs uppercase tracking-wider text-white">
                      {categoryName || 'Danh mục'}
                    </span>
                  )}
                  {searchKeyword && (
                    <span className="rounded-full bg-[#1A1A1B]/8 px-4 py-1.5 text-xs uppercase tracking-wider text-[#1A1A1B]/70">
                      {searchKeyword}
                    </span>
                  )}
                  <Link
                    to="/products"
                    className="rounded-full px-4 py-1.5 text-xs uppercase tracking-wider text-[#1A1A1B]/50 transition-colors hover:bg-[#1A1A1B]/5 hover:text-[#1A1A1B]"
                  >
                    Xóa lọc
                  </Link>
                </div>
              ) : (
                <span className="rounded-full bg-[#1A1A1B] px-4 py-1.5 text-xs uppercase tracking-wider text-white">
                  Tất cả sản phẩm
                </span>
              )}
            </div>

            <div className="flex items-center justify-start gap-3 md:justify-end">
              <span className="hidden text-xs text-[#1A1A1B]/40 sm:block">
                {totalProducts} sản phẩm
              </span>

              <div className="hidden overflow-hidden rounded-full border border-[#1A1A1B]/10 md:flex">
                <button
                  type="button"
                  onClick={() => setGridCols(3)}
                  className={cn(
                    'p-2 transition-colors duration-200',
                    gridCols === 3
                      ? 'bg-[#1A1A1B] text-white'
                      : 'text-[#1A1A1B]/40 hover:text-[#1A1A1B]'
                  )}
                  aria-label="Hiển thị 3 cột"
                >
                  <Grid3X3 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setGridCols(4)}
                  className={cn(
                    'p-2 transition-colors duration-200',
                    gridCols === 4
                      ? 'bg-[#1A1A1B] text-white'
                      : 'text-[#1A1A1B]/40 hover:text-[#1A1A1B]'
                  )}
                  aria-label="Hiển thị 4 cột"
                >
                  <LayoutGrid size={14} />
                </button>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSortOpen((value) => !value)}
                  className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-[#1A1A1B] transition-colors duration-300 hover:bg-[#1A1A1B]/5"
                >
                  <span className="hidden sm:inline">{activeSortLabel}</span>
                  <span className="sm:hidden">Sắp xếp</span>
                  <motion.span
                    animate={{ rotate: isSortOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={14} />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {isSortOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-0 md:left-auto md:right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-[#1A1A1B]/10 bg-white shadow-xl"
                    >
                      {sortOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setSort(option.id)
                            setIsSortOpen(false)
                          }}
                          className={cn(
                            'w-full px-4 py-3 text-left text-sm transition-colors duration-200',
                            sort === option.id
                              ? 'bg-[#1A1A1B] text-white'
                              : 'text-[#1A1A1B] hover:bg-[#1A1A1B]/5'
                          )}
                        >
                          {option.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

        </div>
      </motion.div>

      {hasActiveFilters && (
        <motion.div
          className="mx-auto max-w-7xl px-6 py-4 lg:px-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#1A1A1B]/40">Đang lọc:</span>
            <Link
              to="/products"
              className="flex items-center gap-1.5 rounded-full bg-[#1A1A1B] px-3 py-1 text-xs text-white"
            >
              {categoryName || searchKeyword || 'Bộ lọc'}
              <X size={12} />
            </Link>
          </div>
        </motion.div>
      )}

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {loading && (
          <ProductGridSkeleton
            count={8}
            className={cn(
              'gap-3 sm:gap-6 md:gap-8',
              gridCols === 3
                ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            )}
          />
        )}

        {error && !loading && (
          <motion.div
            className="py-20 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-lg text-red-500">{error}</p>
          </motion.div>
        )}

        {!loading && !error && products.length > 0 && (
          <>
            <motion.div
              className={cn(
                'grid gap-3 sm:gap-6 md:gap-8',
                gridCols === 3
                  ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              )}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              key={`${categoryId}-${searchKeyword}-${sort}-${gridCols}`}
            >
              <AnimatePresence mode="popLayout">
                {products.map((product) => (
                  <motion.div
                    key={product._id || product.id}
                    variants={itemVariants}
                    layout
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <ProductCard product={product} showSizes />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {hasMore && (
              <motion.div
                className="mt-16 flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className={cn(
                    'group relative overflow-hidden rounded-full border border-[#1A1A1B]/20 px-10 py-4 text-sm uppercase tracking-[0.2em] text-[#1A1A1B] transition-colors duration-500 hover:text-white',
                    loadingMore && 'cursor-not-allowed opacity-60'
                  )}
                  whileHover={!loadingMore ? { scale: 1.02 } : undefined}
                  whileTap={!loadingMore ? { scale: 0.98 } : undefined}
                >
                  <span className="relative z-10">
                    {loadingMore ? 'Đang tải...' : 'Xem thêm sản phẩm'}
                  </span>
                  <span
                    className="absolute inset-0 bg-[#1A1A1B] -translate-x-full transition-transform duration-500 ease-out group-hover:translate-x-0"
                  />
                </motion.button>
              </motion.div>
            )}

            {!hasMore && products.length > 0 && (
              <motion.p
                className="mt-16 text-center text-xs uppercase tracking-[0.3em] text-[#1A1A1B]/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Đã hiển thị tất cả sản phẩm
              </motion.p>
            )}
          </>
        )}

        {!loading && !error && products.length === 0 && (
          <motion.div
            className="py-20 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-lg text-[#1A1A1B]/40">
              Không tìm thấy sản phẩm nào
            </p>
            <Link
              to="/products"
              className="mt-4 inline-flex text-sm text-[#1A1A1B] underline underline-offset-4"
            >
              Xem tất cả sản phẩm
            </Link>
          </motion.div>
        )}
      </main>

      <div className="h-20" />
    </div>
  )
}

export default Products
