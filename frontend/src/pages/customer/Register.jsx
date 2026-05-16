import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import api from "../../api/axiosInstance";
import { toast } from "@/components/ui/Toast";
import { Input, PasswordInput } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// --- Animation constants ---
const EASE = [0.23, 1, 0.32, 1];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.065, delayChildren: 0.1 },
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

// --- Row divider between field groups ---
function FieldDivider() {
  return (
    <motion.div
      variants={itemVariants}
      className="h-px w-full bg-border my-1"
    />
  );
}

// --- Password strength indicator ---
function StrengthBar({ password }) {
  const score =
    password.length === 0
      ? 0
      : password.length < 6
      ? 1
      : password.length < 10 ||
        !/[A-Z]/.test(password) ||
        !/[0-9]/.test(password)
      ? 2
      : 3;

  const labels = ["", "Yếu", "Trung bình", "Mạnh"];
  const colors = ["", "#ef4444", "#C9A96E", "#22c55e"];
  const widths = ["0%", "33%", "66%", "100%"];

  if (password.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-2.5 -mt-0.5"
    >
      <div className="flex-1 h-[2px] bg-border rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: widths[score], backgroundColor: colors[score] }}
          transition={{ duration: 0.4, ease: EASE }}
        />
      </div>
      <span
        className="text-[10px] tracking-[0.15em] uppercase shrink-0"
        style={{ color: colors[score] }}
      >
        {labels[score]}
      </span>
    </motion.div>
  );
}

