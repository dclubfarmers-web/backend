const express = require('express');
const router = express.Router();
const {
  inviteAdmin,
  getInvitations,
} = require('../controllers/invitationController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, admin, inviteAdmin);
router.get('/', protect, admin, getInvitations);

module.exports = router;
