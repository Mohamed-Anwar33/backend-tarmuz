const Contact = require('../models/Contact');
const sendEmail = require('../utils/email');
const BlogPost = require('../models/BlogPost');

exports.submitContact = async (req, res) => {
  try {
    const contact = new Contact(req.body);
    await contact.save();
    await sendEmail(process.env.EMAIL_USER, 'New Contact', `Name: ${req.body.name}\nMessage: ${req.body.message}`);
    res.status(201).json({ msg: 'Message sent' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get all blog posts
exports.getBlogPosts = async (req, res) => {
  try {
    const posts = await BlogPost.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get single blog post
exports.getBlogPost = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'Blog post not found' });
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Create blog post
exports.createBlogPost = async (req, res) => {
  try {
    const post = new BlogPost(req.body);
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ msg: errors.join(', ') });
    }
    res.status(400).json({ msg: err.message });
  }
};

// Update blog post
exports.updateBlogPost = async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!post) {
      return res.status(404).json({ msg: 'Blog post not found' });
    }
    
    res.json(post);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ msg: errors.join(', ') });
    }
    res.status(400).json({ msg: err.message });
  }
};

// Delete blog post
exports.deleteBlogPost = async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'Blog post not found' });
    }
    res.json({ msg: 'Blog post deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};