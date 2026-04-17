const express = require('express');
const router = express.Router();
const {
  createDPR,
  getDPRs,
  updateDPRStatus,
} = require('../controllers/dprController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, createDPR);
router.get('/', protect, getDPRs);
router.put('/:id/status', protect, admin, updateDPRStatus);

module.exports = router;
