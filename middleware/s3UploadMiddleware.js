const multer = require('multer');
const multerS3 = require('multer-s3');
const { s3 } = require('../config/s3');
require('dotenv').config();

const s3Storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_BUCKET_NAME,
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    const baseFolder = 'DCLUB-FARMERS';
    let subFolder = req.body.folder || 'misc';

    if (!req.body.folder) {
      if (file.mimetype.startsWith('image/')) {
        subFolder = 'images';
      } else if (file.mimetype === 'application/pdf') {
        subFolder = 'documents';
      }
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, `${baseFolder}/${subFolder}/${fileName}`);
  },
  contentType: multerS3.AUTO_CONTENT_TYPE,
});

const uploadS3 = multer({
  storage: s3Storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

module.exports = uploadS3;
