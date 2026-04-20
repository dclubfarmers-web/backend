const express = require('express');
const router = express.Router();
const {
  inviteAdmin,
  getInvitations,
  acceptInvitation,
  getInvitationByToken,
} = require('../controllers/invitationController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, admin, inviteAdmin);
router.get('/', protect, admin, getInvitations);
router.post('/accept', acceptInvitation);
router.get('/:token', getInvitationByToken);

module.exports = router;
