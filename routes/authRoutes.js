const express = require('express');
const router = express.Router();
const { login, getProfile, setupFirstAdmin, getDashboardStats, registerAdmin, getAllAdmins, deleteAdmin } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/setup', setupFirstAdmin);
router.get('/profile', protect, getProfile);
router.get('/stats', protect, getDashboardStats);

// Admin management
router.post('/register-admin', protect, registerAdmin);
router.get('/admins', protect, getAllAdmins);
router.delete('/admins/:id', protect, deleteAdmin);

module.exports = router;
