const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String },
  addresses: [{
    street: String,
    ward: String,
    district: String,
    province: String,
    isDefault: { type: Boolean, default: false }
  }],
  role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
  isActive: { type: Boolean, default: true },
  passwordChangedAt: { type: Date }
  
}, { timestamps: true });

// ====================== HASH PASSWORD (PHIÊN BẢN MỚI - KHÔNG CÓ next) ======================
userSchema.pre('save', async function () {
  // Không khai báo next, không gọi next()
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 12);
});

// ====================== SO SÁNH MẬT KHẨU ======================
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
