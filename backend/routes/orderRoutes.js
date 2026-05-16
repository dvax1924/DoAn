const express = require('express');
const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getOrdersToday
} = require('../controllers/orderController');

const { retryVnpayPayment } = require('../controllers/paymentController');

const { protect, admin } = require('../middleware/auth');

// ==================== CUSTOMER ROUTES ====================
router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);
// Retry thanh toán VNPay: đặt TRƯỚC route động /:id
router.post('/:orderId/retry-payment', protect, retryVnpayPayment);

// ==================== ADMIN ROUTES ====================
// Đặt route cụ thể (/today) TRƯỚC route động (/:id)
router.get('/today', protect, admin, getOrdersToday);     // ← Quan trọng: đặt trước
router.get('/', protect, admin, getAllOrders);
router.put('/:id/status', protect, updateOrderStatus);

// Route động phải đặt SAU tất cả các route cụ thể
router.get('/:id', protect, getOrderById);

module.exports = router;
