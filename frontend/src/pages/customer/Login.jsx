import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, CircleHelp, Eye, EyeOff, Phone, ShieldX } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axiosInstance';
import { toast } from '@/components/ui/Toast';
import { Input, PasswordInput } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent } from '@/components/ui/Modal';

const EASE = [0.23, 1, 0.32, 1];
const DEFAULT_LOCKED_MESSAGE =
  'Tài khoản của bạn đã bị vô hiệu hóa hoặc không tồn tại. Vui lòng liên hệ quản trị viên 0975959982';

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE },
  },
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [loginLockedMessage, setLoginLockedMessage] = useState(null);

  const { login, lockedMessage, clearLockedMessage } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || null;
  const lockedModalMessage = loginLockedMessage || lockedMessage || DEFAULT_LOCKED_MESSAGE;

  useEffect(() => {
    if (lockedMessage) {
      setShowLockedModal(true);
    }
  }, [lockedMessage]);

  function validate() {
    const e = {};
    if (!email.trim()) e.email = 'Vui lòng nhập email.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email không hợp lệ.';
    if (!password) e.password = 'Vui lòng nhập mật khẩu.';
    else if (password.length < 6) e.password = 'Mật khẩu tối thiểu 6 ký tự.';
    return e;
  }

  const closeLockedModal = () => {
    setShowLockedModal(false);
    setLoginLockedMessage(null);
    clearLockedMessage?.();
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });

      if (res.data.success) {
        if (res.data.isActive === false) {
          setLoginLockedMessage(res.data.message || DEFAULT_LOCKED_MESSAGE);
          setShowLockedModal(true);
          return;
        }

        login(res.data, res.data.token);
        toast.success('Đăng nhập thành công!');

        if (redirect) {
          navigate(redirect);
        } else if (res.data.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      if (error.response?.data?.code === 'ACCOUNT_LOCKED') {
        setLoginLockedMessage(error.response.data.message || DEFAULT_LOCKED_MESSAGE);
        setShowLockedModal(true);
      } else {
        toast.error(error.response?.data?.message || 'Email hoặc mật khẩu không đúng');
      }
    } finally {
      setLoading(false);
    }
  }

  const handleForgotPassword = () => {
    setShowForgotPasswordModal(true);
  };

  const eyeButton = (
    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
      className="text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer outline-none"
    >
      <AnimatePresence mode="wait" initial={false}>
        {showPassword ? (
          <motion.span
            key="off"
            initial={{ opacity: 0, rotate: -10, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 10, scale: 0.8 }}
            transition={{ duration: 0.18 }}
            className="block"
          >
            <EyeOff size={18} strokeWidth={1.8} />
          </motion.span>
        ) : (
          <motion.span
            key="on"
            initial={{ opacity: 0, rotate: 10, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -10, scale: 0.8 }}
            transition={{ duration: 0.18 }}
            className="block"
          >
            <Eye size={18} strokeWidth={1.8} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col px-4 py-10 pb-safe sm:py-16 relative overflow-y-auto">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='1' height='1' fill='%231A1A1B'/%3E%3C/svg%3E\")",
          backgroundSize: '4px 4px',
        }}
      />

      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 text-muted-foreground hover:text-foreground transition-colors p-2"
        aria-label="Quay lại"
      >
        <ArrowLeft size={24} />
      </button>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-sm m-auto z-10"
      >
        <motion.div variants={itemVariants} className="text-center mb-10">
          <div className="inline-flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-px bg-[#C9A96E]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#C9A96E]" />
              <div className="w-8 h-px bg-[#C9A96E]" />
            </div>
            <h1 className="text-[42px] font-light tracking-[0.3em] text-foreground leading-none select-none">
              GOLDIE
            </h1>
            <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
              Luxury Fashion
            </p>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-card backdrop-blur-sm border border-border rounded-lg px-5 py-7 sm:px-8 sm:py-9 shadow-lg"
        >
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <motion.div variants={itemVariants} className="mb-7">
              <h2 className="text-2xl font-medium text-foreground tracking-wide">
                Đăng nhập
              </h2>
              <p className="text-sm text-muted-foreground mt-1 tracking-wide">
                Chào mừng trở lại
              </p>
            </motion.div>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              <motion.div variants={itemVariants}>
                <Input
                  id="email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((p) => ({ ...p, email: null }));
                  }}
                  autoComplete="email"
                  error={errors.email}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <PasswordInput
                  id="password"
                  label="Mật khẩu"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((p) => ({ ...p, password: null }));
                  }}
                  autoComplete="current-password"
                  error={errors.password}
                  rightElement={eyeButton}
                />
              </motion.div>

              <motion.div variants={itemVariants} className="flex justify-end -mt-2">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-muted-foreground hover:text-foreground tracking-wide underline-offset-2 hover:underline transition-colors duration-200 cursor-pointer outline-none focus-visible:underline"
                >
                  Quên mật khẩu?
                </button>
              </motion.div>

              <motion.div variants={itemVariants} className="mt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  className="w-full flex items-center justify-center gap-2"
                >
                  Đăng nhập
                </Button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>

        <motion.p
          variants={itemVariants}
          className="text-center text-sm text-muted-foreground tracking-wide mt-6"
        >
          {'Chưa có tài khoản? '}
          <Link
            to="/register"
            className="text-foreground font-medium hover:underline underline-offset-2 transition-colors duration-200"
          >
            Đăng ký ngay
          </Link>
        </motion.p>

        <motion.p
          variants={itemVariants}
          className="text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-8"
        >
          &copy; {new Date().getFullYear()} Goldie. All rights reserved.
        </motion.p>
      </motion.div>

      <Modal isOpen={showLockedModal} onClose={closeLockedModal} size="sm">
        <ModalContent className="py-8">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 ring-2 ring-red-500/20"
            >
              <motion.div
                className="absolute inset-0 rounded-full bg-red-500/10"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.4, opacity: 0 }}
                transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
              />
              <ShieldX className="h-9 w-9 text-red-500" strokeWidth={1.5} />
            </motion.div>

            <h3 className="mb-3 text-lg font-medium text-foreground tracking-wide">
              Tài khoản bị vô hiệu hóa
            </h3>
            <p className="mb-6 max-w-xs text-sm text-muted-foreground leading-relaxed">
              {lockedModalMessage}
            </p>

            <a
              href="tel:0975959982"
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-foreground/5 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Phone size={16} />
              0975 959 982
            </a>

            <Button variant="primary" size="lg" className="w-full" onClick={closeLockedModal}>
              Đóng
            </Button>
          </div>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        size="sm"
      >
        <ModalContent className="py-8">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#C9A96E]/10 ring-2 ring-[#C9A96E]/20"
            >
              <CircleHelp className="h-9 w-9 text-[#C9A96E]" strokeWidth={1.5} />
            </motion.div>

            <h3 className="mb-3 text-lg font-medium text-foreground tracking-wide">
              Quên mật khẩu?
            </h3>
            <p className="mb-6 max-w-xs text-sm text-muted-foreground leading-relaxed">
              Vui lòng liên hệ với quản trị viên nếu bạn quên mật khẩu.
            </p>

            <a
              href="tel:0975959982"
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-foreground/5 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Phone size={16} />
              0975959982
            </a>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => setShowForgotPasswordModal(false)}
            >
              Đóng
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
}
