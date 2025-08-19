const express = require('express');
const router = express.Router();
const { 
  getCategories, 
  getProjectCategories,
  createCategory, 
  updateCategory, 
  deleteCategory 
} = require('../controllers/categoryController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Public routes
router.get('/', getCategories);
router.get('/from-projects', getProjectCategories);

// Admin routes
router.post('/', protect, admin, createCategory);
router.put('/:id', protect, admin, updateCategory);
router.delete('/:id', protect, admin, deleteCategory);

module.exports = router;
