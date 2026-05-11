const express = require('express');
const router = express.Router();
const { 
  getProfile, 
  updateProfile, 
  getAllUsers, 
  updateUserStatus,
  updateUserByAdmin,
  deleteUserByAdmin
} = require('../controllers/userController');

const { protect, admin } = require('../middleware/auth');

// Customer routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Admin routes
router.get('/', protect, admin, getAllUsers);
router.put('/:id', protect, admin, updateUserByAdmin);
router.delete('/:id', protect, admin, deleteUserByAdmin);
router.put('/:id/status', protect, admin, updateUserStatus);

module.exports = router;
