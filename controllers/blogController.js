const Blog = require('../models/blogModel');

// @desc    Get all blogs
// @route   GET /api/blogs
// @access  Public
const getBlogs = async (req, res) => {
  const includeUnpublished = req.user && req.user.user_metadata.role === 'admin';
  try {
    const blogs = await Blog.findAll(includeUnpublished);
    res.status(200).json(blogs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get single blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findBySlug(req.params.slug);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.status(200).json(blog);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Create a blog
// @route   POST /api/blogs
// @access  Private/Admin
const createBlog = async (req, res) => {
  const { title, slug, content, excerpt, image_url, is_published } = req.body;
  try {
    const blog = await Blog.create({
      title,
      slug,
      content,
      excerpt,
      image_url,
      is_published,
      author_id: req.user.id
    });
    res.status(201).json(blog);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Update a blog
// @route   PUT /api/blogs/:id
// @access  Private/Admin
const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.update(req.params.id, req.body);
    res.status(200).json(blog);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Delete a blog
// @route   DELETE /api/blogs/:id
// @access  Private/Admin
const deleteBlog = async (req, res) => {
  try {
    await Blog.delete(req.params.id);
    res.status(200).json({ message: 'Blog deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  getBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog
};
