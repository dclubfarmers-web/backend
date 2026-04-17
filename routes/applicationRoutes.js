const express = require('express');
const router = express.Router();
const {
  applyToJob,
  getApplications,
} = require('../controllers/applicationController');
const { protect, admin, optionalProtect } = require('../middleware/authMiddleware');

router.post('/', optionalProtect, applyToJob);
router.get('/', protect, admin, getApplications);

module.exports = router;
