const { s3, DeleteObjectCommand } = require('../config/s3');

const uploadController = {
  // @desc    Upload a single file
  uploadFile: (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    res.status(200).json({
      message: 'File uploaded successfully',
      url: req.file.location, // S3 URL
      key: req.file.key,       // S3 Key (useful for deletion)
      bucket: req.file.bucket,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  },

  // @desc    Upload multiple files
  uploadFiles: (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const files = req.files.map(file => ({
      url: file.location,
      key: file.key,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.status(200).json({
      message: `${files.length} files uploaded successfully`,
      files
    });
  },

  // @desc    Delete a file from S3
  deleteFile: async (req, res) => {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ message: 'File key is required for deletion' });
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      });

      await s3.send(command);

      res.status(200).json({ message: 'File deleted successfully from S3' });
    } catch (err) {
      console.error('S3 Deletion Error:', err.message);
      res.status(500).json({ message: 'Failed to delete file from S3', error: err.message });
    }
  }
};

module.exports = uploadController;
