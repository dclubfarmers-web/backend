const express = require('express');
const router = express.Router();
const {
  createJob,
  getJobs,
  getJobById,
} = require('../controllers/jobController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, admin, createJob);
router.get('/', getJobs);
router.get('/:id', getJobById);

module.exports = router;
