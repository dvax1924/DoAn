const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

const { 
  getProducts, 
  getProductBySlug,
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  updateInventory      
} = require('../controllers/productController');

const { protect, admin } = require('../middleware/auth');

// Public routes
router.get('/', getProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);

// Admin routes
router.post('/', protect, admin, upload.array('images', 5), createProduct);

// ✅ SỬA Ở ĐÂY: Thêm upload.array cho route PUT
router.put('/:id', protect, admin, upload.array('images', 5), updateProduct);

router.delete('/:id', protect, admin, deleteProduct);
router.put('/:id/inventory', protect, admin, updateInventory);

module.exports = router;
