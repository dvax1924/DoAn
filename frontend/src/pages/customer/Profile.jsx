import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye,
  EyeOff,
  User,
  Phone,
  Mail,
  Lock,
  Pencil,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { toast } from '@/components/ui/Toast'
import { useAuth } from '../../hooks/useAuth'
import api from '../../api/axiosInstance'
import socket from '../../api/socket'
import { Input, PasswordInput } from '../../components/ui/Input'
import { Button } from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/LoadingSpinner'
import { cn } from '@/lib/utils'



// ─── Main Component ───────────────────────────────────────────────────────────
const Profile = () => {
  const { user, updateUser } = useAuth()

  // ── State: data ────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState(/** @type {any} */ ({}))
  const [loading, setLoading] = useState(true)

  // ── State: tabs ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('info')
  const [isEditing, setIsEditing] = useState(false)

  // ── State: info form ───────────────────────────────────────────────────────
  const [formData, setFormData] = useState({ name: '', phone: '' })
  const [profileErrors, setProfileErrors] = useState(/** @type {any} */ ({}))
  const [savingProfile, setSavingProfile] = useState(false)

  // ── State: password form ───────────────────────────────────────────────────
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmNewPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    newPass: false,
    confirm: false,
  })
  const [passwordErrors, setPasswordErrors] = useState(/** @type {any} */ ({}))
  const [savingPassword, setSavingPassword] = useState(false)

  // ── Fetch profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/profile')
        const data = res.data.user
        setProfile(data)
        setFormData({ name: data.name || '', phone: data.phone || '' })
      } catch {
        toast.error('Không thể tải thông tin profile')
      } finally {
        setLoading(false)
      }
    }

    if (user?._id) fetchProfile()
  }, [user])

  // ── Socket listeners ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?._id) return undefined

    socket.connect()
    socket.emit('join', user._id)

    const handleUserProfileUpdated = (updatedUser) => {
      if (String(updatedUser?._id) !== String(user._id)) return
      setProfile((prev) => ({ ...prev, ...updatedUser }))
      setFormData({ name: updatedUser.name || '', phone: updatedUser.phone || '' })
      updateUser(updatedUser)
    }

    socket.on('userProfileUpdated', handleUserProfileUpdated)

    return () => {
      socket.off('userProfileUpdated', handleUserProfileUpdated)
    }
  }, [updateUser, user?._id])

  // ── Input handlers ─────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setProfileErrors((prev) => ({ ...prev, [name]: null }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({ ...prev, [name]: value }))
    const errKey = name === 'newPassword' ? 'newPass' : 'confirm'
    setPasswordErrors((prev) => ({ ...prev, [errKey]: null }))
  }

  const toggleShow = (field) =>
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }))

  // ── Save profile ───────────────────────────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e?.preventDefault()

    // client-side validation
    const errs = {}
    if (!formData.name.trim()) errs.name = 'Vui lòng nhập họ và tên'
    if (Object.keys(errs).length) {
      setProfileErrors(errs)
      return
    }
    setProfileErrors({})

    setSavingProfile(true)
    try {
      const res = await api.put('/users/profile', {
        name: formData.name,
        phone: formData.phone,
      })
      if (res.data.success) {
        toast.success('Cập nhật thông tin thành công!')
        setProfile(res.data.user || profile)
        updateUser(res.data.user || profile)
        setIsEditing(false)
      }
    } catch {
      toast.error('Cập nhật thất bại')
    } finally {
      setSavingProfile(false)
    }
  }

  // ── Change password ────────────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e?.preventDefault()

    // client-side validation
    const errs = {}
    if (passwordData.newPassword.length < 6)
      errs.newPass = 'Mật khẩu mới phải có ít nhất 6 ký tự'
    if (passwordData.newPassword !== passwordData.confirmNewPassword)
      errs.confirm = 'Mật khẩu xác nhận không khớp'
    if (Object.keys(errs).length) {
      setPasswordErrors(errs)
      return
    }
    setPasswordErrors({})

    setSavingPassword(true)
    try {
      const res = await api.put('/auth/change-password', {
        newPassword: passwordData.newPassword,
      })
      if (res.data.success) {
        toast.success('Đổi mật khẩu thành công!')
        setPasswordData({ newPassword: '', confirmNewPassword: '' })
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đổi mật khẩu thất bại')
    } finally {
      setSavingPassword(false)
    }
  }

  // ── Eye toggle button ──────────────────────────────────────────────────────
  const EyeToggle = ({ field }) => (
    <button
      type="button"
      onClick={() => toggleShow(field)}
      className="text-[#1A1A1B]/30 transition-colors duration-200 hover:text-[#1A1A1B]/70"
    >
      {showPasswords[field] ? (
        <EyeOff size={15} strokeWidth={1.5} />
      ) : (
        <Eye size={15} strokeWidth={1.5} />
      )}
    </button>
  )

  // ── Tab animation variants ─────────────────────────────────────────────────
  /** @type {import('framer-motion').Variants} */
  const tabVariants = {
    hidden: { opacity: 0, x: 18 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
    },
    exit: { opacity: 0, x: -14, transition: { duration: 0.22 } },
  }

  const tabs = [
    { id: 'info', label: 'Thông tin cá nhân' },
    { id: 'password', label: 'Đổi mật khẩu' },
  ]

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (loading)
    return <PageSpinner />

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F5F3] px-4 py-16 font-sans md:py-24">
      <div className="mx-auto max-w-2xl">

        {/* Page heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <p className="mb-3 text-[10px] uppercase tracking-[0.35em] text-[#1A1A1B]/35">
            Tài khoản
          </p>
          <h1 className="text-3xl font-light tracking-tight text-[#1A1A1B] md:text-4xl">
            Hồ Sơ Của Tôi
          </h1>
          <div className="mx-auto mt-5 h-px w-8 bg-[#1A1A1B]/20" />
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="border border-[#1A1A1B]/8 bg-white shadow-sm"
        >
          {/* Tab bar */}
          <div className="relative flex border-b border-[#1A1A1B]/8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex-1 py-4 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors duration-200',
                  activeTab === tab.id
                    ? 'text-[#1A1A1B]'
                    : 'text-[#1A1A1B]/35 hover:text-[#1A1A1B]/60'
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-px bg-[#1A1A1B]"
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab panels */}
          <div className="min-h-[420px] p-8 md:p-10">
            <AnimatePresence mode="wait">

              {/* ── Tab: Thông tin cá nhân ── */}
              {activeTab === 'info' && !isEditing && (
                <motion.div
                  key="info-view"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="flex flex-col gap-7">
                    {/* Name */}
                    <div className="flex flex-col gap-1">
                      <span className="select-none text-[11px] font-medium uppercase tracking-[0.18em] text-[#1A1A1B]/50">
                        Họ và tên
                      </span>
                      <div className="flex h-12 items-center gap-3 border border-[#1A1A1B]/8 bg-[#F5F5F3]/60 px-4">
                        <User size={15} strokeWidth={1.5} className="text-[#1A1A1B]/30" />
                        <span className="text-sm text-[#1A1A1B]">{profile.name || '—'}</span>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex flex-col gap-1">
                      <span className="select-none text-[11px] font-medium uppercase tracking-[0.18em] text-[#1A1A1B]/50">
                        Số điện thoại
                      </span>
                      <div className="flex h-12 items-center gap-3 border border-[#1A1A1B]/8 bg-[#F5F5F3]/60 px-4">
                        <Phone size={15} strokeWidth={1.5} className="text-[#1A1A1B]/30" />
                        <span className="text-sm text-[#1A1A1B]">{profile.phone || 'Chưa cập nhật'}</span>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-1">
                      <span className="select-none text-[11px] font-medium uppercase tracking-[0.18em] text-[#1A1A1B]/50">
                        Email
                      </span>
                      <div className="flex h-12 items-center gap-3 border border-[#1A1A1B]/8 bg-[#F5F5F3]/60 px-4">
                        <Mail size={15} strokeWidth={1.5} className="text-[#1A1A1B]/30" />
                        <span className="text-sm text-[#1A1A1B]/40">{profile.email || '—'}</span>
                      </div>
                      <p className="pl-0.5 text-[10px] tracking-wide text-[#1A1A1B]/35">
                        Email không thể thay đổi.
                      </p>
                    </div>

                    {/* Edit button */}
                    <div className="pt-2">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsEditing(true)}
                        className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden bg-[#1A1A1B] text-[11px] uppercase tracking-[0.22em] text-white transition-opacity duration-200"
                      >
                        <span className="absolute inset-0 translate-x-[-101%] bg-white/10 transition-transform duration-500 ease-out group-hover:translate-x-0" />
                        <Pencil size={14} className="relative" />
                        <span className="relative">Chỉnh sửa thông tin</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Tab: Chỉnh sửa thông tin ── */}
              {activeTab === 'info' && isEditing && (
                <motion.div
                  key="info-edit"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {/* Back to view */}
                  <button
                    type="button"
                    onClick={() => { setIsEditing(false); setProfileErrors({}) }}
                    className="mb-6 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.15em] text-[#1A1A1B]/50 transition-colors hover:text-[#1A1A1B]"
                  >
                    <ArrowLeft size={13} />
                    Quay lại
                  </button>

                  <form onSubmit={handleSaveProfile} noValidate>
                    <div className="flex flex-col gap-6">
                      <Input
                        label="Họ và tên"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        error={profileErrors.name}
                        placeholder="Nguyễn Văn A"
                      />

                      <Input
                        label="Số điện thoại"
                        id="phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        error={profileErrors.phone}
                        placeholder="0912 345 678"
                      />

                      <div className="flex flex-col gap-1.5">
                        <Input
                          label="Email"
                          id="email"
                          type="email"
                          value={profile.email || ''}
                          readOnly
                          disabled
                        />
                        <p className="pl-0.5 text-[10px] tracking-wide text-[#1A1A1B]/35">
                          Email không thể thay đổi. Liên hệ hỗ trợ nếu cần.
                        </p>
                      </div>

                      <div className="pt-2">
                        <Button
                          type="submit"
                          loading={savingProfile}
                          variant="primary"
                          className="w-full uppercase text-[11px] tracking-[0.22em] h-12"
                        >
                          Lưu thay đổi
                        </Button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* ── Tab: Đổi mật khẩu ── */}
              {activeTab === 'password' && (
                <motion.div
                  key="password"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <form onSubmit={handleChangePassword} noValidate>
                    <div className="flex flex-col gap-6">
                      <div className="border-b border-[#1A1A1B]/6 pb-2">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[#1A1A1B]/35">
                          Bảo mật tài khoản
                        </p>
                      </div>



                      <PasswordInput
                        label="Mật khẩu mới"
                        id="new-password"
                        name="newPassword"
                        type={showPasswords.newPass ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        rightElement={<EyeToggle field="newPass" />}
                        error={passwordErrors.newPass}
                      />

                      {/* Password strength indicator */}
                      <AnimatePresence>
                        {passwordData.newPassword.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="-mt-2 flex flex-col gap-2"
                          >
                            <div className="flex gap-1">
                              {[1, 2, 3, 4].map((i) => {
                                const strength = Math.min(
                                  [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/]
                                    .filter((r) => r.test(passwordData.newPassword))
                                    .length +
                                    (passwordData.newPassword.length >= 8 ? 1 : 0),
                                  4
                                )
                                const active = i <= strength
                                const color =
                                  strength <= 1
                                    ? 'bg-red-400'
                                    : strength === 2
                                      ? 'bg-amber-400'
                                      : strength === 3
                                        ? 'bg-emerald-400'
                                        : 'bg-emerald-500'
                                return (
                                  <div
                                    key={i}
                                    className={cn(
                                      'h-0.5 flex-1 transition-colors duration-300',
                                      active ? color : 'bg-[#1A1A1B]/10'
                                    )}
                                  />
                                )
                              })}
                            </div>
                            <p className="tracking-wide text-[10px] text-[#1A1A1B]/35">
                              {passwordData.newPassword.length < 8
                                ? 'Ít nhất 6 ký tự'
                                : 'Thêm ký tự đặc biệt, chữ hoa để tăng độ bảo mật'}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <PasswordInput
                        label="Xác nhận mật khẩu mới"
                        id="confirm-password"
                        name="confirmNewPassword"
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmNewPassword}
                        onChange={handlePasswordChange}
                        rightElement={<EyeToggle field="confirm" />}
                        error={passwordErrors.confirm}
                      />

                      <div className="pt-2">
                        <Button
                          type="submit"
                          loading={savingPassword}
                          variant="primary"
                          className="w-full uppercase text-[11px] tracking-[0.22em] h-12"
                        >
                          Đổi mật khẩu
                        </Button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Profile
