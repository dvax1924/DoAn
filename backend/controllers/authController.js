const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { emitUserPasswordUpdated } = require('../utils/userRealtime');

// ====================== GENERATE TOKEN (CÓ ROLE) ======================
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// ====================== REGISTER ======================
exports.register = async (req, res) => {
  const { name, email, password, phone } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'customer'                    // Mặc định là user
    });

    res.status(201).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== LOGIN ======================
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role)
      });
    } else {  
      res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== LOGOUT ======================
exports.logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Đăng xuất thành công'
  });
};

// ====================== CHANGE PASSWORD ======================
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    emitUserPasswordUpdated(user, {
      changedByUserId: req.user?._id,
      changedByRole: req.user?.role || 'customer'
    });

    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


module.exports = exports;
