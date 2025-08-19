const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { protect } = require('../middlewares/authMiddleware');

// Public routes
router.get('/', blogController.getBlogPosts);
router.get('/:id', blogController.getBlogPost);

// Protected routes (require authentication)
router.post('/', protect, blogController.createBlogPost);
router.put('/:id', protect, blogController.updateBlogPost);
router.delete('/:id', protect, blogController.deleteBlogPost);

module.exports = router;