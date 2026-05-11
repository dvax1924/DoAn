const User = require('../models/User');
const Order = require('../models/Order');
const {
  emitUserProfileUpdated,
  emitUserPasswordUpdated
} = require('../utils/userRealtime');

// ====================== GET PROFILE ======================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== UPDATE PROFILE ======================
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, addresses } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (addresses) user.addresses = addresses;

    await user.save();

    const updatedUser = emitUserProfileUpdated(user);

    res.json({ 
      success: true, 
      message: 'Cập nhật profile thành công',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== ADMIN: GET ALL USERS ======================
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    const userIds = users.map(user => user._id);
    const orderStats = await Order.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: '$user', totalOrders: { $sum: 1 } } }
    ]);

    const orderCountMap = new Map(
      orderStats.map(item => [item._id.toString(), item.totalOrders])
    );

    const accountUsers = users.map(user => ({
      ...user,
      totalOrders: orderCountMap.get(user._id.toString()) || 0,
      passwordLabel: 'Đã mã hóa'
    }));

    res.json({ success: true, count: accountUsers.length, users: accountUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== ADMIN: UPDATE USER ======================
exports.updateUserByAdmin = async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (password) {
      user.password = password;
      user.passwordChangedAt = new Date();
    }

    await user.save();

    const updatedUser = emitUserProfileUpdated(user);
    if (password) {
      emitUserPasswordUpdated(user, {
        changedByUserId: req.user?._id,
        changedByRole: 'admin'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật tài khoản thành công',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== ADMIN: DELETE CUSTOMER ======================
exports.deleteUserByAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || user.role === 'admin') {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
    }

    await Order.deleteMany({ user: user._id });
    await user.deleteOne();

    res.json({ success: true, message: 'Xóa tài khoản khách hàng thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== ADMIN: UPDATE USER STATUS ======================
exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    }

    user.isActive = isActive;
    await user.save();

    res.json({ success: true, message: 'Cập nhật trạng thái user thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
