const { io: socket } = require('../socket');
const { ACCOUNT_LOCKED_MESSAGE } = require('./accountStatus');

const buildUserRealtimePayload = (user) => ({
  _id: String(user._id),
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
  socket.to(String(user._id)).emit('userProfileUpdated', payload);
  socket.to('admins').emit('userProfileUpdated', payload);
  return payload;
};

const emitUserPasswordUpdated = (user, meta = {}) => {
  const payload = {
    _id: user._id,
    passwordChangedAt: user.passwordChangedAt,
    changedByUserId: meta.changedByUserId ? String(meta.changedByUserId) : null,
    changedByRole: meta.changedByRole || null
  };

  socket.to(String(user._id)).emit('userPasswordUpdated', payload);
  socket.to('admins').emit('userPasswordUpdated', payload);
  return payload;
};

const emitAccountLocked = (userId) => {
  socket.to(String(userId)).emit('accountLocked', {
    message: ACCOUNT_LOCKED_MESSAGE
  });
};

const emitAccountUnlocked = (userId) => {
  socket.to(String(userId)).emit('accountUnlocked');
};

module.exports = {
  ACCOUNT_LOCKED_MESSAGE,
  buildUserRealtimePayload,
  emitUserProfileUpdated,
  emitUserPasswordUpdated,
  emitAccountLocked,
  emitAccountUnlocked
};
