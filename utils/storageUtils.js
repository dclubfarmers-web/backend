const { s3, DeleteObjectCommand, GetObjectCommand } = require('../config/s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

/**
 * Generate a pre-signed URL for an S3 object
 * @param {string} key - The S3 object key
 * @param {number} expires - Expiration time in seconds (default 1 hour)
 * @returns {Promise<string>} - The pre-signed URL
 */
const getPresignedUrl = async (key, expires = 3600) => {
  if (!key) return null;
  
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });
    
    return await getSignedUrl(s3, command, { expiresIn: expires });
  } catch (err) {
    console.error('Error generating pre-signed URL:', err.message);
    return null;
  }
};

/**
 * Delete an object from S3
 * @param {string} key - The S3 object key
 * @returns {Promise<boolean>} - Success status
 */
const deleteFromS3 = async (key) => {
  if (!key) return false;

  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    await s3.send(command);
    return true;
  } catch (err) {
    console.error('Error deleting from S3:', err.message);
    return false;
  }
};

module.exports = {
  getPresignedUrl,
  deleteFromS3
};
