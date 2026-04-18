const express = require('express');
const router = express.Router();
const {
  createDPR,
  getDPRs,
  updateDPRStatus,
} = require('../controllers/dprController');
const { protect, admin, optionalProtect } = require('../middleware/authMiddleware');

router.post('/', optionalProtect, createDPR);
router.get('/', protect, getDPRs);
router.put('/:id/status', protect, admin, updateDPRStatus);

module.exports = router;
