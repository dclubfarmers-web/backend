const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

// @desc    Upload a file (image, pdf, etc.)
// @route   POST /api/upload
// @access  Public (Optional Auth)
router.post('/', optionalProtect, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  res.status(200).json({
    message: 'File uploaded successfully',
    url: req.file.path, // Cloudinary URL
    public_id: req.file.filename,
  });
});

module.exports = router;
