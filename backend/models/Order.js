const mongoose = require('mongoose');

function normalizePaymentStatus(status) {
  if (status === 'unpaid') return 'pending';
  if (status === 'refunded') return 'paid';
  return status;
}

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      variant: {
        size: String
      },
      qty: { type: Number, required: true },
      price: { type: Number, required: true }
    }
  ],
  shippingAddress: {
    street: String,
    ward: String,
    district: String,
    province: String,
    phone: String,
    name: String
  },
  totalAmount: { type: Number, required: true },
  paymentMethod: {
    type: String,
    enum: ['COD', 'VNPAY'],
    default: 'COD'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentRef: {
    type: String,
    index: true,
    sparse: true
  },
  paymentTransactionNo: String,
  paymentBankCode: String,
  paymentBankTranNo: String,
  paymentResponseCode: String,
  paidAt: Date,
  paymentUrlExpiresAt: Date,
  inventoryAdjusted: {
    type: Boolean,
    default: false
  },
  confirmedAt: Date,
  orderStatus: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
}, { timestamps: true });

orderSchema.pre('validate', function normalizeLegacyPaymentStatus() {
  this.paymentStatus = normalizePaymentStatus(this.paymentStatus);
});

module.exports = mongoose.model('Order', orderSchema);
