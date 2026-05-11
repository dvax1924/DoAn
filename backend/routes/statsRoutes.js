const express = require('express');
const router = express.Router();

const { getSummary } = require('../controllers/statsController');
const { protect, admin } = require('../middleware/auth');

router.get('/summary', protect, admin, getSummary);

module.exports = router;