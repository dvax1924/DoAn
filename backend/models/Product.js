const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  size: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  images: [{ type: String }],
  
  // GIÁ CHUNG CHO TOÀN BỘ SẢN PHẨM
  price: { type: Number, required: true },

  variants: [variantSchema],        // Chỉ còn size + stock


  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);