const express = require('express');
const router = express.Router();
const {
  applyToJob,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
} = require('../controllers/applicationController');
const { protect, admin, optionalProtect } = require('../middleware/authMiddleware');

router.post('/', optionalProtect, applyToJob);
router.get('/', protect, admin, getApplications);
router.get('/:id', protect, admin, getApplicationById);
router.patch('/:id', protect, admin, updateApplicationStatus);
router.delete('/:id', protect, admin, deleteApplication);

module.exports = router;
