const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  logout, 
  changePassword 
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.put('/change-password', protect, changePassword);   // cần đăng nhập


module.exports = router;