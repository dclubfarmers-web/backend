const express = require('express');
const router = express.Router();
const upload = require('../middleware/s3UploadMiddleware');
const { uploadFile, uploadFiles, deleteFile } = require('../controllers/uploadController');
const { protect, admin, optionalProtect } = require('../middleware/authMiddleware');

// @desc    Upload a single file
// @route   POST /api/upload
router.post('/', optionalProtect, upload.single('file'), uploadFile);

// @desc    Upload multiple files
// @route   POST /api/upload/multiple
router.post('/multiple', optionalProtect, upload.array('files', 10), uploadFiles);

// @desc    Delete a file from S3
// @route   DELETE /api/upload
router.delete('/', protect, admin, deleteFile);

module.exports = router;
