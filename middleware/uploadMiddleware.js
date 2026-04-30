const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Storage configuration for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine folder and resource type
    const baseFolder = 'DCLUB FARMERS';
    let subFolder = req.body.folder || 'misc';

    // Auto-detect based on type if no specific folder sent or if using defaults
    if (!req.body.folder) {
      if (file.mimetype.startsWith('image/')) {
        subFolder = 'images';
      } else if (file.mimetype === 'application/pdf') {
        subFolder = 'documents';
      }
    }

    return {
      folder: `${baseFolder}/${subFolder}`,
      resource_type: 'auto',
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
    };
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

module.exports = upload;
