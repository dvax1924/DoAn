/* eslint-disable react-refresh/only-export-components */
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

// ─── Base shimmer bone ─────────────────────────────────────────────────────

function Bone({ className, delay = 0 }) {
  return (
    <div className={cn("relative overflow-hidden bg-[#1A1A1B]/[0.06]", className)}>
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#1A1A1B]/[0.06] to-transparent"
        animate={{ translateX: ["-100%", "200%"] }}
        transition={{
          duration: 1.6,
          delay,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  )
}

// ─── Default column config (Accounts / Users table) ───────────────────────
/**
 * Column config shape:
 * {
 *   span: number,        // col-span value (must sum to 12)
 *   label: string,       // header text (empty string = no header)
 *   type: 'avatar'       // avatar + two text lines
 *       | 'image'        // square thumbnail
 *       | 'text'         // single text line
 *       | 'text-multi'   // two text lines (no avatar)
 *       | 'badge'        // pill/badge shape
 *       | 'action'       // button shape, right-aligned
 *       | 'none',        // empty cell
 *   align?: 'left' | 'right' | 'center'  // default 'left'
 * }
 */
export const ACCOUNTS_COLUMNS = [
  { span: 4, label: "Người dùng",  type: "avatar" },
  { span: 2, label: "Email",       type: "text" },
  { span: 2, label: "Vai trò",     type: "badge" },
  { span: 2, label: "Trạng thái", type: "badge" },
  { span: 2, label: "Hành động",   type: "action", align: "right" },
]

export const PRODUCTS_COLUMNS = [
  { span: 1, label: "",              type: "image" },
  { span: 3, label: "Tên sản phẩm", type: "text-multi" },
  { span: 2, label: "Danh mục",     type: "badge" },
  { span: 2, label: "Giá",          type: "text" },
  { span: 2, label: "Tồn kho",      type: "text" },
  { span: 2, label: "Hành động",    type: "action" },
]

export const CATEGORIES_COLUMNS = [
  { span: 4, label: "Tên danh mục",       type: "text-multi" },
  { span: 4, label: "Số lượng sản phẩm", type: "badge", align: "center" },
  { span: 4, label: "Hành động",          type: "action", align: "right" },
]

export const ORDERS_COLUMNS = [
  { span: 2, label: "Mã đơn",     type: "text" },
  { span: 2, label: "Ngày đặt",   type: "text" },
  { span: 3, label: "Khách hàng", type: "avatar" },
  { span: 2, label: "Tổng tiền",  type: "text" },
  { span: 2, label: "Trạng thái", type: "badge" },
  { span: 1, label: "Hành động",  type: "action", align: "right" },
]

const HEADER_SPANS = {
  1: [12],
  2: [6, 6],
  3: [4, 4, 4],
  4: [3, 3, 3, 3],
  5: [3, 3, 2, 2, 2],
  6: [3, 3, 2, 2, 1, 1],
}

function getColumnTypeFromHeader(label) {
  const value = label.toLowerCase()

  if (value.includes("khách") || value.includes("người dùng")) return "avatar"
  if (value.includes("trạng thái") || value.includes("vai trò")) return "badge"
  if (value.includes("hành động")) return "action"
  if (value.includes("hình")) return "image"

  return "text"
}

function createColumnsFromHeaders(headers) {
  if (!Array.isArray(headers) || headers.length === 0) return null

  const spans =
    HEADER_SPANS[headers.length] ||
    Array.from({ length: headers.length }, () => Math.max(1, Math.floor(12 / headers.length)))

  return headers.map((label, index) => {
    const type = getColumnTypeFromHeader(label)

    return {
      span: spans[index] || 1,
      label,
      type,
      align: type === "action" ? "right" : undefined,
    }
  })
}

// ─── Cell skeleton by type ─────────────────────────────────────────────────

function SkeletonCell({ col, delay }) {
  const isRight = col.align === "right"
  const isCenter = col.align === "center"

  switch (col.type) {
    case "avatar":
      return (
        <div className="flex items-center gap-3 w-full">
          <Bone className="w-10 h-10 shrink-0 rounded-full" delay={delay} />
          <div className="flex-1 space-y-2">
            <Bone className="h-3.5 w-3/4" delay={delay + 0.02} />
            <Bone className="h-2.5 w-1/2" delay={delay + 0.04} />
          </div>
        </div>
      )
    case "image":
      return <Bone className="h-12 w-12 rounded-lg" delay={delay} />
    case "text-multi":
      return (
        <div className="space-y-2 w-full">
          <Bone className="h-3.5 w-4/5" delay={delay} />
          <Bone className="h-2.5 w-1/2" delay={delay + 0.02} />
        </div>
      )
    case "badge":
      return <Bone className={cn("h-6 w-24 rounded-full", isRight && "ml-auto", isCenter && "mx-auto")} delay={delay} />
    case "action":
      return <Bone className={cn("h-8 w-16 rounded-lg", isRight && "ml-auto", isCenter && "mx-auto")} delay={delay} />
    case "text":
    default:
      return <Bone className="h-3 w-4/5" delay={delay} />
  }
}

// ─── TableRowSkeleton ──────────────────────────────────────────────────────

function TableRowSkeleton({
  delay = 0,
  columns,
  rowGridClassName = "grid grid-cols-12",
  gapClassName = "gap-4",
  useColumnSpans = true,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        rowGridClassName,
        gapClassName,
        "px-6 py-4 border-b border-[#1A1A1B]/5 last:border-b-0 items-center"
      )}
    >
      {columns.map((col, i) => (
        <div
          key={i}
          className={cn(
            useColumnSpans && `col-span-${col.span}`,
            "flex min-w-0 items-center",
            col.align === "right" && "justify-end",
            col.align === "center" && "justify-center"
          )}
        >
          <SkeletonCell col={col} delay={delay + i * 0.03} />
        </div>
      ))}
    </motion.div>
  )
}

// ─── TableSkeleton ─────────────────────────────────────────────────────────

export function TableSkeleton({
  rows = 5,
  className,
  columns,
  headers,
  headerGridClassName = "hidden md:grid grid-cols-12",
  rowGridClassName = "grid grid-cols-12",
  gapClassName = "gap-4",
  useColumnSpans = true,
}) {
  const resolvedColumns = columns || createColumnsFromHeaders(headers) || ACCOUNTS_COLUMNS

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "overflow-hidden rounded-2xl bg-white",
        className
      )}
      style={{ boxShadow: "0 4px 24px -4px rgba(0, 0, 0, 0.06)" }}
    >
      {/* Table header */}
      <div
        className={cn(
          headerGridClassName,
          gapClassName,
          "px-6 py-4 border-b border-gray-100 bg-gray-50/50"
        )}
      >
        {resolvedColumns.map((col, i) => (
          <div
            key={i}
            className={cn(
              useColumnSpans && `col-span-${col.span}`,
              "min-w-0",
              col.align === "right" && "text-right",
              col.align === "center" && "text-center"
            )}
          >
            {col.label && (
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                {col.label}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Skeleton rows */}
      <div>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton
            key={i}
            delay={i * 0.06}
            columns={resolvedColumns}
            rowGridClassName={rowGridClassName}
            gapClassName={gapClassName}
            useColumnSpans={useColumnSpans}
          />
        ))}
      </div>
    </motion.div>
  )
}
