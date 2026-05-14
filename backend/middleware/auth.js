const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  ACCOUNT_LOCKED_MESSAGE,
  isAccountLocked
} = require('../utils/accountStatus');

// Bảo vệ route yêu cầu đăng nhập.
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_LOCKED',
        message: ACCOUNT_LOCKED_MESSAGE
      });
    }

    if (isAccountLocked(req.user)) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_LOCKED',
        message: ACCOUNT_LOCKED_MESSAGE
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ' });
  }
};

// Chỉ cho phép Admin.
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền truy cập (chỉ dành cho Admin)'
    });
  }
};

module.exports = { protect, admin };
