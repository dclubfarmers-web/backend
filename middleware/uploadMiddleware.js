const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Storage configuration for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine folder and resource type
    let folder = 'djairindia/misc';
    let resource_type = 'auto'; // Handles images, pdfs, etc.

    if (file.mimetype.startsWith('image/')) {
      folder = 'djairindia/images';
    } else if (file.mimetype === 'application/pdf') {
      folder = 'djairindia/documents';
    }

    return {
      folder: folder,
      resource_type: resource_type,
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
    };
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

module.exports = upload;
