const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  content: {
    type: String,
    required: true,
  },
  excerpt: {
    type: String,
  },
  author_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  image_url: {
    type: String,
  },
  image_key: {
    type: String,
  },
  is_published: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

blogSchema.set('toJSON', { virtuals: true });
blogSchema.set('toObject', { virtuals: true });
blogSchema.virtual('id').get(function() { return this._id.toHexString(); });

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