// --- Main component ---
export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [show, setShow] = useState({ password: false, confirm: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  function setField(key) {
    return (e) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      if (errors[key]) setErrors((er) => ({ ...er, [key]: null }));
    };
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Vui lòng nhập họ tên.";
    else if (form.name.trim().length < 2) e.name = "Họ tên quá ngắn.";

    if (!form.email.trim()) e.email = "Vui lòng nhập email.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Email không hợp lệ.";

    if (!form.phone.trim()) e.phone = "Vui lòng nhập số điện thoại.";
    else if (!/^[0-9]{9,11}$/.test(form.phone.replace(/[\s\-+]/g, "")))
      e.phone = "Số điện thoại không hợp lệ.";

    if (!form.password) e.password = "Vui lòng nhập mật khẩu.";
    else if (form.password.length < 6) e.password = "Mật khẩu tối thiểu 6 ký tự.";

    if (!form.confirmPassword) e.confirmPassword = "Vui lòng xác nhận mật khẩu.";
    else if (form.confirmPassword !== form.password)
      e.confirmPassword = "Mật khẩu xác nhận không khớp.";

    return e;
  }

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
      const res = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone
      });

      if (res.data.success) {
        toast.success("Đăng ký tài khoản thành công! Vui lòng đăng nhập.");
        setSuccess(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  const getEyeIcon = (visible) => {
    return (
      <AnimatePresence mode="wait" initial={false}>
        {visible ? (
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
    );
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col px-4 py-10 pb-safe sm:py-16 relative overflow-y-auto">
      {/* Subtle texture overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='1' height='1' fill='%231A1A1B'/%3E%3C/svg%3E\")",
          backgroundSize: "4px 4px",
        }}
      />

      {/* Back Button */}
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
        {/* Logo mark */}
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

        {/* Card */}
        <motion.div
          variants={itemVariants}
          className="bg-card backdrop-blur-sm border border-border rounded-lg px-5 py-7 sm:px-8 sm:py-9 shadow-lg"
        >
          <AnimatePresence mode="wait">
            {success ? (
              /* ── Success state ── */
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.45, ease: EASE }}
                className="flex flex-col items-center gap-5 py-6 text-center"
              >
                {/* Gold check circle */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5, ease: EASE }}
                  className="w-14 h-14 rounded-full border border-[#C9A96E]/40 flex items-center justify-center"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 22 22"
                    fill="none"
                    aria-hidden="true"
                  >
                    <motion.path
                      d="M4 11l5 5 9-9"
                      stroke="#C9A96E"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.3, duration: 0.5, ease: EASE }}
                    />
                  </svg>
                </motion.div>
                <div>
                  <p className="text-xl font-medium text-foreground tracking-wide">
                    Đăng ký thành công
                  </p>
                  <p className="text-sm text-muted-foreground tracking-wide mt-1.5">
                    Chào mừng bạn đến với GOLDIE.
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/login')}
                  variant="primary"
                  size="md"
                  className="mt-2 w-full"
                >
                  Đăng nhập ngay
                </Button>
              </motion.div>
            ) : (
              /* ── Form state ── */
              <motion.div
                key="form"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -8 }}
              >
                {/* Heading */}
                <motion.div variants={itemVariants} className="mb-7">
                  <h2 className="text-2xl font-medium text-foreground tracking-wide">
                    Tạo tài khoản
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 tracking-wide">
                    Gia nhập cộng đồng GOLDIE
                  </p>
                </motion.div>

                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="flex flex-col gap-5"
                >
                  {/* Full name */}
                  <motion.div variants={itemVariants}>
                    <Input
                      id="name"
                      label="Họ và tên"
                      type="text"
                      value={form.name}
                      onChange={setField("name")}
                      autoComplete="name"
                      error={errors.name}
                    />
                  </motion.div>

                  {/* Email */}
                  <motion.div variants={itemVariants}>
                    <Input
                      id="email"
                      label="Email"
                      type="email"
                      value={form.email}
                      onChange={setField("email")}
                      autoComplete="email"
                      error={errors.email}
                    />
                  </motion.div>

                  {/* Phone */}
                  <motion.div variants={itemVariants}>
                    <Input
                      id="phone"
                      label="Số điện thoại"
                      type="tel"
                      value={form.phone}
                      onChange={setField("phone")}
                      autoComplete="tel"
                      error={errors.phone}
                    />
                  </motion.div>

                  <FieldDivider />

                  {/* Password */}
                  <motion.div variants={itemVariants} className="flex flex-col gap-2">
                    <PasswordInput
                      id="password"
                      label="Mật khẩu"
                      type={show.password ? "text" : "password"}
                      value={form.password}
                      onChange={setField("password")}
                      autoComplete="new-password"
                      error={errors.password}
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShow((s) => ({ ...s, password: !s.password }))}
                          className="text-muted-foreground hover:text-foreground transition-colors duration-200 outline-none"
                          tabIndex={-1}
                        >
                          {getEyeIcon(show.password)}
                        </button>
                      }
                    />
                    <AnimatePresence>
                      {form.password.length > 0 && (
                        <StrengthBar password={form.password} />
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Confirm password */}
                  <motion.div variants={itemVariants}>
                    <PasswordInput
                      id="confirmPassword"
                      label="Xác nhận mật khẩu"
                      type={show.confirm ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={setField("confirmPassword")}
                      autoComplete="new-password"
                      error={errors.confirmPassword}
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
                          className="text-muted-foreground hover:text-foreground transition-colors duration-200 outline-none"
                          tabIndex={-1}
                        >
                          {getEyeIcon(show.confirm)}
                        </button>
                      }
                    />
                  </motion.div>

                  {/* Submit */}
                  <motion.div variants={itemVariants} className="mt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      loading={loading}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      Đăng ký
                    </Button>
                  </motion.div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Login link */}
        <motion.p
          variants={itemVariants}
          className="text-center text-sm text-muted-foreground tracking-wide mt-6"
        >
          {"Đã có tài khoản? "}
          <Link
            to="/login"
            className="text-foreground font-medium hover:underline underline-offset-2 transition-colors duration-200"
          >
            Đăng nhập
          </Link>
        </motion.p>

        {/* Footer */}
        <motion.p
          variants={itemVariants}
          className="text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-8"
        >
          &copy; {new Date().getFullYear()} Goldie. All rights reserved.
        </motion.p>
      </motion.div>
    </div>
  );
}