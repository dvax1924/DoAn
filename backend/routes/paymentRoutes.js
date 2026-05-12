const express = require('express');
const router = express.Router();

const {
  handleVnpayReturn,
  handleVnpayIpn
} = require('../controllers/paymentController');

router.get('/vnpay/return', handleVnpayReturn);
router.get('/vnpay/ipn', handleVnpayIpn);

module.exports = router;
