const express = require('express');
const router = express.Router();
const {
  submitContact,
  getMessages,
  markRead,
  deleteMessage,
} = require('../controllers/contactController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', submitContact);
router.get('/', protect, admin, getMessages);
router.put('/:id/read', protect, admin, markRead);
router.delete('/:id', protect, admin, deleteMessage);

module.exports = router;
