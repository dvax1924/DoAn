const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: {
      size: String
    },
    qty: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
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
  enum: ['COD'], 
  default: 'COD' 
},
  orderStatus: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
