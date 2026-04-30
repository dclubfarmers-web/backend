const Blog = require('../models/blogModel');
const { getPresignedUrl, deleteFromS3 } = require('../utils/storageUtils');

// @desc    Get all blogs
// @route   GET /api/blogs
// @access  Public
const getBlogs = async (req, res) => {
  const includeUnpublished = req.user && req.user.role === 'admin';
  try {
    let query = {};
    if (!includeUnpublished) {
      query.is_published = true;
    }
    
    const blogs = await Blog.find(query).sort({ created_at: -1 }).populate('author_id', 'full_name');
    
    // Generate pre-signed URLs
    const enhancedBlogs = await Promise.all(blogs.map(async (blog) => {
      const blogObj = blog.toObject();
      if (blogObj.image_key) {
        blogObj.image_url = await getPresignedUrl(blogObj.image_key);
      }
      return blogObj;
    }));

    res.status(200).json(enhancedBlogs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get single blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug }).populate('author_id', 'full_name');
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    
    const blogObj = blog.toObject();
    if (blogObj.image_key) {
      blogObj.image_url = await getPresignedUrl(blogObj.image_key);
    }

    res.status(200).json(blogObj);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Create a blog
// @route   POST /api/blogs
// @access  Private/Admin
const createBlog = async (req, res) => {
  const { title, slug, content, excerpt, image_url, image_key, is_published } = req.body;
  try {
    const blog = await Blog.create({
      title,
      slug,
      content,
      excerpt,
      image_url,
      image_key,
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
    const blog = await Blog.findByIdAndUpdate(req.params.id, { ...req.body, updated_at: new Date() }, { new: true });
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
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
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    if (blog.image_key) {
      await deleteFromS3(blog.image_key);
    }
    
    await Blog.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Blog and associated media deleted' });
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
