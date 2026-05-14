const ACCOUNT_LOCKED_MESSAGE =
  'Tài khoản của bạn đã bị vô hiệu hóa hoặc không tồn tại. Vui lòng liên hệ quản trị viên 0975959982';

const normalizeIsActive = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  if (value === 1) return true;
  if (value === 0) return false;
  return null;
};

const isAccountLocked = (user) => normalizeIsActive(user?.isActive) === false;

module.exports = {
  ACCOUNT_LOCKED_MESSAGE,
  normalizeIsActive,
  isAccountLocked
};
