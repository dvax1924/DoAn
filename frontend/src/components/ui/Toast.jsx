/* eslint-disable react-refresh/only-export-components */
import { isValidElement } from 'react'
import { ToastContainer, toast as _toast, Bounce } from 'react-toastify'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Custom close button ──────────────────────────────────────────────────────
function CloseButton({ closeToast }) {
  return (
    <button
      onClick={closeToast}
      aria-label="Dismiss"
      className={cn(
        'ml-3 mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full',
        'text-[#1A1A1B]/30 hover:text-[#1A1A1B]/80',
        'transition-colors duration-200',
        'focus:outline-none focus:ring-1 focus:ring-[#1A1A1B]/20'
      )}
    >
      <X size={12} strokeWidth={2.5} />
    </button>
  )
}

// ─── Icon map ─────────────────────────────────────────────────────────────────
function ToastIcon({ type }) {
  const map = {
    success: { Icon: CheckCircle,   color: 'text-[#4ADE80]' },
    error:   { Icon: XCircle,       color: 'text-[#F87171]' },
    warning: { Icon: AlertTriangle, color: 'text-[#FBBF24]' },
    info:    { Icon: Info,           color: 'text-[#60A5FA]' },
    default: { Icon: Info,           color: 'text-[#C9A96E]' },
  }
  const { Icon, color } = map[type] ?? map.default
  return (
    <Icon size={17} strokeWidth={2} className={cn('mt-0.5 flex-shrink-0', color)} />
  )
}

// ─── Toast body ───────────────────────────────────────────────────────────────
function ToastBody({ title, message, type }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <ToastIcon type={type} />
      <div className="min-w-0 flex-1">
        {title && (
          <p
            className="mb-0.5 truncate text-[13px] font-semibold leading-tight tracking-wide text-[#1A1A1B]"
            style={{ fontFamily: "'Inter', 'Geist', sans-serif" }}
          >
            {title}
          </p>
        )}
        <p
          className="text-[12.5px] leading-snug text-[#1A1A1B]/60"
          style={{ fontFamily: "'Inter', 'Geist', sans-serif" }}
        >
          {message}
        </p>
      </div>
    </div>
  )
}

// ─── GoldieToastContainer — placed once in App.jsx ───────────────────────────
export function GoldieToastContainer() {
  return (
    <>
      <style>{`
        .Toastify__toast-container {
          width: max-content !important;
          min-width: 240px !important;
          max-width: 400px;
          padding: 0 !important;
        }

        .Toastify__toast {
          width: 100% !important;
          background: #FFFFFF !important;
          border: 1px solid rgba(0,0,0,0.06) !important;
          border-radius: 10px !important;
          box-shadow:
            0 4px 15px rgba(0,0,0,0.05),
            0 10px 24px rgba(0,0,0,0.05) !important;
          padding: 14px 16px !important;
          min-height: unset !important;
          margin-bottom: 10px !important;
          backdrop-filter: blur(16px) !important;
        }

        .Toastify__toast-icon { display: none !important; }

        .Toastify__toast-body {
          margin: 0 !important;
          padding: 0 !important;
          align-items: flex-start !important;
        }

        .Toastify__progress-bar {
          height: 2px !important;
          border-radius: 0 0 10px 10px !important;
          bottom: 0 !important;
          opacity: 1 !important;
        }

        .Toastify__toast--success .Toastify__progress-bar { background: #4ADE80 !important; }
        .Toastify__toast--error   .Toastify__progress-bar { background: #F87171 !important; }
        .Toastify__toast--warning .Toastify__progress-bar { background: #FBBF24 !important; }
        .Toastify__toast--info    .Toastify__progress-bar { background: #60A5FA !important; }
        .Toastify__toast--default .Toastify__progress-bar { background: #C9A96E !important; }

        .Toastify__close-button > svg { display: none; }
        .Toastify__close-button {
          align-self: flex-start !important;
          opacity: 1 !important;
          padding: 0 !important;
        }

        .Toastify__toast:hover {
          transform: translateY(-2px) !important;
          box-shadow:
            0 8px 20px rgba(0,0,0,0.08),
            0 20px 32px rgba(0,0,0,0.1) !important;
          transition: transform 0.25s cubic-bezier(0.23,1,0.32,1),
                      box-shadow 0.25s cubic-bezier(0.23,1,0.32,1) !important;
        }
      `}</style>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        transition={Bounce}
        closeButton={CloseButton}
        icon={false}
      />
    </>
  )
}

// ─── goldieToast — kiểm soát title thủ công ──────────────────────────────────
const goldieToast = {
  success: (message, title = 'Thành công') =>
    _toast.success(<ToastBody title={title} message={message} type="success" />),

  error: (message, title = 'Lỗi') =>
    _toast.error(<ToastBody title={title} message={message} type="error" />),

  warning: (message, title = 'Cảnh báo') =>
    _toast.warning(<ToastBody title={title} message={message} type="warning" />),

  info: (message, title = 'Thông tin') =>
    _toast.info(<ToastBody title={title} message={message} type="info" />),

  goldie: (message, title) =>
    _toast(<ToastBody title={title} message={message} type="default" />, {
      className: 'Toastify__toast--default',
    }),
}

// ─── toast — drop-in thay thế react-toastify ─────────────────────────────────
// Chỉ cần đổi 1 dòng import mỗi file:
//   from: import { toast } from 'react-toastify'
//   to:   import { toast } from '@/components/ui/Toast'
// Không cần đổi cách gọi: toast.success('msg'), toast.error('msg')...

const _titleMap = {
  success: 'Thành công',
  error:   'Lỗi',
  warning: 'Cảnh báo',
  info:    'Thông tin',
}

/** @param {import('react').ReactNode | string} message */
function _makeBody(message, type) {
  // Nếu đã là React element thì giữ nguyên
  if (isValidElement(message)) return message
  // Xóa emoji ở đầu chuỗi
  const clean = typeof message === 'string'
    ? message.replace(/^\p{Emoji}+\s*/u, '').trim()
    : message
  return <ToastBody title={_titleMap[type]} message={clean} type={type} />
}

export const toast = {
  success:  (message, options) => _toast.success(_makeBody(message, 'success'), options),
  error:    (message, options) => _toast.error(_makeBody(message, 'error'), options),
  warning:  (message, options) => _toast.warning(_makeBody(message, 'warning'), options),
  warn:     (message, options) => _toast.warning(_makeBody(message, 'warning'), options),
  info:     (message, options) => _toast.info(_makeBody(message, 'info'), options),
  dismiss:  _toast.dismiss,
  isActive: _toast.isActive,
  update:   _toast.update,
}

// Expose helper APIs from the component so this module only exports a component.
GoldieToastContainer.toast = toast
GoldieToastContainer.goldieToast = goldieToast

export { goldieToast }
export default GoldieToastContainer
