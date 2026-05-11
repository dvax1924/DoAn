const { io } = require('../socket');

const buildUserRealtimePayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  addresses: user.addresses,
  role: user.role,
  createdAt: user.createdAt,
  isActive: user.isActive,
  passwordChangedAt: user.passwordChangedAt
});

const emitUserProfileUpdated = (user) => {
  const payload = buildUserRealtimePayload(user);
  io.to(String(user._id)).emit('userProfileUpdated', payload);
  io.to('admins').emit('userProfileUpdated', payload);
  return payload;
};

const emitUserPasswordUpdated = (user, meta = {}) => {
  const payload = {
    _id: user._id,
    passwordChangedAt: user.passwordChangedAt,
    changedByUserId: meta.changedByUserId ? String(meta.changedByUserId) : null,
    changedByRole: meta.changedByRole || null
  };

  io.to(String(user._id)).emit('userPasswordUpdated', payload);
  io.to('admins').emit('userPasswordUpdated', payload);
  return payload;
};

module.exports = {
  buildUserRealtimePayload,
  emitUserProfileUpdated,
  emitUserPasswordUpdated
};
